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

australian_products = [
    {
        "id": "holden-commodore-remote-1",
        "name": "Holden Commodore Remote Key VE/VF",
        "description": "Genuine replacement remote key for Holden Commodore VE and VF models. 3 button design with lock, unlock, and boot release.",
        "category": "car-remotes",
        "brand": "Holden",
        "model": "Commodore VE/VF",
        "price": 89.95,
        "images": ["https://images.unsplash.com/photo-1710006548777-bb4c5c159f86"],
        "stock": 15,
        "specifications": {"buttons": "3", "frequency": "433MHz", "compatible": "VE/VF 2006-2017"},
        "featured": True,
        "created_at": "2025-01-15T00:00:00Z"
    },
    {
        "id": "toyota-camry-remote-1",
        "name": "Toyota Camry Remote Key 2012-2017",
        "description": "OEM quality remote key for Toyota Camry. Features 3 buttons with panic alarm function.",
        "category": "car-remotes",
        "brand": "Toyota",
        "model": "Camry 2012-2017",
        "price": 95.00,
        "images": ["https://images.unsplash.com/photo-1710006548777-bb4c5c159f86"],
        "stock": 20,
        "specifications": {"buttons": "3", "frequency": "433MHz", "panic": "Yes"},
        "featured": True,
        "created_at": "2025-01-15T00:00:00Z"
    },
    {
        "id": "ford-ranger-remote-1",
        "name": "Ford Ranger Remote Key PX/PX2/PX3",
        "description": "Complete remote key for Ford Ranger PX series. Includes chip and remote in one unit.",
        "category": "car-remotes",
        "brand": "Ford",
        "model": "Ranger PX Series",
        "price": 125.00,
        "images": ["https://images.unsplash.com/photo-1710006548777-bb4c5c159f86"],
        "stock": 12,
        "specifications": {"buttons": "3", "frequency": "433MHz", "chip": "Transponder included"},
        "featured": True,
        "created_at": "2025-01-15T00:00:00Z"
    },
    {
        "id": "mazda-cx5-remote-1",
        "name": "Mazda CX-5 Smart Key 2012-2021",
        "description": "Smart proximity key for Mazda CX-5. Push button start compatible.",
        "category": "car-remotes",
        "brand": "Mazda",
        "model": "CX-5",
        "price": 145.00,
        "images": ["https://images.unsplash.com/photo-1710006548777-bb4c5c159f86"],
        "stock": 10,
        "specifications": {"buttons": "4", "type": "Smart Key", "start": "Push Button"},
        "featured": True,
        "created_at": "2025-01-15T00:00:00Z"
    },
    {
        "id": "subaru-outback-remote-1",
        "name": "Subaru Outback Remote Key 2015-2020",
        "description": "Genuine Subaru remote key fob. 3 button configuration with excellent range.",
        "category": "car-remotes",
        "brand": "Subaru",
        "model": "Outback",
        "price": 110.00,
        "images": ["https://images.unsplash.com/photo-1710006548777-bb4c5c159f86"],
        "stock": 8,
        "specifications": {"buttons": "3", "frequency": "433MHz", "range": "50m"},
        "featured": False,
        "created_at": "2025-01-15T00:00:00Z"
    },
    {
        "id": "nissan-navara-remote-1",
        "name": "Nissan Navara D40 Remote Key",
        "description": "Remote key for Nissan Navara D40. Durable design built for tough conditions.",
        "category": "car-remotes",
        "brand": "Nissan",
        "model": "Navara D40",
        "price": 85.00,
        "images": ["https://images.unsplash.com/photo-1710006548777-bb4c5c159f86"],
        "stock": 18,
        "specifications": {"buttons": "2", "frequency": "433MHz", "compatible": "2005-2015"},
        "featured": False,
        "created_at": "2025-01-15T00:00:00Z"
    },
    {
        "id": "mitsubishi-triton-remote-1",
        "name": "Mitsubishi Triton Remote Key MQ/MR",
        "description": "Remote key for latest Mitsubishi Triton models. High quality replacement.",
        "category": "car-remotes",
        "brand": "Mitsubishi",
        "model": "Triton MQ/MR",
        "price": 99.95,
        "images": ["https://images.unsplash.com/photo-1710006548777-bb4c5c159f86"],
        "stock": 14,
        "specifications": {"buttons": "3", "frequency": "433MHz", "year": "2015-2024"},
        "featured": False,
        "created_at": "2025-01-15T00:00:00Z"
    },
    {
        "id": "hyundai-i30-remote-1",
        "name": "Hyundai i30 Remote Key 2017-2024",
        "description": "Flip key remote for Hyundai i30. Modern design with flip-out key blade.",
        "category": "car-remotes",
        "brand": "Hyundai",
        "model": "i30",
        "price": 105.00,
        "images": ["https://images.unsplash.com/photo-1710006548777-bb4c5c159f86"],
        "stock": 16,
        "specifications": {"buttons": "3", "style": "Flip Key", "frequency": "433MHz"},
        "featured": False,
        "created_at": "2025-01-15T00:00:00Z"
    },
    {
        "id": "garage-remote-merlin-1",
        "name": "Merlin E945M Garage Remote",
        "description": "Compatible remote for Merlin garage door openers. Works with most Merlin models.",
        "category": "garage-remotes",
        "brand": "Merlin",
        "model": "E945M",
        "price": 45.00,
        "images": ["https://images.unsplash.com/photo-1675747158954-4a32e28812c0"],
        "stock": 30,
        "specifications": {"buttons": "3", "frequency": "433.92MHz", "compatible": "Most Merlin openers"},
        "featured": True,
        "created_at": "2025-01-15T00:00:00Z"
    },
    {
        "id": "garage-remote-bnd-1",
        "name": "B&D TB6 Garage Remote",
        "description": "Genuine B&D remote control. Compatible with TriTran+ receivers.",
        "category": "garage-remotes",
        "brand": "B&D",
        "model": "TB6",
        "price": 52.00,
        "images": ["https://images.unsplash.com/photo-1675747158954-4a32e28812c0"],
        "stock": 25,
        "specifications": {"buttons": "3", "frequency": "433.92MHz", "range": "30m"},
        "featured": False,
        "created_at": "2025-01-15T00:00:00Z"
    },
    {
        "id": "garage-remote-boss-1",
        "name": "Boss BOC-2 Garage Remote",
        "description": "Universal remote for Boss garage door openers. Easy programming.",
        "category": "garage-remotes",
        "brand": "Boss",
        "model": "BOC-2",
        "price": 38.00,
        "images": ["https://images.unsplash.com/photo-1675747158954-4a32e28812c0"],
        "stock": 35,
        "specifications": {"buttons": "2", "frequency": "433.92MHz", "programming": "Easy"},
        "featured": False,
        "created_at": "2025-01-15T00:00:00Z"
    },
    {
        "id": "key-cutting-machine-1",
        "name": "Professional Key Cutting Machine KC-300",
        "description": "High-precision key cutting machine for automotive and household keys. Digital display and adjustable speed.",
        "category": "machinery",
        "brand": "KeyMaster",
        "model": "KC-300",
        "price": 1299.00,
        "images": ["https://images.unsplash.com/photo-1749477417968-2bc986bc6a42"],
        "stock": 5,
        "specifications": {"voltage": "240V", "speed": "Variable", "weight": "15kg"},
        "featured": True,
        "created_at": "2025-01-15T00:00:00Z"
    },
    {
        "id": "key-cutting-tools-1",
        "name": "Key Cutting Tools Set Professional",
        "description": "Complete set of key cutting and programming tools. Includes files, picks, and gauges.",
        "category": "tools",
        "brand": "ProTools",
        "model": "KCT-PRO",
        "price": 189.00,
        "images": ["https://images.unsplash.com/photo-1759419282068-eb664e0f0a17"],
        "stock": 20,
        "specifications": {"pieces": "24", "case": "Included", "quality": "Professional"},
        "featured": False,
        "created_at": "2025-01-15T00:00:00Z"
    },
    {
        "id": "key-blanks-1",
        "name": "Key Blanks Assorted Pack (50pcs)",
        "description": "Assorted key blanks for common Australian vehicles. Suitable for key cutting machines.",
        "category": "accessories",
        "brand": "KeySupply",
        "model": "KB-AU50",
        "price": 75.00,
        "images": ["https://images.unsplash.com/photo-1761264889404-a194af20ae90"],
        "stock": 40,
        "specifications": {"quantity": "50", "types": "Mixed", "material": "Brass"},
        "featured": False,
        "created_at": "2025-01-15T00:00:00Z"
    },
    {
        "id": "remote-battery-pack-1",
        "name": "Remote Key Batteries CR2032 (10 Pack)",
        "description": "High quality CR2032 batteries for car remotes. Long lasting power.",
        "category": "accessories",
        "brand": "PowerCell",
        "model": "CR2032-10",
        "price": 12.00,
        "images": ["https://images.unsplash.com/photo-1761264889404-a194af20ae90"],
        "stock": 100,
        "specifications": {"type": "CR2032", "voltage": "3V", "quantity": "10"},
        "featured": False,
        "created_at": "2025-01-15T00:00:00Z"
    },
    {
        "id": "honda-crv-remote-1",
        "name": "Honda CR-V Remote Key 2017-2023",
        "description": "Smart key for Honda CR-V. Proximity entry and push button start.",
        "category": "car-remotes",
        "brand": "Honda",
        "model": "CR-V",
        "price": 135.00,
        "images": ["https://images.unsplash.com/photo-1710006548777-bb4c5c159f86"],
        "stock": 11,
        "specifications": {"buttons": "4", "type": "Smart Key", "features": "Proximity entry"},
        "featured": False,
        "created_at": "2025-01-15T00:00:00Z"
    },
    {
        "id": "volkswagen-golf-remote-1",
        "name": "Volkswagen Golf Remote Key MK7/MK8",
        "description": "Remote key for VW Golf MK7 and MK8. Premium build quality.",
        "category": "car-remotes",
        "brand": "Volkswagen",
        "model": "Golf MK7/MK8",
        "price": 150.00,
        "images": ["https://images.unsplash.com/photo-1710006548777-bb4c5c159f86"],
        "stock": 9,
        "specifications": {"buttons": "3", "frequency": "434MHz", "year": "2013-2024"},
        "featured": False,
        "created_at": "2025-01-15T00:00:00Z"
    },
    {
        "id": "kia-sportage-remote-1",
        "name": "Kia Sportage Smart Key 2016-2024",
        "description": "Smart proximity key for Kia Sportage. Sleek design with excellent functionality.",
        "category": "car-remotes",
        "brand": "Kia",
        "model": "Sportage",
        "price": 140.00,
        "images": ["https://images.unsplash.com/photo-1710006548777-bb4c5c159f86"],
        "stock": 13,
        "specifications": {"buttons": "4", "type": "Smart Key", "start": "Push Button"},
        "featured": False,
        "created_at": "2025-01-15T00:00:00Z"
    }
]

async def seed_database():
    try:
        await db.products.delete_many({})
        print("Cleared existing products")
        
        await db.products.insert_many(australian_products)
        print(f"Successfully inserted {len(australian_products)} products")
        
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
            print("Created admin user")
        
        print("Database seeding completed!")
        
    except Exception as e:
        print(f"Error seeding database: {str(e)}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
