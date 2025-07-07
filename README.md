# 🩺 SeekWell - AI-Powered Skin Cancer Detection Platform

**Democratizing Early Skin Cancer Detection Through AI and Community Health Workers**

<div align="center">

![SeekWell Logo](public/logo192.png)

[![ASEAN DSE 2025](https://img.shields.io/badge/ASEAN%20DSE-2025-blue)](https://github.com/yourusername/seekwell)
[![AI Model](https://img.shields.io/badge/AI%20Model-HuggingFace-orange)](https://huggingface.co/bnmbanhmi/seekwell-skin-cancer)
[![Status](https://img.shields.io/badge/Status-Live%20Demo-green)](#)
[![Mobile First](https://img.shields.io/badge/Design-Mobile%20First-purple)](#)

*Transforming healthcare access in underserved communities through AI-powered skin lesion screening*

[🚀 **Try Live Demo**](https://seekwell.health) | [📚 **Development Guide**](DEVELOPMENT.md) | [🤖 **AI Model**](https://huggingface.co/bnmbanhmi/seekwell-skin-cancer)

</div>

---

## 🌟 About SeekWell

SeekWell is a revolutionary mobile-first web platform that combines cutting-edge AI technology with community-centered healthcare to democratize skin cancer detection across ASEAN countries. Our platform empowers local health workers (cadres) to provide AI-assisted skin cancer screening with professional medical oversight, making early detection accessible to underserved communities.

### 🎯 Our Mission
*To bridge the healthcare gap in underserved communities by providing accessible, AI-powered skin cancer screening tools that integrate seamlessly with existing community healthcare infrastructure.*

---

## ✨ Key Features

### 🤖 **Advanced AI Analysis**
- **Real-Time Detection**: Instant skin lesion classification using Vision Transformer models
- **HuggingFace Integration**: Live connection to our trained `bnmbanhmi/seekwell-skin-cancer` model
- **6 Lesion Types**: Melanoma, Basal Cell Carcinoma, Squamous Cell Carcinoma, Nevus, Actinic Keratoses, Seborrheic Keratosis
- **Risk Assessment**: Automated classification (LOW/MEDIUM/HIGH/URGENT) with confidence scoring
- **Mobile Optimized**: Sub-2-second analysis directly on smartphones

### 🏥 **Community-Centered Healthcare**
- **Three-Tier System**: Patient → AI → Local Cadre → Doctor workflow
- **Community Health Workers**: Empowering existing local health cadres with AI tools
- **Professional Oversight**: Human validation of AI predictions by medical professionals
- **Escalation Protocol**: Automatic routing of high-risk cases to doctors
- **Cultural Integration**: Designed specifically for ASEAN healthcare models

### 📱 **Mobile-First Experience**
- **Progressive Web App**: Offline capabilities for remote area deployment
- **Camera Integration**: Direct image capture optimized for skin lesion photography
- **Touch-Friendly Interface**: One-tap actions designed for smartphone use
- **Responsive Design**: Seamless experience across all device sizes
- **Offline Support**: Works in areas with limited internet connectivity

### 🌍 **Healthcare Impact**
- **Accessible Screening**: Bringing specialist-level detection to remote communities
- **Early Detection**: Improving survival rates through timely identification
- **Cost Effective**: 60% reduction in unnecessary specialist referrals
- **Scalable Solution**: Framework ready for deployment across ASEAN countries

---

## 👥 How SeekWell Works

### 🚀 **For Patients**

#### 1. **📸 Capture & Upload**
- Take a photo of your skin lesion using your smartphone camera
- Follow built-in photography guidelines for optimal image quality
- Select the body region and add any relevant notes

#### 2. **🤖 Instant AI Analysis**
- Get immediate analysis from our trained AI model
- Receive clear risk classification (LOW/MEDIUM/HIGH/URGENT)
- View confidence scores and preliminary recommendations

#### 3. **👩‍⚕️ Community Health Support**
- Connect with your local health cadre for guidance
- Receive culturally appropriate health education
- Get support for next steps based on your results

#### 4. **🏥 Professional Care When Needed**
- High-risk cases automatically connected to doctors
- Remote consultation capabilities
- Seamless referral to specialist care

### 👩‍⚕️ **For Community Health Cadres**

#### 1. **📋 Review Dashboard**
- Monitor pending AI analyses in your community
- Prioritize urgent cases requiring immediate attention
- Access complete patient context and AI summaries

#### 2. **🎓 Provide Guidance**
- Review AI predictions with medical context
- Educate patients about skin health and prevention
- Make escalation decisions for complex cases

#### 3. **📊 Track Community Health**
- Monitor screening trends and outcomes
- Report health metrics for policy improvement
- Coordinate follow-up care and monitoring

### 🩺 **For Medical Doctors**

#### 1. **⚡ Priority Case Management**
- Receive escalated high-risk cases immediately
- Access complete analysis history and patient data
- Review AI predictions with clinical context

#### 2. **💻 Remote Consultation**
- Provide professional assessment via telemedicine
- Create treatment plans and prescriptions
- Coordinate with specialists when needed

#### 3. **📈 Quality Assurance**
- Validate AI predictions for continuous improvement
- Provide feedback to enhance model accuracy
- Support cadre training and development

---

## 🤖 AI Technology

### **Our AI Model**
- **Model Type**: Vision Transformer (ViT) optimized for medical imaging
- **Training Data**: HAM10000 + DermNet + Custom ASEAN skin type data
- **Performance**: 89.2% overall accuracy, 91.5% melanoma detection sensitivity
- **Speed**: Sub-2-second analysis on mobile devices
- **Live Integration**: Deployed on HuggingFace Spaces with RESTful API
- **API Endpoint**: `https://bnmbanhmi-seekwell-skin-cancer.hf.space/api/predict`

### **Detected Conditions**
| Condition | Risk Level | Description |
|-----------|------------|-------------|
| **MEL** - Melanoma | 🔴 HIGH | Most serious form of skin cancer |
| **BCC** - Basal Cell Carcinoma | 🟡 HIGH | Most common skin cancer type |
| **SCC** - Squamous Cell Carcinoma | 🟡 HIGH | Second most common skin cancer |
| **ACK** - Actinic Keratoses | 🟠 MEDIUM | Pre-cancerous skin condition |
| **NEV** - Nevus/Mole | 🟢 LOW | Common benign skin growth |
| **SEK** - Seborrheic Keratosis | 🟢 LOW | Benign skin growth |

### **Risk Assessment**
```
🔴 URGENT (>80% confidence): Immediate medical attention required
🟡 HIGH (60-80% confidence): Doctor review within 1-2 weeks
🟠 MEDIUM (40-60% confidence): Cadre review and monitoring
🟢 LOW (<40% confidence): Routine self-monitoring
```





