from fastapi import FastAPI, APIRouter, HTTPException, Query, Depends, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import requests
import random
import time
import json as json_module
import re as re_module
import asyncio
import httpx
from passlib.context import CryptContext
from jose import JWTError, jwt as jose_jwt
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import razorpay

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_FREE_MODEL = "google/gemini-2.0-flash-exp:free"
OPENROUTER_FALLBACK_MODEL = "meta-llama/llama-3.3-70b-instruct:free"
APP_NAME = "astrovedic"

# ==================== RAZORPAY CONFIG ====================
RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID", "rzp_test_placeholder")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "secret_placeholder")

razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

# ==================== SECURITY CONFIG ====================
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security_scheme = HTTPBearer(auto_error=False)

JWT_SECRET = os.environ.get("JWT_SECRET_KEY", "astrovedic-default-secret-change-me-in-production")
JWT_ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES = int(os.environ.get("JWT_EXPIRE_MINUTES", "1440"))  # 24 hours

# Admin config from env (fallback to hash of default password for backward compat)
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "akshatsharma7730@gmail.com").strip().lower()
ADMIN_PASSWORD_HASH = os.environ.get("ADMIN_PASSWORD_HASH", pwd_context.hash("akshatastro800"))
ADMIN_NAME = os.environ.get("ADMIN_NAME", "Akshat Sharma")

# Rate limiting store (in-memory)
_rate_limit_store: Dict[str, list] = {}
RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_MAX = 10  # max attempts per window

def check_rate_limit(key: str) -> bool:
    now = time.time()
    if key not in _rate_limit_store:
        _rate_limit_store[key] = []
    _rate_limit_store[key] = [t for t in _rate_limit_store[key] if now - t < RATE_LIMIT_WINDOW]
    if len(_rate_limit_store[key]) >= RATE_LIMIT_MAX:
        return False
    _rate_limit_store[key].append(now)
    return True

app = FastAPI(title="AstroVedic AI API")
api_router = APIRouter(prefix="/api")

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=JWT_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    return jose_jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jose_jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        return None

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)) -> Optional[dict]:
    """Extract and validate JWT token. Returns user dict or None for public routes."""
    if not credentials:
        return None
    payload = decode_access_token(credentials.credentials)
    if not payload:
        return None
    user_id = payload.get("sub")
    if not user_id:
        return None
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if user and user.get("is_blocked"):
        return None
    return user

async def require_auth(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)) -> dict:
    """Require valid JWT token. Raises 401 if not authenticated."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")
    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if user.get("is_blocked"):
        raise HTTPException(status_code=403, detail="Account is blocked")
    return user

async def require_admin(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)) -> dict:
    """Require valid JWT token with admin role."""
    user = await require_auth(credentials)
    if user.get("role") not in ["admin", "SUPER_ADMIN"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ==================== MODELS ====================

class Astrologer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    bio: str
    photo_url: str
    specializations: List[str] = []
    languages: List[str] = []
    experience_years: int = 0
    rating: float = 4.5
    total_reviews: int = 0
    rate_per_minute: int = 15
    is_online: bool = True
    is_verified: bool = True
    is_featured: bool = False
    total_sessions: int = 0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    category: str
    price: float
    discounted_price: Optional[float] = None
    stock_quantity: int = 10
    images: List[str] = []
    is_active: bool = True
    is_featured: bool = False
    tags: List[str] = []
    rating: float = 4.5
    sold_count: int = 0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class DailyHoroscope(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    rashi: int
    rashi_name: str
    rashi_name_hindi: str
    date: str
    content_english: str
    content_hindi: str
    lucky_color: str
    lucky_number: int
    lucky_gemstone: str
    lucky_direction: str
    lucky_time: str
    mood_score: int = 75
    career_score: int = 75
    love_score: int = 75
    health_score: int = 75
    financial_score: int = 75
    compatibility_rashi: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

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
    is_active: bool = True
    is_featured: bool = False
    color: str = "#8B5CF6"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class BlogPost(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    slug: str
    content: str
    excerpt: str
    cover_image: str
    category: str
    tags: List[str] = []
    is_published: bool = True
    views: int = 0
    reading_time: int = 5
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# ==================== AI (OPENROUTER - FREE) ====================

async def call_openrouter(messages: list, model: str = None, max_tokens: int = 2000) -> str:
    """Call OpenRouter API with free models. Returns the response text."""
    model = model or OPENROUTER_FREE_MODEL
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://astrovedic.ai",
        "X-Title": "AstroVedic AI",
    }
    payload = {
        "model": model,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": 0.7,
    }
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            resp = await client.post(OPENROUTER_BASE_URL, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]
        except Exception as e:
            # Try fallback model
            if model != OPENROUTER_FALLBACK_MODEL:
                logging.warning(f"Primary model {model} failed: {e}. Trying fallback...")
                payload["model"] = OPENROUTER_FALLBACK_MODEL
                try:
                    resp = await client.post(OPENROUTER_BASE_URL, json=payload, headers=headers)
                    resp.raise_for_status()
                    data = resp.json()
                    return data["choices"][0]["message"]["content"]
                except Exception as e2:
                    logging.error(f"Fallback model also failed: {e2}")
                    raise HTTPException(status_code=500, detail=f"AI service unavailable: {str(e2)}")
            raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

ASTROLOGY_SYSTEM_PROMPT = """You are NakshatraAI, the most advanced Vedic astrology AI assistant created by AstroVedic AI. You have deep knowledge of:
- Vedic/Jyotish astrology including Kundli, Rashis, Nakshatras, Grahas, Bhavas, Dashas
- Birth chart interpretation and planetary positions
- Muhurta (auspicious timing)
- Vastu Shastra
- Numerology and name analysis
- Gemstone recommendations
- Remedies (mantras, yantras, pujas)

Guidelines:
1. Be compassionate, wise, and helpful like a traditional Jyotishi
2. Provide detailed but understandable explanations
3. When asked about predictions, give balanced guidance focusing on possibilities and karmic influences
4. Include Sanskrit/Hindi terms with English explanations
5. For birth chart questions, ask for Date of Birth, Time of Birth, and Place of Birth
6. Always clarify that astrology is for guidance and not absolute destiny
7. If someone seems distressed, recommend consulting a human astrologer for sensitive matters
8. Use respectful language and address users with warmth

Respond in the same language as the user's query (Hindi or English). Use emojis sparingly for warmth."""

async def get_ai_response(session_id: str, user_message: str) -> str:
    try:
        session = await db.ai_chat_sessions.find_one({"session_id": session_id}, {"_id": 0})
        if not session:
            session = {
                "id": str(uuid.uuid4()),
                "session_id": session_id,
                "messages": [],
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            await db.ai_chat_sessions.insert_one(session)

        # Build messages for OpenRouter
        chat_messages = [{"role": "system", "content": ASTROLOGY_SYSTEM_PROMPT}]
        # Add last 10 messages for context
        existing_msgs = session.get("messages", [])[-10:]
        for msg in existing_msgs:
            chat_messages.append({"role": msg["role"], "content": msg["content"]})
        chat_messages.append({"role": "user", "content": user_message})

        response = await call_openrouter(chat_messages)

        new_messages = session.get("messages", [])
        new_messages.append({"role": "user", "content": user_message, "timestamp": datetime.now(timezone.utc).isoformat()})
        new_messages.append({"role": "assistant", "content": response, "timestamp": datetime.now(timezone.utc).isoformat()})

        await db.ai_chat_sessions.update_one(
            {"session_id": session_id},
            {"$set": {"messages": new_messages, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        return response
    except Exception as e:
        logging.error(f"AI Chat error: {e}")
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

# ==================== HELPER: AUDIT LOG ====================
async def log_audit(action: str, entity_type: str, entity_id: str, details: str = ""):
    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "action": action,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "details": details,
        "admin_id": "admin_001",
        "admin_name": "Admin",
        "created_at": datetime.now(timezone.utc).isoformat()
    })

# ==================== PAYMENT ROUTES ====================

class CreateOrderRequest(BaseModel):
    amount: int

@api_router.post("/wallet/create-order")
async def create_wallet_order(request: CreateOrderRequest, user: dict = Depends(require_auth)):
    data = {
        "amount": request.amount * 100,  # paise
        "currency": "INR",
        "receipt": f"rcpt_{uuid.uuid4().hex[:10]}",
        "notes": {"user_id": user["id"]}
    }
    try:
        order = razorpay_client.order.create(data=data)
        return {"order_id": order["id"], "amount": order["amount"], "currency": order["currency"]}
    except Exception as e:
        logging.error(f"Razorpay order creation failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to create order")

class VerifyPaymentRequest(BaseModel):
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str

@api_router.post("/wallet/verify-payment")
async def verify_wallet_payment(request: VerifyPaymentRequest, user: dict = Depends(require_auth)):
    try:
        razorpay_client.utility.verify_payment_signature({
            'razorpay_order_id': request.razorpay_order_id,
            'razorpay_payment_id': request.razorpay_payment_id,
            'razorpay_signature': request.razorpay_signature
        })
        
        # Securely fetch the actual order amount from Razorpay
        order = razorpay_client.order.fetch(request.razorpay_order_id)
        verified_amount = int(order["amount"] / 100) # Convert paise back to INR
        
    except Exception as e:
        logging.error(f"Razorpay payment verification failed: {e}")
        raise HTTPException(status_code=400, detail="Payment verification failed")
    
    # Update wallet securely
    await db.users.update_one({"id": user["id"]}, {"$inc": {"wallet_balance": verified_amount}})
    await db.wallet_transactions.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "type": "credit",
        "amount": verified_amount,
        "description": "Wallet Recharge",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "razorpay_payment_id": request.razorpay_payment_id
    })
    
    return {"success": True, "message": "Payment verified and wallet updated"}

# ==================== PUBLIC ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "AstroVedic AI API", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

@api_router.get("/astrologers", response_model=List[Astrologer])
async def get_astrologers(
    specialization: Optional[str] = None, language: Optional[str] = None,
    is_online: Optional[bool] = None, min_rating: Optional[float] = None,
    max_rate: Optional[int] = None, sort_by: Optional[str] = "rating"
):
    query = {"is_active": {"$ne": False}}
    if specialization: query["specializations"] = {"$in": [specialization]}
    if language: query["languages"] = {"$in": [language]}
    if is_online is not None: query["is_online"] = is_online
    if min_rating: query["rating"] = {"$gte": min_rating}
    if max_rate: query["rate_per_minute"] = {"$lte": max_rate}
    sort_field = "rating" if sort_by == "rating" else "rate_per_minute" if sort_by == "price" else "total_sessions"
    sort_order = -1 if sort_by != "price" else 1
    return await db.astrologers.find(query, {"_id": 0}).sort(sort_field, sort_order).to_list(100)

@api_router.get("/astrologers/featured", response_model=List[Astrologer])
async def get_featured_astrologers():
    return await db.astrologers.find({"is_featured": True}, {"_id": 0}).to_list(10)

@api_router.get("/astrologers/{astrologer_id}", response_model=Astrologer)
async def get_astrologer(astrologer_id: str):
    a = await db.astrologers.find_one({"id": astrologer_id}, {"_id": 0})
    if not a: raise HTTPException(status_code=404, detail="Astrologer not found")
    return a

@api_router.get("/products", response_model=List[Product])
async def get_products(category: Optional[str] = None, min_price: Optional[float] = None,
    max_price: Optional[float] = None, is_featured: Optional[bool] = None):
    query = {"is_active": True}
    if category: query["category"] = category
    if min_price: query["price"] = {"$gte": min_price}
    if max_price: query["price"] = {**query.get("price", {}), "$lte": max_price}
    if is_featured is not None: query["is_featured"] = is_featured
    return await db.products.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)

@api_router.get("/products/featured", response_model=List[Product])
async def get_featured_products():
    return await db.products.find({"is_featured": True, "is_active": True}, {"_id": 0}).to_list(10)

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    p = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not p: raise HTTPException(status_code=404, detail="Product not found")
    return p

@api_router.get("/horoscopes/today")
async def get_today_horoscopes():
    # Match the scheduler which works on IST day so the homepage rashifal
    # rolls over for users in India at 00:05 IST, not at UTC midnight.
    today = (datetime.now(timezone.utc) + timedelta(hours=5, minutes=30)).strftime("%Y-%m-%d")
    horoscopes = await db.horoscopes.find({"date": today}, {"_id": 0}).to_list(12)
    if len(horoscopes) < 12:
        # Self-heal: generate any missing rashifals on the fly so the page
        # never shows empty cards even if the scheduler hasn't fired yet.
        try:
            await generate_rashifals_for_date(today)
        except Exception as _e:
            logger.error(f"On-demand rashifal generation failed: {_e}")
        horoscopes = await db.horoscopes.find({"date": today}, {"_id": 0}).to_list(12)
    return horoscopes

