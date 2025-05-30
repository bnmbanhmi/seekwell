from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime # Added datetime
from typing import cast # Added cast

from app import crud, models, schemas # Added schemas
from app.database import get_db
# Changed get_current_active_cadre to get_current_active_user
from app.dependencies import get_current_active_user 
from app.config import settings
import google.generativeai as genai

# Fallback imports for Gemini SDK exceptions, accommodating older versions like 0.8.5
try:
    from google.generativeai.types import BlockedPromptException
except ImportError:
    BlockedPromptException = None  # Define as None if import fails

try:
    # Attempt common path for GoogleGenerativeAIError in v0.8.x
    from google.generativeai.errors import GoogleGenerativeAIError
except ImportError:
    try:
        # Older or alternative path
        from google.generativeai.core.exceptions import GoogleGenerativeAIError
    except ImportError:
        GoogleGenerativeAIError = None # Define as None if import fails

router = APIRouter()

# Configure API key at module level
try:
    if settings.GOOGLE_API_KEY:
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        print("Gemini SDK configured successfully at module level.") # Added for confirmation
    else:
        print("CẢNH BÁO: GOOGLE_API_KEY chưa được đặt trong cài đặt. Hãy đảm bảo biến này được đặt trong môi trường của bạn để SDK hoạt động chính xác.")
except AttributeError as e:
    print(f"CRITICAL SDK ATTRIBUTE ERROR at module level: Failed to configure Gemini SDK - {e}. Check google-generativeai installation and version.")
except Exception as e:
    print(f"CRITICAL SDK UNEXPECTED ERROR at module level: An error occurred during Gemini SDK configuration - {e}.")


class ChatMessageCreate(BaseModel):
    patient_id: int
    message: str

class ChatResponse(BaseModel):
    reply: str

