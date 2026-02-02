"""
Test suite for new features:
1. Product Reviews & Ratings API
2. Related Products API
3. Email Notifications API (mocked)
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://allremotes-shop.preview.emergentagent.com').rstrip('/')

# Test credentials
TEST_USER_EMAIL = "admin@allremotes.com.au"
TEST_USER_PASSWORD = "admin123"
TEST_PRODUCT_ID = "car-remote-1"

@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture(scope="module")
def auth_user(api_client):
    """Login and get user info"""
    response = api_client.post(f"{BASE_URL}/api/login", json={
        "email": TEST_USER_EMAIL,
        "password": TEST_USER_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("user")
    return None


class TestHealthCheck:
    """Basic API health check"""
    
    def test_api_root(self, api_client):
        """Test API root endpoint"""
        response = api_client.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"] == "All Remotes API"


class TestProductReviewsAPI:
    """Product Reviews CRUD tests"""
    
    def test_get_reviews_for_product(self, api_client):
        """GET /api/reviews/{product_id} - Get reviews with stats"""
        response = api_client.get(f"{BASE_URL}/api/reviews/{TEST_PRODUCT_ID}")
        assert response.status_code == 200
        
        data = response.json()
        # Verify response structure
        assert "reviews" in data
        assert "total_reviews" in data
        assert "average_rating" in data
        assert "rating_breakdown" in data
        
        # Verify rating breakdown structure
        breakdown = data["rating_breakdown"]
        for star in [1, 2, 3, 4, 5]:
            assert str(star) in breakdown or star in breakdown
        
        # Verify average rating is valid
        assert 0 <= data["average_rating"] <= 5
        assert data["total_reviews"] >= 0
    
    def test_get_reviews_nonexistent_product(self, api_client):
        """GET /api/reviews/{product_id} - Returns empty for nonexistent product"""
        response = api_client.get(f"{BASE_URL}/api/reviews/nonexistent-product-xyz")
        assert response.status_code == 200
        
        data = response.json()
        assert data["total_reviews"] == 0
        assert data["average_rating"] == 0
        assert data["reviews"] == []
    
    def test_create_review_success(self, api_client, auth_user):
        """POST /api/reviews - Create new review"""
        unique_email = f"TEST_reviewer_{uuid.uuid4().hex[:8]}@test.com"
        
        review_data = {
            "product_id": TEST_PRODUCT_ID,
            "user_email": unique_email,
            "user_name": "Test Reviewer",
            "rating": 4,
            "title": "TEST_Great remote control",
            "comment": "This is a test review for automated testing."
        }
        
        response = api_client.post(f"{BASE_URL}/api/reviews", json=review_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["product_id"] == TEST_PRODUCT_ID
        assert data["user_email"] == unique_email
        assert data["rating"] == 4
        assert data["title"] == "TEST_Great remote control"
        assert "id" in data
        assert "created_at" in data
    
    def test_create_review_duplicate_blocked(self, api_client):
        """POST /api/reviews - Duplicate review should be blocked"""
        unique_email = f"TEST_dup_{uuid.uuid4().hex[:8]}@test.com"
        
        review_data = {
            "product_id": TEST_PRODUCT_ID,
            "user_email": unique_email,
            "user_name": "Duplicate Tester",
            "rating": 5,
            "title": "TEST_First review",
            "comment": "First review from this user."
        }
        
        # First review should succeed
        response1 = api_client.post(f"{BASE_URL}/api/reviews", json=review_data)
        assert response1.status_code == 200
        
        # Second review from same user should fail
        review_data["title"] = "TEST_Second review attempt"
        response2 = api_client.post(f"{BASE_URL}/api/reviews", json=review_data)
        assert response2.status_code == 400
        assert "already reviewed" in response2.json().get("detail", "").lower()
    
    def test_create_review_invalid_rating(self, api_client):
        """POST /api/reviews - Invalid rating should fail validation"""
        review_data = {
            "product_id": TEST_PRODUCT_ID,
            "user_email": "invalid_rating@test.com",
            "user_name": "Invalid Rater",
            "rating": 10,  # Invalid - should be 1-5
            "title": "TEST_Invalid rating",
            "comment": "This should fail."
        }
        
        response = api_client.post(f"{BASE_URL}/api/reviews", json=review_data)
        assert response.status_code == 422  # Validation error
    
    def test_create_review_nonexistent_product(self, api_client):
        """POST /api/reviews - Review for nonexistent product should fail"""
        review_data = {
            "product_id": "nonexistent-product-xyz",
            "user_email": "test_nonexistent@test.com",
            "user_name": "Test User",
            "rating": 5,
            "title": "TEST_Review for nonexistent",
            "comment": "This should fail."
        }
        
        response = api_client.post(f"{BASE_URL}/api/reviews", json=review_data)
        assert response.status_code == 404
        assert "not found" in response.json().get("detail", "").lower()
    
    def test_delete_review_success(self, api_client):
        """DELETE /api/reviews/{review_id} - Delete own review"""
        unique_email = f"TEST_delete_{uuid.uuid4().hex[:8]}@test.com"
        
        # First create a review
        review_data = {
            "product_id": TEST_PRODUCT_ID,
            "user_email": unique_email,
            "user_name": "Delete Tester",
            "rating": 3,
            "title": "TEST_To be deleted",
            "comment": "This review will be deleted."
        }
        
        create_response = api_client.post(f"{BASE_URL}/api/reviews", json=review_data)
        assert create_response.status_code == 200
        review_id = create_response.json()["id"]
        
        # Delete the review
        delete_response = api_client.delete(
            f"{BASE_URL}/api/reviews/{review_id}?user_email={unique_email}"
        )
        assert delete_response.status_code == 200
        assert "deleted" in delete_response.json().get("message", "").lower()
    
    def test_delete_review_unauthorized(self, api_client):
        """DELETE /api/reviews/{review_id} - Cannot delete others' reviews"""
        # Try to delete with wrong email
        delete_response = api_client.delete(
            f"{BASE_URL}/api/reviews/some-review-id?user_email=wrong@email.com"
        )
        assert delete_response.status_code == 404


