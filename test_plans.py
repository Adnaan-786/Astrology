import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict
import uuid
from datetime import datetime, timezone
from typing import List

class Plan(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    slug: str
    description: str
    price_monthly: float
    price_annual: float
    features: List[str] = []
    ai_reports_per_month: int = 0
    free_chat_minutes: int = 0
    discount_on_products: int = 0
    ai_chat_messages_limit: int = 5        # -1 = unlimited
    ai_chat_limit_period: str = "day"      # "day", "month", "lifetime"
    is_active: bool = True
    is_featured: bool = False
    color: str = "#8B5CF6"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

async def main():
    import os
    from dotenv import load_dotenv
    load_dotenv("backend/.env")
    client = AsyncIOMotorClient(os.getenv("MONGODB_URL"))
    db = client.get_database("astrovedic")
    docs = await db.plans.find({"is_active": True}, {"_id": 0}).to_list(10)
    for doc in docs:
        try:
            Plan(**doc)
            print(f"Plan {doc.get('name')} is OK")
        except Exception as e:
            print(f"Error parsing plan {doc.get('name')}: {e}")

asyncio.run(main())