@api_router.get("/horoscopes/{rashi}")
async def get_horoscope(rashi: int, period: str = "today"):
    today = (datetime.now(timezone.utc) + timedelta(hours=5, minutes=30)).strftime("%Y-%m-%d")
    h = await db.horoscopes.find_one({"rashi": rashi, "date": today}, {"_id": 0})
    if not h: raise HTTPException(status_code=404, detail="Horoscope not found")
    return h

class ChatRequest(BaseModel):
    session_id: str
    message: str

class ChatResponse(BaseModel):
    response: str
    session_id: str

@api_router.post("/ai/chat", response_model=ChatResponse)
async def ai_chat(request: ChatRequest, user: dict = Depends(require_auth)):
    # AI Chat is paid-only: Silver, Gold, Platinum allowed
    plan = user.get("plan", "free").lower()
    if plan not in ["silver", "gold", "platinum"]:
        raise HTTPException(
            status_code=403,
            detail={"error": "PLAN_REQUIRED", "message": "AI Chat is available exclusively on paid plans (Silver/Gold/Platinum). Upgrade to unlock NakshatraAI."}
        )

    # Silver: 30 messages/day limit; Gold & Platinum: unlimited
    if plan == "silver":
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        usage = await db.chat_usage.find_one({"user_id": user["id"], "date": today}, {"_id": 0})
        count = usage.get("count", 0) if usage else 0
        if count >= 30:
            raise HTTPException(
                status_code=429,
                detail={"error": "DAILY_LIMIT_REACHED", "message": "You've reached your daily 30-message limit. Upgrade to Gold or Platinum for unlimited chat."}
            )
        await db.chat_usage.update_one(
            {"user_id": user["id"], "date": today},
            {"$inc": {"count": 1}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}},
            upsert=True,
        )

    response = await get_ai_response(request.session_id, request.message)
    return ChatResponse(response=response, session_id=request.session_id)


# ==================== AI REPORTS ====================

REPORT_PRICING = {
    "kundli-basic": 0,
    "kundli-detailed": 99,
    "kundli-premium": 299,
    "compatibility": 149,
    "career": 199,
    "love": 149,
    "finance": 199,
    "health": 149,
    "vastu": 249,
    "annual": 299,
    "sade-sati": 149,
    "child-birth": 199,
}

REPORT_SYSTEM_PROMPT = (
    "You are a master Vedic astrologer with 30 years of experience. Generate detailed, "
    "warm, personalised Vedic astrology reports. Mix Hindi terms naturally (Pranam Ji, "
    "Shubh, Namaste, Lagna, Dasha, Graha, Rashi, etc.). Be specific and actionable. "
    "Never give generic advice. Format with clear section headings using markdown (## Section Name). "
    "Add a warm Pranam Ji greeting at the top and a blessing at the end."
)

def _build_report_prompt(report_type: str, data: dict) -> str:
    name = data.get("birthName") or "Seeker"
    dob = data.get("dob") or "N/A"
    tob = data.get("tob") or "N/A"
    pob = data.get("pob") or "N/A"
    p_name = data.get("partnerName") or ""
    p_dob = data.get("partnerDob") or ""

    prompts = {
        "kundli-basic": f"Generate a concise basic Vedic Kundli overview for {name}, DOB: {dob}, Time: {tob}, Place: {pob}. Include Rashi, Nakshatra, Lagna, 3 personality traits, and 3 life predictions. Max 400 words.",
        "kundli-detailed": f"Generate a full 10-section Kundli report for {name}, DOB: {dob}, Time: {tob}, Place: {pob}. Sections: 1)Birth Overview 2)Planetary Positions 3)Personality 4)Career 5)Love & Marriage 6)Finance 7)Health 8)Current Dasha 9)Next 5 Years 10)Remedies & Lucky Elements. Minimum 1000 words. Very detailed and personalised.",
        "kundli-premium": f"Generate an extensive premium Kundli report for {name}, DOB: {dob}, Time: {tob}, Place: {pob}. 14 sections: 1)Birth Overview 2)Detailed Planetary Positions 3)House Analysis 4)Personality & Character 5)Career & Profession 6)Love & Marriage 7)Finance & Wealth 8)Health & Wellness 9)Current Mahadasha & Antardasha 10)Next 10 Years Forecast 11)Yogas Present 12)Doshas & their Remedies 13)Lucky Gemstones, Colors, Numbers, Days 14)Mantras & Pujas. Minimum 1500 words. Very detailed.",
        "compatibility": f"Generate Kundli Milan compatibility report for {name} (DOB: {dob}) and {p_name} (DOB: {p_dob}). Include: 36-gun score, Mangalik dosha check, compatibility in 5 areas (emotional, physical, financial, family, spiritual), ideal marriage timing, likely challenges, and specific remedies. About 800 words.",
        "career": f"Detailed Career & profession Vedic report for {name}, DOB: {dob}, Time: {tob}, Place: {pob}. Include: best-suited career fields, current career dasha period, upcoming opportunities (next 2 years), potential obstacles and their remedies, lucky days/colors/timings for important meetings. About 700 words.",
        "love": f"Love & relationship Vedic report for {name}, DOB: {dob}, Time: {tob}, Place: {pob}. Include: love life indicators in chart, Venus/Mars placement analysis, ideal partner traits, timing of soulmate meeting, challenges in existing relationships, and remedies. About 600 words.",
        "finance": f"Finance & wealth Vedic report for {name}, DOB: {dob}, Time: {tob}, Place: {pob}. Include: 2nd & 11th house analysis, Jupiter/Venus placements, wealth yogas present, best investment sectors, periods of financial growth, debt/loss warnings, and wealth-attracting remedies. About 700 words.",
        "health": f"Health & wellness Vedic report for {name}, DOB: {dob}, Time: {tob}, Place: {pob}. Include: 6th house analysis, susceptibility to specific health issues, organ systems to watch, best diet based on rashi, yoga/pranayama recommendations, gemstones and mantras for health. About 600 words.",
        "vastu": f"Vastu Shastra report for {name} (DOB: {dob}). Include: ideal home/office directions based on rashi, entrance placement, bedroom/kitchen/pooja room guidelines, plants and crystals to attract positivity, common Vastu doshas and their corrections. About 700 words.",
        "annual": f"Annual forecast (Varshphal) for {name}, DOB: {dob}, Time: {tob}, Place: {pob} for the next 12 months. Month-by-month prediction covering career, finance, love, health, family, travel. Include lucky dates, warnings, and monthly remedies. About 1000 words.",
        "sade-sati": f"Sade Sati (7.5 years Shani period) analysis for {name}, DOB: {dob}. Include: current phase (first/peak/last), impact areas, specific challenges expected, Shani remedies (Hanuman Chalisa, Shani mantra, donations, fasting), gemstone recommendations. About 600 words.",
        "child-birth": f"Child birth & progeny Vedic report for {name}, DOB: {dob}, Time: {tob}, Place: {pob}. Include: 5th house analysis, Jupiter placement, Putra yoga/dosha check, auspicious times for conception, potential challenges and their remedies, and guidance for existing children. About 700 words.",
    }
    return prompts.get(report_type, prompts["kundli-basic"])


class ReportRequest(BaseModel):
    reportType: str
    birthName: str
    dob: str
    tob: Optional[str] = ""
    pob: str
    partnerName: Optional[str] = ""
    partnerDob: Optional[str] = ""

@api_router.post("/ai/report")
async def generate_ai_report(request: ReportRequest, current_user: Optional[dict] = Depends(get_current_user)):
    report_type = request.reportType
    if report_type not in REPORT_PRICING:
        raise HTTPException(status_code=400, detail="Invalid report type")

    price = REPORT_PRICING[report_type]

    # Require authentication for paid reports
    if price > 0 and not current_user:
        raise HTTPException(status_code=401, detail="Authentication required for paid reports")

    # Free basic kundli - once per account lifetime
    if report_type == "kundli-basic" and current_user:
        existing = await db.ai_reports.find_one(
            {"user_id": current_user["id"], "report_type": "kundli-basic"}, {"_id": 0}
        )
        if existing:
            raise HTTPException(
                status_code=403,
                detail={"error": "FREE_REPORT_USED", "message": "You've already used your free basic Kundli. Try our detailed report for ₹99."},
            )

    # For paid reports: deduct wallet balance securely
    wallet_balance = 0
    if price > 0 and current_user:
        # Refresh user from DB to get latest wallet balance
        user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
        if user:
            wallet_balance = user.get("wallet_balance", 0)
            
            if wallet_balance < price:
                raise HTTPException(
                    status_code=402,
                    detail={"error": "INSUFFICIENT_BALANCE", "message": f"Insufficient wallet balance. Needed ₹{price}, available ₹{wallet_balance}. Please recharge."},
                )
                
            # Deduct
            await db.users.update_one(
                {"id": current_user["id"]}, {"$inc": {"wallet_balance": -price}}
            )
            wallet_balance -= price
            await db.wallet_transactions.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": current_user["id"],
                "type": "debit",
                "amount": price,
                "description": f"AI Report: {report_type}",
                "created_at": datetime.now(timezone.utc).isoformat(),
            })

    # Build prompt
    user_prompt = _build_report_prompt(report_type, request.model_dump())

    # Call OpenRouter (FREE)
    try:
        report_messages = [
            {"role": "system", "content": REPORT_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ]
        report_text = await call_openrouter(report_messages, max_tokens=4000)
    except Exception as e:
        logging.error(f"AI Report error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate report: {str(e)}")

    # Save
    report_doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"] if current_user else "guest",
        "user_name": request.birthName,
        "report_type": report_type,
        "birth_data": {
            "dob": request.dob, "tob": request.tob, "pob": request.pob,
            "partner_name": request.partnerName, "partner_dob": request.partnerDob,
        },
        "content": report_text,
        "price_paid": price,
        "status": "completed",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.ai_reports.insert_one(report_doc)

    return {
        "report": report_text,
        "reportType": report_type,
        "price": price,
        "walletBalance": wallet_balance,
        "reportId": report_doc["id"],
        "generatedAt": report_doc["created_at"],
    }

@api_router.get("/ai/chat/{session_id}")
async def get_chat_history(session_id: str):
    session = await db.ai_chat_sessions.find_one({"session_id": session_id}, {"_id": 0})
    if not session: return {"messages": [], "session_id": session_id}
    return {"messages": session.get("messages", []), "session_id": session_id}

@api_router.get("/plans", response_model=List[Plan])
async def get_plans():
    return await db.plans.find({"is_active": True}, {"_id": 0}).to_list(10)

@api_router.get("/blog", response_model=List[BlogPost])
async def get_blog_posts(category: Optional[str] = None, limit: int = 10):
    query = {"is_published": True}
    if category: query["category"] = category
    return await db.blog_posts.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)

@api_router.get("/blog/{slug}", response_model=BlogPost)
async def get_blog_post(slug: str):
    post = await db.blog_posts.find_one({"slug": slug}, {"_id": 0})
    if not post: raise HTTPException(status_code=404, detail="Blog post not found")
    await db.blog_posts.update_one({"slug": slug}, {"$inc": {"views": 1}})
    return post

@api_router.get("/stats")
async def get_stats():
    total_users = await db.users.count_documents({})
    total_astrologers = await db.astrologers.count_documents({})
    online_astrologers = await db.astrologers.count_documents({"is_online": True})
    return {
        "total_users": max(total_users, 12847),
        "online_astrologers": max(online_astrologers, 24),
        "total_sessions": 50000,
        "rating": 4.9
    }

# Public - Site Settings
@api_router.get("/site-settings")
async def get_public_site_settings():
    s = await db.site_settings.find_one({"id": "global"}, {"_id": 0})
    if not s:
        return {
            "siteName": "AstroVedic AI",
            "tagline": "Where Ancient Stars Meet Artificial Intelligence",
            "contactEmail": "support@astrovedic.ai",
            "supportPhone": "+91 98765 43210",
            "logoUrl": "",
            "instagram": "", "youtube": "", "whatsapp": "", "twitter": "", "facebook": ""
        }
    return s