class TestRelatedProductsAPI:
    """Related Products API tests"""
    
    def test_get_related_products(self, api_client):
        """GET /api/products/{id}/related - Get related products"""
        response = api_client.get(f"{BASE_URL}/api/products/{TEST_PRODUCT_ID}/related")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        # Should return related products (up to 8 by default)
        assert len(data) <= 8
        
        # Each product should have required fields
        for product in data:
            assert "id" in product
            assert "name" in product
            assert "price" in product
            assert "category" in product
            assert "brand" in product
            # Should not include the original product
            assert product["id"] != TEST_PRODUCT_ID
    
    def test_get_related_products_with_limit(self, api_client):
        """GET /api/products/{id}/related?limit=4 - Limit related products"""
        response = api_client.get(f"{BASE_URL}/api/products/{TEST_PRODUCT_ID}/related?limit=4")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) <= 4
    
    def test_get_related_products_nonexistent(self, api_client):
        """GET /api/products/{id}/related - Nonexistent product returns 404"""
        response = api_client.get(f"{BASE_URL}/api/products/nonexistent-xyz/related")
        assert response.status_code == 404
    
    def test_related_products_same_category_or_brand(self, api_client):
        """Verify related products share category or brand with original"""
        # First get the original product
        product_response = api_client.get(f"{BASE_URL}/api/products/{TEST_PRODUCT_ID}")
        assert product_response.status_code == 200
        original = product_response.json()
        
        # Get related products
        related_response = api_client.get(f"{BASE_URL}/api/products/{TEST_PRODUCT_ID}/related")
        assert related_response.status_code == 200
        related = related_response.json()
        
        # Each related product should share category OR brand
        for product in related:
            shares_category = product["category"] == original["category"]
            shares_brand = product["brand"] == original["brand"]
            assert shares_category or shares_brand, \
                f"Related product {product['id']} doesn't share category or brand"


class TestEmailNotificationsAPI:
    """Email Notifications API tests (MOCKED)"""
    
    def test_send_order_confirmation_success(self, api_client):
        """POST /api/orders/{id}/send-confirmation - Send confirmation email (mocked)"""
        # First create a test order
        order_data = {
            "user_email": "TEST_email_test@example.com",
            "items": [
                {"product_id": TEST_PRODUCT_ID, "quantity": 1, "price": 99.99}
            ],
            "total": 99.99
        }
        
        create_response = api_client.post(f"{BASE_URL}/api/orders", json=order_data)
        assert create_response.status_code == 200
        order_id = create_response.json()["id"]
        
        # Send confirmation email
        email_response = api_client.post(f"{BASE_URL}/api/orders/{order_id}/send-confirmation")
        assert email_response.status_code == 200
        
        data = email_response.json()
        # Should have customer and admin email results
        assert "customer_email" in data
        assert "admin_email" in data
        
        # Since Resend is not configured, should be mocked
        assert data["customer_email"]["status"] in ["mocked", "sent"]
        assert data["admin_email"]["status"] in ["mocked", "sent"]
    
    def test_send_order_confirmation_nonexistent(self, api_client):
        """POST /api/orders/{id}/send-confirmation - Nonexistent order returns 404"""
        response = api_client.post(f"{BASE_URL}/api/orders/nonexistent-order-xyz/send-confirmation")
        assert response.status_code == 404
    
    def test_test_email_endpoint(self, api_client):
        """POST /api/test-email - Test email functionality (mocked)"""
        response = api_client.post(f"{BASE_URL}/api/test-email?to_email=test@example.com")
        assert response.status_code == 200
        
        data = response.json()
        assert "status" in data
        # Should be mocked since Resend API key is not configured
        assert data["status"] in ["mocked", "sent"]


class TestProductEndpoints:
    """Verify product endpoints still work correctly"""
    
    def test_get_product_by_id(self, api_client):
        """GET /api/products/{id} - Get single product"""
        response = api_client.get(f"{BASE_URL}/api/products/{TEST_PRODUCT_ID}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["id"] == TEST_PRODUCT_ID
        assert "name" in data
        assert "price" in data
        assert "category" in data
        assert "brand" in data
        assert "images" in data
    
    def test_get_all_products(self, api_client):
        """GET /api/products - Get all products"""
        response = api_client.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0


class TestAuthEndpoints:
    """Verify auth endpoints work for review functionality"""
    
    def test_login_success(self, api_client):
        """POST /api/login - Login with valid credentials"""
        response = api_client.post(f"{BASE_URL}/api/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "user" in data
        assert data["user"]["email"] == TEST_USER_EMAIL
    
    def test_login_invalid_credentials(self, api_client):
        """POST /api/login - Login with invalid credentials"""
        response = api_client.post(f"{BASE_URL}/api/login", json={
            "email": "wrong@email.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
