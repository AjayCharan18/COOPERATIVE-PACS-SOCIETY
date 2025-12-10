"""
Notification service for SMS, WhatsApp, Email
"""

from typing import Optional, Dict
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import httpx

from app.core.config import settings
from app.models.notification import (
    Notification,
    NotificationTemplate,
    NotificationType,
    NotificationPurpose,
    NotificationStatus,
)
from app.models.user import User
from app.models.loan import Loan


class NotificationService:
    """Service for sending notifications"""

    @staticmethod
    async def send_notification(
        db: AsyncSession,
        user: User,
        notification_type: NotificationType,
        purpose: NotificationPurpose,
        template_key: str,
        context: Dict,
        loan_id: Optional[int] = None,
        payment_id: Optional[int] = None,
    ) -> Notification:
        """Send a notification to user"""

        # Get template
        result = await db.execute(
            select(NotificationTemplate).where(
                NotificationTemplate.template_key == template_key
            )
        )
        template = result.scalar_one_or_none()

        if not template:
            raise ValueError(f"Template {template_key} not found")

        # Get message in user's preferred language
        language = user.preferred_language or "english"
        message_template = getattr(
            template, f"template_{language}", template.template_english
        )
        title_template = (
            getattr(template, f"subject_{language}", template.subject_english)
            or "Notification"
        )

        # Format message with context
        message = message_template.format(**context)
        title = title_template.format(**context) if title_template else "Notification"

        # Create notification record
        notification = Notification(
            user_id=user.id,
            notification_type=notification_type,
            purpose=purpose,
            title=title,
            message=message,
            language=language,
            loan_id=loan_id,
            payment_id=payment_id,
            status=NotificationStatus.PENDING,
        )

        db.add(notification)
        await db.flush()

        # Send based on type
        try:
            if notification_type == NotificationType.SMS:
                await NotificationService._send_sms(user.mobile, message)
            elif notification_type == NotificationType.WHATSAPP:
                await NotificationService._send_whatsapp(user.mobile, message)
            elif notification_type == NotificationType.EMAIL:
                await NotificationService._send_email(user.email, title, message)

            notification.status = NotificationStatus.SENT
            notification.sent_at = datetime.utcnow()
        except Exception as e:
            notification.status = NotificationStatus.FAILED
            notification.error_message = str(e)

        await db.commit()
        await db.refresh(notification)

        return notification

    @staticmethod
    async def _send_sms(mobile: str, message: str):
        """Send SMS via Twilio"""
        if not settings.TWILIO_ACCOUNT_SID:
            print("\n" + "=" * 80)
            print(f"📱 SMS OTP (Development Mode)")
            print(f"To: {mobile}")
            print(f"Message: {message}")
            print("=" * 80 + "\n")
            # Return True in development mode for testing
            return True

        from twilio.rest import Client

        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)

        message = client.messages.create(
            body=message, from_=settings.TWILIO_PHONE_NUMBER, to=mobile
        )

        return message.sid

    @staticmethod
    async def _send_whatsapp(mobile: str, message: str):
        """Send WhatsApp message"""
        if not settings.WHATSAPP_API_KEY:
            print(f"WhatsApp not configured. Would send to {mobile}: {message}")
            return

        # Using WhatsApp Business API
        url = f"{settings.WHATSAPP_API_URL}/messages"
        headers = {
            "Authorization": f"Bearer {settings.WHATSAPP_API_KEY}",
            "Content-Type": "application/json",
        }

        data = {
            "messaging_product": "whatsapp",
            "to": mobile,
            "type": "text",
            "text": {"body": message},
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=data, headers=headers)
            response.raise_for_status()
            return response.json()

    @staticmethod
    async def _send_email(email: str, subject: str, body: str):
        """Send email via SMTP"""
        if not settings.SMTP_USER:
            print(f"Email not configured. Would send to {email}: {subject}")
            return

        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart

        msg = MIMEMultipart("alternative")
        msg["From"] = (
            settings.EMAIL_FROM
            if hasattr(settings, "EMAIL_FROM")
            else settings.SMTP_USER
        )
        msg["To"] = email
        msg["Subject"] = subject

        # Support both plain text and HTML
        if "<html>" in body.lower():
            msg.attach(MIMEText(body, "html"))
        else:
            msg.attach(MIMEText(body, "plain"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)

    @staticmethod
    async def send_email(to_email: str, subject: str, body: str):
        """Public method to send email"""
        return await NotificationService._send_email(to_email, subject, body)

    @staticmethod
    async def send_sms(mobile: str, message: str):
        """Public method to send SMS"""
        return await NotificationService._send_sms(mobile, message)

    @staticmethod
    async def send_emi_reminder(
        db: AsyncSession, loan: Loan, farmer: User, days_before: int = 3
    ):
        """Send EMI reminder notification"""
        context = {
            "farmer_name": farmer.full_name,
            "loan_number": loan.loan_number,
            "emi_amount": f"₹{loan.emi_amount:,.2f}",
            "due_date": (
                loan.first_emi_date.strftime("%d-%b-%Y")
                if loan.first_emi_date
                else "N/A"
            ),
            "days": days_before,
        }

        await NotificationService.send_notification(
            db=db,
            user=farmer,
            notification_type=NotificationType.WHATSAPP,
            purpose=NotificationPurpose.EMI_REMINDER,
            template_key="emi_reminder",
            context=context,
            loan_id=loan.id,
        )

    @staticmethod
    async def send_overdue_alert(
        db: AsyncSession,
        loan: Loan,
        farmer: User,
        overdue_amount: float,
        overdue_days: int,
    ):
        """Send overdue payment alert"""
        context = {
            "farmer_name": farmer.full_name,
            "loan_number": loan.loan_number,
            "overdue_amount": f"₹{overdue_amount:,.2f}",
            "overdue_days": overdue_days,
            "penalty_date": "25th of this month",  # Configurable
        }

        await NotificationService.send_notification(
            db=db,
            user=farmer,
            notification_type=NotificationType.SMS,
            purpose=NotificationPurpose.OVERDUE_ALERT,
            template_key="overdue_alert",
            context=context,
            loan_id=loan.id,
        )
