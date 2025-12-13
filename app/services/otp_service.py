"""
OTP Service for password reset and verification
Supports both Email and SMS OTP
"""

import random
import string
import json
from datetime import datetime, timedelta
from typing import Optional, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.models.user import User
from app.core.config import settings
import logging

from redis.asyncio import Redis
from redis.asyncio.client import Redis as RedisClient
from redis.asyncio import from_url as redis_from_url

logger = logging.getLogger(__name__)


class OTPStore:
    """In-memory OTP storage (use Redis in production)"""

    _otps: Dict[str, Dict] = {}

    _redis: Optional[RedisClient] = None

    @classmethod
    def _use_redis(cls) -> bool:
        return bool(settings.REDIS_URL) and settings.ENVIRONMENT != "development"

    @classmethod
    def _redis_key(cls, identifier: str) -> str:
        return f"otp:{identifier}"

    @classmethod
    async def _get_redis(cls) -> Optional[RedisClient]:
        if not cls._use_redis():
            return None

        if cls._redis is None:
            try:
                cls._redis = redis_from_url(settings.REDIS_URL, decode_responses=True)
            except Exception:
                cls._redis = None
                return None
        return cls._redis

    @classmethod
    async def save_otp(cls, identifier: str, otp: str, expires_in_minutes: int = 10):
        """Save OTP with expiration"""
        if cls._use_redis():
            redis = await cls._get_redis()
            if redis is not None:
                payload = {"otp": otp, "attempts": 0}
                try:
                    await redis.set(
                        cls._redis_key(identifier),
                        json.dumps(payload),
                        ex=expires_in_minutes * 60,
                    )
                    return
                except Exception:
                    cls._redis = None

        cls._otps[identifier] = {
            "otp": otp,
            "expires_at": datetime.utcnow() + timedelta(minutes=expires_in_minutes),
            "attempts": 0,
        }

    @classmethod
    async def verify_otp(cls, identifier: str, otp: str) -> bool:
        """Verify OTP"""
        if cls._use_redis():
            redis = await cls._get_redis()
            if redis is not None:
                key = cls._redis_key(identifier)
                try:
                    raw = await redis.get(key)
                except Exception:
                    cls._redis = None
                    raw = None
                if not raw:
                    return False

                try:
                    stored = json.loads(raw)
                except Exception:
                    await redis.delete(key)
                    return False

                attempts = int(stored.get("attempts", 0))
                if attempts >= 3:
                    try:
                        await redis.delete(key)
                    except Exception:
                        cls._redis = None
                    return False

                if stored.get("otp") == otp:
                    try:
                        await redis.delete(key)
                    except Exception:
                        cls._redis = None
                    return True

                stored["attempts"] = attempts + 1
                try:
                    ttl = await redis.ttl(key)
                except Exception:
                    cls._redis = None
                    return False
                if ttl is None or ttl <= 0:
                    try:
                        await redis.delete(key)
                    except Exception:
                        cls._redis = None
                    return False
                try:
                    await redis.set(key, json.dumps(stored), ex=int(ttl))
                except Exception:
                    cls._redis = None
                return False

        if identifier not in cls._otps:
            return False

        stored = cls._otps[identifier]

        # Check expiration
        if datetime.utcnow() > stored["expires_at"]:
            del cls._otps[identifier]
            return False

        # Check attempts
        if stored["attempts"] >= 3:
            del cls._otps[identifier]
            return False

        # Verify OTP
        if stored["otp"] == otp:
            del cls._otps[identifier]
            return True
        else:
            stored["attempts"] += 1
            return False

    @classmethod
    async def delete_otp(cls, identifier: str):
        """Delete OTP"""
        if cls._use_redis():
            redis = await cls._get_redis()
            if redis is not None:
                try:
                    await redis.delete(cls._redis_key(identifier))
                    return
                except Exception:
                    cls._redis = None
        if identifier in cls._otps:
            del cls._otps[identifier]


