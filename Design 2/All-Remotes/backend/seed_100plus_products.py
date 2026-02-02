import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Generate 105+ products
products = []

# Car Remotes - Major Australian brands
car_products = [
    # Toyota (10 products)
    {"brand": "Toyota", "models": ["Camry", "Corolla", "Hilux", "RAV4", "LandCruiser", "Prado", "Yaris", "Kluger", "Fortuner", "C-HR"]},
    # Holden (6 products)
    {"brand": "Holden", "models": ["Commodore", "Cruze", "Astra", "Captiva", "Colorado", "Trailblazer"]},
    # Ford (8 products)
    {"brand": "Ford", "models": ["Ranger", "Territory", "Focus", "Mondeo", "Fiesta", "Everest", "Mustang", "Escape"]},
    # Mazda (7 products)
    {"brand": "Mazda", "models": ["CX-5", "CX-3", "Mazda3", "Mazda6", "CX-9", "BT-50", "MX-5"]},
    # Hyundai (7 products)
    {"brand": "Hyundai", "models": ["i30", "Tucson", "Santa Fe", "Kona", "Elantra", "iLoad", "Accent"]},
    # Nissan (7 products)
    {"brand": "Nissan", "models": ["Navara", "Qashqai", "X-Trail", "Patrol", "Pulsar", "Juke", "Pathfinder"]},
    # Mitsubishi (6 products)
    {"brand": "Mitsubishi", "models": ["Triton", "Outlander", "ASX", "Pajero", "Lancer", "Eclipse Cross"]},
    # Subaru (6 products)
    {"brand": "Subaru", "models": ["Outback", "Forester", "XV", "Impreza", "WRX", "Liberty"]},
    # Honda (6 products)
    {"brand": "Honda", "models": ["CR-V", "Civic", "Accord", "HR-V", "Jazz", "Odyssey"]},
    # Volkswagen (6 products)
    {"brand": "Volkswagen", "models": ["Golf", "Tiguan", "Passat", "Polo", "Amarok", "Transporter"]},
    # Kia (6 products)
    {"brand": "Kia", "models": ["Sportage", "Cerato", "Sorento", "Carnival", "Picanto", "Stinger"]},
    # Premium brands
    {"brand": "BMW", "models": ["3 Series", "5 Series", "X3", "X5"]},
    {"brand": "Mercedes-Benz", "models": ["C-Class", "E-Class", "GLC", "A-Class"]},
    {"brand": "Audi", "models": ["A3", "A4", "Q3", "Q5"]},
    # Others
    {"brand": "Isuzu", "models": ["D-MAX", "MU-X"]},
    {"brand": "Suzuki", "models": ["Swift", "Vitara", "S-Cross", "Jimny"]},
]

product_id = 1

# Generate car remotes
for brand_data in car_products:
    brand = brand_data["brand"]
    for model in brand_data["models"]:
        price = round(75 + (len(brand) * 3) + (product_id % 30), 2)
        stock = 8 + (product_id % 25)
        
        products.append({
            "id": f"car-remote-{product_id}",
            "name": f"{brand} {model} Remote Key",
            "description": f"Genuine OEM quality replacement remote key for {brand} {model}. Features high-quality buttons, durable construction, and long battery life. Compatible with Australian market vehicles. Includes programming instructions.",
            "category": "car-remotes",
            "brand": brand,
            "model": model,
            "price": price,
            "images": [
                "https://images.unsplash.com/photo-1710006548777-bb4c5c159f86",
                "https://images.unsplash.com/photo-1761264889404-a194af20ae90"
            ],
            "stock": stock,
            "specifications": {
                "buttons": "3-4",
                "frequency": "433MHz",
                "battery": "CR2032",
                "warranty": "12 months"
            },
            "featured": product_id % 12 == 0,
            "created_at": "2025-01-15T00:00:00Z"
        })
        product_id += 1

