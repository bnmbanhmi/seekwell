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
        print("WARNING: GOOGLE_API_KEY is not set in settings. Please ensure this variable is set in your environment for the SDK to work properly.")
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
        You are the SeekWell AI assistant - a friendly, knowledgeable guide for community health services in ASEAN. 
        
        🌟 **About SeekWell:**
        SeekWell is a community-driven health platform that combines AI-powered skin cancer detection with a network of local officials to serve ASEAN communities. Our mission is to make early detection accessible, especially in underserved areas.

        📱 **How SeekWell Works:**
        1. **Patients** use mobile phones to capture skin lesion photos
        2. **AI Analysis** provides instant preliminary screening (6 lesion types)
        3. **Local Officials** review cases and provide local care
        4. **Doctors** handle complex cases through our referral system
        5. **Mobile-first** design works offline and in low-connectivity areas

        🔍 **AI Detection Capabilities:**
        - **HIGH PRIORITY** 🔴: MEL (Melanoma), BCC (Basal Cell Carcinoma), SCC (Squamous Cell Carcinoma)
        - **MEDIUM PRIORITY** 🟠: ACK (Actinic Keratosis/Solar Keratosis)
        - **LOW PRIORITY** 🟢: NEV (Nevus/Mole), SEK (Seborrheic Keratosis)
        - **AI Model:** bnmbanhmi/seekwell-skin-cancer (HuggingFace)

        🏥 **Community Health Network:**
        - **Health Centers** serve as local hubs for care and referrals
        - **Local Officials** are trained community health workers who bridge AI and clinical care
        - **Mobile Coordination** allows officials to work efficiently in the field
        - **Referral Pathways** ensure complex cases reach appropriate specialists

        ✨ **Your Role as Assistant:**
        Help visitors understand SeekWell's services, guide them through the AI analysis process, provide skin health education, and connect them with local health resources. Always emphasize that AI is a screening tool - not a replacement for professional medical care.

        🤝 **Community Focus:**
        Emphasize that SeekWell is designed by and for ASEAN communities, with special attention to rural and underserved areas. Promote the value of local officials and community-based care.

        **User Question:** "{chat_message.message}"

        **Instructions:**
        - Respond in a warm, helpful tone using emojis and markdown formatting
        - Focus on community health and early detection
        - Highlight the role of local officials
        - Encourage regular skin checks and sun protection
        - Always remind users that AI results need professional follow-up
        - Provide practical, actionable advice
        - Mention SeekWell's mobile-first, offline-capable design when relevant
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
            detail="Sorry, the system is currently experiencing issues. Please try again later or contact us directly."
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
        You are the personal SeekWell AI assistant for patient {current_user.full_name}. You're here to support their health journey within our community health network.

        👋 **Welcome {current_user.full_name}!**
        
        🌟 **How I Can Help You:**
        
        🔍 **AI Analysis Support:**
        - Guide you through taking clear, well-lit photos of skin lesions
        - Explain AI results and confidence levels in simple terms
        - Help you understand the 6 types of lesions we detect
        - Prepare you for follow-up with your local official

        🏥 **Community Health Navigation:**
        - Explain the role of your local official
        - Help you prepare questions for health visits
        - Guide you through the referral pathway if specialist care is needed
        - Connect you with nearby health centers and services

        📱 **Your Health Journey:**
        - Track your skin health over time
        - Understand when to seek immediate care vs. routine follow-up
        - Learn about skin cancer prevention and sun protection
        - Get tips for regular self-examinations

        🤝 **Community Connection:**
        - Your local official is trained to work with our AI system
        - They can provide personalized care and answer detailed questions
        - SeekWell works offline, so you can use it anywhere
        - You're part of a growing network of health-conscious communities

        ⚠️ **Important Reminders:**
        - Our AI is a screening tool - always follow up with health professionals
        - HIGH PRIORITY results (🔴) need prompt attention from your official
        - Regular skin checks help catch changes early
        - Protect your skin with sunscreen, clothing, and shade

        **Your Question:** "{chat_message.message}"

        **Response Guidelines:**
        - Be encouraging and supportive about their health journey
        - Use simple, clear language with relevant emojis
        - Focus on actionable next steps
        - Emphasize the community support available to them
        - Always promote collaboration with local officials
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
            detail="Sorry, the system is currently experiencing issues. Please try again later."
        )

