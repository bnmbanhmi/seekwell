from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime # Added datetime
from typing import cast, Optional # Added cast and Optional

from app import crud, models, schemas # Added schemas
from app.database import get_db
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

class GeneralChatMessageCreate(BaseModel):
    message: str
    context: Optional[str] = None  # Optional context for different chat scenarios

class ChatResponse(BaseModel):
    reply: str

# Public chatbot endpoint for general inquiries (patients and visitors)
@router.post("/public", response_model=ChatResponse)
async def public_chat_message(
    chat_message: GeneralChatMessageCreate
):
    try:
        # Configure AI service
        if not settings.GOOGLE_API_KEY:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="AI service is not available at the moment."
            )
        
        try:
            genai.configure(api_key=settings.GOOGLE_API_KEY)
        except Exception as e:
            print(f"Failed to configure AI service: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="AI service configuration failed."
            )

        # Construct prompt for general inquiries
        prompt = f"""
        You are a smart AI assistant for SeekWell - an AI-powered skin cancer detection platform. You help patients and the community with:

        1. **Information about SeekWell** and its AI skin cancer detection service.
        2. **Guidance on using** the photo capture and skin analysis features.
        3. **Education** on skin health and skin cancer prevention.
        4. **Basic advice** on abnormal skin signs.
        5. **Connecting** with community health workers (cadres) and doctors.

        **About SeekWell:**
        - An AI platform for early skin cancer detection in ASEAN communities.
        - Uses a Vision Transformer AI to analyze 6 types of skin lesions.
        - A 3-tier system: Patient → AI → Cadre → Doctor.
        - Designed for mobile phones and works offline.
        - AI Model: bnmbanhmi/seekwell-skin-cancer on HuggingFace.

        **Detected Lesion Types:**
        - MEL (Melanoma) - High Risk 🔴
        - BCC (Basal Cell Carcinoma) - High Risk 🔴
        - SCC (Squamous Cell Carcinoma) - High Risk 🔴
        - ACK (Actinic Keratosis) - Medium Risk 🟠
        - NEV (Nevus/Mole) - Low Risk 🟢
        - SEK (Seborrheic Keratosis) - Low Risk 🟢

        **Important Rules:**
        - Reply in English, in a friendly and easy-to-understand manner.
        - ALWAYS emphasize that the AI is a support tool, not a substitute for a doctor.
        - Encourage early and regular check-ups with health workers.
        - Use emojis and Markdown formatting for readability.
        - Provide educational information on skin cancer prevention.

        Question: "{chat_message.message}"

        Please provide a helpful and professional answer.
        """

        model = genai.GenerativeModel(model_name='gemma-3-27b-it')
        response = await model.generate_content_async(prompt)
        ai_reply = response.text
        
        return ChatResponse(reply=ai_reply)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in public chat: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Xin lỗi, hiện tại hệ thống đang gặp sự cố. Vui lòng thử lại sau hoặc liên hệ trực tiếp qua số điện thoại (028) 1234-5678."
        )

# Patient-specific chatbot endpoint
@router.post("/patient", response_model=ChatResponse)
async def patient_chat_message(
    chat_message: GeneralChatMessageCreate,
    current_user: models.User = Depends(get_current_active_user)
):
    # Ensure user is a patient
    if current_user.role != models.UserRole.PATIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is only available for patients."
        )
    
    try:
        # Configure AI service
        if not settings.GOOGLE_API_KEY:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="AI service is not available at the moment."
            )
        
        genai.configure(api_key=settings.GOOGLE_API_KEY)

        # Construct prompt for authenticated patients
        prompt = f"""
        You are a personal AI assistant for patient {current_user.full_name} within the SeekWell system.

        **SeekWell** is a platform for early skin cancer detection using AI for ASEAN communities. You can help with:

        1. **Advice on skin health** and signs to look out for.
        2. **Guidance on using** the AI skin analysis feature.
        3. **Explaining AI results** and next steps.
        4. **Preparing for consultations** with health workers or doctors.
        5. **Education** on skin cancer prevention.

        **About the AI Analysis:**
        - The AI can detect 6 types of skin lesions.
        - Results are classified as: LOW 🟢, MEDIUM 🟠, HIGH 🟡, URGENT 🔴.
        - The AI's confidence level is shown as a percentage.

        **Important Notes:**
        - The AI is a support tool ONLY and does not replace a professional doctor.
        - Always follow up with a local health worker for any unusual results.
        - Perform regular skin checks for early detection.
        - Protect your skin from sun and UV exposure.

        Patient's question: "{chat_message.message}"

        Please provide a helpful, safe, and encouraging response to promote proactive skin health care.
        """

        model = genai.GenerativeModel(model_name='gemma-3-27b-it')
        response = await model.generate_content_async(prompt)
        ai_reply = response.text
        
        return ChatResponse(reply=ai_reply)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in patient chat: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Xin lỗi, hiện tại hệ thống đang gặp sự cố. Vui lòng thử lại sau."
        )

@router.post("/send", response_model=ChatResponse)
async def send_chat_message(
    chat_message: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user) # Changed dependency and param name
):
    # Role check for authorized personnel
    if current_user.role not in [schemas.UserRole.DOCTOR, schemas.UserRole.LOCAL_CADRE, schemas.UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not have permission to access this feature."
        )

    patient_instance = crud.get_patient(db, patient_id=chat_message.patient_id)

    if not patient_instance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID {chat_message.patient_id} not found."
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
        log_entry = f"New note ({datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')} by {current_user.email} [{current_user.role.value}]): {message_content}"
        
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
                detail=f"Could not update EMR for patient ID {patient_id_for_update}."
            )
        emr_summary_for_prompt = new_emr_summary
    # If chat_message.message is empty or whitespace, emr_summary_for_prompt remains current_emr_summary from patient_instance

    # Construct the prompt for the AI
    prompt = f"""
    You are a helpful medical AI assistant working for SeekWell.
    You are assisting a healthcare professional ({current_user.role.value} - {current_user.email}). Please reply in English.
    Format your response using Markdown.

    Patient Information:
    - Age: {getattr(patient_instance, 'age', 'N/A')}
    - Gender: {getattr(patient_instance, 'gender', 'N/A')}
    - Medical History (EMR): {emr_summary_for_prompt if emr_summary_for_prompt.strip() else "No EMR information available."}

    The professional says: "{chat_message.message.strip() if chat_message.message and chat_message.message.strip() else "The professional did not provide a new message. Please review the EMR and provide a general summary or ask for more information if needed."}"

    Based on the above information and the message from the staff or doctor (if any), provide relevant advice or information.
    IMPORTANT NOTE: You are not a substitute for a professional doctor. If the situation seems serious or you are unsure, always advise the healthcare professional to consult a doctor or refer the patient to the nearest medical facility.
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

        model = genai.GenerativeModel(model_name='gemma-3-27b-it')
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