@router.post("/send", response_model=ChatResponse)
async def send_chat_message(
    chat_message: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user) # Changed dependency and param name
):
    # Role check for authorized personnel
    if current_user.role not in [schemas.UserRole.DOCTOR, schemas.UserRole.CLINIC_STAFF, schemas.UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not have permission to access this feature."
        )

    patient_instance = crud.get_patient(db, patient_id=chat_message.patient_id)

    if not patient_instance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy bệnh nhân với ID {chat_message.patient_id}."
        )

    # patient_instance.id is an int at runtime. Type checkers might warn due to SQLAlchemy's Column type.
    # crud.update_patient_emr expects an int for patient_id.
    patient_id_for_update: int = cast(int, patient_instance.id) 
    
    # Fetch current EMR. Ensure it's a string.
    current_emr_summary = str(getattr(patient_instance, 'emr_summary', "")) 
    
    emr_summary_for_prompt: str = current_emr_summary # Initialize with current

    # Process and update EMR if a new message is provided
    if chat_message.message and chat_message.message.strip():
        message_content = chat_message.message.strip()
        # Log entry includes timestamp, user email, role, and the message
        log_entry = f"Lưu ý mới ({datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')} bởi {current_user.email} [{current_user.role.value}]): {message_content}"
        
        if current_emr_summary.strip(): # Check if current_emr_summary is not just whitespace
            new_emr_summary = f"{current_emr_summary}\n\n{log_entry}"
        else:
            new_emr_summary = log_entry
        
        # Update EMR using the simplified crud function
        updated_patient = crud.update_patient_emr(db, patient_id=patient_id_for_update, emr_summary=new_emr_summary)
        
        if not updated_patient:
            # This typically means patient_id was not found by crud.update_patient_emr,
            # but we already checked patient_instance. So, this might indicate another issue.
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Không thể cập nhật EMR cho bệnh nhân ID {patient_id_for_update}."
            )
        emr_summary_for_prompt = new_emr_summary
    # If chat_message.message is empty or whitespace, emr_summary_for_prompt remains current_emr_summary from patient_instance

    # Construct the prompt for the AI
    prompt = f"""
    Bạn là một trợ lý AI y tế hữu ích làm việc cho SeekWell, một dịch vụ nhằm cải thiện khả năng tiếp cận chăm sóc sức khỏe ở các vùng nông thôn Việt Nam.
    Bạn đang hỗ trợ một cán bộ y tế ({current_user.role.value} - {current_user.email}). Vui lòng trả lời bằng tiếng Việt.
    Định dạng câu trả lời của bạn bằng Markdown.

    Thông tin bệnh nhân:
    - Tuổi: {getattr(patient_instance, 'age', 'N/A')}
    - Giới tính: {getattr(patient_instance, 'gender', 'N/A')}
    - Lịch sử bệnh án (EMR): {emr_summary_for_prompt if emr_summary_for_prompt.strip() else "Chưa có thông tin EMR."}

    Cán bộ nói: "{chat_message.message.strip() if chat_message.message and chat_message.message.strip() else "Cán bộ không cung cấp tin nhắn mới. Vui lòng xem lại EMR và đưa ra nhận xét tổng quan nếu có, hoặc hỏi thêm thông tin nếu cần."}"

    Dựa trên thông tin trên và lời nhắn của cán bộ (nếu có), hãy đưa ra lời khuyên hoặc thông tin liên quan.
    LƯU Ý QUAN TRỌNG: Bạn không thay thế bác sĩ chuyên nghiệp. Nếu tình hình có vẻ nghiêm trọng hoặc bạn không chắc chắn, hãy luôn khuyên cán bộ y tế tham khảo ý kiến bác sĩ hoặc đưa bệnh nhân đến cơ sở y tế gần nhất.
    """

    try:
        # Attempt to configure and use Gemini SDK within the route
        # This is a fallback if module-level configuration fails or causes issues.
        if not settings.GOOGLE_API_KEY:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="GOOGLE_API_KEY is not set. Cannot initialize AI service."
            )
        
        try:
            genai.configure(api_key=settings.GOOGLE_API_KEY)
        except AttributeError as ae_config:
            print(f"Fallback genai.configure AttributeError: {ae_config}. The SDK might be an older version or not fully initialized.")
            # If genai.configure itself is the problem, direct model instantiation might also fail
            # but we proceed to see if GenerativeModel is accessible.
        except Exception as e_config:
            print(f"Fallback genai.configure Exception: {e_config}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"AI SDK configuration error: {e_config}"
            )

        model = genai.GenerativeModel(model_name='gemini-pro')
        response = await model.generate_content_async(prompt)
        ai_reply = response.text
    except AttributeError as ae:
        # This can happen if genai.GenerativeModel or genai.configure wasn't found/imported as expected
        # due to SDK version or setup issues, despite user's working version.
        print(f"Lỗi thuộc tính SDK: {ae}. Kiểm tra cấu hình google-generativeai và phiên bản SDK (kỳ vọng 0.8.5).")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SDK AI không được cấu hình đúng hoặc một phương thức/thuộc tính không tồn tại."
        )
    except Exception as e: # General catch-all, then try to identify specific Gemini errors
        error_handled = False
        
        # Handle BlockedPromptException if successfully imported and e is an instance
        if BlockedPromptException and isinstance(e, BlockedPromptException):
            print(f"Yêu cầu bị chặn bởi API Gemini do chính sách nội dung: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Yêu cầu của bạn đã bị chặn bởi dịch vụ AI vì lý do an toàn hoặc chính sách nội dung."
            )

        # Handle GoogleGenerativeAIError if successfully imported and e is an instance
        # Must be checked *after* more specific exceptions if there's inheritance, or if not, ensure error_handled logic is correct.
        if GoogleGenerativeAIError and isinstance(e, GoogleGenerativeAIError):
            print(f"Lỗi Google Generative AI: {e}")
            error_str = str(e).lower()
            status_code_to_raise = status.HTTP_500_INTERNAL_SERVER_ERROR
            detail_message = f"Đã xảy ra lỗi với dịch vụ AI. Lỗi: {e}"

            if ("permission_denied" in error_str or
                "insufficient authentication scopes" in error_str or
                "unauthenticated" in error_str or
                "api key not valid" in error_str or
                "invalid api key" in error_str):
                
                status_code_to_raise = status.HTTP_403_FORBIDDEN
                if ("unauthenticated" in error_str or 
                    "api key not valid" in error_str or 
                    "invalid api key" in error_str):
                    status_code_to_raise = status.HTTP_401_UNAUTHORIZED
                detail_message = f"Xác thực dịch vụ AI không thành công, không đủ quyền, hoặc khóa API không hợp lệ. Lỗi: {e}"
            elif "resource_exhausted" in error_str or "quota" in error_str:
                status_code_to_raise = status.HTTP_429_TOO_MANY_REQUESTS
                detail_message = f"Đã đạt giới hạn yêu cầu cho dịch vụ AI (hết quota). Vui lòng thử lại sau. Lỗi: {e}"
            
            raise HTTPException(status_code=status_code_to_raise, detail=detail_message)
            error_handled = True # Mark as handled if it was this type of error

        if not error_handled and not (BlockedPromptException and isinstance(e, BlockedPromptException)): # Re-check if not handled by GoogleGenerativeAIError
            # Fallback for other exceptions not caught above
            print(f"Lỗi không xác định khi gọi Gemini API: {type(e).__name__} - {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Không thể nhận phản hồi từ dịch vụ AI do lỗi không xác định. Lỗi: {type(e).__name__}"
            )

    return ChatResponse(reply=ai_reply)

@router.get("/history")
async def get_chat_history_placeholder():
    return {"history": [], "message": "Chat history placeholder - to be implemented if needed"}