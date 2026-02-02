import requests
import sys
import json
from datetime import datetime

class AllRemotesAPITester:
    def __init__(self, base_url="https://allremotes-shop.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.admin_user = None
        self.test_order_id = None

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    {details}")
        
        if success:
            self.tests_passed += 1
        else:
            self.failed_tests.append({"test": name, "details": details})

    def test_api_root(self):
        """Test API root endpoint"""
        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Message: {data.get('message', 'N/A')}"
            self.log_test("API Root", success, details)
            return success
        except Exception as e:
            self.log_test("API Root", False, f"Error: {str(e)}")
            return False

    def test_get_products(self):
        """Test get all products"""
        try:
            response = requests.get(f"{self.api_url}/products", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                products = response.json()
                details += f", Products count: {len(products)}"
                # Check if we have Australian car brands
                brands = [p.get('brand', '') for p in products]
                aus_brands = ['Holden', 'Toyota', 'Ford', 'Mazda']
                found_brands = [b for b in aus_brands if b in brands]
                details += f", Australian brands found: {found_brands}"
            self.log_test("Get Products", success, details)
            return success, response.json() if success else []
        except Exception as e:
            self.log_test("Get Products", False, f"Error: {str(e)}")
            return False, []

    def test_get_categories(self):
        """Test get categories"""
        try:
            response = requests.get(f"{self.api_url}/categories", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                categories = response.json()
                details += f", Categories count: {len(categories)}"
                cat_names = [c.get('name', '') for c in categories]
                details += f", Categories: {', '.join(cat_names[:3])}..."
            self.log_test("Get Categories", success, details)
            return success
        except Exception as e:
            self.log_test("Get Categories", False, f"Error: {str(e)}")
            return False

    def test_get_brands(self):
        """Test get brands"""
        try:
            response = requests.get(f"{self.api_url}/brands", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                brands = response.json()
                details += f", Brands count: {len(brands)}"
                if brands:
                    details += f", Sample brands: {', '.join(brands[:3])}"
            self.log_test("Get Brands", success, details)
            return success
        except Exception as e:
            self.log_test("Get Brands", False, f"Error: {str(e)}")
            return False

    def test_product_filters(self):
        """Test product filtering"""
        try:
            # Test category filter
            response = requests.get(f"{self.api_url}/products?category=car-remotes", timeout=10)
            success1 = response.status_code == 200
            car_remotes_count = len(response.json()) if success1 else 0
            
            # Test brand filter
            response = requests.get(f"{self.api_url}/products?brand=Toyota", timeout=10)
            success2 = response.status_code == 200
            toyota_count = len(response.json()) if success2 else 0
            
            # Test search
            response = requests.get(f"{self.api_url}/products?search=remote", timeout=10)
            success3 = response.status_code == 200
            search_count = len(response.json()) if success3 else 0
            
            # Test featured products
            response = requests.get(f"{self.api_url}/products?featured=true", timeout=10)
            success4 = response.status_code == 200
            featured_count = len(response.json()) if success4 else 0
            
            success = success1 and success2 and success3 and success4
            details = f"Car remotes: {car_remotes_count}, Toyota: {toyota_count}, Search 'remote': {search_count}, Featured: {featured_count}"
            
            self.log_test("Product Filters", success, details)
            return success
        except Exception as e:
            self.log_test("Product Filters", False, f"Error: {str(e)}")
            return False

    def test_get_single_product(self, products):
        """Test get single product"""
        if not products:
            self.log_test("Get Single Product", False, "No products available to test")
            return False
            
        try:
            product_id = products[0]['id']
            response = requests.get(f"{self.api_url}/products/{product_id}", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                product = response.json()
                details += f", Product: {product.get('name', 'N/A')}, Price: ${product.get('price', 0)}"
            self.log_test("Get Single Product", success, details)
            return success
        except Exception as e:
            self.log_test("Get Single Product", False, f"Error: {str(e)}")
            return False

    def test_user_registration(self):
        """Test user registration"""
        try:
            test_user = {
                "email": f"test_user_{datetime.now().strftime('%H%M%S')}@test.com",
                "password": "TestPass123!",
                "name": "Test User"
            }
            
            response = requests.post(f"{self.api_url}/register", json=test_user, timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                user_data = response.json()
                details += f", User ID: {user_data.get('id', 'N/A')[:8]}..."
            self.log_test("User Registration", success, details)
            return success, test_user if success else None
        except Exception as e:
            self.log_test("User Registration", False, f"Error: {str(e)}")
            return False, None

    def test_user_login(self, user_data):
        """Test user login"""
        if not user_data:
            self.log_test("User Login", False, "No user data available")
            return False, None
            
        try:
            login_data = {
                "email": user_data["email"],
                "password": user_data["password"]
            }
            
            response = requests.post(f"{self.api_url}/login", json=login_data, timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                result = response.json()
                user_info = result.get('user', {})
                details += f", User: {user_info.get('name', 'N/A')}, Role: {user_info.get('role', 'N/A')}"
            self.log_test("User Login", success, details)
            return success, result.get('user') if success else None
        except Exception as e:
            self.log_test("User Login", False, f"Error: {str(e)}")
            return False, None

    def test_admin_login(self):
        """Test admin login"""
        try:
            admin_data = {
                "email": "admin@allremotes.com.au",
                "password": "admin123"
            }
            
            response = requests.post(f"{self.api_url}/login", json=admin_data, timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                result = response.json()
                user_info = result.get('user', {})
                details += f", Admin: {user_info.get('name', 'N/A')}, Role: {user_info.get('role', 'N/A')}"
                self.admin_user = user_info
            self.log_test("Admin Login", success, details)
            return success
        except Exception as e:
            self.log_test("Admin Login", False, f"Error: {str(e)}")
            return False

    def test_create_order(self, user_data, products):
        """Test order creation"""
        if not user_data or not products:
            self.log_test("Create Order", False, "Missing user data or products")
            return False, None
            
        try:
            # Create order with first product
            product = products[0]
            order_data = {
                "user_email": user_data["email"],
                "items": [
                    {
                        "product_id": product["id"],
                        "quantity": 2,
                        "price": product["price"]
                    }
                ],
                "total": product["price"] * 2
            }
            
            response = requests.post(f"{self.api_url}/orders", json=order_data, timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                order = response.json()
                details += f", Order ID: {order.get('id', 'N/A')[:8]}..., Total: ${order.get('total', 0)}"
                self.test_order_id = order.get('id')
            self.log_test("Create Order", success, details)
            return success, order if success else None
        except Exception as e:
            self.log_test("Create Order", False, f"Error: {str(e)}")
            return False, None

    def test_get_orders(self, user_email):
        """Test get orders"""
        if not user_email:
            self.log_test("Get Orders", False, "No user email provided")
            return False
            
        try:
            response = requests.get(f"{self.api_url}/orders?user_email={user_email}", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                orders = response.json()
                details += f", Orders count: {len(orders)}"
            self.log_test("Get Orders", success, details)
            return success
        except Exception as e:
            self.log_test("Get Orders", False, f"Error: {str(e)}")
            return False

    def test_get_single_order(self):
        """Test get single order"""
        if not self.test_order_id:
            self.log_test("Get Single Order", False, "No order ID available")
            return False
            
        try:
            response = requests.get(f"{self.api_url}/orders/{self.test_order_id}", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                order = response.json()
                details += f", Order total: ${order.get('total', 0)}, Status: {order.get('status', 'N/A')}"
            self.log_test("Get Single Order", success, details)
            return success
        except Exception as e:
            self.log_test("Get Single Order", False, f"Error: {str(e)}")
            return False

    def test_checkout_session_creation(self):
        """Test checkout session creation"""
        if not self.test_order_id:
            self.log_test("Checkout Session", False, "No order ID available")
            return False
            
        try:
            checkout_data = {
                "order_id": self.test_order_id,
                "origin_url": self.base_url
            }
            
            response = requests.post(f"{self.api_url}/checkout/session", json=checkout_data, timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                session = response.json()
                details += f", Session ID: {session.get('session_id', 'N/A')[:20]}..., Has URL: {bool(session.get('url'))}"
            self.log_test("Checkout Session", success, details)
            return success
        except Exception as e:
            self.log_test("Checkout Session", False, f"Error: {str(e)}")
            return False

    def test_invalid_endpoints(self):
        """Test error handling for invalid endpoints"""
        try:
            # Test non-existent product
            response = requests.get(f"{self.api_url}/products/invalid-id", timeout=10)
            success1 = response.status_code == 404
            
            # Test non-existent order
            response = requests.get(f"{self.api_url}/orders/invalid-id", timeout=10)
            success2 = response.status_code == 404
            
            success = success1 and success2
            details = f"Invalid product: {response.status_code == 404}, Invalid order: {success2}"
            
            self.log_test("Error Handling", success, details)
            return success
        except Exception as e:
            self.log_test("Error Handling", False, f"Error: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all API tests"""
        print(f"🚀 Starting All Remotes API Tests")
        print(f"📍 Base URL: {self.base_url}")
        print("=" * 60)
        
        # Basic API tests
        if not self.test_api_root():
            print("❌ API Root failed - stopping tests")
            return self.generate_summary()
        
        # Product tests
        products_success, products = self.test_get_products()
        self.test_get_categories()
        self.test_get_brands()
        self.test_product_filters()
        
        if products:
            self.test_get_single_product(products)
        
        # User authentication tests
        reg_success, test_user = self.test_user_registration()
        if reg_success:
            login_success, user_data = self.test_user_login(test_user)
        
        # Admin tests
        self.test_admin_login()
        
        # Order tests
        if reg_success and products:
            order_success, order_data = self.test_create_order(test_user, products)
            if order_success:
                self.test_get_orders(test_user["email"])
                self.test_get_single_order()
                self.test_checkout_session_creation()
        
        # Error handling tests
        self.test_invalid_endpoints()
        
        return self.generate_summary()

    def generate_summary(self):
        """Generate test summary"""
        print("\n" + "=" * 60)
        print(f"📊 Test Summary")
        print(f"✅ Passed: {self.tests_passed}/{self.tests_run}")
        print(f"❌ Failed: {len(self.failed_tests)}/{self.tests_run}")
        
        if self.failed_tests:
            print("\n🔍 Failed Tests:")
            for test in self.failed_tests:
                print(f"  • {test['test']}: {test['details']}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"\n📈 Success Rate: {success_rate:.1f}%")
        
        return {
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "failed_tests": self.failed_tests,
            "success_rate": success_rate
        }

def main():
    tester = AllRemotesAPITester()
    results = tester.run_all_tests()
    
    # Return appropriate exit code
    return 0 if results["success_rate"] >= 80 else 1

if __name__ == "__main__":
    sys.exit(main())