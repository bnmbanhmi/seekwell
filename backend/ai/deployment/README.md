# SeekWell Skin Cancer Detection

This is the HuggingFace Space for SeekWell's AI-powered skin cancer detection system.

## Model Information

- **Model**: `bnmbanhmi/seekwell_skincancer_v2`
- **Architecture**: Vision Transformer (ViT)
- **Classes**: 6 skin lesion types
- **Accuracy**: 69%
- **Training Dataset**: ISIC skin cancer dataset

## Supported Classes

1. **ACK** - Actinic keratoses (Precancerous lesions)
2. **BCC** - Basal cell carcinoma (Common skin cancer)
3. **MEL** - Melanoma (Most serious skin cancer)
4. **NEV** - Nevus/Mole (Benign lesions)
5. **SCC** - Squamous cell carcinoma (Skin cancer)
6. **SEK** - Seborrheic keratosis (Benign lesions)

## Risk Levels

- **🚨 URGENT**: Melanoma - requires immediate medical attention
- **🔴 HIGH**: BCC, SCC - schedule dermatologist within 1-2 weeks  
- **🟡 MEDIUM**: ACK - monitor and consider professional consultation
- **🟢 LOW**: NEV, SEK - routine monitoring sufficient

## Usage

1. Upload a clear image of the skin lesion
2. The AI will analyze and provide:
   - Classification with confidence scores
   - Risk assessment 
   - Medical recommendations
   - Follow-up guidance

## Disclaimer

⚠️ **This application is for educational and research purposes only.**

- NOT a substitute for professional medical diagnosis
- Always consult healthcare providers for medical decisions
- AI predictions should be verified by medical professionals
- Developed for the ASEAN Data Science Explorers Competition

## Technical Details

- **Framework**: PyTorch + Transformers
- **Processor**: Google ViT Base Patch16-224
- **Interface**: Gradio
- **Developer**: SeekWell Team

## Integration

This model is integrated into the full SeekWell healthcare platform which includes:
- Multi-tier review system (Patient → Local Cadre → Doctor)
- Electronic health records
- Telemedicine capabilities
- Mobile-first design for underserved communities

---

*Developed by Team SeekWell for ASEAN DSE 2025*
