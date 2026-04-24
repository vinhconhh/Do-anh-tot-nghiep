from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional
from openai import OpenAI
from ..database import get_db
from ..models.user import User
from ..models.profile import MemberProfile
from ..models.ai import AIRequest, AIResponse
from ..models.finance import Transaction, Invoice
from ..middleware.auth import get_current_user
from ..config import settings

router = APIRouter(prefix="/api/ai", tags=["AI"])

# ─── Package definitions ───
AI_PACKAGES = [
    {"id": 1, "label": "Gói nhỏ", "qty": 20, "price": 240000},
    {"id": 2, "label": "Gói phổ biến", "qty": 50, "price": 600000},
]

class BuyPackageBody(BaseModel):
    packageId: int

class AiChatBody(BaseModel):
    prompt: str
    model: Optional[str] = "gemma-4"

# ─── OpenRouter client (lazy init) ───
_client: OpenAI | None = None

def get_openrouter_client() -> OpenAI:
    global _client
    if _client is None:
        api_key = settings.OPENROUTER_API_KEY
        if not api_key or api_key == "your_openrouter_api_key_here":
            raise HTTPException(status_code=503, detail="OpenRouter API key chưa được cấu hình.")
        _client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=api_key,
        )
    return _client

# ─── System prompt cho classifier ───
CLASSIFIER_SYSTEM = """Bạn là bộ lọc. Trả lời YES nếu câu hỏi liên quan đến bất kỳ hoạt động thể thao, tập luyện, võ thuật, gym, fitness, dinh dưỡng thể thao.
Trả lời NO nếu không liên quan (ví dụ: chính trị, tình yêu, ẩm thực không liên quan thể thao).
Chỉ trả lời YES hoặc NO, không thêm từ nào khác."""

# ─── System prompt cho responder ───
RESPONDER_SYSTEM = """Bạn là chuyên gia tư vấn thể thao và tập luyện. Bạn được phép trả lời tất cả các chủ đề sau:
- Tập gym (tạ, bodyweight, bài tập)
- Các môn thể thao: bơi, chạy, bóng đá, tennis, cầu lông, võ thuật (boxing, kick boxing, karate, taekwondo, judo,...)
- Tập luyện tại nhà, yoga, pilates, cardio, HIIT
- Dinh dưỡng cho người tập (protein, macro, chế độ ăn)
- Phục hồi, kéo giãn, chấn thương thể thao
- Lịch tập, kỹ thuật, mục tiêu (giảm mỡ, tăng cơ)

Hãy trả lời câu hỏi một cách trực tiếp, đầy đủ, không cần hỏi lại thông tin cá nhân trừ khi thực sự cần thiết.
Ưu tiên đưa ra hướng dẫn cụ thể, ví dụ, và lời khuyên thực tế.
Nếu câu hỏi chung chung, hãy cung cấp một lộ trình tổng quan và khuyến khích người dùng hỏi chi tiết hơn.
Trả lời bằng tiếng Việt, dễ hiểu, đầy đủ dấu, không trả lời bằng tiếng việt không dấu, không rút gọn câu trả lời."""

# Danh sách các model dự phòng khi bị rate limit
MODELS = [
    "openai/gpt-oss-20b:free",
    "qwen/qwen3-next-80b-a3b-instruct:free",
    "openai/gpt-oss-120b:free"
]

import time

def call_openrouter_with_retry(messages: list, max_tokens: int, temperature: float = 0.7):
    client = get_openrouter_client()
    last_error = None
    
    # Thử 2 vòng (tổng cộng 6 lần gọi API)
    for attempt in range(2):
        for model in MODELS:
            try:
                response = client.chat.completions.create(
                    model=model,
                    messages=messages,
                    max_tokens=max_tokens,
                    temperature=temperature,
                )
                return response, model
            except Exception as e:
                last_error = str(e)
                print(f"[Warning] Model {model} failed: {last_error[:100]}...")
                # Nếu là lỗi 429 Rate Limit thì thử model tiếp theo ngay
                if "429" in last_error or "rate-limited" in last_error.lower():
                    continue
                # Lỗi khác thì có thể do model bị lỗi, cũng thử next
                continue
        
        # Nếu vòng 1 thất bại tất cả các model, đợi 2s rồi thử lại
        print(f"[Retry] Attempt {attempt+1} failed for all models. Waiting 2s...")
        time.sleep(2)
        
    raise HTTPException(status_code=503, detail="Hệ thống AI đang quá tải. Vui lòng thử lại sau ít phút.")

def classify_prompt(prompt: str) -> bool:
    """Phân loại câu hỏi có liên quan thể thao/gym không."""
    try:
        response, used_model = call_openrouter_with_retry(
            messages=[
                {"role": "system", "content": CLASSIFIER_SYSTEM},
                {"role": "user", "content": prompt},
            ],
            max_tokens=5,
            temperature=0
        )
        answer = response.choices[0].message.content.strip().upper()
        print(f"[Classifier] Model: {used_model} | Input: {prompt} -> Output: {answer}")
        return "YES" in answer
    except HTTPException:
        raise
    except Exception as e:
        print(f"Classifier error: {e}")
        return True  # fallback an toàn

