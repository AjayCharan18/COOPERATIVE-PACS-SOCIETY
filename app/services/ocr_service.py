"""
OCR service for document processing using Tesseract
"""
from typing import Dict, Optional
import pytesseract
from PIL import Image
import re
from datetime import datetime

from app.core.config import settings

# Set Tesseract path
pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_PATH


class OCRService:
    """Service for OCR and document data extraction"""
    
    @staticmethod
    def extract_text_from_image(image_path: str, lang: str = 'eng') -> str:
        """
        Extract text from image using Tesseract OCR
        Supports: eng, tel (Telugu), kan (Kannada), hin (Hindi)
        """
        try:
            image = Image.open(image_path)
            text = pytesseract.image_to_string(image, lang=lang)
            return text
        except Exception as e:
            raise Exception(f"OCR extraction failed: {str(e)}")
    
    @staticmethod
    def extract_loan_data(image_path: str) -> Dict:
        """
        Extract loan application data from uploaded document
        Returns structured data: name, aadhaar, amount, etc.
        """
        text = OCRService.extract_text_from_image(image_path)
        
        extracted_data = {
            "raw_text": text,
            "name": None,
            "aadhaar": None,
            "pan": None,
            "loan_amount": None,
            "mobile": None,
            "address": None
        }
        
        # Extract Aadhaar (12 digits)
        aadhaar_pattern = r'\b\d{4}\s?\d{4}\s?\d{4}\b'
        aadhaar_match = re.search(aadhaar_pattern, text)
        if aadhaar_match:
            extracted_data["aadhaar"] = aadhaar_match.group().replace(" ", "")
        
        # Extract PAN (format: ABCDE1234F)
        pan_pattern = r'\b[A-Z]{5}\d{4}[A-Z]\b'
        pan_match = re.search(pan_pattern, text)
        if pan_match:
            extracted_data["pan"] = pan_match.group()
        
        # Extract mobile (10 digits)
        mobile_pattern = r'\b[6-9]\d{9}\b'
        mobile_match = re.search(mobile_pattern, text)
        if mobile_match:
            extracted_data["mobile"] = mobile_match.group()
        
        # Extract amounts (₹ or Rs followed by numbers)
        amount_pattern = r'(?:₹|Rs\.?)\s?(\d+(?:,\d+)*(?:\.\d{2})?)'
        amount_match = re.search(amount_pattern, text)
        if amount_match:
            amount_str = amount_match.group(1).replace(",", "")
            extracted_data["loan_amount"] = float(amount_str)
        
        # Extract name (heuristic: look for "Name:" or similar)
        name_pattern = r'(?:Name|Applicant)[:\s]+([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)'
        name_match = re.search(name_pattern, text, re.IGNORECASE)
        if name_match:
            extracted_data["name"] = name_match.group(1)
        
        return extracted_data
    
    @staticmethod
    def extract_cheque_data(image_path: str) -> Dict:
        """Extract data from cheque image"""
        text = OCRService.extract_text_from_image(image_path)
        
        cheque_data = {
            "raw_text": text,
            "cheque_number": None,
            "amount": None,
            "date": None,
            "bank_name": None
        }
        
        # Extract cheque number (6-8 digits usually)
        cheque_num_pattern = r'\b\d{6,8}\b'
        cheque_match = re.search(cheque_num_pattern, text)
        if cheque_match:
            cheque_data["cheque_number"] = cheque_match.group()
        
        # Extract amount
        amount_pattern = r'(?:₹|Rs\.?)\s?(\d+(?:,\d+)*(?:\.\d{2})?)'
        amount_match = re.search(amount_pattern, text)
        if amount_match:
            amount_str = amount_match.group(1).replace(",", "")
            cheque_data["amount"] = float(amount_str)
        
        # Extract date patterns
        date_pattern = r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b'
        date_match = re.search(date_pattern, text)
        if date_match:
            cheque_data["date"] = date_match.group()
        
        return cheque_data
    
    @staticmethod
    def validate_document(image_path: str, doc_type: str) -> Dict:
        """
        Validate document authenticity (basic checks)
        Returns validation results
        """
        text = OCRService.extract_text_from_image(image_path)
        
        validation = {
            "is_valid": False,
            "document_type": doc_type,
            "confidence": 0.0,
            "issues": []
        }
        
        if doc_type == "aadhaar":
            # Check for Aadhaar specific keywords
            aadhaar_keywords = ["government of india", "aadhaar", "unique identification"]
            found_keywords = sum(1 for kw in aadhaar_keywords if kw.lower() in text.lower())
            
            # Check for 12-digit number
            aadhaar_pattern = r'\b\d{4}\s?\d{4}\s?\d{4}\b'
            has_aadhaar_num = bool(re.search(aadhaar_pattern, text))
            
            if found_keywords >= 2 and has_aadhaar_num:
                validation["is_valid"] = True
                validation["confidence"] = min(100, (found_keywords / len(aadhaar_keywords)) * 100)
            else:
                validation["issues"].append("Aadhaar format not recognized")
        
        elif doc_type == "pan":
            # Check for PAN specific keywords
            pan_keywords = ["income tax", "permanent account number", "pan"]
            found_keywords = sum(1 for kw in pan_keywords if kw.lower() in text.lower())
            
            # Check for PAN number pattern
            pan_pattern = r'\b[A-Z]{5}\d{4}[A-Z]\b'
            has_pan_num = bool(re.search(pan_pattern, text))
            
            if found_keywords >= 1 and has_pan_num:
                validation["is_valid"] = True
                validation["confidence"] = 80.0
            else:
                validation["issues"].append("PAN format not recognized")
        
        return validation
