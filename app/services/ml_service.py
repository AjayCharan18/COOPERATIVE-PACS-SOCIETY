"""
ML service for loan default prediction and risk assessment
"""
from typing import Dict, Optional
import numpy as np
from datetime import date, datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import joblib
import os

from app.models.loan import Loan, LoanStatus
from app.models.user import User


class MLService:
    """Service for ML-based predictions"""
    
    # Feature importance (for manual scoring if model not available)
    FEATURE_WEIGHTS = {
        "payment_history": 0.35,
        "loan_amount": 0.20,
        "tenure": 0.15,
        "land_area": 0.10,
        "previous_defaults": 0.20
    }
    
    @staticmethod
    async def predict_default_risk(
        db: AsyncSession,
        farmer: User,
        loan_amount: float,
        tenure_months: int,
        loan_type: str
    ) -> Dict:
        """
        Predict default risk for a loan application
        Returns risk score (0-100) and probability
        """
        
        # Get farmer's loan history
        result = await db.execute(
            select(Loan).where(Loan.farmer_id == farmer.id)
        )
        previous_loans = result.scalars().all()
        
        # Calculate features
        features = MLService._extract_features(
            farmer,
            previous_loans,
            loan_amount,
            tenure_months
        )
        
        # Try to load ML model if available
        model_path = "models/default_prediction_model.pkl"
        
        if os.path.exists(model_path):
            try:
                model = joblib.load(model_path)
                # Prepare feature vector
                feature_vector = np.array([list(features.values())])
                probability = model.predict_proba(feature_vector)[0][1]
                risk_score = int(probability * 100)
            except Exception as e:
                print(f"Model loading failed: {e}")
                # Fallback to rule-based scoring
                risk_score, probability = MLService._rule_based_scoring(features)
        else:
            # Use rule-based scoring
            risk_score, probability = MLService._rule_based_scoring(features)
        
        # Risk category
        if risk_score < 30:
            risk_category = "LOW"
            recommendation = "APPROVE"
        elif risk_score < 60:
            risk_category = "MEDIUM"
            recommendation = "REVIEW"
        else:
            risk_category = "HIGH"
            recommendation = "REJECT"
        
        return {
            "risk_score": risk_score,
            "default_probability": round(probability, 4),
            "risk_category": risk_category,
            "recommendation": recommendation,
            "factors": features
        }
    
    @staticmethod
    def _extract_features(
        farmer: User,
        previous_loans: list,
        loan_amount: float,
        tenure_months: int
    ) -> Dict:
        """Extract features for ML model"""
        
        features = {}
        
        # Payment history score (0-100)
        if previous_loans:
            total_loans = len(previous_loans)
            defaulted = sum(1 for l in previous_loans if l.status == LoanStatus.DEFAULTED)
            closed_on_time = sum(1 for l in previous_loans if l.status == LoanStatus.CLOSED)
            
            payment_history_score = (closed_on_time / total_loans) * 100 if total_loans > 0 else 50
            features["payment_history_score"] = payment_history_score
            features["previous_defaults"] = defaulted
            features["total_previous_loans"] = total_loans
        else:
            features["payment_history_score"] = 50  # Neutral for new customers
            features["previous_defaults"] = 0
            features["total_previous_loans"] = 0
        
        # Loan amount (normalized)
        features["loan_amount"] = loan_amount
        features["loan_amount_normalized"] = min(loan_amount / 1000000, 1.0)  # Cap at 10L
        
        # Tenure
        features["tenure_months"] = tenure_months
        features["tenure_years"] = tenure_months / 12
        
        # Land area (if farmer)
        try:
            land_area = float(farmer.land_area) if farmer.land_area else 0
            features["land_area"] = land_area
        except:
            features["land_area"] = 0
        
        # Age of customer (approximate from creation date)
        account_age_days = (datetime.utcnow() - farmer.created_at).days
        features["account_age_months"] = account_age_days / 30
        
        return features
    
    @staticmethod
    def _rule_based_scoring(features: Dict) -> tuple:
        """Fallback rule-based risk scoring"""
        
        score = 0
        
        # Payment history (35% weight)
        payment_score = features.get("payment_history_score", 50)
        score += (100 - payment_score) * 0.35
        
        # Loan amount (20% weight)
        amount_risk = min(features.get("loan_amount_normalized", 0.5), 1.0)
        score += amount_risk * 20
        
        # Tenure (15% weight) - longer tenure = higher risk
        tenure_risk = min(features.get("tenure_years", 1) / 10, 1.0)
        score += tenure_risk * 15
        
        # Land area (10% weight) - more land = lower risk
        land_area = features.get("land_area", 0)
        land_risk = max(0, 1 - (land_area / 20))  # 20 acres = low risk
        score += land_risk * 10
        
        # Previous defaults (20% weight)
        defaults = features.get("previous_defaults", 0)
        default_risk = min(defaults / 3, 1.0) * 100  # 3+ defaults = max risk
        score += default_risk * 0.20
        
        risk_score = int(min(score, 100))
        probability = risk_score / 100.0
        
        return risk_score, probability
    
    @staticmethod
    async def identify_high_risk_loans(
        db: AsyncSession,
        threshold: float = 0.6
    ) -> list:
        """
        Identify active loans with high default risk
        Used for recovery management
        """
        result = await db.execute(
            select(Loan).where(Loan.status == LoanStatus.ACTIVE)
        )
        active_loans = result.scalars().all()
        
        high_risk_loans = []
        
        for loan in active_loans:
            # Check if overdue
            days_overdue = 0
            if loan.maturity_date < date.today():
                days_overdue = (date.today() - loan.maturity_date).days
            
            # Check payment patterns
            payment_ratio = loan.total_paid / loan.total_amount_payable if loan.total_amount_payable > 0 else 0
            
            # Simple risk calculation
            risk_factors = {
                "overdue": days_overdue > 30,
                "low_payment": payment_ratio < 0.3,
                "high_outstanding": loan.total_outstanding > loan.principal_amount * 0.8
            }
            
            risk_count = sum(risk_factors.values())
            
            if risk_count >= 2:  # At least 2 risk factors
                high_risk_loans.append({
                    "loan_id": loan.id,
                    "loan_number": loan.loan_number,
                    "farmer_id": loan.farmer_id,
                    "outstanding": loan.total_outstanding,
                    "days_overdue": days_overdue,
                    "risk_factors": risk_factors,
                    "priority": "HIGH" if risk_count == 3 else "MEDIUM"
                })
        
        return high_risk_loans
    
    @staticmethod
    def train_model(training_data: list):
        """
        Train default prediction model (to be run periodically with historical data)
        This is a placeholder for actual model training
        """
        from sklearn.ensemble import RandomForestClassifier
        from sklearn.model_selection import train_test_split
        
        # Prepare data
        X = []
        y = []
        
        for record in training_data:
            X.append(record["features"])
            y.append(1 if record["defaulted"] else 0)
        
        X = np.array(X)
        y = np.array(y)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Train model
        model = RandomForestClassifier(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)
        
        # Save model
        os.makedirs("models", exist_ok=True)
        joblib.dump(model, "models/default_prediction_model.pkl")
        
        # Evaluate
        accuracy = model.score(X_test, y_test)
        return {"accuracy": accuracy, "model": "RandomForestClassifier"}