@router.post("/send", response_model=ChatResponse)
async def send_chat_message(
    chat_message: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user) # Changed dependency and param name
):
    # Role check for authorized personnel
    if current_user.role not in [schemas.UserRole.DOCTOR, schemas.UserRole.OFFICIAL, schemas.UserRole.ADMIN]:
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
    role_specific_context = ""
    if current_user.role == models.UserRole.OFFICIAL:
        role_specific_context = """
        **Role Context - Local Official:**
        You are supporting a frontline community health worker who serves as the crucial bridge between AI technology and community care. They conduct home visits, manage patient follow-ups, coordinate with health centers, and work with mobile tools often in offline conditions.
        
        **Focus Areas:**
        - Community health visit planning and documentation
        - AI result interpretation for community members
        - Mobile coordination and offline workflow management
        - Patient education and prevention programs
        - Referral pathway coordination with doctors
        - Coverage area management and resource allocation
        """
    elif current_user.role == models.UserRole.DOCTOR:
        role_specific_context = """
        **Role Context - Medical Doctor:**
        You are supporting a doctor who receives pre-screened cases from the AI system and community health cadres. They focus on complex diagnoses, treatment planning, and clinical oversight of the community health network.
        
        **Focus Areas:**
        - Clinical decision support for AI-flagged cases
        - Referral management from community cadres
        - Complex case diagnosis and treatment planning
        - EMR review and clinical documentation
        - Health center coordination and quality assurance
        - Professional guidance for community health programs
        """
    elif current_user.role == models.UserRole.ADMIN:
        role_specific_context = """
        **Role Context - System Administrator:**
        You are supporting a system administrator who manages the overall SeekWell platform, including user management, cadre assignments, health center coordination, and system analytics.
        
        **Focus Areas:**
        - System performance and analytics monitoring
        - Cadre management (assignments, training, coverage areas)
        - Health center network coordination
        - User management and access control
        - Data insights and community health trends
        - Platform configuration and workflow optimization
        """

    prompt = f"""
    You are the SeekWell AI assistant for healthcare professionals, designed to support community health initiatives across ASEAN.

    {role_specific_context}

    **SeekWell System Overview:**
    - **Mission:** Community-driven health network combining AI screening with local expertise
    - **Network:** Patients → AI Analysis → Community Cadres → Doctors → Health Centers
    - **Technology:** Mobile-first, offline-capable, AI-powered skin cancer detection
    - **Coverage:** ASEAN communities with focus on underserved areas

    **Current Case Context:**
    **Healthcare Professional:** {current_user.role.value} - {current_user.email}
    **Patient Information:**
    - **Age:** {getattr(patient_instance, 'age', 'N/A')}
    - **Gender:** {getattr(patient_instance, 'gender', 'N/A')}
    - **Medical History (EMR):** {emr_summary_for_prompt if emr_summary_for_prompt.strip() else "No EMR information available."}

    **Professional's Message/Query:** "{chat_message.message.strip() if chat_message.message and chat_message.message.strip() else "No specific message provided. Please review the EMR and provide clinical insights or ask for more information if needed."}"

    **AI Detection System Reference:**
    - **HIGH PRIORITY** 🔴: MEL (Melanoma), BCC (Basal Cell Carcinoma), SCC (Squamous Cell Carcinoma)
    - **MEDIUM PRIORITY** 🟠: ACK (Actinic Keratosis)
    - **LOW PRIORITY** 🟢: NEV (Nevus/Mole), SEK (Seborrheic Keratosis)

    **Response Guidelines:**
    - Provide professional, evidence-based guidance appropriate for the user's role
    - Use clear medical terminology while remaining accessible
    - Focus on community health and preventive care approaches
    - Emphasize collaboration between AI, cadres, and clinical staff
    - Consider resource limitations and mobile/offline working conditions
    - Suggest practical next steps for patient care and case management
    - Use markdown formatting for clarity and organization

    **Critical Safety Note:**
    You are a clinical decision support tool, not a replacement for professional medical judgment. For urgent cases or diagnostic uncertainty, always recommend direct consultation with appropriate medical specialists or referral to equipped healthcare facilities.
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
        print(f"SDK attribute error: {ae}. Please check google-generativeai configuration and SDK version (expected 0.8.5).")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI SDK is not configured properly or a method/attribute does not exist."
        )
    except Exception as e: # General catch-all, then try to identify specific Gemini errors
        error_handled = False
        
        # Handle BlockedPromptException if successfully imported and e is an instance
        if BlockedPromptException and isinstance(e, BlockedPromptException):
            print(f"Request blocked by Gemini API due to content policy: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Your request was blocked by the AI service due to safety or content policy reasons."
            )

        # Handle GoogleGenerativeAIError if successfully imported and e is an instance
        # Must be checked *after* more specific exceptions if there's inheritance, or if not, ensure error_handled logic is correct.
        if GoogleGenerativeAIError and isinstance(e, GoogleGenerativeAIError):
            print(f"Google Generative AI error: {e}")
            error_str = str(e).lower()
            status_code_to_raise = status.HTTP_500_INTERNAL_SERVER_ERROR
            detail_message = f"An error occurred with the AI service. Error: {e}"

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
                detail_message = f"AI service authentication failed, insufficient permissions, or invalid API key. Error: {e}"
            elif "resource_exhausted" in error_str or "quota" in error_str:
                status_code_to_raise = status.HTTP_429_TOO_MANY_REQUESTS
                detail_message = f"AI service request limit reached (quota exhausted). Please try again later. Error: {e}"
            
            raise HTTPException(status_code=status_code_to_raise, detail=detail_message)
            error_handled = True # Mark as handled if it was this type of error

        if not error_handled and not (BlockedPromptException and isinstance(e, BlockedPromptException)): # Re-check if not handled by GoogleGenerativeAIError
            # Fallback for other exceptions not caught above
            print(f"Unknown error when calling Gemini API: {type(e).__name__} - {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Unable to get response from AI service due to unknown error. Error: {type(e).__name__}"
            )

    return ChatResponse(reply=ai_reply)

@router.get("/history")
async def get_chat_history_placeholder():
    return {"history": [], "message": "Chat history placeholder - to be implemented if needed"}

# General staff chatbot endpoint for healthcare professionals
@router.post("/staff", response_model=ChatResponse)
async def staff_chat_message(
    chat_message: GeneralChatMessageCreate,
    current_user: models.User = Depends(get_current_active_user)
):
    # Ensure user is a healthcare professional
    if current_user.role not in [models.UserRole.DOCTOR, models.UserRole.LOCAL_CADRE, models.UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is only available for healthcare professionals."
        )
    
    try:
        # Configure AI service
        if not settings.GOOGLE_API_KEY:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="AI service is not available at the moment."
            )
        
        genai.configure(api_key=settings.GOOGLE_API_KEY)

        # Role-specific context
        role_specific_context = ""
        role_greeting = ""
        
        if current_user.role == models.UserRole.LOCAL_CADRE:
            role_greeting = f"👨‍⚕️ Hello {current_user.full_name}, Community Health Cadre!"
            role_specific_context = """
            **Your Role as Community Health Cadre:**
            You are a frontline community health worker bridging AI technology and community care. Your work includes home visits, patient follow-ups, mobile coordination, and connecting communities with healthcare resources.
            
            **I can help you with:**
            - **Community health visit** planning and best practices
            - **AI result interpretation** for community education
            - **Mobile tools** and offline workflow optimization
            - **Patient education** materials and prevention programs
            - **Referral coordination** with doctors and health centers
            - **Coverage area management** and resource allocation
            - **Cultural considerations** for community engagement
            """
        elif current_user.role == models.UserRole.DOCTOR:
            role_greeting = f"👩‍⚕️ Hello Dr. {current_user.full_name}!"
            role_specific_context = """
            **Your Role as Medical Doctor:**
            You provide clinical oversight for our community health network, handling complex cases and supporting community cadres with medical expertise.
            
            **I can help you with:**
            - **Clinical protocols** for AI-flagged cases
            - **Diagnostic support** and differential considerations
            - **Treatment planning** for resource-limited settings
            - **Cadre supervision** and clinical guidance
            - **Quality assurance** for community health programs
            - **Professional development** and continuing education
            - **Health system coordination** and referral pathways
            """
        elif current_user.role == models.UserRole.ADMIN:
            role_greeting = f"⚙️ Hello {current_user.full_name}, System Administrator!"
            role_specific_context = """
            **Your Role as System Administrator:**
            You manage the overall SeekWell platform, ensuring effective coordination between AI technology, community cadres, and healthcare providers.
            
            **I can help you with:**
            - **System performance** monitoring and optimization
            - **Cadre management** including assignments and training
            - **Health center network** coordination and resource planning
            - **User management** and access control
            - **Analytics and reporting** for health outcomes
            - **Platform configuration** and workflow design
            - **Data privacy** and security best practices
            """

        # Construct prompt for healthcare professionals
        prompt = f"""
        You are the SeekWell AI assistant for healthcare professionals, designed to support community health initiatives across ASEAN.

        {role_greeting}

        {role_specific_context}

        **SeekWell Community Health Network:**
        - **Mission:** Community-driven health platform combining AI screening with local expertise
        - **Network Flow:** Patients → AI Analysis → Community Cadres → Doctors → Health Centers
        - **Technology:** Mobile-first, offline-capable, AI-powered skin cancer detection
        - **Coverage:** ASEAN communities with focus on underserved and rural areas

        **AI Detection System Overview:**
        - **HIGH PRIORITY** 🔴: MEL (Melanoma), BCC (Basal Cell Carcinoma), SCC (Squamous Cell Carcinoma)
        - **MEDIUM PRIORITY** 🟠: ACK (Actinic Keratosis)
        - **LOW PRIORITY** 🟢: NEV (Nevus/Mole), SEK (Seborrheic Keratosis)
        - **AI Model:** bnmbanhmi/seekwell-skin-cancer (HuggingFace)

        **Your Question/Request:** "{chat_message.message}"

        **Response Guidelines:**
        - Provide professional, evidence-based guidance appropriate for your role
        - Consider resource limitations and mobile/offline working conditions
        - Focus on community health and preventive care approaches
        - Emphasize collaboration within the SeekWell network
        - Use clear, practical language with relevant emojis and markdown formatting
        - Suggest actionable next steps and best practices
        - Promote patient-centered, culturally sensitive care

        **Professional Standards:**
        Remember that you're supporting professional healthcare decision-making. Provide evidence-based information while respecting the limits of AI assistance. For complex clinical situations or policy decisions, recommend consultation with appropriate specialists or professional networks.
        """

        model = genai.GenerativeModel(model_name='gemma-3-27b-it')
        response = await model.generate_content_async(prompt)
        ai_reply = response.text
        
        return ChatResponse(reply=ai_reply)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in staff chat: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Sorry, the system is currently experiencing issues. Please try again later."
        )