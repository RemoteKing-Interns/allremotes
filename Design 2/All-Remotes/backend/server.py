from fastapi import FastAPI, APIRouter, HTTPException, Request, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone
from fastapi import UploadFile, File
from fastapi.responses import StreamingResponse
import csv
import io
from collections import defaultdict
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

# Email setup (Resend)
try:
    import resend
    resend.api_key = os.environ.get('RESEND_API_KEY', '')
    EMAIL_ENABLED = bool(resend.api_key)
except ImportError:
    EMAIL_ENABLED = False

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

stripe_api_key = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    category: str
    brand: str
    model: Optional[str] = None
    price: float
    images: List[str]
    stock: int
    specifications: Optional[Dict[str, str]] = {}
    featured: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    name: str
    description: str
    category: str
    brand: str
    model: Optional[str] = None
    price: float
    images: List[str]
    stock: int
    specifications: Optional[Dict[str, str]] = {}
    featured: bool = False

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    password: str
    name: str
    role: str = "customer"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserRegister(BaseModel):
    email: str
    password: str
    name: str

class UserLogin(BaseModel):
    email: str
    password: str

class CartItem(BaseModel):
    product_id: str
    quantity: int
    price: float

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_email: str
    items: List[CartItem]
    total: float
    status: str = "pending"
    payment_session_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrderCreate(BaseModel):
    user_email: str
    items: List[CartItem]
    total: float

class PaymentTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    amount: float
    currency: str
    metadata: Dict[str, str]
    payment_status: str = "pending"
    order_id: Optional[str] = None
    user_email: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CheckoutRequest(BaseModel):
    order_id: str
    origin_url: str

@api_router.get("/")
async def root():
    return {"message": "All Remotes API"}

@api_router.get("/products")
async def get_products(
    category: Optional[str] = None,
    brand: Optional[str] = None,
    search: Optional[str] = None,
    featured: Optional[bool] = None
):
    filter_query = {}
    if category:
        filter_query['category'] = category
    if brand:
        filter_query['brand'] = brand
    if featured is not None:
        filter_query['featured'] = featured
    if search:
        filter_query['$or'] = [
            {'name': {'$regex': search, '$options': 'i'}},
            {'description': {'$regex': search, '$options': 'i'}},
            {'brand': {'$regex': search, '$options': 'i'}}
        ]
    
    products = await db.products.find(filter_query, {"_id": 0}).to_list(1000)
    for product in products:
        if isinstance(product.get('created_at'), str):
            product['created_at'] = datetime.fromisoformat(product['created_at'])
    return products

@api_router.get("/products/export-csv")
async def export_products_csv():
    products = await db.products.find({}, {"_id": 0}).to_list(10000)
    
    output = io.StringIO()
    if products:
        fieldnames = ['id', 'name', 'description', 'category', 'brand', 'model', 'price', 'stock', 'images', 'featured']
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        
        for product in products:
            writer.writerow({
                'id': product['id'],
                'name': product['name'],
                'description': product['description'],
                'category': product['category'],
                'brand': product['brand'],
                'model': product.get('model', ''),
                'price': product['price'],
                'stock': product['stock'],
                'images': '|'.join(product.get('images', [])),
                'featured': product.get('featured', False)
            })
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=products.csv"}
    )

@api_router.post("/products/import-csv")
async def import_products_csv(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        decoded = contents.decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(decoded))
        
        imported = 0
        for row in csv_reader:
            product = Product(
                name=row['name'],
                description=row.get('description', ''),
                category=row['category'],
                brand=row['brand'],
                model=row.get('model'),
                price=float(row['price']),
                images=row.get('images', '').split('|') if row.get('images') else [],
                stock=int(row.get('stock', 0)),
                specifications={k: v for k, v in row.items() if k.startswith('spec_')},
                featured=row.get('featured', '').lower() == 'true'
            )
            
            doc = product.model_dump()
            doc['created_at'] = doc['created_at'].isoformat()
            await db.products.insert_one(doc)
            imported += 1
        
        return {"message": f"Successfully imported {imported} products"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Import failed: {str(e)}")

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if isinstance(product.get('created_at'), str):
        product['created_at'] = datetime.fromisoformat(product['created_at'])
    return product

@api_router.post("/products", response_model=Product)
async def create_product(product: ProductCreate):
    product_obj = Product(**product.model_dump())
    doc = product_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.products.insert_one(doc)
    return product_obj

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product: ProductCreate):
    existing = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    updated_product = Product(id=product_id, **product.model_dump())
    doc = updated_product.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.products.update_one({"id": product_id}, {"$set": doc})
    return updated_product

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}