def generate_response(prompt: str) -> str:
    """Sinh câu trả lời qua OpenRouter."""
    try:
        response, used_model = call_openrouter_with_retry(
            messages=[
                {"role": "system", "content": RESPONDER_SYSTEM},
                {"role": "user", "content": prompt},
            ],
            max_tokens=2048,
            temperature=0.7
        )
        result = response.choices[0].message.content.strip()
        tokens_used = response.usage.total_tokens if response.usage else len(result.split())
        print(f"[Responder] Model: {used_model} | Response: {result[:100]}...")
        return result, tokens_used
    except HTTPException:
        raise
    except Exception as e:
        return f"[Lỗi AI] {str(e)}", 0

# ─── API Endpoints ───
@router.get("/quota")
def get_quota(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    profile = db.query(MemberProfile).filter(MemberProfile.UserID == current_user.UserID).first()
    ai_used = db.query(func.count(AIRequest.RequestID)).filter(AIRequest.UserID == current_user.UserID).scalar() or 0
    quota = profile.AIQuota if profile else 0
    return {"quota": quota, "used": ai_used, "remaining": max(0, quota - ai_used)}

@router.get("/packages")
def get_packages(current_user: User = Depends(get_current_user)):
    return AI_PACKAGES

@router.post("/buy")
def buy_package(body: BuyPackageBody, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    pkg = next((p for p in AI_PACKAGES if p["id"] == body.packageId), None)
    if not pkg:
        raise HTTPException(status_code=404, detail="Gói không tồn tại")
    profile = db.query(MemberProfile).filter(MemberProfile.UserID == current_user.UserID).first()
    if not profile:
        profile = MemberProfile(UserID=current_user.UserID, AIQuota=0)
        db.add(profile)
        db.flush()
    profile.AIQuota = (profile.AIQuota or 0) + pkg["qty"]
    invoice = Invoice(UserID=current_user.UserID, TotalAmount=pkg["price"], Status="Paid")
    db.add(invoice)
    db.flush()
    transaction = Transaction(UserID=current_user.UserID, InvoiceID=invoice.InvoiceID, Amount=pkg["price"], Status="Paid")
    db.add(transaction)
    db.commit()
    return {"message": f"Mua thành công {pkg['label']} — +{pkg['qty']} lượt AI!", "newQuota": profile.AIQuota, "transactionId": transaction.TransactionID}

@router.get("/purchase-history")
def purchase_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    transactions = db.query(Transaction).filter(Transaction.UserID == current_user.UserID).order_by(Transaction.CreatedAt.desc()).limit(20).all()
    result = []
    for t in transactions:
        pkg = next((p for p in AI_PACKAGES if p["price"] == float(t.Amount)), None)
        result.append({
            "date": t.CreatedAt.strftime("%d/%m/%Y %H:%M") if t.CreatedAt else "",
            "qty": pkg["qty"] if pkg else "—",
            "price": f"{int(t.Amount):,}đ".replace(",", ".") if t.Amount else "—",
            "status": (t.Status or "pending").lower(),
        })
    return result

@router.post("/chat")
def chat_with_ai(
    body: AiChatBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1. Phân loại bằng Gemma 4 (không tốn quota)
    if not classify_prompt(body.prompt):
        raise HTTPException(status_code=400, detail="Câu hỏi không liên quan đến thể thao hoặc tập luyện. Tôi chỉ tư vấn về gym, thể thao, dinh dưỡng thể thao.")
    
    # 2. Kiểm tra quota
    profile = db.query(MemberProfile).filter(MemberProfile.UserID == current_user.UserID).first()
    ai_used = db.query(func.count(AIRequest.RequestID)).filter(AIRequest.UserID == current_user.UserID).scalar() or 0
    quota = profile.AIQuota if profile else 0
    if ai_used >= quota:
        raise HTTPException(status_code=400, detail="Bạn đã hết lượt AI. Vui lòng mua thêm.")
    
    # 3. Lưu request (tính 1 lượt)
    ai_req = AIRequest(UserID=current_user.UserID, Prompt=body.prompt, Model="gemma-4-openrouter")
    db.add(ai_req)
    db.flush()
    
    # 4. Sinh response bằng Gemma 4 qua OpenRouter
    response_text, tokens_used = generate_response(body.prompt)
    
    # 5. Lưu response
    ai_resp = AIResponse(
        RequestID=ai_req.RequestID,
        ResponseData=response_text,
        TokensUsed=tokens_used,
        Cost=0,
        Status="Success"
    )
    db.add(ai_resp)
    db.commit()
    
    return {
        "response": response_text,
        "tokensUsed": ai_resp.TokensUsed,
        "remainingQuota": quota - ai_used - 1,
    }

@router.get("/chat-history")
def chat_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    reqs = db.query(AIRequest).filter(AIRequest.UserID == current_user.UserID).order_by(AIRequest.CreatedAt.desc()).limit(30).all()
    messages = []
    for r in reversed(reqs):
        messages.append({"role": "user", "content": r.Prompt, "time": r.CreatedAt.strftime("%H:%M") if r.CreatedAt else ""})
        resp = db.query(AIResponse).filter(AIResponse.RequestID == r.RequestID).first()
        if resp:
            messages.append({"role": "assistant", "content": resp.ResponseData, "time": resp.CreatedAt.strftime("%H:%M") if resp.CreatedAt else ""})
    return messages