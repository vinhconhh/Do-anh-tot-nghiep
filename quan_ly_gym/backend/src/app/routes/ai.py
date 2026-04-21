from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional
import os
from ..database import get_db
from ..models.user import User
from ..models.profile import MemberProfile
from ..models.ai import AIRequest, AIResponse
from ..models.finance import Transaction, Invoice
from ..middleware.auth import get_current_user

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

# ─── Lazy loading cho 2 models ───
_gemma3 = None
_gemma4 = None

def get_gemma3():
    global _gemma3
    if _gemma3 is None:
        from llama_cpp import Llama
        model_path = os.environ.get("GEMMA3_PATH", "/app/AI_local/gemma-3-4b-it-Q4_K_M.gguf")
        _gemma3 = Llama(model_path=model_path, n_ctx=2048, n_threads=4, verbose=False)
    return _gemma3

def get_gemma4():
    global _gemma4
    if _gemma4 is None:
        from llama_cpp import Llama
        model_path = os.environ.get("GEMMA4_PATH", "/app/AI_local/gemma-4-E4B-it-Q4_K_M.gguf")
        _gemma4 = Llama(model_path=model_path, n_ctx=2048, n_threads=4, verbose=False)
    return _gemma4

# ─── System prompt cho classifier (Gemma 3) ───
CLASSIFIER_SYSTEM = """Bạn là bộ lọc. Trả lời YES nếu câu hỏi liên quan đến bất kỳ hoạt động thể thao, tập luyện, võ thuật, gym, fitness, dinh dưỡng thể thao.
Trả lời NO nếu không liên quan (ví dụ: chính trị, tình yêu, ẩm thực không liên quan thể thao).
Chỉ trả lời YES hoặc NO, không thêm từ nào khác."""

# ─── System prompt cho responder (Gemma 4) ───
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

def classify_prompt(prompt: str) -> bool:
    llm = get_gemma3()
    # Sử dụng template đơn giản, không cần system prompt phức tạp
    full_prompt = f"""{CLASSIFIER_SYSTEM}

Câu hỏi: {prompt}
Trả lời:"""
    try:
        output = llm(full_prompt, max_tokens=2, temperature=0, stop=["\n"], echo=False)
        answer = output["choices"][0]["text"].strip().upper()
        print(f"[Classifier] Input: {prompt} -> Output: {answer}")  # Log ra console
        return "YES" in answer
    except Exception as e:
        print(f"Classifier error: {e}")
        return True  # fallback an toàn

def generate_response(prompt: str) -> str:
    llm = get_gemma4()
    # Đưa system prompt vào trong user message để đảm bảo model tuân thủ
    full_prompt = f"""<start_of_turn>user
{RESPONDER_SYSTEM}

Hãy trả lời câu hỏi sau: {prompt}<end_of_turn>
<start_of_turn>model
"""
    try:
        output = llm(full_prompt, max_tokens=2048, temperature=0.7, stop=["<end_of_turn>"], echo=False)
        response = output["choices"][0]["text"].strip()
        print(f"[Responder] Response: {response[:100]}...")  # Log
        return response
    except Exception as e:
        return f"[Lỗi AI] {str(e)}"

# ─── API Endpoints (giữ nguyên các endpoint khác) ───
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
    # 1. Phân loại bằng Gemma 3 (không tốn quota)
    if not classify_prompt(body.prompt):
        raise HTTPException(status_code=400, detail="Câu hỏi không liên quan đến thể thao hoặc tập luyện. Tôi chỉ tư vấn về gym, thể thao, dinh dưỡng thể thao.")
    
    # 2. Kiểm tra quota
    profile = db.query(MemberProfile).filter(MemberProfile.UserID == current_user.UserID).first()
    ai_used = db.query(func.count(AIRequest.RequestID)).filter(AIRequest.UserID == current_user.UserID).scalar() or 0
    quota = profile.AIQuota if profile else 0
    if ai_used >= quota:
        raise HTTPException(status_code=400, detail="Bạn đã hết lượt AI. Vui lòng mua thêm.")
    
    # 3. Lưu request (tính 1 lượt)
    ai_req = AIRequest(UserID=current_user.UserID, Prompt=body.prompt, Model="gemma-4")
    db.add(ai_req)
    db.flush()
    
    # 4. Sinh response bằng Gemma 4
    response_text = generate_response(body.prompt)
    
    # 5. Lưu response
    ai_resp = AIResponse(
        RequestID=ai_req.RequestID,
        ResponseData=response_text,
        TokensUsed=len(response_text.split()),
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