# Garage remotes - 20 products
garage_brands = ["Merlin", "B&D", "ATA", "Boss", "Gliderol", "Steel-Line", "Centurion", "Superlift", "Dominator", "CBB"]
models_per_brand = 2

for brand in garage_brands:
    for i in range(models_per_brand):
        model_code = f"{brand[0]}{(i+1)*100+product_id}"
        products.append({
            "id": f"garage-remote-{product_id}",
            "name": f"{brand} {model_code} Garage Remote",
            "description": f"Compatible garage door remote control for {brand} openers. Easy DIY programming with step-by-step instructions included. Reliable Australian quality with extended range up to 50 meters.",
            "category": "garage-remotes",
            "brand": brand,
            "model": model_code,
            "price": round(38 + (i * 5) + (product_id % 15), 2),
            "images": [
                "https://images.unsplash.com/photo-1675747158954-4a32e28812c0",
                "https://images.unsplash.com/photo-1761264889404-a194af20ae90"
            ],
            "stock": 20 + (product_id % 30),
            "specifications": {
                "buttons": str(2 + (i % 4)),
                "frequency": "433.92MHz",
                "range": "40-50m",
                "warranty": "12 months"
            },
            "featured": product_id % 8 == 0,
            "created_at": "2025-01-15T00:00:00Z"
        })
        product_id += 1

# Add accessories and equipment
accessories = [
    {"name": "Remote Battery Pack CR2032 (10pcs)", "price": 12.00, "category": "accessories"},
    {"name": "Remote Battery Pack CR2016 (10pcs)", "price": 11.00, "category": "accessories"},
    {"name": "Key Fob Cover Silicone (5 pack)", "price": 19.95, "category": "accessories"},
    {"name": "Key Ring Multi-tool", "price": 8.95, "category": "accessories"},
    {"name": "Remote Programming Tool", "price": 149.00, "category": "tools"},
    {"name": "Key Cutting Machine KC-500", "price": 1499.00, "category": "machinery"},
]

for item in accessories:
    products.append({
        "id": f"accessory-{product_id}",
        "name": item["name"],
        "description": f"High quality {item['name']} for car remotes and keys. Professional grade product suitable for locksmiths and DIY users.",
        "category": item["category"],
        "brand": "Universal",
        "model": "Standard",
        "price": item["price"],
        "images": ["https://images.unsplash.com/photo-1761264889404-a194af20ae90"],
        "stock": 50 if item["category"] == "accessories" else 10,
        "specifications": {"type": "Universal", "warranty": "6 months"},
        "featured": False,
        "created_at": "2025-01-15T00:00:00Z"
    })
    product_id += 1

async def seed_database():
    try:
        # Clear existing products
        await db.products.delete_many({})
        print(f"Cleared existing products")
        
        # Insert new products
        if products:
            await db.products.insert_many(products)
            print(f"✅ Successfully inserted {len(products)} products")
        
        # Verify counts by category
        car_count = len([p for p in products if p['category'] == 'car-remotes'])
        garage_count = len([p for p in products if p['category'] == 'garage-remotes'])
        other_count = len(products) - car_count - garage_count
        
        print(f"\nBreakdown:")
        print(f"  - Car Remotes: {car_count}")
        print(f"  - Garage Remotes: {garage_count}")
        print(f"  - Accessories & Tools: {other_count}")
        print(f"  - Total: {len(products)}")
        
        # Create admin user if not exists
        admin_user = {
            "id": "admin-1",
            "email": "admin@allremotes.com.au",
            "password": "admin123",
            "name": "Admin User",
            "role": "admin",
            "created_at": "2025-01-15T00:00:00Z"
        }
        
        existing_admin = await db.users.find_one({"email": admin_user["email"]}, {"_id": 0})
        if not existing_admin:
            await db.users.insert_one(admin_user)
            print("\n✅ Admin user created")
        
    except Exception as e:
        print(f"❌ Error seeding database: {str(e)}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
