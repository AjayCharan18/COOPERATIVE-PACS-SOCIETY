"""
Comprehensive API Testing Script
Tests all major endpoints with realistic scenarios
"""
import asyncio
import httpx
from datetime import date, timedelta
import json


BASE_URL = "http://localhost:8000/api/v1"


class Colors:
    """ANSI color codes for terminal output"""
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'


class APITester:
    def __init__(self):
        self.token = None
        self.loan_id = None
        self.payment_id = None
        self.tests_passed = 0
        self.tests_failed = 0
    
    def log_success(self, message):
        print(f"{Colors.GREEN}✓ {message}{Colors.RESET}")
        self.tests_passed += 1
    
    def log_error(self, message):
        print(f"{Colors.RED}✗ {message}{Colors.RESET}")
        self.tests_failed += 1
    
    def log_info(self, message):
        print(f"{Colors.BLUE}ℹ {message}{Colors.RESET}")
    
    def log_warning(self, message):
        print(f"{Colors.YELLOW}⚠ {message}{Colors.RESET}")
    
    async def test_authentication(self, client: httpx.AsyncClient):
        """Test authentication endpoints"""
        print(f"\n{Colors.YELLOW}{'='*60}")
        print("Testing Authentication")
        print(f"{'='*60}{Colors.RESET}\n")
        
        # Test login with farmer credentials
        try:
            response = await client.post(
                f"{BASE_URL}/auth/login",
                data={
                    "username": "farmer@dccb.com",
                    "password": "Farmer@123"
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                self.token = data["access_token"]
                self.log_success(f"Login successful: Token received")
                self.log_info(f"Token Type: {data['token_type']}")
                return True
            else:
                self.log_error(f"Login failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log_error(f"Login error: {str(e)}")
            return False
    
    async def test_user_profile(self, client: httpx.AsyncClient):
        """Test getting current user profile"""
        print(f"\n{Colors.YELLOW}{'='*60}")
        print("Testing User Profile")
        print(f"{'='*60}{Colors.RESET}\n")
        
        if not self.token:
            self.log_warning("Skipping - No authentication token")
            return
        
        try:
            response = await client.get(
                f"{BASE_URL}/users/me",
                headers={"Authorization": f"Bearer {self.token}"}
            )
            
            if response.status_code == 200:
                user = response.json()
                self.log_success("User profile retrieved")
                self.log_info(f"Name: {user['full_name']}")
                self.log_info(f"Email: {user['email']}")
                self.log_info(f"Role: {user['role']}")
            else:
                self.log_error(f"Profile retrieval failed: {response.status_code}")
                
        except Exception as e:
            self.log_error(f"Profile error: {str(e)}")
    
    async def test_loan_types(self, client: httpx.AsyncClient):
        """Test loan type configurations"""
        print(f"\n{Colors.YELLOW}{'='*60}")
        print("Testing Loan Type Configurations")
        print(f"{'='*60}{Colors.RESET}\n")
        
        if not self.token:
            self.log_warning("Skipping - No authentication token")
            return
        
        try:
            response = await client.get(
                f"{BASE_URL}/loans/types",
                headers={"Authorization": f"Bearer {self.token}"}
            )
            
            if response.status_code == 200:
                loan_types = response.json()
                self.log_success(f"Retrieved {len(loan_types)} loan type configurations")
                
                for lt in loan_types:
                    self.log_info(f"- {lt['loan_type']}: {lt['max_amount']} max, {lt['interest_rate']}% interest")
            else:
                self.log_error(f"Loan types retrieval failed: {response.status_code}")
                
        except Exception as e:
            self.log_error(f"Loan types error: {str(e)}")
    
    async def test_create_loan(self, client: httpx.AsyncClient):
        """Test creating a new loan application"""
        print(f"\n{Colors.YELLOW}{'='*60}")
        print("Testing Loan Creation")
        print(f"{'='*60}{Colors.RESET}\n")
        
        if not self.token:
            self.log_warning("Skipping - No authentication token")
            return
        
        try:
            loan_data = {
                "loan_type": "SAO",
                "principal_amount": 50000.0,
                "interest_rate": 7.0,
                "tenure_months": 12,
                "purpose": "Agricultural equipment purchase",
                "guarantor_name": "Ramesh Kumar",
                "guarantor_contact": "9876543211",
                "collateral_details": "Land document - Survey No. 123/A"
            }
            
            response = await client.post(
                f"{BASE_URL}/loans/",
                headers={"Authorization": f"Bearer {self.token}"},
                json=loan_data
            )
            
            if response.status_code == 200:
                loan = response.json()
                self.loan_id = loan['id']
                self.log_success(f"Loan created successfully - ID: {self.loan_id}")
                self.log_info(f"Principal: ₹{loan['principal_amount']}")
                self.log_info(f"Status: {loan['status']}")
                self.log_info(f"Loan Account Number: {loan['loan_account_number']}")
            else:
                self.log_error(f"Loan creation failed: {response.status_code} - {response.text}")
                
        except Exception as e:
            self.log_error(f"Loan creation error: {str(e)}")
    
    async def test_get_loan_details(self, client: httpx.AsyncClient):
        """Test retrieving loan details"""
        print(f"\n{Colors.YELLOW}{'='*60}")
        print("Testing Loan Details Retrieval")
        print(f"{'='*60}{Colors.RESET}\n")
        
        if not self.token or not self.loan_id:
            self.log_warning("Skipping - No loan created yet")
            return
        
        try:
            response = await client.get(
                f"{BASE_URL}/loans/{self.loan_id}",
                headers={"Authorization": f"Bearer {self.token}"}
            )
            
            if response.status_code == 200:
                loan = response.json()
                self.log_success("Loan details retrieved")
                self.log_info(f"Outstanding: ₹{loan.get('outstanding_amount', 'N/A')}")
                self.log_info(f"Total Interest: ₹{loan.get('total_interest_amount', 'N/A')}")
            else:
                self.log_error(f"Loan retrieval failed: {response.status_code}")
                
        except Exception as e:
            self.log_error(f"Loan retrieval error: {str(e)}")
    
    async def test_approve_loan(self, client: httpx.AsyncClient):
        """Test loan approval (requires admin/employee credentials)"""
        print(f"\n{Colors.YELLOW}{'='*60}")
        print("Testing Loan Approval")
        print(f"{'='*60}{Colors.RESET}\n")
        
        if not self.loan_id:
            self.log_warning("Skipping - No loan created yet")
            return
        
        # Login as employee to approve
        try:
            response = await client.post(
                f"{BASE_URL}/auth/login",
                data={
                    "username": "employee@dccb.com",
                    "password": "Employee@123"
                }
            )
            
            if response.status_code == 200:
                employee_token = response.json()["access_token"]
                self.log_success("Logged in as employee")
                
                # Approve the loan
                approval_data = {
                    "approved_amount": 50000.0,
                    "disbursement_date": str(date.today()),
                    "remarks": "Approved after document verification"
                }
                
                response = await client.post(
                    f"{BASE_URL}/loans/{self.loan_id}/approve",
                    headers={"Authorization": f"Bearer {employee_token}"},
                    json=approval_data
                )
                
                if response.status_code == 200:
                    loan = response.json()
                    self.log_success(f"Loan approved - Status: {loan['status']}")
                    self.log_info(f"Approved Amount: ₹{loan['approved_amount']}")
                else:
                    self.log_error(f"Loan approval failed: {response.status_code} - {response.text}")
            else:
                self.log_error("Employee login failed")
                
        except Exception as e:
            self.log_error(f"Loan approval error: {str(e)}")
    
    async def test_emi_schedule(self, client: httpx.AsyncClient):
        """Test EMI schedule generation"""
        print(f"\n{Colors.YELLOW}{'='*60}")
        print("Testing EMI Schedule")
        print(f"{'='*60}{Colors.RESET}\n")
        
        if not self.token or not self.loan_id:
            self.log_warning("Skipping - No loan available")
            return
        
        try:
            response = await client.get(
                f"{BASE_URL}/loans/{self.loan_id}/emi-schedule",
                headers={"Authorization": f"Bearer {self.token}"}
            )
            
            if response.status_code == 200:
                schedule = response.json()
                self.log_success(f"EMI schedule retrieved - {len(schedule)} installments")
                
                if schedule:
                    first_emi = schedule[0]
                    self.log_info(f"First EMI: ₹{first_emi.get('emi_amount', 'N/A')} on {first_emi.get('due_date', 'N/A')}")
            else:
                self.log_error(f"EMI schedule retrieval failed: {response.status_code}")
                
        except Exception as e:
            self.log_error(f"EMI schedule error: {str(e)}")
    
    async def test_payment_processing(self, client: httpx.AsyncClient):
        """Test payment processing"""
        print(f"\n{Colors.YELLOW}{'='*60}")
        print("Testing Payment Processing")
        print(f"{'='*60}{Colors.RESET}\n")
        
        if not self.token or not self.loan_id:
            self.log_warning("Skipping - No loan available")
            return
        
        try:
            payment_data = {
                "amount": 5000.0,
                "payment_mode": "CASH",
                "payment_type": "EMI",
                "payment_date": str(date.today()),
                "transaction_reference": "TXN123456789",
                "remarks": "First EMI payment"
            }
            
            response = await client.post(
                f"{BASE_URL}/payments/loan/{self.loan_id}",
                headers={"Authorization": f"Bearer {self.token}"},
                json=payment_data
            )
            
            if response.status_code == 200:
                payment = response.json()
                self.payment_id = payment['id']
                self.log_success(f"Payment processed - ID: {self.payment_id}")
                self.log_info(f"Amount: ₹{payment['amount']}")
                self.log_info(f"Status: {payment['status']}")
            else:
                self.log_error(f"Payment processing failed: {response.status_code} - {response.text}")
                
        except Exception as e:
            self.log_error(f"Payment processing error: {str(e)}")
    
    async def test_loan_ledger(self, client: httpx.AsyncClient):
        """Test loan ledger retrieval"""
        print(f"\n{Colors.YELLOW}{'='*60}")
        print("Testing Loan Ledger")
        print(f"{'='*60}{Colors.RESET}\n")
        
        if not self.token or not self.loan_id:
            self.log_warning("Skipping - No loan available")
            return
        
        try:
            response = await client.get(
                f"{BASE_URL}/loans/{self.loan_id}/ledger",
                headers={"Authorization": f"Bearer {self.token}"}
            )
            
            if response.status_code == 200:
                ledger = response.json()
                self.log_success(f"Loan ledger retrieved - {len(ledger)} entries")
                
                for entry in ledger[:3]:  # Show first 3 entries
                    self.log_info(f"- {entry.get('transaction_type', 'N/A')}: ₹{entry.get('amount', 0)} on {entry.get('transaction_date', 'N/A')}")
            else:
                self.log_error(f"Loan ledger retrieval failed: {response.status_code}")
                
        except Exception as e:
            self.log_error(f"Loan ledger error: {str(e)}")
    
    async def test_notifications(self, client: httpx.AsyncClient):
        """Test notification retrieval"""
        print(f"\n{Colors.YELLOW}{'='*60}")
        print("Testing Notifications")
        print(f"{'='*60}{Colors.RESET}\n")
        
        if not self.token:
            self.log_warning("Skipping - No authentication token")
            return
        
        try:
            response = await client.get(
                f"{BASE_URL}/notifications/my-notifications",
                headers={"Authorization": f"Bearer {self.token}"}
            )
            
            if response.status_code == 200:
                notifications = response.json()
                self.log_success(f"Retrieved {len(notifications)} notifications")
                
                for notif in notifications[:3]:  # Show first 3
                    self.log_info(f"- {notif.get('title', 'N/A')}: {notif.get('notification_type', 'N/A')}")
            else:
                self.log_error(f"Notifications retrieval failed: {response.status_code}")
                
        except Exception as e:
            self.log_error(f"Notifications error: {str(e)}")
    
    async def test_reports(self, client: httpx.AsyncClient):
        """Test report generation"""
        print(f"\n{Colors.YELLOW}{'='*60}")
        print("Testing Reports")
        print(f"{'='*60}{Colors.RESET}\n")
        
        # Login as admin for reports
        try:
            response = await client.post(
                f"{BASE_URL}/auth/login",
                data={
                    "username": "admin@dccb.com",
                    "password": "Admin@123"
                }
            )
            
            if response.status_code == 200:
                admin_token = response.json()["access_token"]
                self.log_success("Logged in as admin")
                
                # Get dashboard stats
                response = await client.get(
                    f"{BASE_URL}/reports/dashboard",
                    headers={"Authorization": f"Bearer {admin_token}"}
                )
                
                if response.status_code == 200:
                    stats = response.json()
                    self.log_success("Dashboard stats retrieved")
                    self.log_info(f"Total Loans: {stats.get('total_loans', 0)}")
                    self.log_info(f"Active Loans: {stats.get('active_loans', 0)}")
                    self.log_info(f"Total Disbursed: ₹{stats.get('total_disbursed', 0)}")
                else:
                    self.log_error(f"Dashboard stats failed: {response.status_code}")
            else:
                self.log_error("Admin login failed")
                
        except Exception as e:
            self.log_error(f"Reports error: {str(e)}")
    
    async def run_all_tests(self):
        """Run all tests sequentially"""
        print(f"\n{Colors.BLUE}{'='*60}")
        print("DCCB Loan Management System - API Testing")
        print(f"{'='*60}{Colors.RESET}\n")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Authentication tests
            auth_success = await self.test_authentication(client)
            
            if auth_success:
                # User profile tests
                await self.test_user_profile(client)
                
                # Loan configuration tests
                await self.test_loan_types(client)
                
                # Loan creation and management
                await self.test_create_loan(client)
                await self.test_get_loan_details(client)
                await self.test_approve_loan(client)
                await self.test_emi_schedule(client)
                
                # Payment processing
                await self.test_payment_processing(client)
                await self.test_loan_ledger(client)
                
                # Notifications
                await self.test_notifications(client)
                
                # Reports
                await self.test_reports(client)
        
        # Print summary
        print(f"\n{Colors.BLUE}{'='*60}")
        print("Test Summary")
        print(f"{'='*60}{Colors.RESET}\n")
        
        total_tests = self.tests_passed + self.tests_failed
        success_rate = (self.tests_passed / total_tests * 100) if total_tests > 0 else 0
        
        print(f"{Colors.GREEN}Passed: {self.tests_passed}{Colors.RESET}")
        print(f"{Colors.RED}Failed: {self.tests_failed}{Colors.RESET}")
        print(f"{Colors.BLUE}Success Rate: {success_rate:.1f}%{Colors.RESET}\n")


async def main():
    tester = APITester()
    await tester.run_all_tests()


if __name__ == "__main__":
    asyncio.run(main())