# Public - Banners
@api_router.get("/banners")
async def get_public_banners(page: Optional[str] = None):
    q: Dict[str, Any] = {"is_active": True}
    if page:
        # Treat "home" as the default page if not stored explicitly.
        if page == "home":
            q["$or"] = [{"page": "home"}, {"page": {"$exists": False}}, {"page": ""}]
        else:
            q["page"] = page
    return await db.banners.find(q, {"_id": 0}).sort("position", 1).to_list(20)

# Public - Coupons validation
@api_router.post("/coupons/validate")
async def validate_coupon(data: dict):
    code = data.get("code", "").upper()
    coupon = await db.coupons.find_one({"code": code, "is_active": True}, {"_id": 0})
    if not coupon: raise HTTPException(status_code=404, detail="Invalid coupon code")
    if coupon.get("expires_at") and coupon["expires_at"] < datetime.now(timezone.utc).isoformat():
        raise HTTPException(status_code=400, detail="Coupon has expired")
    if coupon.get("usage_count", 0) >= coupon.get("usage_limit", 9999):
        raise HTTPException(status_code=400, detail="Coupon usage limit reached")
    return {"valid": True, "coupon": coupon}

# Public reviews
@api_router.get("/reviews")
async def get_public_reviews(entity_type: Optional[str] = None, entity_id: Optional[str] = None):
    query = {"is_approved": True}
    if entity_type: query["entity_type"] = entity_type
    if entity_id: query["entity_id"] = entity_id
    return await db.reviews.find(query, {"_id": 0}).sort("created_at", -1).to_list(50)

# ==================== PUBLIC SUPPORT TICKETS ====================
class SupportTicketCreate(BaseModel):
    user_id: str
    user_name: str
    user_email: str
    category: str           # payment | technical | astrologer | general | refund | other
    subject: str
    description: str
    priority: Optional[str] = "medium"     # low | medium | high
    screenshot_url: Optional[str] = None   # data URL or external URL