@api_router.get("/categories")
async def get_categories():
    categories = [
        {"id": "car-remotes", "name": "Car Remotes", "description": "Remote keys for all car brands"},
        {"id": "garage-remotes", "name": "Garage Remotes", "description": "Garage door remote controls"},
        {"id": "car-keys", "name": "Car Keys", "description": "Replacement car keys"},
        {"id": "lock-keys", "name": "Lock Keys", "description": "Keys for all types of locks"},
        {"id": "accessories", "name": "Accessories", "description": "Remote and key accessories"},
        {"id": "machinery", "name": "Key Cutting Machines", "description": "Professional key cutting equipment"},
        {"id": "tools", "name": "Tools", "description": "Key cutting and locksmith tools"}
    ]
    return categories

@api_router.get("/brands")
async def get_brands():
    brands = await db.products.distinct("brand")
    return brands

@api_router.post("/register", response_model=User)
async def register_user(user: UserRegister):
    existing = await db.users.find_one({"email": user.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_obj = User(**user.model_dump())
    doc = user_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.users.insert_one(doc)
    return user_obj

@api_router.post("/login")
async def login_user(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or user['password'] != credentials.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return {"message": "Login successful", "user": {"id": user['id'], "email": user['email'], "name": user['name'], "role": user['role']}}

@api_router.post("/orders", response_model=Order)
async def create_order(order: OrderCreate):
    order_obj = Order(**order.model_dump())
    doc = order_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.orders.insert_one(doc)
    return order_obj

@api_router.get("/orders", response_model=List[Order])
async def get_orders(user_email: Optional[str] = None):
    filter_query = {}
    if user_email:
        filter_query['user_email'] = user_email
    
    orders = await db.orders.find(filter_query, {"_id": 0}).to_list(1000)
    for order in orders:
        if isinstance(order.get('created_at'), str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
    return orders

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if isinstance(order.get('created_at'), str):
        order['created_at'] = datetime.fromisoformat(order['created_at'])
    return order

@api_router.post("/checkout/session")
async def create_checkout_session(request: CheckoutRequest):
    order = await db.orders.find_one({"id": request.order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    host_url = request.origin_url
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    success_url = f"{host_url}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{host_url}/checkout"
    
    checkout_request = CheckoutSessionRequest(
        amount=float(order['total']),
        currency="aud",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "order_id": order['id'],
            "user_email": order['user_email']
        }
    )
    
    session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
    
    transaction = PaymentTransaction(
        session_id=session.session_id,
        amount=float(order['total']),
        currency="aud",
        metadata={"order_id": order['id'], "user_email": order['user_email']},
        payment_status="pending",
        order_id=order['id'],
        user_email=order['user_email']
    )
    
    doc = transaction.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.payment_transactions.insert_one(doc)
    
    await db.orders.update_one(
        {"id": request.order_id},
        {"$set": {"payment_session_id": session.session_id}}
    )
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/checkout/status/{session_id}")
async def get_checkout_status(session_id: str):
    transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    if transaction['payment_status'] == 'paid':
        return transaction
    
    host_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    try:
        status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
        
        if status.payment_status == 'paid' and transaction['payment_status'] != 'paid':
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {
                    "$set": {
                        "payment_status": "paid",
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
            
            if transaction.get('order_id'):
                await db.orders.update_one(
                    {"id": transaction['order_id']},
                    {"$set": {"status": "paid"}}
                )
        
        transaction['payment_status'] = status.payment_status
        transaction['status'] = status.status
        
        return transaction
    except Exception as e:
        logging.error(f"Error checking payment status: {str(e)}")
        raise HTTPException(status_code=500, detail="Error checking payment status")

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None)):
    body = await request.body()
    
    host_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, stripe_signature)
        
        if webhook_response.payment_status == 'paid':
            transaction = await db.payment_transactions.find_one(
                {"session_id": webhook_response.session_id},
                {"_id": 0}
            )
            
            if transaction and transaction['payment_status'] != 'paid':
                await db.payment_transactions.update_one(
                    {"session_id": webhook_response.session_id},
                    {
                        "$set": {
                            "payment_status": "paid",
                            "updated_at": datetime.now(timezone.utc).isoformat()
                        }
                    }
                )
                
                if transaction.get('order_id'):
                    await db.orders.update_one(
                        {"id": transaction['order_id']},
                        {"$set": {"status": "paid"}}
                    )
        
        return {"status": "success"}
    except Exception as e:
        logging.error(f"Webhook error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/analytics/dashboard")
async def get_analytics_dashboard():
    orders = await db.orders.find({}, {"_id": 0}).to_list(10000)
    products = await db.products.find({}, {"_id": 0}).to_list(10000)
    
    total_revenue = sum(order['total'] for order in orders if order.get('status') == 'paid')
    total_orders = len([o for o in orders if o.get('status') == 'paid'])
    
    product_sales = defaultdict(int)
    for order in orders:
        if order.get('status') == 'paid':
            for item in order.get('items', []):
                product_sales[item['product_id']] += item['quantity']
    
    top_products = sorted(product_sales.items(), key=lambda x: x[1], reverse=True)[:5]
    top_products_data = []
    for product_id, quantity in top_products:
        product = await db.products.find_one({"id": product_id}, {"_id": 0})
        if product:
            top_products_data.append({
                "name": product['name'],
                "quantity": quantity,
                "revenue": quantity * product['price']
            })
    
    monthly_sales = defaultdict(float)
    for order in orders:
        if order.get('status') == 'paid' and order.get('created_at'):
            if isinstance(order['created_at'], str):
                date = datetime.fromisoformat(order['created_at'])
            else:
                date = order['created_at']
            month_key = date.strftime('%Y-%m')
            monthly_sales[month_key] += order['total']
    
    monthly_data = [{"month": k, "revenue": v} for k, v in sorted(monthly_sales.items())]
    
    return {
        "total_revenue": total_revenue,
        "total_orders": total_orders,
        "total_products": len(products),
        "top_products": top_products_data,
        "monthly_sales": monthly_data,
        "low_stock_products": len([p for p in products if p.get('stock', 0) < 10])
    }

 

class Wishlist(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_email: str
    product_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

@api_router.post("/wishlist")
async def add_to_wishlist(user_email: str, product_id: str):
    existing = await db.wishlist.find_one({"user_email": user_email, "product_id": product_id}, {"_id": 0})
    if existing:
        return {"message": "Already in wishlist"}
    
    wishlist_item = Wishlist(user_email=user_email, product_id=product_id)
    doc = wishlist_item.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.wishlist.insert_one(doc)
    return {"message": "Added to wishlist"}

@api_router.get("/wishlist/{user_email}")
async def get_wishlist(user_email: str):
    wishlist_items = await db.wishlist.find({"user_email": user_email}, {"_id": 0}).to_list(1000)
    product_ids = [item['product_id'] for item in wishlist_items]
    
    products = []
    for product_id in product_ids:
        product = await db.products.find_one({"id": product_id}, {"_id": 0})
        if product:
            products.append(product)
    
    return products

@api_router.delete("/wishlist/{user_email}/{product_id}")
async def remove_from_wishlist(user_email: str, product_id: str):
    result = await db.wishlist.delete_one({"user_email": user_email, "product_id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found in wishlist")
    return {"message": "Removed from wishlist"}

class DiscountCode(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    discount_type: str
    discount_value: float
    min_purchase: float = 0
    max_uses: int = 0
    used_count: int = 0
    active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

@api_router.post("/discount-codes")
async def create_discount_code(code_data: dict):
    discount = DiscountCode(**code_data)
    doc = discount.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.discount_codes.insert_one(doc)
    return discount

@api_router.post("/discount-codes/validate")
async def validate_discount_code(code: str, order_total: float):
    discount = await db.discount_codes.find_one({"code": code.upper(), "active": True}, {"_id": 0})
    if not discount:
        raise HTTPException(status_code=404, detail="Invalid discount code")
    
    if discount.get('max_uses', 0) > 0 and discount.get('used_count', 0) >= discount['max_uses']:
        raise HTTPException(status_code=400, detail="Discount code has reached maximum uses")
    
    if order_total < discount.get('min_purchase', 0):
        raise HTTPException(status_code=400, detail=f"Minimum purchase of ${discount['min_purchase']} required")
    
    discount_amount = 0
    if discount['discount_type'] == 'percentage':
        discount_amount = (order_total * discount['discount_value']) / 100
    else:
        discount_amount = discount['discount_value']
    
    return {
        "valid": True,
        "discount_amount": discount_amount,
        "new_total": max(0, order_total - discount_amount)
    }

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str):
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Order status updated"}

@api_router.get("/customers")
async def get_customers():
    users = await db.users.find({"role": "customer"}, {"_id": 0, "password": 0}).to_list(10000)
    
    customer_data = []
    for user in users:
        orders = await db.orders.find({"user_email": user['email']}, {"_id": 0}).to_list(1000)
        total_spent = sum(order['total'] for order in orders if order.get('status') == 'paid')
        customer_data.append({
            **user,
            "total_orders": len(orders),
            "total_spent": total_spent
        })
    
    return customer_data

# ==================== PRODUCT REVIEWS ====================

class Review(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: str
    user_email: str
    user_name: str
    rating: int = Field(ge=1, le=5)
    title: str
    comment: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ReviewCreate(BaseModel):
    product_id: str
    user_email: str
    user_name: str
    rating: int = Field(ge=1, le=5)
    title: str
    comment: str

@api_router.post("/reviews", response_model=Review)
async def create_review(review: ReviewCreate):
    # Check if user already reviewed this product
    existing = await db.reviews.find_one(
        {"product_id": review.product_id, "user_email": review.user_email}, 
        {"_id": 0}
    )
    if existing:
        raise HTTPException(status_code=400, detail="You have already reviewed this product")
    
    # Verify product exists
    product = await db.products.find_one({"id": review.product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    review_obj = Review(**review.model_dump())
    doc = review_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.reviews.insert_one(doc)
    
    return review_obj

@api_router.get("/reviews/{product_id}")
async def get_product_reviews(product_id: str):
    reviews = await db.reviews.find({"product_id": product_id}, {"_id": 0}).to_list(1000)
    
    # Calculate average rating
    total_rating = sum(r['rating'] for r in reviews)
    avg_rating = total_rating / len(reviews) if reviews else 0
    
    # Convert dates
    for review in reviews:
        if isinstance(review.get('created_at'), str):
            review['created_at'] = datetime.fromisoformat(review['created_at'])
    
    # Sort by newest first
    reviews.sort(key=lambda x: x.get('created_at', datetime.min), reverse=True)
    
    return {
        "reviews": reviews,
        "total_reviews": len(reviews),
        "average_rating": round(avg_rating, 1),
        "rating_breakdown": {
            5: len([r for r in reviews if r['rating'] == 5]),
            4: len([r for r in reviews if r['rating'] == 4]),
            3: len([r for r in reviews if r['rating'] == 3]),
            2: len([r for r in reviews if r['rating'] == 2]),
            1: len([r for r in reviews if r['rating'] == 1]),
        }
    }

@api_router.delete("/reviews/{review_id}")
async def delete_review(review_id: str, user_email: str):
    result = await db.reviews.delete_one({"id": review_id, "user_email": user_email})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Review not found or unauthorized")
    return {"message": "Review deleted successfully"}

# ==================== RELATED PRODUCTS ====================

@api_router.get("/products/{product_id}/related")
async def get_related_products(product_id: str, limit: int = 8):
    # Get the current product
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Find related products by same category or brand (excluding current product)
    related = await db.products.find({
        "$and": [
            {"id": {"$ne": product_id}},
            {"$or": [
                {"category": product['category']},
                {"brand": product['brand']}
            ]}
        ]
    }, {"_id": 0}).to_list(limit * 2)  # Get more to filter
    
    # Prioritize products matching both category AND brand
    def relevance_score(p):
        score = 0
        if p['category'] == product['category']:
            score += 2
        if p['brand'] == product['brand']:
            score += 1
        return score
    
    related.sort(key=relevance_score, reverse=True)
    
    return related[:limit]

# ==================== EMAIL NOTIFICATIONS ====================

SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@allremotes.com.au')

async def send_email_async(to_email: str, subject: str, html_content: str):
    """Send email using Resend (non-blocking)"""
    if not EMAIL_ENABLED:
        logging.info(f"[EMAIL MOCK] To: {to_email}, Subject: {subject}")
        logging.info(f"[EMAIL MOCK] Content preview: {html_content[:200]}...")
        return {"status": "mocked", "message": "Email logged (Resend not configured)"}
    
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [to_email],
            "subject": subject,
            "html": html_content
        }
        result = await asyncio.to_thread(resend.Emails.send, params)
        logging.info(f"Email sent to {to_email}: {subject}")
        return {"status": "sent", "email_id": result.get("id")}
    except Exception as e:
        logging.error(f"Failed to send email to {to_email}: {str(e)}")
        return {"status": "error", "message": str(e)}

def generate_order_confirmation_html(order: dict, items_details: list) -> str:
    """Generate HTML email for order confirmation"""
    items_html = ""
    for item in items_details:
        items_html += f"""
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">
                <strong>{item['name']}</strong><br>
                <span style="color: #666;">Qty: {item['quantity']}</span>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
                ${item['subtotal']:.2f}
            </td>
        </tr>
        """
    
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #dc2626; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">ALL<span style="color: #fee2e2;">REMOTES</span></h1>
        </div>
        
        <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #1f2937;">Order Confirmation</h2>
            <p style="color: #4b5563;">Thank you for your order! Here are your order details:</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Order ID:</strong> {order['id']}</p>
                <p><strong>Status:</strong> {order.get('status', 'pending').upper()}</p>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px;">
                <thead>
                    <tr style="background: #f3f4f6;">
                        <th style="padding: 12px; text-align: left;">Item</th>
                        <th style="padding: 12px; text-align: right;">Price</th>
                    </tr>
                </thead>
                <tbody>
                    {items_html}
                </tbody>
                <tfoot>
                    <tr style="background: #dc2626; color: white;">
                        <td style="padding: 15px; font-weight: bold;">TOTAL</td>
                        <td style="padding: 15px; text-align: right; font-weight: bold; font-size: 18px;">
                            ${order['total']:.2f} AUD
                        </td>
                    </tr>
                </tfoot>
            </table>
            
            <div style="margin-top: 30px; padding: 20px; background: #fef2f2; border-radius: 8px;">
                <h3 style="color: #dc2626; margin-top: 0;">Need Help?</h3>
                <p style="color: #4b5563; margin-bottom: 0;">
                    Call us at <strong>1300 REMOTE</strong> or reply to this email.
                </p>
            </div>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
            <p>© 2025 All Remotes Australia. All rights reserved.</p>
        </div>
    </body>
    </html>
    """

def generate_admin_notification_html(order: dict, items_details: list) -> str:
    """Generate HTML email for admin order notification"""
    items_html = ""
    for item in items_details:
        items_html += f"<li>{item['name']} x {item['quantity']} = ${item['subtotal']:.2f}</li>"
    
    return f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #dc2626;">🛒 New Order Received!</h2>
        <p><strong>Order ID:</strong> {order['id']}</p>
        <p><strong>Customer:</strong> {order['user_email']}</p>
        <p><strong>Total:</strong> ${order['total']:.2f} AUD</p>
        <p><strong>Status:</strong> {order.get('status', 'pending')}</p>
        
        <h3>Items:</h3>
        <ul>{items_html}</ul>
        
        <p style="margin-top: 20px;">
            <a href="#" style="background: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                View in Admin Panel
            </a>
        </p>
    </body>
    </html>
    """

@api_router.post("/orders/{order_id}/send-confirmation")
async def send_order_confirmation(order_id: str):
    """Send order confirmation email to customer and notification to admin"""
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Get product details for each item
    items_details = []
    for item in order.get('items', []):
        product = await db.products.find_one({"id": item['product_id']}, {"_id": 0})
        if product:
            items_details.append({
                "name": product['name'],
                "quantity": item['quantity'],
                "price": item['price'],
                "subtotal": item['quantity'] * item['price']
            })
    
    results = {}
    
    # Send customer confirmation
    customer_html = generate_order_confirmation_html(order, items_details)
    customer_result = await send_email_async(
        order['user_email'],
        f"Order Confirmation - #{order_id[:8].upper()}",
        customer_html
    )
    results['customer_email'] = customer_result
    
    # Send admin notification
    admin_html = generate_admin_notification_html(order, items_details)
    admin_result = await send_email_async(
        ADMIN_EMAIL,
        f"New Order - #{order_id[:8].upper()} - ${order['total']:.2f}",
        admin_html
    )
    results['admin_email'] = admin_result
    
    return results

# Test email endpoint
@api_router.post("/test-email")
async def test_email(to_email: str):
    """Test email functionality"""
    html = """
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="color: #dc2626;">All Remotes - Test Email</h1>
        <p>If you're seeing this, email notifications are working correctly!</p>
        <p>📧 Sent from All Remotes E-Commerce</p>
    </body>
    </html>
    """
    result = await send_email_async(to_email, "All Remotes - Test Email", html)
    return result

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
