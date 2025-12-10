"""
Utility constants for the application
"""

# Loan Types Display Names
LOAN_TYPE_NAMES = {
    "sao": "SAO - Short-term Agricultural Operations",
    "long_term_emi": "Long-term EMI (9 years)",
    "rythu_bandhu": "Rythu Bandhu Scheme",
    "rythu_nethany": "Rythu Nethany (10 years)",
    "amul_loan": "Amul Dairy Loan (10 months)",
    "custom": "Custom Loan",
}

# Interest Calculation Methods
INTEREST_METHODS = {
    "simple": "Simple Interest",
    "compound": "Compound Interest",
    "prorata_daily": "Pro-rata Daily Interest",
    "emi": "EMI (Reducing Balance)",
}

# Payment Modes
PAYMENT_MODES = {
    "cash": "Cash",
    "cheque": "Cheque",
    "neft": "NEFT",
    "rtgs": "RTGS",
    "imps": "IMPS",
    "upi": "UPI",
    "debit_card": "Debit Card",
    "credit_card": "Credit Card",
    "net_banking": "Net Banking",
}

# Status Colors for UI
STATUS_COLORS = {
    "pending_approval": "yellow",
    "approved": "blue",
    "active": "green",
    "closed": "gray",
    "defaulted": "red",
    "rejected": "red",
    "rescheduled": "purple",
}

# Supported Languages
LANGUAGES = {
    "english": "English",
    "telugu": "తెలుగు",
    "kannada": "ಕನ್ನಡ",
    "hindi": "हिंदी",
}

# Date Formats
DATE_FORMAT = "%d-%m-%Y"
DATETIME_FORMAT = "%d-%m-%Y %H:%M:%S"

# Currency Format
CURRENCY_SYMBOL = "₹"
CURRENCY_FORMAT = "₹{:,.2f}"

# Risk Categories
RISK_CATEGORIES = {
    "LOW": {"min": 0, "max": 30, "color": "green"},
    "MEDIUM": {"min": 30, "max": 60, "color": "yellow"},
    "HIGH": {"min": 60, "max": 100, "color": "red"},
}

# Default Page Sizes
PAGE_SIZE = 20
MAX_PAGE_SIZE = 100
