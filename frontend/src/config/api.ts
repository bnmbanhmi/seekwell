// API Configuration
export const API_CONFIG = {
  BACKEND_URL: (process.env.REACT_APP_BACKEND_URL || 'https://seekwell-backend.onrender.com').replace(/\/+$/, ''),
  AI_CONFIDENCE_THRESHOLD: parseFloat(process.env.REACT_APP_AI_CONFIDENCE_THRESHOLD || '0.8'),
  HUGGINGFACE_SPACE_URL: process.env.REACT_APP_HUGGINGFACE_SPACE_URL || 'https://bnmbanhmi-seekwell-skin-cancer.hf.space',
  ENABLE_OFFLINE_MODE: process.env.REACT_APP_ENABLE_OFFLINE_MODE === 'true',
  ENABLE_PWA: process.env.REACT_APP_ENABLE_PWA === 'true',
  ENVIRONMENT: process.env.REACT_APP_ENVIRONMENT || 'development'
};

// Debug log in development
if (API_CONFIG.ENVIRONMENT === 'development') {
  console.log('🔧 API Configuration:', API_CONFIG);
}

export default API_CONFIG;
