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

# 25 Australian products with multiple images
australian_products = [
    {
        "id": "holden-commodore-remote-1",
        "name": "Holden Commodore Remote Key VE/VF",
        "description": "Genuine replacement remote key for Holden Commodore VE and VF models. 3 button design with lock, unlock, and boot release. Compatible with 2006-2017 models. Includes programming instructions.",
        "category": "car-remotes",
        "brand": "Holden",
        "model": "Commodore VE/VF",
        "price": 89.95,
        "images": [
            "https://images.unsplash.com/photo-1710006548777-bb4c5c159f86",
            "https://images.unsplash.com/photo-1761264889404-a194af20ae90",
            "https://images.unsplash.com/photo-1745242666792-6cd30907f7ff"
        ],
        "stock": 15,
        "specifications": {"buttons": "3", "frequency": "433MHz", "compatible": "VE/VF 2006-2017", "battery": "CR2032"},
        "featured": True,
        "created_at": "2025-01-15T00:00:00Z"
    },
    {
        "id": "toyota-camry-remote-1",
        "name": "Toyota Camry Remote Key 2012-2017",
        "description": "OEM quality remote key for Toyota Camry. Features 3 buttons with panic alarm function. High-quality construction for long-lasting durability.",
        "category": "car-remotes",
        "brand": "Toyota",
        "model": "Camry 2012-2017",
        "price": 95.00,
        "images": [
            "https://images.unsplash.com/photo-1710006548777-bb4c5c159f86",
            "https://images.unsplash.com/photo-1761264889404-a194af20ae90"
        ],
        "stock": 20,
        "specifications": {"buttons": "3", "frequency": "433MHz", "panic": "Yes", "battery": "CR2016"},
        "featured": True,
        "created_at": "2025-01-15T00:00:00Z"
    },
    {
        "id": "ford-ranger-remote-1",
        "name": "Ford Ranger Remote Key PX/PX2/PX3",
        "description": "Complete remote key for Ford Ranger PX series. Includes chip and remote in one unit. Professional quality replacement part.",
        "category": "car-remotes",
        "brand": "Ford",
        "model": "Ranger PX Series",
        "price": 125.00,
        "images": [
            "https://images.unsplash.com/photo-1710006548777-bb4c5c159f86",
            "https://images.unsplash.com/photo-1761264889404-a194af20ae90"
        ],
        "stock": 12,
        "specifications": {"buttons": "3", "frequency": "433MHz", "chip": "Transponder included", "battery": "CR2032"},
        "featured": True,
        "created_at": "2025-01-15T00:00:00Z"
    },
    {
        "id": "mazda-cx5-remote-1",
        "name": "Mazda CX-5 Smart Key 2012-2021",
        "description": "Smart proximity key for Mazda CX-5. Push button start compatible. Advanced keyless entry system.",
        "category": "car-remotes",
        "brand": "Mazda",
        "model": "CX-5",
        "price": 145.00,
        "images": [
            "https://images.unsplash.com/photo-1710006548777-bb4c5c159f86",
            "https://images.unsplash.com/photo-1761264889404-a194af20ae90"
        ],
        "stock": 10,
        "specifications": {"buttons": "4", "type": "Smart Key", "start": "Push Button", "battery": "CR2025"},
        "featured": True,
        "created_at": "2025-01-15T00:00:00Z"
    },
    {
        "id": "subaru-outback-remote-1",
        "name": "Subaru Outback Remote Key 2015-2020",
        "description": "Genuine Subaru remote key fob. 3 button configuration with excellent range up to 50 meters.",
        "category": "car-remotes",
        "brand": "Subaru",
        "model": "Outback",
        "price": 110.00,
        "images": ["https://images.unsplash.com/photo-1710006548777-bb4c5c159f86"],
        "stock": 8,
        "specifications": {"buttons": "3", "frequency": "433MHz", "range": "50m", "battery": "CR2032"},
        "featured": False,
        "created_at": "2025-01-15T00:00:00Z"
    },
    {
        "id": "nissan-navara-remote-1",
        "name": "Nissan Navara D40 Remote Key",
        "description": "Remote key for Nissan Navara D40. Durable design built for tough Australian conditions.",
        "category": "car-remotes",
        "brand": "Nissan",
        "model": "Navara D40",
        "price": 85.00,
        "images": ["https://images.unsplash.com/photo-1710006548777-bb4c5c159f86"],
        "stock": 18,
        "specifications": {"buttons": "2", "frequency": "433MHz", "compatible": "2005-2015", "battery": "CR2016"},
        "featured": False,
        "created_at": "2025-01-15T00:00:00Z"
    },
    {
        "id": "mitsubishi-triton-remote-1",
        "name": "Mitsubishi Triton Remote Key MQ/MR",
        "description": "Remote key for latest Mitsubishi Triton models. High quality OEM replacement part.",
        "category": "car-remotes",
        "brand": "Mitsubishi",
        "model": "Triton MQ/MR",
        "price": 99.95,
        "images": ["https://images.unsplash.com/photo-1710006548777-bb4c5c159f86"],
        "stock": 14,
        "specifications": {"buttons": "3", "frequency": "433MHz", "year": "2015-2024", "battery": "CR2032"},
        "featured": False,
        "created_at": "2025-01-15T00:00:00Z"
    },
    {
        "id": "hyundai-i30-remote-1",
        "name": "Hyundai i30 Remote Key 2017-2024",
        "description": "Flip key remote for Hyundai i30. Modern design with flip-out key blade. Premium finish.",
        "category": "car-remotes",
        "brand": "Hyundai",
        "model": "i30",
        "price": 105.00,
        "images": ["https://images.unsplash.com/photo-1710006548777-bb4c5c159f86"],
        "stock": 16,
        "specifications": {"buttons": "3", "style": "Flip Key", "frequency": "433MHz", "battery": "CR2032"},
        "featured": False,
        "created_at": "2025-01-15T00:00:00Z"
    },
    {
        "id": "honda-crv-remote-1",
        "name": "Honda CR-V Remote Key 2017-2023",
        "description": "Smart key for Honda CR-V. Proximity entry and push button start. Latest technology.",
        "category": "car-remotes",
        "brand": "Honda",
        "model": "CR-V",
        "price": 135.00,
        "images": ["https://images.unsplash.com/photo-1710006548777-bb4c5c159f86"],
        "stock": 11,
        "specifications": {"buttons": "4", "type": "Smart Key", "features": "Proximity entry", "battery": "CR2032"},
        "featured": False,
        "created_at": "2025-01-15T00:00:00Z"
    },
    {
        "id": "volkswagen-golf-remote-1",
        "name": "Volkswagen Golf Remote Key MK7/MK8",
        "description": "Remote key for VW Golf MK7 and MK8. Premium European quality build.",
        "category": "car-remotes",
        "brand": "Volkswagen",
        "model": "Golf MK7/MK8",
        "price": 150.00,
        "images": ["https://images.unsplash.com/photo-1710006548777-bb4c5c159f86"],
        "stock": 9,
        "specifications": {"buttons": "3", "frequency": "434MHz", "year": "2013-2024", "battery": "CR2032"},
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
        "specifications": {"buttons": "4", "type": "Smart Key", "start": "Push Button", "battery": "CR2032"},
        "featured": True,
        "created_at": "2025-01-15T00:00:00Z"
    },
    {
        "id": "toyota-hilux-remote-1",
        "name": "Toyota Hilux Remote Key 2015-2023",
        "description": "Rugged remote key for Toyota Hilux. Built to withstand harsh conditions. Perfect for work vehicles.",
        "category": "car-remotes",
        "brand": "Toyota",
        "model": "Hilux",
        "price": 115.00,
        "images": ["https://images.unsplash.com/photo-1710006548777-bb4c5c159f86"],
        "stock": 22,
        "specifications": {"buttons": "3", "frequency": "433MHz", "durability": "High", "battery": "CR2016"},
        "featured": True,
        "created_at": "2025-01-15T00:00:00Z"
    },
    {
        "id": "holden-cruze-remote-1",
        "name": "Holden Cruze Remote Key 2009-2016",
        "description": "Replacement remote for Holden Cruze. Reliable and affordable option.",
        "category": "car-remotes",
        "brand": "Holden",
        "model": "Cruze",
        "price": 79.95,
        "images": ["https://images.unsplash.com/photo-1710006548777-bb4c5c159f86"],
        "stock": 19,
        "specifications": {"buttons": "3", "frequency": "433MHz", "compatible": "2009-2016", "battery": "CR2032"},
        "featured": False,
        "created_at": "2025-01-15T00:00:00Z"
    },
    {
        "id": "garage-remote-merlin-1",
        "name": "Merlin E945M Garage Remote",
        "description": "Compatible remote for Merlin garage door openers. Works with most Merlin models. Easy programming.",
        "category": "garage-remotes",
        "brand": "Merlin",
        "model": "E945M",
        "price": 45.00,
        "images": [
            "https://images.unsplash.com/photo-1675747158954-4a32e28812c0",
            "https://images.unsplash.com/photo-1761264889404-a194af20ae90"
        ],
        "stock": 30,
        "specifications": {"buttons": "3", "frequency": "433.92MHz", "compatible": "Most Merlin openers", "battery": "CR2032"},
        "featured": True,
        "created_at": "2025-01-15T00:00:00Z"
    },
    {
        "id": "garage-remote-bnd-1",
        "name": "B&D TB6 Garage Remote",
        "description": "Genuine B&D remote control. Compatible with TriTran+ receivers. Australian made quality.",
        "category": "garage-remotes",
        "brand": "B&D",
        "model": "TB6",
        "price": 52.00,
        "images": ["https://images.unsplash.com/photo-1675747158954-4a32e28812c0"],
        "stock": 25,
        "specifications": {"buttons": "3", "frequency": "433.92MHz", "range": "30m", "battery": "CR2032"},
        "featured": False,
        "created_at": "2025-01-15T00:00:00Z"
    },
    {
        "id": "garage-remote-boss-1",
        "name": "Boss BOC-2 Garage Remote",
        "description": "Universal remote for Boss garage door openers. Easy programming with step-by-step guide included.",
        "category": "garage-remotes",
        "brand": "Boss",
        "model": "BOC-2",
        "price": 38.00,
        "images": ["https://images.unsplash.com/photo-1675747158954-4a32e28812c0"],
        "stock": 35,
        "specifications": {"buttons": "2", "frequency": "433.92MHz", "programming": "Easy", "battery": "CR2016"},
        "featured": False,
        "created_at": "2025-01-15T00:00:00Z"
    },
    {
        "id": "garage-remote-ata-1",
        "name": "ATA PTX-4 Garage Remote",
        "description": "Premium ATA remote control. 4 button design for multiple doors. Long battery life.",
        "category": "garage-remotes",
        "brand": "ATA",
        "model": "PTX-4",
        "price": 55.00,
        "images": ["https://images.unsplash.com/photo-1675747158954-4a32e28812c0"],
        "stock": 20,
        "specifications": {"buttons": "4", "frequency": "433.92MHz", "range": "40m", "battery": "CR2032"},
        "featured": False,
        "created_at": "2025-01-15T00:00:00Z"
    },
    {
        "id": "garage-remote-gliderol-1",
        "name": "Gliderol TM305C Garage Remote",
        "description": "Replacement remote for Gliderol garage doors. Compatible with most Gliderol systems.",
        "category": "garage-remotes",
        "brand": "Gliderol",
        "model": "TM305C",
        "price": 48.00,
        "images": ["https://images.unsplash.com/photo-1675747158954-4a32e28812c0"],
        "stock": 28,
        "specifications": {"buttons": "3", "frequency": "433.92MHz", "compatible": "Gliderol systems", "battery": "CR2032"},
        "featured": False,
        "created_at": "2025-01-15T00:00:00Z"
    },
    {
        "id": "key-cutting-machine-1",
        "name": "Professional Key Cutting Machine KC-300",
        "description": "High-precision key cutting machine for automotive and household keys. Digital display and adjustable speed. Professional grade equipment.",
        "category": "machinery",
        "brand": "KeyMaster",
        "model": "KC-300",
        "price": 1299.00,
        "images": [
            "https://images.unsplash.com/photo-1749477417968-2bc986bc6a42",
            "https://images.unsplash.com/photo-1759419282068-eb664e0f0a17"
        ],
        "stock": 5,
        "specifications": {"voltage": "240V", "speed": "Variable", "weight": "15kg", "warranty": "2 years"},
        "featured": True,
        "created_at": "2025-01-15T00:00:00Z"
    },
    {
        "id": "key-cutting-machine-2",
        "name": "Portable Key Duplicator KD-150",
        "description": "Compact portable key cutting machine. Perfect for mobile locksmiths. Battery powered option available.",
        "category": "machinery",
        "brand": "KeyMaster",
        "model": "KD-150",
        "price": 899.00,
        "images": ["https://images.unsplash.com/photo-1749477417968-2bc986bc6a42"],
        "stock": 8,
        "specifications": {"voltage": "240V/Battery", "weight": "8kg", "portable": "Yes", "warranty": "1 year"},
        "featured": False,
        "created_at": "2025-01-15T00:00:00Z"
    },
    {
        "id": "key-cutting-tools-1",
        "name": "Key Cutting Tools Set Professional",
        "description": "Complete set of key cutting and programming tools. Includes files, picks, gauges, and measuring tools. Heavy-duty carrying case included.",
        "category": "tools",
        "brand": "ProTools",
        "model": "KCT-PRO",
        "price": 189.00,
        "images": [
            "https://images.unsplash.com/photo-1759419282068-eb664e0f0a17",
            "https://images.unsplash.com/photo-1749477417968-2bc986bc6a42"
        ],
        "stock": 20,
        "specifications": {"pieces": "24", "case": "Included", "quality": "Professional", "warranty": "1 year"},
        "featured": False,
        "created_at": "2025-01-15T00:00:00Z"
    },
    {
        "id": "key-blanks-1",
        "name": "Key Blanks Assorted Pack (50pcs)",
        "description": "Assorted key blanks for common Australian vehicles. Suitable for key cutting machines. Premium brass construction.",
        "category": "accessories",
        "brand": "KeySupply",
        "model": "KB-AU50",
        "price": 75.00,
        "images": ["https://images.unsplash.com/photo-1761264889404-a194af20ae90"],
        "stock": 40,
        "specifications": {"quantity": "50", "types": "Mixed", "material": "Brass", "finish": "Polished"},
        "featured": False,
        "created_at": "2025-01-15T00:00:00Z"
    },
    {
        "id": "remote-battery-pack-1",
        "name": "Remote Key Batteries CR2032 (10 Pack)",
        "description": "High quality CR2032 batteries for car remotes. Long lasting power. 5 year shelf life.",
        "category": "accessories",
        "brand": "PowerCell",
        "model": "CR2032-10",
        "price": 12.00,
        "images": ["https://images.unsplash.com/photo-1761264889404-a194af20ae90"],
        "stock": 100,
        "specifications": {"type": "CR2032", "voltage": "3V", "quantity": "10", "shelf_life": "5 years"},
        "featured": False,
        "created_at": "2025-01-15T00:00:00Z"
    },
    {
        "id": "key-programmer-1",
        "name": "Universal Car Key Programmer KP-500",
        "description": "Advanced key programming tool for most car makes. Supports Australian market vehicles. Regular software updates included.",
        "category": "tools",
        "brand": "ProTools",
        "model": "KP-500",
        "price": 599.00,
        "images": ["https://images.unsplash.com/photo-1759419282068-eb664e0f0a17"],
        "stock": 12,
        "specifications": {"compatible": "Most brands", "updates": "Free 1 year", "display": "LCD", "warranty": "2 years"},
        "featured": False,
        "created_at": "2025-01-15T00:00:00Z"
    },
    {
        "id": "key-fob-cases-1",
        "name": "Silicone Key Fob Covers (5 Pack)",
        "description": "Protective silicone covers for key fobs. Prevents scratches and damage. Multiple colors available.",
        "category": "accessories",
        "brand": "KeyCare",
        "model": "SFC-5",
        "price": 24.95,
        "images": ["https://images.unsplash.com/photo-1761264889404-a194af20ae90"],
        "stock": 50,
        "specifications": {"quantity": "5", "material": "Silicone", "colors": "Mixed", "fit": "Universal"},
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
        print(f"\nSummary:")
        print(f"- Total products: {len(australian_products)}")
        print(f"- Car remotes: {len([p for p in australian_products if p['category'] == 'car-remotes'])}")
        print(f"- Garage remotes: {len([p for p in australian_products if p['category'] == 'garage-remotes'])}")
        print(f"- Machinery: {len([p for p in australian_products if p['category'] == 'machinery'])}")
        print(f"- Tools: {len([p for p in australian_products if p['category'] == 'tools'])}")
        print(f"- Accessories: {len([p for p in australian_products if p['category'] == 'accessories'])}")
        
    except Exception as e:
        print(f"Error seeding database: {str(e)}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