class OTPService:
    """OTP Service for authentication"""

    @staticmethod
    def generate_otp(length: int = 6) -> str:
        """Generate random OTP"""
        return "".join(random.choices(string.digits, k=length))

    @staticmethod
    async def send_email_otp(email: str, otp: str, purpose: str = "password reset"):
        """Send OTP via email"""
        from app.services.notification_service import NotificationService

        subject = f"COOPERATIVE PACS Loan - Your OTP for {purpose}"
        message = f"""
        <html>
        <body>
            <h2>COOPERATIVE PACS Loan Management System</h2>
            <p>Dear User,</p>
            <p>Your OTP for {purpose} is:</p>
            <h1 style="color: #4F46E5; font-size: 32px; letter-spacing: 5px;">{otp}</h1>
            <p>This OTP is valid for 10 minutes.</p>
            <p><strong>Do not share this OTP with anyone.</strong></p>
            <br>
            <p>If you didn't request this, please ignore this email.</p>
            <br>
            <p>Regards,<br>COOPERATIVE PACS Loan Team</p>
        </body>
        </html>
        """

        try:
            await NotificationService.send_email(
                to_email=email, subject=subject, body=message
            )
            logger.info(f"OTP sent to email: {email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send OTP email: {str(e)}")
            return False

    @staticmethod
    async def send_sms_otp(mobile: str, otp: str, purpose: str = "password reset"):
        """Send OTP via SMS"""
        from app.services.notification_service import NotificationService

        message = f"Your COOPERATIVE PACS Loan OTP for {purpose} is: {otp}. Valid for 10 minutes. Do not share with anyone."

        try:
            await NotificationService.send_sms(mobile, message)
            logger.info(f"OTP sent to mobile: {mobile}")
            return True
        except Exception as e:
            logger.error(f"Failed to send OTP SMS: {str(e)}")
            return False

    @staticmethod
    async def initiate_password_reset(
        db: AsyncSession, identifier: str, method: str = "email"
    ) -> Dict:
        """
        Initiate password reset process
        identifier: email or mobile number
        method: 'email' or 'sms'
        """
        # Find user by email or mobile
        result = await db.execute(
            select(User).where((User.email == identifier) | (User.mobile == identifier))
        )
        user = result.scalar_one_or_none()

        if not user:
            # Return generic message for security (don't reveal if user exists)
            return {
                "success": False,
                "message": "If this email/mobile is registered, you will receive an OTP shortly",
            }

        # Generate OTP
        otp = OTPService.generate_otp()

        # Save OTP
        await OTPStore.save_otp(identifier, otp, expires_in_minutes=10)

        # Send OTP
        if method == "email":
            sent = await OTPService.send_email_otp(user.email, otp, "password reset")
            contact = user.email
        else:  # sms
            sent = await OTPService.send_sms_otp(user.mobile, otp, "password reset")
            contact = user.mobile

        if sent:
            # Mask contact for security
            if method == "email":
                masked = f"{contact[:3]}***{contact.split('@')[1]}"
            else:
                masked = f"{contact[:3]}***{contact[-2:]}"

            return {
                "success": True,
                "message": f"OTP sent to {masked}",
                "method": method,
                "identifier": identifier,
            }
        else:
            return {"success": False, "message": "Failed to send OTP"}

    @staticmethod
    async def verify_otp_and_reset_password(
        db: AsyncSession, identifier: str, otp: str, new_password: str
    ) -> Dict:
        """Verify OTP and reset password"""
        from app.core.security import get_password_hash, validate_password_strength

        # Verify OTP
        if not await OTPStore.verify_otp(identifier, otp):
            return {"success": False, "message": "Invalid or expired OTP"}

        # Validate password strength
        is_valid, msg = validate_password_strength(new_password)
        if not is_valid:
            return {"success": False, "message": msg}

        # Find user
        result = await db.execute(
            select(User).where((User.email == identifier) | (User.mobile == identifier))
        )
        user = result.scalar_one_or_none()

        if not user:
            return {"success": False, "message": "User not found"}

        # Update password
        user.hashed_password = get_password_hash(new_password)
        user.updated_at = datetime.utcnow()

        await db.commit()

        logger.info(f"Password reset successful for user: {user.email}")

        return {
            "success": True,
            "message": "Password reset successful",
            "user_id": user.id,
        }

    @staticmethod
    async def resend_otp(
        db: AsyncSession, identifier: str, method: str = "email"
    ) -> Dict:
        """Resend OTP"""
        # Delete old OTP
        await OTPStore.delete_otp(identifier)

        # Send new OTP
        return await OTPService.initiate_password_reset(db, identifier, method)
