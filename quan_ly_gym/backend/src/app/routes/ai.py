from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from openai import OpenAI
from ..database import get_db
from ..models.user import User
from ..models.ai import AIRequest, AIResponse
from ..middleware.auth import get_current_user
from ..config import settings

router = APIRouter(prefix="/api/ai", tags=["AI"])

class AiChatBody(BaseModel):
    prompt: str
    model: Optional[str] = "openai/gpt-oss-120b:free"
    hidden: Optional[bool] = False

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

CLASSIFIER_SYSTEM = """Bạn là một AI phân loại dữ liệu nghiêm ngặt. Nhiệm vụ của bạn là kiểm tra xem câu hỏi của người dùng có liên quan đến các chủ đề: thể thao, tập luyện, võ thuật, gym, fitness, hoặc dinh dưỡng thể thao hay không.

- Trả lời "YES" nếu câu hỏi liên quan đến bất kỳ chủ đề nào nêu trên.
- Trả lời "NO" nếu câu hỏi KHÔNG liên quan (ví dụ: chính trị, tình yêu, ẩm thực thông thường, công nghệ...).

QUY TẮC BẮT BUỘC:
- Chỉ trả lời duy nhất một từ là "YES" hoặc "NO" (viết hoa).
- Không kèm theo dấu chấm, không giải thích, không thêm bất kỳ ký tự hay từ ngữ nào khác."""

RESPONDER_SYSTEM = """Bạn là chuyên gia tư vấn hàng đầu về thể thao, thể hình và dinh dưỡng thể thao. Nhiệm vụ của bạn là cung cấp câu trả lời chuyên sâu, chính xác và có giá trị thực tiễn cao cho người dùng.

CHỦ ĐỀ ĐƯỢC PHÉP TRẢ LỜI:
- Gym, Fitness, Võ thuật, các môn thể thao (bơi, chạy, bóng đá, bóng rổ...).
- Dinh dưỡng thể thao, chế độ ăn, tính toán Macros, Calories, thực phẩm bổ sung (Supplements).
- Lịch tập luyện, kỹ thuật bài tập, phục hồi và phòng tránh chấn thương.
- Phân tích chỉ số cơ thể (BMI, BMR, TDEE, Body Fat).

QUY TẮC ĐỊNH DẠNG (BẮT BUỘC):
1. TRẢ LỜI BẰNG TIẾNG VIỆT CÓ DẤU HOÀN CHỈNH: Không viết tắt, không thiếu dấu.
2. TUYỆT ĐỐI KHÔNG SỬ DỤNG ĐỊNH DẠNG MARKDOWN: Không dùng các ký tự như **, *, #, ##, __, hoặc bảng markdown. 
3. CÁCH TRÌNH BÀY PLAIN TEXT (VĂN BẢN THUẦN TÚY): 
   - Để làm nổi bật tiêu đề, hãy viết HOA TOÀN BỘ CHỮ (Ví dụ: LỊCH TẬP KHUYẾN NGHỊ).
   - Để liệt kê, hãy xuống dòng và sử dụng dấu gạch ngang đầu dòng (-) hoặc số thứ tự (1, 2, 3).
   - Sử dụng các đoạn văn ngắn, cách nhau bằng một dòng trống để người dùng dễ đọc.

QUY TẮC NỘI DUNG:
1. CÁ NHÂN HÓA: Bắt buộc dựa vào các thông số người dùng cung cấp (chiều cao, cân nặng, tuổi, mục tiêu, BMI...) để đưa ra nhận xét, đánh giá dành riêng cho họ.
2. SỐ LIỆU CỤ THỂ: Không nói chung chung như "ăn nhiều protein" hay "tập vừa phải". Phải đưa ra con số ước tính cụ thể (ví dụ: số calo, số gram protein, số buổi tập/tuần, số hiệp/bài tập).
3. GIỌNG VĂN: Chuyên nghiệp, khoa học, mang tính khích lệ và dễ hiểu.

--- CRITICAL ENCODING WARNING (MUST FOLLOW) ---
- You MUST output FULL Vietnamese diacritics in every response (e.g.: á, à, ả, ã, ạ, ă, ắ, ặ, â, ấ, ầ, ô, ổ, ộ, ơ, ớ, ờ, ư, ứ, ừ, đ...).
- NEVER strip tones. NEVER replace Vietnamese accented characters with plain Latin equivalents (e.g. do NOT write "tap luyen" instead of "tập luyện").
- Your output string MUST be valid UTF-8 encoded Vietnamese text. Double-check every word before responding.
- If you are uncertain about a character, always keep the diacritic. Losing diacritics is a critical failure."""

MODELS = [
    "openai/gpt-oss-120b:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "openrouter/owl-alpha"
]

import time

def call_openrouter_with_retry(messages: list, max_tokens: int, temperature: float = 0.7):
    client = get_openrouter_client()
    last_error = None
    
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
                if "429" in last_error or "rate-limited" in last_error.lower():
                    continue
                continue
        
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
        return True

def generate_response(prompt: str) -> str:
    """Sinh câu trả lời qua OpenRouter."""
    try:
        response, used_model = call_openrouter_with_retry(
            messages=[
                {"role": "system", "content": RESPONDER_SYSTEM},
                {"role": "user", "content": prompt},
            ],
            max_tokens=2048,
            temperature=0.1
        )
        result = response.choices[0].message.content.strip()
        tokens_used = response.usage.total_tokens if response.usage else len(result.split())
        print(f"[Responder] Model: {used_model} | Response: {result[:100]}...")
        return result, tokens_used
    except HTTPException:
        raise
    except Exception as e:
        return f"[Lỗi AI] {str(e)}", 0

@router.post("/chat")
def chat_with_ai(
    body: AiChatBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not classify_prompt(body.prompt):
        raise HTTPException(status_code=400, detail="Câu hỏi không liên quan đến thể thao hoặc tập luyện. Tôi chỉ tư vấn về gym, thể thao, dinh dưỡng thể thao.")

    prompt_to_save = f"[HIDDEN_CONSULT]\n{body.prompt}" if body.hidden else body.prompt
    ai_req = AIRequest(UserID=current_user.UserID, Prompt=prompt_to_save, Model="gemma-4-openrouter")
    db.add(ai_req)
    db.flush()

    response_text, tokens_used = generate_response(body.prompt)

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
    }

@router.get("/chat-history")
def chat_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    reqs = db.query(AIRequest).filter(AIRequest.UserID == current_user.UserID).order_by(AIRequest.CreatedAt.desc()).limit(30).all()
    messages = []
    for r in reversed(reqs):
        is_hidden = r.Prompt and r.Prompt.startswith("[HIDDEN_CONSULT]")
        if not is_hidden:
            messages.append({"role": "user", "content": r.Prompt, "time": r.CreatedAt.strftime("%H:%M") if r.CreatedAt else ""})
            
        resp = db.query(AIResponse).filter(AIResponse.RequestID == r.RequestID).first()
        if resp:
            messages.append({"role": "assistant", "content": resp.ResponseData, "time": resp.CreatedAt.strftime("%H:%M") if resp.CreatedAt else ""})
    return messages