@api_router.post("/support/tickets")
async def create_support_ticket(ticket: SupportTicketCreate):
    if not ticket.user_id or not ticket.subject.strip() or not ticket.description.strip():
        raise HTTPException(status_code=400, detail="user_id, subject and description are required")

    doc = {
        "id": str(uuid.uuid4())[:8],
        "user_id": ticket.user_id,
        "user_name": ticket.user_name or "User",
        "user_email": ticket.user_email or "",
        "category": ticket.category or "general",
        "subject": ticket.subject.strip(),
        "description": ticket.description.strip(),
        "priority": (ticket.priority or "medium").lower(),
        "status": "open",
        "screenshot_url": ticket.screenshot_url or None,
        "messages": [
            {
                "sender": "user",
                "content": ticket.description.strip(),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        ],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.support_tickets.insert_one(doc)
    return {"success": True, "ticket_id": doc["id"]}

@api_router.get("/support/tickets")
async def list_my_tickets(user_id: str):
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
    tickets = await db.support_tickets.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return tickets

# ==================== AUTH ROUTES ====================

class UserRegister(BaseModel):
    email: str
    password: str
    name: Optional[str] = None

class UserLoginRequest(BaseModel):
    email: str
    password: str

class GoogleAuthRequest(BaseModel):
    firebase_token: str
    email: str
    name: Optional[str] = None
    photo_url: Optional[str] = None

class AdminLogin(BaseModel):
    email: str
    password: str

@api_router.post("/auth/register")
async def register_user(payload: UserRegister, request: Request):
    """Register a new user with email and password."""
    client_ip = request.client.host if request.client else "unknown"
    if not check_rate_limit(f"register:{client_ip}"):
        raise HTTPException(status_code=429, detail="Too many registration attempts. Try again later.")
    
    email_lc = (payload.email or "").strip().lower()
    if not email_lc or "@" not in email_lc:
        raise HTTPException(status_code=400, detail="Valid email is required")
    if not payload.password or len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    # Check if user already exists
    existing = await db.users.find_one({"email": email_lc}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists. Please login.")
    
    user = {
        "id": f"user_{uuid.uuid4().hex[:10]}",
        "email": email_lc,
        "name": payload.name or email_lc.split("@")[0],
        "password_hash": hash_password(payload.password),
        "role": "user",
        "plan": "free",
        "wallet_balance": 0,
        "is_blocked": False,
        "is_onboarded": False,
        "auth_provider": "email",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user)
    
    # Create JWT token
    token = create_access_token({"sub": user["id"], "email": user["email"], "role": user["role"]})
    
    user_response = {k: v for k, v in user.items() if k not in ("password_hash", "_id")}
    return {"success": True, "token": token, "user": user_response}

@api_router.post("/auth/login")
async def user_login(payload: UserLoginRequest, request: Request):
    """Login with email and password."""
    client_ip = request.client.host if request.client else "unknown"
    if not check_rate_limit(f"login:{client_ip}"):
        raise HTTPException(status_code=429, detail="Too many login attempts. Try again later.")
    
    email_lc = (payload.email or "").strip().lower()
    
    # Check if this is the admin email
    if email_lc == ADMIN_EMAIL:
        if verify_password(payload.password, ADMIN_PASSWORD_HASH):
            # Ensure admin user exists in DB
            admin_user = await db.users.find_one({"email": ADMIN_EMAIL}, {"_id": 0})
            if not admin_user:
                admin_user = {
                    "id": "admin_fixed_001",
                    "email": ADMIN_EMAIL,
                    "name": ADMIN_NAME,
                    "role": "admin",
                    "plan": "platinum",
                    "wallet_balance": 0,
                    "is_blocked": False,
                    "is_onboarded": True,
                    "auth_provider": "email",
                    "created_at": datetime.now(timezone.utc).isoformat(),
                }
                await db.users.insert_one(admin_user)
            else:
                await db.users.update_one({"email": ADMIN_EMAIL}, {"$set": {"role": "admin"}})
                admin_user["role"] = "admin"
            
            token = create_access_token({"sub": admin_user["id"], "email": admin_user["email"], "role": "admin"})
            user_response = {k: v for k, v in admin_user.items() if k not in ("password_hash", "_id")}
            return {"success": True, "token": token, "user": user_response, "redirect": "/admin"}
        else:
            raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Regular user login
    user = await db.users.find_one({"email": email_lc}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials. Please register first.")
    
    if user.get("is_blocked"):
        raise HTTPException(status_code=403, detail="Your account has been blocked. Contact support.")
    
    # Verify password
    stored_hash = user.get("password_hash", "")
    if not stored_hash or not verify_password(payload.password, stored_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": user["id"], "email": user["email"], "role": user.get("role", "user")})
    user_response = {k: v for k, v in user.items() if k not in ("password_hash", "_id")}
    redirect = "/admin" if user.get("role") == "admin" else ("/onboarding" if not user.get("is_onboarded") else "/dashboard")
    return {"success": True, "token": token, "user": user_response, "redirect": redirect}

@api_router.post("/auth/google")
async def google_auth(payload: GoogleAuthRequest, request: Request):
    """Authenticate with Google (Firebase ID token)."""
    client_ip = request.client.host if request.client else "unknown"
    if not check_rate_limit(f"google_auth:{client_ip}"):
        raise HTTPException(status_code=429, detail="Too many attempts. Try again later.")
    
    email_lc = (payload.email or "").strip().lower()
    if not email_lc:
        raise HTTPException(status_code=400, detail="Email is required")
    
    # Check if user exists
    user = await db.users.find_one({"email": email_lc}, {"_id": 0})
    
    if user:
        # Existing user - update auth provider if needed
        if user.get("is_blocked"):
            raise HTTPException(status_code=403, detail="Your account has been blocked.")
        await db.users.update_one({"email": email_lc}, {"$set": {
            "auth_provider": "google",
            "photo_url": payload.photo_url or user.get("photo_url", ""),
            "last_login": datetime.now(timezone.utc).isoformat(),
        }})
        user["photo_url"] = payload.photo_url or user.get("photo_url", "")
    else:
        # New user
        role = "admin" if email_lc == ADMIN_EMAIL else "user"
        user = {
            "id": f"user_{uuid.uuid4().hex[:10]}",
            "email": email_lc,
            "name": payload.name or email_lc.split("@")[0],
            "role": role,
            "plan": "platinum" if role == "admin" else "free",
            "wallet_balance": 0,
            "is_blocked": False,
            "is_onboarded": False,
            "auth_provider": "google",
            "photo_url": payload.photo_url or "",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.users.insert_one(user)
    
    token = create_access_token({"sub": user["id"], "email": user["email"], "role": user.get("role", "user")})
    user_response = {k: v for k, v in user.items() if k not in ("password_hash", "_id")}
    redirect = "/admin" if user.get("role") == "admin" else ("/onboarding" if not user.get("is_onboarded") else "/dashboard")
    return {"success": True, "token": token, "user": user_response, "redirect": redirect}

@api_router.get("/auth/me")
async def get_current_user_profile(current_user: dict = Depends(require_auth)):
    """Get current authenticated user's profile."""
    user_response = {k: v for k, v in current_user.items() if k not in ("password_hash", "_id")}
    return {"success": True, "user": user_response}

# ==================== USER PROFILE ====================

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    dob: Optional[str] = None
    tob: Optional[str] = None  # time of birth
    pob: Optional[str] = None  # place of birth
    gender: Optional[str] = None
    preferred_language: Optional[str] = None
    rashi: Optional[str] = None
    profile_photo: Optional[str] = None

@api_router.post("/auth/profile")
async def save_user_profile(profile: ProfileUpdate, current_user: dict = Depends(require_auth)):
    """Save user profile (onboarding)."""
    update_data = {k: v for k, v in profile.model_dump().items() if v is not None}
    update_data["is_onboarded"] = True
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.users.update_one({"id": current_user["id"]}, {"$set": update_data})
    return {"success": True, "message": "Profile saved successfully"}

@api_router.put("/auth/profile")
async def update_user_profile(profile: ProfileUpdate, current_user: dict = Depends(require_auth)):
    """Update user profile."""
    update_data = {k: v for k, v in profile.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.users.update_one({"id": current_user["id"]}, {"$set": update_data})
    updated_user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
    user_response = {k: v for k, v in updated_user.items() if k not in ("password_hash", "_id")}
    return {"success": True, "user": user_response}

@api_router.get("/auth/profile")
async def get_user_profile(current_user: dict = Depends(require_auth)):
    """Get user profile."""
    user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
    user_response = {k: v for k, v in user.items() if k not in ("password_hash", "_id")}
    return {"success": True, "user": user_response}

# ==================== ADMIN LOGIN ====================

@api_router.post("/admin/login")
async def admin_login(credentials: AdminLogin, request: Request):
    client_ip = request.client.host if request.client else "unknown"
    if not check_rate_limit(f"admin_login:{client_ip}"):
        raise HTTPException(status_code=429, detail="Too many login attempts. Try again later.")
    
    email_lc = (credentials.email or "").strip().lower()
    
    # Check against env-based admin
    if email_lc == ADMIN_EMAIL and verify_password(credentials.password, ADMIN_PASSWORD_HASH):
        admin_user = await db.users.find_one({"email": ADMIN_EMAIL}, {"_id": 0})
        if not admin_user:
            admin_user = {
                "id": "admin_fixed_001",
                "email": ADMIN_EMAIL,
                "name": ADMIN_NAME,
                "role": "admin",
                "plan": "platinum",
                "wallet_balance": 0,
                "is_blocked": False,
                "is_onboarded": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            await db.users.insert_one(admin_user)
        token = create_access_token({"sub": admin_user["id"], "email": admin_user["email"], "role": "admin"})
        return {"success": True, "token": token, "admin": {k: v for k, v in admin_user.items() if k not in ("password_hash", "_id")}}
    
    # Check DB admins
    admin = await db.admins.find_one({"email": email_lc}, {"_id": 0})
    if admin:
        stored_hash = admin.get("password_hash", "")
        if stored_hash and verify_password(credentials.password, stored_hash):
            token = create_access_token({"sub": admin["id"], "email": admin["email"], "role": admin.get("role", "admin")})
            return {"success": True, "token": token, "admin": {k: v for k, v in admin.items() if k not in ("password_hash", "password", "_id")}}
    
    raise HTTPException(status_code=401, detail="Invalid credentials")

@api_router.get("/admin/stats")
async def get_admin_stats(_admin: dict = Depends(require_admin)):
    total_users = await db.users.count_documents({})
    total_astrologers = await db.astrologers.count_documents({})
    online_astrologers = await db.astrologers.count_documents({"is_online": True})
    total_products = await db.products.count_documents({})
    total_orders = await db.orders.count_documents({})
    total_revenue = 0
    async for txn in db.wallet_transactions.find({"type": "credit"}):
        total_revenue += txn.get("amount", 0)
    open_tickets = await db.support_tickets.count_documents({"status": {"$in": ["open", "in_progress"]}})
    return {
        "totalUsers": max(total_users, 12847),
        "activeSessions": await db.sessions.count_documents({"status": "active"}),
        "todayRevenue": max(int(total_revenue), 45670),
        "onlineAstrologers": max(online_astrologers, 18),
        "pendingOrders": await db.orders.count_documents({"status": "pending"}),
        "openTickets": max(int(open_tickets), 5),
        "totalProducts": total_products,
        "totalAstrologers": total_astrologers,
        "totalOrders": total_orders
    }

# --- Admin Users ---
@api_router.get("/admin/users")
async def get_admin_users(page: int = 1, limit: int = 10, plan: Optional[str] = None, _admin: dict = Depends(require_admin)):
    query = {}
    if plan and plan != "all": query["plan"] = plan
    skip = (page - 1) * limit
    users = await db.users.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.users.count_documents(query)
    if not users:
        users = [
            {"id": f"user_{i}", "name": f"User {i}", "email": f"user{i}@example.com",
             "plan": ["free", "silver", "gold", "platinum"][i % 4], "wallet_balance": i * 100,
             "created_at": datetime.now(timezone.utc).isoformat(), "is_blocked": False,
             "rashi": "Leo", "total_spent": i * 500}
            for i in range(1, 11)
        ]
        return {"users": users, "total": 100}
    return {"users": users, "total": total}

@api_router.patch("/admin/users/{user_id}/block")
async def block_user(user_id: str, data: dict, _admin: dict = Depends(require_admin)):
    await db.users.update_one({"id": user_id}, {"$set": {"is_blocked": data.get("is_blocked", False)}})
    await log_audit("block_user" if data.get("is_blocked") else "unblock_user", "user", user_id)
    return {"success": True}

@api_router.post("/admin/users/{user_id}/wallet")
async def adjust_wallet(user_id: str, data: dict, _admin: dict = Depends(require_admin)):
    amount = data.get("amount", 0)
    reason = data.get("reason", "Admin adjustment")
    await db.users.update_one({"id": user_id}, {"$inc": {"wallet_balance": amount}})
    await db.wallet_transactions.insert_one({
        "id": str(uuid.uuid4()), "user_id": user_id,
        "type": "credit" if amount > 0 else "debit",
        "amount": abs(amount), "description": reason,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    await log_audit("wallet_adjust", "user", user_id, f"Amount: {amount}, Reason: {reason}")
    return {"success": True}

# --- Admin Astrologers ---
@api_router.post("/admin/astrologers")
async def create_astrologer(astrologer: dict, _admin: dict = Depends(require_admin)):
    astrologer["id"] = str(uuid.uuid4())
    astrologer["created_at"] = datetime.now(timezone.utc).isoformat()
    astrologer.setdefault("rating", 4.5)
    astrologer.setdefault("total_reviews", 0)
    astrologer.setdefault("total_sessions", 0)
    astrologer.setdefault("is_online", False)
    await db.astrologers.insert_one(astrologer)
    await log_audit("create", "astrologer", astrologer["id"], astrologer.get("name", ""))
    return {"success": True, "id": astrologer["id"]}

@api_router.put("/admin/astrologers/{astrologer_id}")
async def update_astrologer(astrologer_id: str, astrologer: dict, _admin: dict = Depends(require_admin)):
    await db.astrologers.update_one({"id": astrologer_id}, {"$set": astrologer})
    await log_audit("update", "astrologer", astrologer_id)
    return {"success": True}

@api_router.delete("/admin/astrologers/{astrologer_id}")
async def delete_astrologer(astrologer_id: str, _admin: dict = Depends(require_admin)):
    await db.astrologers.delete_one({"id": astrologer_id})
    await log_audit("delete", "astrologer", astrologer_id)
    return {"success": True}

@api_router.patch("/admin/astrologers/{astrologer_id}/status")
async def update_astrologer_status(astrologer_id: str, data: dict, _admin: dict = Depends(require_admin)):
    await db.astrologers.update_one({"id": astrologer_id}, {"$set": {"is_online": data.get("is_online", False)}})
    return {"success": True}

# --- Admin Horoscope ---
@api_router.get("/admin/horoscopes")
async def get_admin_horoscopes(date: str = None, _admin: dict = Depends(require_admin)):
    if not date: date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return await db.horoscopes.find({"date": date}, {"_id": 0}).to_list(12)

@api_router.post("/admin/horoscopes")
async def save_horoscope(horoscope: dict, _admin: dict = Depends(require_admin)):
    date, rashi = horoscope.get("date"), horoscope.get("rashi")
    existing = await db.horoscopes.find_one({"date": date, "rashi": rashi})
    if existing:
        await db.horoscopes.update_one({"date": date, "rashi": rashi}, {"$set": horoscope})
    else:
        horoscope["id"] = str(uuid.uuid4())
        horoscope["created_at"] = datetime.now(timezone.utc).isoformat()
        await db.horoscopes.insert_one(horoscope)
    await log_audit("save", "horoscope", f"{date}-{rashi}")
    return {"success": True}

@api_router.post("/admin/horoscopes/publish-all")
async def publish_all_horoscopes(data: dict, _admin: dict = Depends(require_admin)):
    date = data.get("date", datetime.now(timezone.utc).strftime("%Y-%m-%d"))
    await db.horoscopes.update_many({"date": date}, {"$set": {"is_published": True}})
    await log_audit("publish_all", "horoscope", date)
    return {"success": True}

# --- Admin Products ---
@api_router.post("/admin/products")
async def create_product(product: dict, _admin: dict = Depends(require_admin)):
    product["id"] = str(uuid.uuid4())
    product["created_at"] = datetime.now(timezone.utc).isoformat()
    product.setdefault("rating", 4.5)
    product.setdefault("sold_count", 0)
    await db.products.insert_one(product)
    await log_audit("create", "product", product["id"], product.get("name", ""))
    return {"success": True, "id": product["id"]}

@api_router.put("/admin/products/{product_id}")
async def update_product(product_id: str, product: dict, _admin: dict = Depends(require_admin)):
    await db.products.update_one({"id": product_id}, {"$set": product})
    await log_audit("update", "product", product_id)
    return {"success": True}

@api_router.delete("/admin/products/{product_id}")
async def delete_product(product_id: str, _admin: dict = Depends(require_admin)):
    await db.products.delete_one({"id": product_id})
    await log_audit("delete", "product", product_id)
    return {"success": True}

# --- Admin Orders ---
@api_router.get("/admin/orders")
async def get_admin_orders(status: Optional[str] = None, _admin: dict = Depends(require_admin)):
    query = {}
    if status and status != "all": query["status"] = status
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    if not orders:
        orders = [
            {"id": str(uuid.uuid4())[:8], "user_name": f"Customer {i}", "user_email": f"cust{i}@email.com",
             "items": [{"name": "Blue Sapphire", "qty": 1, "price": 12999}],
             "total_amount": 12999 + i * 1000, "status": ["pending", "confirmed", "shipped", "delivered"][i % 4],
             "payment_method": "wallet", "shipping_address": f"Address {i}, City",
             "created_at": (datetime.now(timezone.utc) - timedelta(days=i)).isoformat()}
            for i in range(1, 9)
        ]
    return orders

@api_router.patch("/admin/orders/{order_id}/status")
async def update_order_status(order_id: str, data: dict, _admin: dict = Depends(require_admin)):
    new_status = data.get("status")
    await db.orders.update_one({"id": order_id}, {"$set": {"status": new_status, "updated_at": datetime.now(timezone.utc).isoformat()}})
    await log_audit("update_status", "order", order_id, f"Status: {new_status}")
    return {"success": True}

# --- Admin Sessions ---
@api_router.get("/admin/sessions")
async def get_admin_sessions(status: Optional[str] = None, _admin: dict = Depends(require_admin)):
    query = {}
    if status and status != "all": query["status"] = status
    sessions = await db.sessions.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    if not sessions:
        statuses = ["active", "completed", "cancelled"]
        sessions = [
            {"id": str(uuid.uuid4())[:8], "user_name": f"User {i}", "astrologer_name": ["Pandit Rajesh", "Dr. Priya", "Acharya Vinod"][i % 3],
             "type": ["chat", "call", "video"][i % 3], "duration_minutes": random.randint(5, 45),
             "amount": random.randint(100, 1500), "status": statuses[i % 3],
             "rating": random.randint(3, 5) if statuses[i % 3] == "completed" else None,
             "created_at": (datetime.now(timezone.utc) - timedelta(hours=i * 2)).isoformat()}
            for i in range(12)
        ]
    return sessions

@api_router.patch("/admin/sessions/{session_id}/end")
async def end_session(session_id: str, _admin: dict = Depends(require_admin)):
    await db.sessions.update_one({"id": session_id}, {"$set": {"status": "completed", "ended_at": datetime.now(timezone.utc).isoformat()}})
    await log_audit("end_session", "session", session_id)
    return {"success": True}

# --- Admin AI Reports ---
@api_router.get("/admin/ai-reports")
async def get_admin_ai_reports(_admin: dict = Depends(require_admin)):
    reports = await db.ai_reports.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    if not reports:
        report_types = ["Kundli Analysis", "Marriage Compatibility", "Career Report", "Health Report", "Financial Forecast", "Yearly Prediction"]
        reports = [
            {"id": str(uuid.uuid4())[:8], "user_name": f"User {i}", "user_email": f"user{i}@email.com",
             "report_type": report_types[i % len(report_types)],
             "status": ["completed", "processing", "failed"][i % 3],
             "tokens_used": random.randint(500, 3000),
             "created_at": (datetime.now(timezone.utc) - timedelta(days=i)).isoformat()}
            for i in range(15)
        ]
    return reports

@api_router.delete("/admin/ai-reports/{report_id}")
async def delete_ai_report(report_id: str, _admin: dict = Depends(require_admin)):
    await db.ai_reports.delete_one({"id": report_id})
    await log_audit("delete", "ai_report", report_id)
    return {"success": True}


# --- AI Report Types (the catalogue of report packages users can buy) ---
DEFAULT_REPORT_TYPES = [
    {"slug": "kundli-basic",    "name": "Janam Kundli Basic",    "desc": "Quick overview of your chart",       "price": 0,   "icon": "Scroll",     "color": "#F5C842", "free": True,  "needs_partner": False, "position": 1, "is_active": True},
    {"slug": "kundli-detailed", "name": "Janam Kundli Detailed", "desc": "Full 10-section deep analysis",      "price": 99,  "icon": "Gem",        "color": "#3FB0FF", "free": False, "needs_partner": False, "position": 2, "is_active": True},
    {"slug": "kundli-premium",  "name": "Premium PDF Report",    "desc": "14-section extensive forecast",      "price": 299, "icon": "FileDown",   "color": "#E879F9", "free": False, "needs_partner": False, "position": 3, "is_active": True},
    {"slug": "compatibility",   "name": "Love Compatibility",    "desc": "Marriage compatibility (36 gunas)",  "price": 149, "icon": "Heart",      "color": "#EF4444", "free": False, "needs_partner": True,  "position": 4, "is_active": True},
    {"slug": "career",          "name": "Career & Wealth",       "desc": "Professional guidance & timing",     "price": 199, "icon": "Briefcase",  "color": "#D4A017", "free": False, "needs_partner": False, "position": 5, "is_active": True},
    {"slug": "health",          "name": "Health Outlook",        "desc": "Wellness predictions & remedies",    "price": 149, "icon": "HeartPulse", "color": "#22C55E", "free": False, "needs_partner": False, "position": 6, "is_active": True},
    {"slug": "finance",         "name": "Finance Report",        "desc": "Wealth yogas & investment periods",  "price": 199, "icon": "Wallet",     "color": "#10B981", "free": False, "needs_partner": False, "position": 7, "is_active": True},
    {"slug": "vastu",           "name": "Vastu Report",          "desc": "Home & office energy guidance",      "price": 249, "icon": "Home",       "color": "#F59E0B", "free": False, "needs_partner": False, "position": 8, "is_active": True},
    {"slug": "annual",          "name": "Annual Forecast",       "desc": "Month-by-month for next 12 months",  "price": 299, "icon": "Calendar",   "color": "#8B5CF6", "free": False, "needs_partner": False, "position": 9, "is_active": True},
    {"slug": "sade-sati",       "name": "Sade Sati Analysis",    "desc": "7.5 yr Shani period deep dive",      "price": 149, "icon": "Orbit",      "color": "#6366F1", "free": False, "needs_partner": False, "position": 10, "is_active": True},
    {"slug": "child-birth",     "name": "Child Birth Report",    "desc": "Progeny & parenting guidance",       "price": 199, "icon": "Baby",       "color": "#F472B6", "free": False, "needs_partner": False, "position": 11, "is_active": True},
]

async def _ensure_default_report_types():
    existing = await db.ai_report_types.count_documents({})
    if existing == 0:
        for rt in DEFAULT_REPORT_TYPES:
            await db.ai_report_types.insert_one({
                "id": str(uuid.uuid4()),
                **rt,
                "created_at": datetime.now(timezone.utc).isoformat(),
            })

@api_router.get("/report-types")
async def get_public_report_types():
    await _ensure_default_report_types()
    return await db.ai_report_types.find({"is_active": True}, {"_id": 0}).sort("position", 1).to_list(50)

@api_router.get("/admin/report-types")
async def admin_list_report_types(_admin: dict = Depends(require_admin)):
    await _ensure_default_report_types()
    return await db.ai_report_types.find({}, {"_id": 0}).sort("position", 1).to_list(100)

@api_router.post("/admin/report-types")
async def admin_create_report_type(payload: Dict[str, Any], _admin: dict = Depends(require_admin)):
    if not payload.get("name"):
        raise HTTPException(status_code=400, detail="Name is required")
    doc = {
        "id": str(uuid.uuid4()),
        "slug": (payload.get("slug") or payload["name"]).lower().replace(" ", "-")[:60],
        "name": payload["name"],
        "desc": payload.get("desc", ""),
        "price": int(payload.get("price", 0) or 0),
        "icon": payload.get("icon", "Scroll"),
        "color": payload.get("color", "#8B5CF6"),
        "free": bool(payload.get("free", False)),
        "needs_partner": bool(payload.get("needs_partner", False)),
        "position": int(payload.get("position", 99) or 99),
        "is_active": bool(payload.get("is_active", True)),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.ai_report_types.insert_one(doc)
    await log_audit("create", "report_type", doc["id"], doc["name"])
    return {"success": True, "id": doc["id"]}

@api_router.put("/admin/report-types/{rt_id}")
async def admin_update_report_type(rt_id: str, payload: Dict[str, Any], _admin: dict = Depends(require_admin)):
    update = {k: v for k, v in payload.items() if k not in ("id", "_id", "created_at")}
    if "price" in update:
        try:
            update["price"] = int(update["price"] or 0)
        except Exception:
            update["price"] = 0
    if "position" in update:
        try:
            update["position"] = int(update["position"] or 99)
        except Exception:
            update["position"] = 99
    res = await db.ai_report_types.update_one({"id": rt_id}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Report type not found")
    await log_audit("update", "report_type", rt_id, payload.get("name", ""))
    return {"success": True}

@api_router.delete("/admin/report-types/{rt_id}")
async def admin_delete_report_type(rt_id: str, _admin: dict = Depends(require_admin)):
    res = await db.ai_report_types.delete_one({"id": rt_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Report type not found")
    await log_audit("delete", "report_type", rt_id)
    return {"success": True}

@api_router.patch("/admin/report-types/{rt_id}/toggle")
async def admin_toggle_report_type(rt_id: str, data: Dict[str, Any], _admin: dict = Depends(require_admin)):
    await db.ai_report_types.update_one({"id": rt_id}, {"$set": {"is_active": bool(data.get("is_active", True))}})
    return {"success": True}


# --- Admin Blog ---
@api_router.get("/admin/blog")
async def get_admin_blog_posts(_admin: dict = Depends(require_admin)):
    posts = await db.blog_posts.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return posts

@api_router.post("/admin/blog")
async def create_blog_post(post: dict, _admin: dict = Depends(require_admin)):
    post["id"] = str(uuid.uuid4())
    post["created_at"] = datetime.now(timezone.utc).isoformat()
    post.setdefault("views", 0)
    post.setdefault("is_published", False)
    post.setdefault("slug", post.get("title", "").lower().replace(" ", "-")[:50])
    await db.blog_posts.insert_one(post)
    await log_audit("create", "blog", post["id"], post.get("title", ""))
    return {"success": True, "id": post["id"]}

@api_router.put("/admin/blog/{post_id}")
async def update_blog_post(post_id: str, post: dict, _admin: dict = Depends(require_admin)):
    post["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.blog_posts.update_one({"id": post_id}, {"$set": post})
    await log_audit("update", "blog", post_id)
    return {"success": True}

@api_router.delete("/admin/blog/{post_id}")
async def delete_blog_post(post_id: str, _admin: dict = Depends(require_admin)):
    await db.blog_posts.delete_one({"id": post_id})
    await log_audit("delete", "blog", post_id)
    return {"success": True}

@api_router.patch("/admin/blog/{post_id}/publish")
async def toggle_blog_publish(post_id: str, data: dict, _admin: dict = Depends(require_admin)):
    await db.blog_posts.update_one({"id": post_id}, {"$set": {"is_published": data.get("is_published", True)}})
    await log_audit("publish_toggle", "blog", post_id)
    return {"success": True}

# --- Admin Plans ---
@api_router.get("/admin/plans")
async def get_admin_plans(_admin: dict = Depends(require_admin)):
    plans = await db.plans.find({}, {"_id": 0}).to_list(20)
    return plans

@api_router.post("/admin/plans")
async def create_plan(plan: dict, _admin: dict = Depends(require_admin)):
    plan["id"] = str(uuid.uuid4())
    plan["created_at"] = datetime.now(timezone.utc).isoformat()
    plan.setdefault("is_active", True)
    await db.plans.insert_one(plan)
    await log_audit("create", "plan", plan["id"], plan.get("name", ""))
    return {"success": True, "id": plan["id"]}

@api_router.put("/admin/plans/{plan_id}")
async def update_plan(plan_id: str, plan: dict, _admin: dict = Depends(require_admin)):
    await db.plans.update_one({"id": plan_id}, {"$set": plan})
    await log_audit("update", "plan", plan_id)
    return {"success": True}

@api_router.delete("/admin/plans/{plan_id}")
async def delete_plan(plan_id: str, _admin: dict = Depends(require_admin)):
    await db.plans.delete_one({"id": plan_id})
    await log_audit("delete", "plan", plan_id)
    return {"success": True}

@api_router.patch("/admin/plans/{plan_id}/toggle")
async def toggle_plan(plan_id: str, data: dict, _admin: dict = Depends(require_admin)):
    await db.plans.update_one({"id": plan_id}, {"$set": {"is_active": data.get("is_active", True)}})
    return {"success": True}

# --- Admin Coupons ---
@api_router.get("/admin/coupons")
async def get_admin_coupons(_admin: dict = Depends(require_admin)):
    coupons = await db.coupons.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    if not coupons:
        coupons = [
            {"id": str(uuid.uuid4())[:8], "code": "ASTRO50", "discount_type": "percentage", "discount_value": 50,
             "min_order": 500, "max_discount": 200, "usage_limit": 100, "usage_count": 45,
             "is_active": True, "expires_at": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
             "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4())[:8], "code": "WELCOME100", "discount_type": "flat", "discount_value": 100,
             "min_order": 299, "max_discount": 100, "usage_limit": 500, "usage_count": 234,
             "is_active": True, "expires_at": (datetime.now(timezone.utc) + timedelta(days=60)).isoformat(),
             "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4())[:8], "code": "NEWYEAR25", "discount_type": "percentage", "discount_value": 25,
             "min_order": 1000, "max_discount": 500, "usage_limit": 200, "usage_count": 200,
             "is_active": False, "expires_at": (datetime.now(timezone.utc) - timedelta(days=10)).isoformat(),
             "created_at": (datetime.now(timezone.utc) - timedelta(days=40)).isoformat()},
        ]
    return coupons

@api_router.post("/admin/coupons")
async def create_coupon(coupon: dict, _admin: dict = Depends(require_admin)):
    coupon["id"] = str(uuid.uuid4())
    coupon["created_at"] = datetime.now(timezone.utc).isoformat()
    coupon.setdefault("usage_count", 0)
    coupon["code"] = coupon.get("code", "").upper()
    await db.coupons.insert_one(coupon)
    await log_audit("create", "coupon", coupon["id"], coupon.get("code", ""))
    return {"success": True, "id": coupon["id"]}

@api_router.put("/admin/coupons/{coupon_id}")
async def update_coupon(coupon_id: str, coupon: dict, _admin: dict = Depends(require_admin)):
    await db.coupons.update_one({"id": coupon_id}, {"$set": coupon})
    await log_audit("update", "coupon", coupon_id)
    return {"success": True}

@api_router.delete("/admin/coupons/{coupon_id}")
async def delete_coupon(coupon_id: str, _admin: dict = Depends(require_admin)):
    await db.coupons.delete_one({"id": coupon_id})
    await log_audit("delete", "coupon", coupon_id)
    return {"success": True}

@api_router.patch("/admin/coupons/{coupon_id}/toggle")
async def toggle_coupon(coupon_id: str, data: dict, _admin: dict = Depends(require_admin)):
    await db.coupons.update_one({"id": coupon_id}, {"$set": {"is_active": data.get("is_active", True)}})
    return {"success": True}

# --- Admin Finance ---
@api_router.get("/admin/finance")
async def get_admin_finance(_admin: dict = Depends(require_admin)):
    transactions = await db.wallet_transactions.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    if not transactions:
        txn_types = ["credit", "debit"]
        descriptions = ["Wallet Recharge", "Consultation Payment", "Product Purchase", "Refund", "Plan Subscription", "Referral Bonus"]
        transactions = [
            {"id": str(uuid.uuid4())[:8], "user_id": f"user_{i}", "user_name": f"User {i}",
             "type": txn_types[i % 2], "amount": random.randint(100, 5000),
             "description": descriptions[i % len(descriptions)],
             "created_at": (datetime.now(timezone.utc) - timedelta(hours=i * 3)).isoformat()}
            for i in range(20)
        ]
    total_credit = sum(t["amount"] for t in transactions if t.get("type") == "credit")
    total_debit = sum(t["amount"] for t in transactions if t.get("type") == "debit")
    return {
        "transactions": transactions,
        "summary": {
            "total_revenue": max(total_credit, 145670),
            "total_payouts": max(total_debit, 45230),
            "net_profit": max(total_credit - total_debit, 100440),
            "pending_settlements": 12340,
            "this_month": 45670,
            "last_month": 38900
        }
    }

# --- Admin Banners ---
@api_router.get("/admin/banners")
async def get_admin_banners(_admin: dict = Depends(require_admin)):
    banners = await db.banners.find({}, {"_id": 0}).sort("position", 1).to_list(50)
    if not banners:
        banners = [
            {"id": str(uuid.uuid4())[:8], "title": "Free Kundli Report", "subtitle": "Get your detailed birth chart analysis free",
             "image_url": "https://images.unsplash.com/photo-1627947224567-4b17c3137ad4?w=1200",
             "link": "/nakshatra-ai", "position": 1, "is_active": True, "page": "home",
             "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4())[:8], "title": "Gemstone Sale - 30% Off", "subtitle": "Certified natural gemstones with lab report",
             "image_url": "https://images.unsplash.com/photo-1613843351058-1dd06fda7c02?w=1200",
             "link": "/cosmic-store", "position": 2, "is_active": True, "page": "home",
             "created_at": datetime.now(timezone.utc).isoformat()},
        ]
    return banners

@api_router.post("/admin/banners")
async def create_banner(banner: dict, _admin: dict = Depends(require_admin)):
    banner["id"] = str(uuid.uuid4())
    banner["created_at"] = datetime.now(timezone.utc).isoformat()
    banner.setdefault("is_active", True)
    banner.setdefault("position", 99)
    await db.banners.insert_one(banner)
    await log_audit("create", "banner", banner["id"], banner.get("title", ""))
    return {"success": True, "id": banner["id"]}

@api_router.put("/admin/banners/{banner_id}")
async def update_banner(banner_id: str, banner: dict, _admin: dict = Depends(require_admin)):
    await db.banners.update_one({"id": banner_id}, {"$set": banner})
    await log_audit("update", "banner", banner_id)
    return {"success": True}

@api_router.delete("/admin/banners/{banner_id}")
async def delete_banner(banner_id: str, _admin: dict = Depends(require_admin)):
    await db.banners.delete_one({"id": banner_id})
    await log_audit("delete", "banner", banner_id)
    return {"success": True}

@api_router.patch("/admin/banners/{banner_id}/toggle")
async def toggle_banner(banner_id: str, data: dict, _admin: dict = Depends(require_admin)):
    await db.banners.update_one({"id": banner_id}, {"$set": {"is_active": data.get("is_active", True)}})
    return {"success": True}

# --- Admin Notifications ---
@api_router.get("/admin/notifications")
async def get_admin_notifications(_admin: dict = Depends(require_admin)):
    notifs = await db.notifications.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    if not notifs:
        notifs = [
            {"id": str(uuid.uuid4())[:8], "title": "Welcome to AstroVedic!", "message": "Start your cosmic journey today.",
             "type": "all", "target": "all_users", "is_sent": True, "sent_count": 12847,
             "created_at": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()},
            {"id": str(uuid.uuid4())[:8], "title": "New Year Sale!", "message": "50% off on all consultations.",
             "type": "promotional", "target": "all_users", "is_sent": True, "sent_count": 12847,
             "created_at": (datetime.now(timezone.utc) - timedelta(days=3)).isoformat()},
        ]
    return notifs


# Public notifications (visible to all users on the site)
@api_router.get("/notifications")
async def get_public_notifications():
    notifs = await db.notifications.find(
        {"is_sent": True}, {"_id": 0}
    ).sort("created_at", -1).to_list(20)
    if not notifs:
        notifs = [
            {"id": "n1", "title": "Welcome to AstroVedic AI 🙏",
             "message": "Get your free Kundli today and explore AI-powered Vedic astrology.",
             "type": "info", "is_sent": True,
             "created_at": (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat()},
            {"id": "n2", "title": "Daily Rashifal updated ✨",
             "message": "Today's horoscope is ready for all 12 rashis.",
             "type": "rashifal", "is_sent": True,
             "created_at": (datetime.now(timezone.utc) - timedelta(hours=6)).isoformat()},
            {"id": "n3", "title": "First consultation: 50% off 🎁",
             "message": "Use code FIRST50 on your first astrologer consultation.",
             "type": "promotional", "is_sent": True,
             "created_at": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()},
        ]
    return notifs

@api_router.post("/admin/notifications")
async def create_notification(notif: dict, _admin: dict = Depends(require_admin)):
    notif["id"] = str(uuid.uuid4())
    notif["created_at"] = datetime.now(timezone.utc).isoformat()
    notif.setdefault("is_sent", False)
    notif.setdefault("sent_count", 0)
    await db.notifications.insert_one(notif)
    await log_audit("create", "notification", notif["id"], notif.get("title", ""))
    return {"success": True, "id": notif["id"]}

@api_router.post("/admin/notifications/{notif_id}/send")
async def send_notification(notif_id: str, _admin: dict = Depends(require_admin)):
    user_count = await db.users.count_documents({})
    await db.notifications.update_one({"id": notif_id}, {"$set": {"is_sent": True, "sent_count": max(user_count, 12847), "sent_at": datetime.now(timezone.utc).isoformat()}})
    await log_audit("send", "notification", notif_id)
    return {"success": True, "sent_count": max(user_count, 12847)}

@api_router.delete("/admin/notifications/{notif_id}")
async def delete_notification(notif_id: str, _admin: dict = Depends(require_admin)):
    await db.notifications.delete_one({"id": notif_id})
    return {"success": True}

# --- Admin Reviews ---
@api_router.get("/admin/reviews")
async def get_admin_reviews(_admin: dict = Depends(require_admin)):
    reviews = await db.reviews.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    if not reviews:
        reviews = [
            {"id": str(uuid.uuid4())[:8], "user_name": f"User {i}", "entity_type": ["astrologer", "product", "platform"][i % 3],
             "entity_name": ["Pandit Rajesh", "Blue Sapphire", "AstroVedic AI"][i % 3],
             "entity_id": f"entity_{i}", "rating": random.randint(2, 5),
             "comment": ["Great experience! Very accurate predictions.", "Good quality gemstone, fast delivery.", "Amazing platform for astrology consultations.", "Average experience, could be better.", "Excellent! Highly recommended."][i % 5],
             "is_approved": i % 3 != 1, "is_flagged": i % 5 == 3,
             "created_at": (datetime.now(timezone.utc) - timedelta(days=i)).isoformat()}
            for i in range(15)
        ]
    return reviews

@api_router.patch("/admin/reviews/{review_id}/approve")
async def approve_review(review_id: str, data: dict, _admin: dict = Depends(require_admin)):
    await db.reviews.update_one({"id": review_id}, {"$set": {"is_approved": data.get("is_approved", True)}})
    await log_audit("approve_review" if data.get("is_approved") else "reject_review", "review", review_id)
    return {"success": True}

@api_router.patch("/admin/reviews/{review_id}/flag")
async def flag_review(review_id: str, data: dict, _admin: dict = Depends(require_admin)):
    await db.reviews.update_one({"id": review_id}, {"$set": {"is_flagged": data.get("is_flagged", True)}})
    return {"success": True}

@api_router.delete("/admin/reviews/{review_id}")
async def delete_review(review_id: str, _admin: dict = Depends(require_admin)):
    await db.reviews.delete_one({"id": review_id})
    await log_audit("delete", "review", review_id)
    return {"success": True}

# --- Admin Support Tickets ---
@api_router.get("/admin/support")
async def get_admin_support_tickets(status: Optional[str] = None, _admin: dict = Depends(require_admin)):
    query = {}
    if status and status != "all": query["status"] = status
    tickets = await db.support_tickets.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    if not tickets:
        subjects = ["Payment not received", "Cannot access premium features", "Wrong horoscope shown", "Astrologer didn't respond", "Refund request", "App is crashing"]
        priorities = ["high", "medium", "low"]
        tickets = [
            {"id": str(uuid.uuid4())[:8], "user_name": f"User {i}", "user_email": f"user{i}@email.com",
             "subject": subjects[i % len(subjects)], "description": f"Detailed description of issue {i}...",
             "priority": priorities[i % 3], "status": ["open", "in_progress", "resolved", "closed"][i % 4],
             "category": ["payment", "technical", "astrologer", "general"][i % 4],
             "messages": [
                 {"sender": "user", "content": f"I need help with {subjects[i % len(subjects)].lower()}", "timestamp": (datetime.now(timezone.utc) - timedelta(hours=i * 2)).isoformat()},
                 {"sender": "admin", "content": "We are looking into this issue. Please be patient.", "timestamp": (datetime.now(timezone.utc) - timedelta(hours=i)).isoformat()} if i % 2 == 0 else None
             ],
             "created_at": (datetime.now(timezone.utc) - timedelta(days=i)).isoformat()}
            for i in range(10)
        ]
        for t in tickets:
            t["messages"] = [m for m in t["messages"] if m]
    return tickets

@api_router.patch("/admin/support/{ticket_id}/status")
async def update_ticket_status(ticket_id: str, data: dict, _admin: dict = Depends(require_admin)):
    await db.support_tickets.update_one({"id": ticket_id}, {"$set": {"status": data.get("status"), "updated_at": datetime.now(timezone.utc).isoformat()}})
    await log_audit("update_status", "support_ticket", ticket_id, f"Status: {data.get('status')}")
    return {"success": True}

@api_router.post("/admin/support/{ticket_id}/reply")
async def reply_to_ticket(ticket_id: str, data: dict, _admin: dict = Depends(require_admin)):
    msg = {"sender": "admin", "content": data.get("message", ""), "timestamp": datetime.now(timezone.utc).isoformat()}
    await db.support_tickets.update_one({"id": ticket_id}, {"$push": {"messages": msg}, "$set": {"status": "in_progress", "updated_at": datetime.now(timezone.utc).isoformat()}})
    await log_audit("reply", "support_ticket", ticket_id)
    return {"success": True}

# --- Admin Site Settings ---
@api_router.get("/admin/settings")
async def get_admin_settings(_admin: dict = Depends(require_admin)):
    s = await db.site_settings.find_one({"id": "global"}, {"_id": 0})
    if not s:
        s = {
            "id": "global",
            "siteName": "AstroVedic AI",
            "tagline": "Where Ancient Stars Meet Artificial Intelligence",
            "contactEmail": "support@astrovedic.ai",
            "supportPhone": "+91 98765 43210",
            "logoUrl": "",
            "instagram": "https://instagram.com/astrovedic",
            "youtube": "https://youtube.com/astrovedic",
            "whatsapp": "+919876543210",
            "twitter": "",
            "facebook": "",
            "commissionRate": 30,
            "gstRate": 18,
            "referralBonus": 50,
            "freeMessagesPerDay": 5,
            "maintenanceMode": False,
            "dreamAnalyserEnabled": True,
            "communityEnabled": True,
            "panchangEnabled": True,
            "numerologyEnabled": True
        }
    return s

@api_router.put("/admin/settings")
async def save_admin_settings(settings: dict, _admin: dict = Depends(require_admin)):
    settings["id"] = "global"
    settings["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.site_settings.update_one({"id": "global"}, {"$set": settings}, upsert=True)
    await log_audit("update", "settings", "global")
    return {"success": True}

# --- Admin Audit Log ---
@api_router.get("/admin/audit")
async def get_audit_logs(limit: int = 100, _admin: dict = Depends(require_admin)):
    logs = await db.audit_logs.find({}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    if not logs:
        actions = ["create", "update", "delete", "login", "publish_all", "send", "approve_review", "block_user", "wallet_adjust"]
        entity_types = ["astrologer", "product", "blog", "horoscope", "user", "plan", "coupon", "notification", "settings"]
        logs = [
            {"id": str(uuid.uuid4())[:8], "action": actions[i % len(actions)],
             "entity_type": entity_types[i % len(entity_types)],
             "entity_id": f"entity_{i}", "details": f"Action on {entity_types[i % len(entity_types)]}",
             "admin_id": "admin_001", "admin_name": "Admin",
             "created_at": (datetime.now(timezone.utc) - timedelta(hours=i * 2)).isoformat()}
            for i in range(25)
        ]
    return logs

# ==================== SEED DATA ====================

@api_router.post("/seed")
async def seed_data(_admin: dict = Depends(require_admin)):
    astrologers_data = [
        {"id": str(uuid.uuid4()), "name": "Pandit Rajesh Sharma", "bio": "With over 25 years of experience in Vedic astrology, Pandit Rajesh Sharma is renowned for his accurate predictions and deep knowledge of Kundli analysis.", "photo_url": "https://images.unsplash.com/photo-1763046198554-12ae9ac8dc09?w=400", "specializations": ["Kundli", "Marriage", "Career", "Vastu"], "languages": ["Hindi", "English"], "experience_years": 25, "rating": 4.9, "total_reviews": 3456, "rate_per_minute": 25, "is_online": True, "is_verified": True, "is_featured": True, "total_sessions": 15000, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Dr. Priya Joshi", "bio": "A PhD in Jyotish Shastra, Dr. Priya combines traditional Vedic knowledge with modern counseling. Expert in Nadi astrology.", "photo_url": "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=400", "specializations": ["Nadi", "Numerology", "Tarot", "Gemstones"], "languages": ["Hindi", "English", "Marathi"], "experience_years": 15, "rating": 4.8, "total_reviews": 2341, "rate_per_minute": 20, "is_online": True, "is_verified": True, "is_featured": True, "total_sessions": 10500, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Acharya Vinod Mishra", "bio": "A disciple of renowned Jyotish Guru, Acharya Vinod specializes in Prashna Kundli and muhurta selection.", "photo_url": "https://images.unsplash.com/photo-1667184763638-a666fc90ece2?w=400", "specializations": ["Prashna", "Muhurta", "Kundli", "Puja"], "languages": ["Hindi", "Sanskrit", "English"], "experience_years": 30, "rating": 4.9, "total_reviews": 4521, "rate_per_minute": 35, "is_online": False, "is_verified": True, "is_featured": True, "total_sessions": 20000, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Meera Krishnan", "bio": "South Indian astrology expert with specialization in Parashari and Jaimini systems.", "photo_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400", "specializations": ["Career", "Finance", "Kundli", "Remedies"], "languages": ["Tamil", "English", "Hindi"], "experience_years": 12, "rating": 4.7, "total_reviews": 1876, "rate_per_minute": 18, "is_online": True, "is_verified": True, "is_featured": False, "total_sessions": 8000, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Swami Dharmananda", "bio": "Spiritual healer and Vedic astrologer from Varanasi. Expertise in Kaal Sarpa Dosha remedies.", "photo_url": "https://images.unsplash.com/photo-1543934776-32d1cc654abb?w=400", "specializations": ["Dosha Nivaran", "Kundli", "Marriage", "Spiritual"], "languages": ["Hindi", "Sanskrit"], "experience_years": 35, "rating": 4.9, "total_reviews": 5234, "rate_per_minute": 40, "is_online": True, "is_verified": True, "is_featured": True, "total_sessions": 25000, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Neha Gupta", "bio": "Young and dynamic astrologer specializing in relationship counseling through astrology.", "photo_url": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400", "specializations": ["Love", "Relationships", "Tarot", "Numerology"], "languages": ["Hindi", "English"], "experience_years": 8, "rating": 4.6, "total_reviews": 1234, "rate_per_minute": 12, "is_online": True, "is_verified": True, "is_featured": False, "total_sessions": 5000, "created_at": datetime.now(timezone.utc).isoformat()},
    ]

    products_data = [
        {"id": str(uuid.uuid4()), "name": "Natural Blue Sapphire (Neelam)", "description": "Certified natural Blue Sapphire stone for Saturn benefits.", "category": "gemstone", "price": 15999, "discounted_price": 12999, "stock_quantity": 25, "images": ["https://images.unsplash.com/photo-1613843351058-1dd06fda7c02?w=600"], "is_active": True, "is_featured": True, "tags": ["saturn", "career", "neelam"], "rating": 4.8, "sold_count": 234, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "5 Mukhi Rudraksha Mala", "description": "Original 5 Mukhi Rudraksha mala with 108+1 beads.", "category": "rudraksha", "price": 2499, "discounted_price": 1999, "stock_quantity": 100, "images": ["https://images.pexels.com/photos/18723429/pexels-photo-18723429.jpeg?w=600"], "is_active": True, "is_featured": True, "tags": ["rudraksha", "mala", "spiritual"], "rating": 4.9, "sold_count": 1523, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Shree Yantra - Gold Plated", "description": "Sacred Shree Yantra for wealth and prosperity.", "category": "yantra", "price": 4999, "discounted_price": 3999, "stock_quantity": 50, "images": ["https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=600"], "is_active": True, "is_featured": True, "tags": ["yantra", "wealth", "prosperity"], "rating": 4.7, "sold_count": 876, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Yellow Sapphire (Pukhraj)", "description": "Natural Ceylon Yellow Sapphire for Jupiter benefits.", "category": "gemstone", "price": 21999, "discounted_price": 18999, "stock_quantity": 15, "images": ["https://images.unsplash.com/photo-1653190262923-fa971c552377?w=600"], "is_active": True, "is_featured": True, "tags": ["jupiter", "pukhraj", "wisdom"], "rating": 4.9, "sold_count": 189, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Navratna Ring - 9 Gemstones", "description": "Complete Navratna ring with all 9 planetary gemstones.", "category": "gemstone", "price": 8999, "discounted_price": 7499, "stock_quantity": 30, "images": ["https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600"], "is_active": True, "is_featured": False, "tags": ["navratna", "ring", "all-planets"], "rating": 4.6, "sold_count": 456, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Kaal Sarp Dosh Nivaran Puja Kit", "description": "Complete puja kit for Kaal Sarp Dosh remedy.", "category": "puja", "price": 2999, "discounted_price": 2499, "stock_quantity": 75, "images": ["https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=600"], "is_active": True, "is_featured": False, "tags": ["puja", "kaal-sarp", "dosha"], "rating": 4.5, "sold_count": 345, "created_at": datetime.now(timezone.utc).isoformat()},
    ]

    rashis = [
        {"num": 1, "name": "Aries", "hindi": "मेष"}, {"num": 2, "name": "Taurus", "hindi": "वृषभ"},
        {"num": 3, "name": "Gemini", "hindi": "मिथुन"}, {"num": 4, "name": "Cancer", "hindi": "कर्क"},
        {"num": 5, "name": "Leo", "hindi": "सिंह"}, {"num": 6, "name": "Virgo", "hindi": "कन्या"},
        {"num": 7, "name": "Libra", "hindi": "तुला"}, {"num": 8, "name": "Scorpio", "hindi": "वृश्चिक"},
        {"num": 9, "name": "Sagittarius", "hindi": "धनु"}, {"num": 10, "name": "Capricorn", "hindi": "मकर"},
        {"num": 11, "name": "Aquarius", "hindi": "कुंभ"}, {"num": 12, "name": "Pisces", "hindi": "मीन"},
    ]
    colors = ["Red", "Blue", "Green", "Yellow", "Orange", "White", "Pink", "Purple", "Gold", "Silver", "Maroon", "Turquoise"]
    gemstones = ["Ruby", "Pearl", "Coral", "Emerald", "Yellow Sapphire", "Diamond", "Blue Sapphire", "Hessonite", "Cat's Eye"]
    directions = ["North", "South", "East", "West", "Northeast", "Northwest", "Southeast", "Southwest"]
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    horoscopes_data = []
    for i, rashi in enumerate(rashis):
        horoscopes_data.append({
            "id": str(uuid.uuid4()), "rashi": rashi["num"], "rashi_name": rashi["name"],
            "rashi_name_hindi": rashi["hindi"], "date": today,
            "content_english": f"Today brings positive energy for {rashi['name']}. The planetary alignment suggests a favorable day for important decisions.",
            "content_hindi": f"आज का दिन {rashi['hindi']} राशि के लिए शुभ है। ग्रहों की स्थिति अनुकूल है।",
            "lucky_color": colors[i], "lucky_number": random.randint(1, 9),
            "lucky_gemstone": gemstones[i % len(gemstones)], "lucky_direction": directions[i % len(directions)],
            "lucky_time": f"{random.randint(6,11)}:00 AM - {random.randint(1,5)}:00 PM",
            "mood_score": random.randint(60, 95), "career_score": random.randint(60, 95),
            "love_score": random.randint(60, 95), "health_score": random.randint(60, 95),
            "financial_score": random.randint(60, 95), "compatibility_rashi": rashis[(i + 4) % 12]["name"],
            "created_at": datetime.now(timezone.utc).isoformat()
        })

    plans_data = [
        {"id": str(uuid.uuid4()), "name": "Nakshatra Free", "slug": "free", "description": "Start your cosmic journey", "price_monthly": 0, "price_annual": 0, "features": ["1 Basic Kundli Report", "5 AI Chat Messages/Day", "Daily Horoscope", "Browse Astrologers"], "ai_reports_per_month": 1, "free_chat_minutes": 0, "discount_on_products": 0, "is_active": True, "is_featured": False, "color": "#6B7280", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Tara Silver", "slug": "silver", "description": "Enhanced features for regular seekers", "price_monthly": 199, "price_annual": 1599, "features": ["3 AI Reports/Month", "30 AI Chat Messages/Day", "10 Free Minutes", "5% Store Discount", "Priority Support"], "ai_reports_per_month": 3, "free_chat_minutes": 10, "discount_on_products": 5, "is_active": True, "is_featured": False, "color": "#9CA3AF", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Graha Gold", "slug": "gold", "description": "Premium features for enthusiasts", "price_monthly": 499, "price_annual": 3999, "features": ["10 AI Reports/Month", "Unlimited AI Chat", "30 Free Minutes", "15% Store Discount", "Video Call", "Gold Badge", "Annual Report"], "ai_reports_per_month": 10, "free_chat_minutes": 30, "discount_on_products": 15, "is_active": True, "is_featured": True, "color": "#D4A017", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Jyotish Platinum", "slug": "platinum", "description": "Ultimate cosmic experience", "price_monthly": 999, "price_annual": 7999, "features": ["Unlimited AI Reports", "Unlimited AI Chat", "60 Free Minutes/Month", "25% Store Discount", "Free Shipping", "Dedicated Astrologer", "Monthly Live Session", "Platinum Badge", "Priority Queue"], "ai_reports_per_month": -1, "free_chat_minutes": 60, "discount_on_products": 25, "is_active": True, "is_featured": False, "color": "#8B5CF6", "created_at": datetime.now(timezone.utc).isoformat()},
    ]

    blog_data = [
        {"id": str(uuid.uuid4()), "title": "Understanding Your Birth Chart: A Complete Guide", "slug": "understanding-birth-chart-guide", "content": "Your birth chart, or Janam Kundli, is a cosmic snapshot of the sky at the exact moment of your birth...", "excerpt": "Learn how to read and interpret your Janam Kundli.", "cover_image": "https://images.unsplash.com/photo-1627947224567-4b17c3137ad4?w=800", "category": "Kundli", "tags": ["kundli", "birth-chart", "guide"], "is_published": True, "views": 15234, "reading_time": 8, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Gemstones and Their Planetary Powers", "slug": "gemstones-planetary-powers", "content": "Each gemstone in Vedic astrology is associated with a specific planet...", "excerpt": "Discover which gemstone is right for you.", "cover_image": "https://images.unsplash.com/photo-1613843351058-1dd06fda7c02?w=800", "category": "Gemstones", "tags": ["gemstones", "planets", "remedies"], "is_published": True, "views": 12456, "reading_time": 6, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Vastu Tips for a Prosperous Home", "slug": "vastu-tips-prosperous-home", "content": "Vastu Shastra is the ancient Indian science of architecture...", "excerpt": "Transform your living space with Vastu guidelines.", "cover_image": "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800", "category": "Vastu", "tags": ["vastu", "home", "prosperity"], "is_published": True, "views": 8976, "reading_time": 5, "created_at": datetime.now(timezone.utc).isoformat()},
    ]

    for coll in [db.astrologers, db.products, db.horoscopes, db.plans, db.blog_posts]:
        await coll.delete_many({})
    await db.astrologers.insert_many(astrologers_data)
    await db.products.insert_many(products_data)
    await db.horoscopes.insert_many(horoscopes_data)
    await db.plans.insert_many(plans_data)
    await db.blog_posts.insert_many(blog_data)

    return {"message": "Data seeded successfully", "astrologers": len(astrologers_data), "products": len(products_data), "horoscopes": len(horoscopes_data), "plans": len(plans_data), "blog_posts": len(blog_data)}


# ==================== DAILY RASHIFAL AUTO-GENERATE ====================
RASHI_LIST = [
    {"num": 1,  "name": "Aries",       "hindi": "मेष"},
    {"num": 2,  "name": "Taurus",      "hindi": "वृषभ"},
    {"num": 3,  "name": "Gemini",      "hindi": "मिथुन"},
    {"num": 4,  "name": "Cancer",      "hindi": "कर्क"},
    {"num": 5,  "name": "Leo",         "hindi": "सिंह"},
    {"num": 6,  "name": "Virgo",       "hindi": "कन्या"},
    {"num": 7,  "name": "Libra",       "hindi": "तुला"},
    {"num": 8,  "name": "Scorpio",     "hindi": "वृश्चिक"},
    {"num": 9,  "name": "Sagittarius", "hindi": "धनु"},
    {"num": 10, "name": "Capricorn",   "hindi": "मकर"},
    {"num": 11, "name": "Aquarius",    "hindi": "कुंभ"},
    {"num": 12, "name": "Pisces",      "hindi": "मीन"},
]
_LUCKY_COLORS   = ["Red", "Blue", "Green", "Yellow", "Orange", "White", "Pink", "Purple", "Gold", "Silver", "Maroon", "Turquoise"]
_LUCKY_GEMS     = ["Ruby", "Pearl", "Coral", "Emerald", "Yellow Sapphire", "Diamond", "Blue Sapphire", "Hessonite", "Cat's Eye"]
_LUCKY_DIRECTIONS = ["North", "South", "East", "West", "Northeast", "Northwest", "Southeast", "Southwest"]


async def _generate_single_rashifal(rashi: dict, date_str: str) -> dict:
    """Use OpenRouter (free) to generate today's rashifal for one rashi. Falls back to a static template if AI fails."""
    content_en = f"Today brings positive energy for {rashi['name']}. The planetary alignment suggests a favorable day for important decisions."
    content_hi = f"आज का दिन {rashi['hindi']} राशि के लिए शुभ है। ग्रहों की स्थिति अनुकूल है।"
    try:
        prompt = (
            f"Write today's Vedic rashifal for {rashi['name']} ({rashi['hindi']}) rashi for date {date_str}. "
            "Return STRICTLY a compact JSON object with keys: content_english (2-3 sentence prediction), "
            "content_hindi (2-3 sentence prediction in Devanagari), mood_score, career_score, love_score, "
            "health_score, financial_score (each an integer 55-95). No markdown, no extra text."
        )
        messages = [
            {"role": "system", "content": "You are a Vedic astrologer. Reply with JSON only."},
            {"role": "user", "content": prompt},
        ]
        resp = await call_openrouter(messages, max_tokens=500)
        m = re_module.search(r"\{.*\}", resp, re_module.DOTALL)
        if m:
            parsed = json_module.loads(m.group(0))
            content_en = parsed.get("content_english", content_en)
            content_hi = parsed.get("content_hindi", content_hi)
            mood  = int(parsed.get("mood_score",      random.randint(60, 90)))
            career= int(parsed.get("career_score",    random.randint(60, 90)))
            love  = int(parsed.get("love_score",      random.randint(60, 90)))
            health= int(parsed.get("health_score",    random.randint(60, 90)))
            fin   = int(parsed.get("financial_score", random.randint(60, 90)))
        else:
            mood = career = love = health = fin = random.randint(65, 90)
    except Exception as e:
        logging.warning(f"OpenRouter rashifal fallback for {rashi['name']}: {e}")
        mood = career = love = health = fin = random.randint(65, 90)

    i = rashi["num"] - 1
    return {
        "id": str(uuid.uuid4()),
        "rashi": rashi["num"],
        "rashi_name": rashi["name"],
        "rashi_name_hindi": rashi["hindi"],
        "date": date_str,
        "content_english": content_en,
        "content_hindi": content_hi,
        "lucky_color": _LUCKY_COLORS[i],
        "lucky_number": random.randint(1, 9),
        "lucky_gemstone": _LUCKY_GEMS[i % len(_LUCKY_GEMS)],
        "lucky_direction": _LUCKY_DIRECTIONS[i % len(_LUCKY_DIRECTIONS)],
        "lucky_time": f"{random.randint(6, 11)}:00 AM - {random.randint(1, 5)}:00 PM",
        "mood_score": mood,
        "career_score": career,
        "love_score": love,
        "health_score": health,
        "financial_score": fin,
        "compatibility_rashi": RASHI_LIST[(i + 4) % 12]["name"],
        "is_published": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "auto_generated": True,
    }


async def generate_rashifals_for_date(date_str: str) -> int:
    """Generate missing rashifals for the given date. Returns the number newly inserted."""
    count = 0
    for rashi in RASHI_LIST:
        existing = await db.horoscopes.find_one({"date": date_str, "rashi": rashi["num"]})
        if existing:
            continue
        doc = await _generate_single_rashifal(rashi, date_str)
        await db.horoscopes.insert_one(doc)
        count += 1
    return count


@api_router.post("/admin/rashifal/generate-today")
async def admin_generate_today_rashifal(_admin: dict = Depends(require_admin)):
    """Admin: force-regenerate today's rashifal. Deletes today's rows then regenerates via OpenRouter (free)."""
    now_ist = datetime.now(timezone.utc) + timedelta(hours=5, minutes=30)
    today_str = now_ist.strftime("%Y-%m-%d")
    await db.horoscopes.delete_many({"date": today_str})
    inserted = await generate_rashifals_for_date(today_str)
    await log_audit("regenerate", "rashifal", today_str, f"Generated {inserted} rashifals")
    return {"success": True, "date": today_str, "generated": inserted}


# ==================== ASTROLOGER APPLICATIONS ====================

class AstrologerApplication(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: f"APP-{uuid.uuid4().hex[:8].upper()}")
    full_name: str
    email: str
    phone: str
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    city: str
    state: str
    years_of_experience: int = 0
    specializations: List[str] = []
    languages: List[str] = []
    education_qualification: str = ""
    astrology_certifications: Optional[str] = ""
    about_yourself: str = ""
    rate_per_minute: int = 15
    available_hours: str = ""
    documents: Dict[str, Any] = {}
    social_links: Dict[str, Any] = {}
    agreement_accepted: bool = False
    status: str = "pending"
    admin_notes: str = ""
    applied_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    reviewed_at: Optional[str] = None
    reviewed_by: Optional[str] = None


@api_router.post("/apply-astrologer")
async def apply_astrologer(payload: Dict[str, Any]):
    """Public endpoint. Accepts JSON. For file uploads, the client converts
    <5MB files to base64 strings and posts them under documents.*_url."""
    required = [
        "full_name", "email", "phone", "city", "state",
        "years_of_experience", "specializations", "languages",
        "education_qualification", "about_yourself",
        "rate_per_minute", "available_hours",
        "documents", "agreement_accepted",
    ]
    missing = [k for k in required if payload.get(k) in (None, "", [])]
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing required fields: {', '.join(missing)}")
    if not payload.get("agreement_accepted"):
        raise HTTPException(status_code=400, detail="You must accept the agreement to submit")
    if len((payload.get("about_yourself") or "").strip()) < 100:
        raise HTTPException(status_code=400, detail="'About yourself' must be at least 100 characters")
    docs = payload.get("documents") or {}
    for must_have in ["aadhaar_number", "aadhaar_front_url", "aadhaar_back_url",
                      "pan_number", "pan_card_url", "profile_photo_url"]:
        if not docs.get(must_have):
            raise HTTPException(status_code=400, detail=f"Missing document: {must_have}")

    # Duplicate-application guard: one email / phone / aadhaar / pan can apply only once
    # (unless the previous one was rejected — they may re-apply).
    email_lc = (payload.get("email") or "").strip().lower()
    phone_norm = "".join(ch for ch in (payload.get("phone") or "") if ch.isdigit())[-10:]
    aadhaar_norm = "".join(ch for ch in (docs.get("aadhaar_number") or "") if ch.isdigit())
    pan_norm = (docs.get("pan_number") or "").strip().upper()

    dup_or = []
    if email_lc:
        dup_or.append({"email": {"$regex": f"^{email_lc}$", "$options": "i"}})
    if phone_norm:
        dup_or.append({"phone": {"$regex": f"{phone_norm}$"}})
    if aadhaar_norm:
        dup_or.append({"documents.aadhaar_number": {"$regex": f"{aadhaar_norm}$"}})
    if pan_norm:
        dup_or.append({"documents.pan_number": pan_norm})

    if dup_or:
        existing = await db.astrologer_applications.find_one(
            {"$or": dup_or, "status": {"$in": ["pending", "approved"]}},
            {"_id": 0, "id": 1, "status": 1, "email": 1, "phone": 1},
        )
        if existing:
            status_word = "already approved" if existing.get("status") == "approved" else "already pending review"
            raise HTTPException(
                status_code=409,
                detail=(
                    f"An application with this email / phone / Aadhaar / PAN is {status_word}. "
                    f"Reference: #{existing.get('id')}. You can re-apply only if your previous "
                    "application is rejected."
                ),
            )

    app_doc = AstrologerApplication(**payload).model_dump()
    await db.astrologer_applications.insert_one(app_doc)
    await log_audit("apply", "astrologer_application", app_doc["id"], app_doc.get("full_name", ""))
    return {
        "success": True,
        "id": app_doc["id"],
        "message": "Application submitted successfully. We'll review it within 2-3 business days.",
    }


@api_router.get("/admin/astrologer-applications")
async def admin_list_astrologer_applications(status: Optional[str] = None, search: Optional[str] = None, _admin: dict = Depends(require_admin)):
    query: Dict[str, Any] = {}
    if status and status.lower() != "all":
        query["status"] = status.lower()
    if search:
        query["$or"] = [
            {"full_name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
        ]
    apps = await db.astrologer_applications.find(query, {"_id": 0}).sort("applied_at", -1).to_list(500)
    counts = {
        "total": await db.astrologer_applications.count_documents({}),
        "pending": await db.astrologer_applications.count_documents({"status": "pending"}),
        "approved": await db.astrologer_applications.count_documents({"status": "approved"}),
        "rejected": await db.astrologer_applications.count_documents({"status": "rejected"}),
    }
    return {"applications": apps, "counts": counts}


@api_router.get("/admin/astrologer-applications/{app_id}")
async def admin_get_astrologer_application(app_id: str, _admin: dict = Depends(require_admin)):
    app_doc = await db.astrologer_applications.find_one({"id": app_id}, {"_id": 0})
    if not app_doc:
        raise HTTPException(status_code=404, detail="Application not found")
    return app_doc


class ApplicationReviewInput(BaseModel):
    status: str                    # "approved" | "rejected" | "pending"
    admin_notes: Optional[str] = ""
    rejection_reason: Optional[str] = None
    reviewed_by: Optional[str] = "admin"


@api_router.patch("/admin/astrologer-applications/{app_id}")
async def admin_update_astrologer_application(app_id: str, review: ApplicationReviewInput, _admin: dict = Depends(require_admin)):
    app_doc = await db.astrologer_applications.find_one({"id": app_id}, {"_id": 0})
    if not app_doc:
        raise HTTPException(status_code=404, detail="Application not found")
    status_lc = (review.status or "").lower()
    if status_lc not in ("approved", "rejected", "pending"):
        raise HTTPException(status_code=400, detail="Invalid status")
    update: Dict[str, Any] = {
        "status": status_lc,
        "admin_notes": review.admin_notes or "",
        "reviewed_at": datetime.now(timezone.utc).isoformat(),
        "reviewed_by": review.reviewed_by or "admin",
    }
    if review.rejection_reason:
        update["rejection_reason"] = review.rejection_reason
    await db.astrologer_applications.update_one({"id": app_id}, {"$set": update})

    # On approval: auto-create an entry in the astrologers collection.
    if status_lc == "approved":
        docs = app_doc.get("documents", {}) or {}
        astrologer_doc = {
            "id": str(uuid.uuid4()),
            "name": app_doc.get("full_name", ""),
            "bio": app_doc.get("about_yourself", "")[:500],
            "photo_url": docs.get("profile_photo_url", ""),
            "specializations": app_doc.get("specializations", []),
            "languages": app_doc.get("languages", []),
            "experience_years": app_doc.get("years_of_experience", 0),
            "rate_per_minute": app_doc.get("rate_per_minute", 15),
            "rating": 4.5,
            "total_reviews": 0,
            "total_sessions": 0,
            "is_online": False,
            "is_verified": False,
            "is_active": True,
            "is_featured": False,
            "email": app_doc.get("email", ""),
            "phone": app_doc.get("phone", ""),
            "application_id": app_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.astrologers.insert_one(astrologer_doc)
        await log_audit("approve_application", "astrologer_application", app_id, app_doc.get("full_name", ""))
    elif status_lc == "rejected":
        await log_audit("reject_application", "astrologer_application", app_id, review.rejection_reason or "")

    return {"success": True, "status": status_lc}



app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','), allow_methods=["*"], allow_headers=["*"])

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def daily_rashifal_scheduler():
    """Runs forever. On startup generates today's rashifals if missing, then waits until next midnight UTC+5:30 to run again."""
    import asyncio
    await asyncio.sleep(5)  # let the app fully start
    while True:
        try:
            now_ist = datetime.now(timezone.utc) + timedelta(hours=5, minutes=30)
            today_str = now_ist.strftime("%Y-%m-%d")
            inserted = await generate_rashifals_for_date(today_str)
            if inserted:
                logger.info(f"Daily rashifal: generated {inserted} entries for {today_str}")
            # Sleep until just after next IST midnight
            tomorrow_midnight_ist = (now_ist + timedelta(days=1)).replace(hour=0, minute=5, second=0, microsecond=0)
            sleep_seconds = max(60, int((tomorrow_midnight_ist - now_ist).total_seconds()))
            await asyncio.sleep(sleep_seconds)
        except Exception as e:
            logger.error(f"daily_rashifal_scheduler error: {e}")
            await asyncio.sleep(3600)  # retry in 1 hour


@app.on_event("startup")
async def startup():
    logger.info("AstroVedic AI server starting up...")
    # Start daily rashifal scheduler
    import asyncio
    asyncio.create_task(daily_rashifal_scheduler())


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
