import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { UserRole } from '../../types/UserType';
import './ChatbotWidget.css';

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/+$/, '');

interface ChatMessage {
    id: string;
    sender: 'user' | 'ai';
    text: string;
    timestamp: Date;
}

interface ChatbotWidgetProps {
    userRole?: UserRole | null;
    isAuthenticated?: boolean;
    position?: 'fixed' | 'inline';
    className?: string;
    placeholder?: string;
}

const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({
    userRole = null,
    isAuthenticated = false,
    position = 'fixed',
    className = '',
    placeholder = 'Type your question...'
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Initial welcome message
    useEffect(() => {
        if (messages.length === 0) {
            const welcomeMessage: ChatMessage = {
                id: 'welcome',
                sender: 'ai',
                text: getWelcomeMessage(),
                timestamp: new Date()
            };
            setMessages([welcomeMessage]);
        }
    }, [userRole, isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

    const getWelcomeMessage = () => {
        if (!isAuthenticated) {
            return `👋 **Xin chào! / Hello!**

🌟 **Tôi là trợ lý AI SeekWell - người bạn đồng hành sức khỏe da của bạn!**
🌟 **I'm your SeekWell AI Assistant - your skin health companion!**

---

� **Tôi có thể giúp gì cho bạn? / How can I help you?**

📱 **Hướng dẫn sử dụng ứng dụng / App Guide:**
- Cách chụp ảnh cho phân tích AI / How to take photos for AI analysis
- Hiểu kết quả phân tích / Understanding analysis results  
- Xem lại lịch sử phân tích / Viewing analysis history
- Điều hướng trong ứng dụng / Navigating the app

🔍 **Giải thích kết quả / Results Explanation:**
- Các loại bệnh da khác nhau / Different skin conditions
- Mức độ rủi ro và màu sắc / Risk levels and colors
- Kết quả không chắc chắn / Uncertain results
- Khi nào cần gặp bác sĩ / When to see a doctor

�️ **Phòng ngừa ung thư da / Skin Cancer Prevention:**
- Bảo vệ da khỏi ánh nắng / Sun protection tips
- Tự kiểm tra da hàng tháng / Monthly self-examination
- Dấu hiệu cảnh báo / Warning signs
- Thói quen chăm sóc da / Healthy skin habits

---

**💡 Mẹo:** Hỏi tôi bằng tiếng Việt hoặc tiếng Anh - tôi sẽ trả lời bằng ngôn ngữ bạn chọn!
**💡 Tip:** Ask me in Vietnamese or English - I'll respond in your language!`;
        }

        switch (userRole) {
            case 'PATIENT':
                return `👋 **Xin chào! Chào mừng trở lại! / Hello! Welcome back!**

🌟 **Tôi là trợ lý AI SeekWell cá nhân của bạn!**
🌟 **I'm your personal SeekWell AI Assistant!**

---

💬 **Tôi có thể giúp bạn với: / I can help you with:**

📱 **Sử dụng ứng dụng / Using the App:**
- Hướng dẫn chụp ảnh rõ nét / Taking clear photos for analysis
- Cách phân tích da / How to analyze skin lesions
- Xem lịch sử kết quả / Viewing your analysis history
- Chuyển đổi ngôn ngữ / Switching languages

📊 **Hiểu kết quả của bạn / Understanding Your Results:**
- Giải thích tên bệnh và mức độ rủi ro / Disease names and risk levels
- Khi nào kết quả "không chắc chắn" / When results are "uncertain"
- Cách đọc độ tin cậy / Reading confidence percentages
- Các bước tiếp theo cần làm / Next steps to take

🏥 **Chăm sóc sức khỏe / Healthcare Guidance:**
- Khi nào cần gặp bác sĩ / When to see a doctor
- Dấu hiệu khẩn cấp / Emergency warning signs
- Chuẩn bị cho cuộc hẹn / Preparing for appointments
- Theo dõi sức khỏe da / Monitoring skin health

🛡️ **Phòng ngừa / Prevention:**
- Bảo vệ da khỏi tia UV / UV protection
- Tự kiểm tra da / Self-examination tips
- Thói quen lành mạnh / Healthy habits
- Phát hiện sớm / Early detection

---

**Hãy hỏi tôi bất cứ điều gì về sức khỏe da của bạn! 💚**
**Ask me anything about your skin health! 💚**`;

            case 'OFFICIAL':
                return `🌟 **Welcome, Health Official! / Chào mừng, Cán bộ Y tế!**

🤝 **I'm here to support your vital community health work!**
🤝 **Tôi ở đây để hỗ trợ công việc y tế cộng đồng quan trọng của bạn!**

---

💬 **I can assist with: / Tôi có thể hỗ trợ:**

🔍 **AI Analysis Support:**
- Understanding AI results and confidence levels
- Handling urgent cases effectively
- Connecting with doctors for case reviews
- Patient communication and education

🏥 **Community Care:**
- Guidance for home visits
- Mobile workflow and offline tools
- Patient follow-up strategies
- Referral pathway coordination

📊 **Documentation:**
- EMR updates and patient tracking
- Case documentation best practices
- Progress monitoring tools

---

**How can I support you today? / Tôi có thể giúp gì cho bạn hôm nay? 🌟**`;

            case 'DOCTOR':
                return `👩‍⚕️ **Welcome, Doctor! / Chào mừng, Bác sĩ!**

🏥 **I'm your clinical support assistant!**
🏥 **Tôi là trợ lý hỗ trợ lâm sàng của bạn!**

---

💬 **I can help with: / Tôi có thể giúp:**

🔍 **Clinical Support:**
- Reviewing urgent AI-flagged cases
- Accessing patient analysis history
- Understanding AI model performance
- Complex case diagnosis support

📊 **System Insights:**
- EMR documentation and review
- Referral case management
- Treatment planning guidance
- Follow-up coordination

---

**What clinical support do you need today? / Bạn cần hỗ trợ lâm sàng gì hôm nay? 🩺**`;

            case 'ADMIN':
                return `⚙️ **Welcome, Administrator! / Chào mừng, Quản trị viên!**

📊 **I'm your SeekWell system management assistant!**
📊 **Tôi là trợ lý quản lý hệ thống SeekWell của bạn!**

---

💬 **I can help with: / Tôi có thể giúp:**

🔧 **System Management:**
- System analytics and monitoring
- User management and access control
- Platform configuration
- Workflow optimization

📈 **Network Coordination:**
- Health center management
- Staff assignments and training
- Community health trends
- Resource allocation

---

**What would you like to manage today? / Bạn muốn quản lý gì hôm nay? 🛠️**`;

            default:
                return `👋 **Xin chào! / Hello!**

🌟 **I'm the SeekWell AI assistant for community health.**
🌟 **Tôi là trợ lý AI SeekWell về sức khỏe cộng đồng.**

---

💬 **I can provide information about: / Tôi có thể cung cấp thông tin về:**
- Our platform and services / Nền tảng và dịch vụ của chúng tôi
- Skin health guidance / Hướng dẫn sức khỏe da
- Community health resources / Tài nguyên y tế cộng đồng

**How can I help you? / Tôi có thể giúp gì cho bạn? 💚**`;
        }
    };

    const sendMessage = async () => {
        if (!currentMessage.trim() || isLoading) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString() + '-user',
            sender: 'user',
            text: currentMessage,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setCurrentMessage('');
        setIsLoading(true);
        setError(null);

        try {
            let endpoint = '/chat/public';
            let headers: any = { 'Content-Type': 'application/json' };

            // Determine endpoint and headers based on authentication and role
            if (isAuthenticated) {
                const token = localStorage.getItem('accessToken');
                if (token) {
                    headers.Authorization = `Bearer ${token}`;
                    
                    if (userRole === 'PATIENT') {
                        endpoint = '/chat/patient';
                    } else if (userRole === 'DOCTOR' || userRole === 'OFFICIAL' || userRole === 'ADMIN') {
                        endpoint = '/chat/staff';
                    }
                    // If no specific role match, will use public endpoint
                }
            }

            const response = await axios.post(
                BACKEND_URL + endpoint,
                { message: currentMessage },
                { headers }
            );

            const aiMessage: ChatMessage = {
                id: Date.now().toString() + '-ai',
                sender: 'ai',
                text: response.data.reply,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMessage]);
        } catch (err) {
            console.error('Error sending message:', err);
            let errorMessage = 'Sorry, an error occurred. Please try again later.';
            
            if (axios.isAxiosError(err) && err.response) {
                errorMessage = err.response.data.detail || errorMessage;
            }
            
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const toggleChat = () => {
        setIsOpen(!isOpen);
        setError(null);
    };

    const clearChat = () => {
        setMessages([]);
        // Re-add welcome message
        const welcomeMessage: ChatMessage = {
            id: 'welcome-new',
            sender: 'ai',
            text: getWelcomeMessage(),
            timestamp: new Date()
        };
        setMessages([welcomeMessage]);
        setError(null);
    };

    if (position === 'fixed') {
        return (
            <>
                {/* Chat Widget Button */}
                <button
                    className={`chatbot-toggle ${isOpen ? 'chatbot-toggle-open' : ''}`}
                    onClick={toggleChat}
                    aria-label="Toggle Chat"
                >
                    {isOpen ? '✕' : 'Chat'}
                </button>

                {/* Chat Window */}
                {isOpen && (
                    <div className="chatbot-window">
                        <div className="chatbot-header">
                            <div className="chatbot-header-info">
                                <span className="chatbot-avatar">AI</span>
                                <div>
                                    <h4>SeekWell Assistant</h4>
                                    <span className="chatbot-status">Online</span>
                                </div>
                            </div>
                            <div className="chatbot-header-actions">
                                <button
                                    onClick={clearChat}
                                    className="chatbot-action-btn"
                                    title="Clear chat history"
                                >
                                    Clear
                                </button>
                                <button
                                    onClick={toggleChat}
                                    className="chatbot-action-btn"
                                    title="Đóng chat"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        <div className="chatbot-messages">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`chatbot-message ${message.sender === 'user' ? 'chatbot-message-user' : 'chatbot-message-ai'}`}
                                >
                                    <div className="chatbot-message-content">
                                        {message.sender === 'ai' ? (
                                            <ReactMarkdown>{message.text}</ReactMarkdown>
                                        ) : (
                                            message.text
                                        )}
                                    </div>
                                    <div className="chatbot-message-time">
                                        {message.timestamp.toLocaleTimeString('vi-VN', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="chatbot-message chatbot-message-ai">
                                    <div className="chatbot-message-content chatbot-typing">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {error && (
                            <div className="chatbot-error">
                                {error}
                            </div>
                        )}

                        <div className="chatbot-input">
                            <textarea
                                value={currentMessage}
                                onChange={(e) => setCurrentMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder={placeholder}
                                disabled={isLoading}
                                rows={1}
                                className="chatbot-textarea"
                            />
                            <button
                                onClick={sendMessage}
                                disabled={isLoading || !currentMessage.trim()}
                                className="chatbot-send-btn"
                            >
                                {isLoading ? 'Sending...' : 'Send'}
                            </button>
                        </div>
                    </div>
                )}
            </>
        );
    }

    // Inline mode
    return (
        <div className={`chatbot-inline ${className}`}>
            <div className="chatbot-messages">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`chatbot-message ${message.sender === 'user' ? 'chatbot-message-user' : 'chatbot-message-ai'}`}
                    >
                        <div className="chatbot-message-content">
                            {message.sender === 'ai' ? (
                                <ReactMarkdown>{message.text}</ReactMarkdown>
                            ) : (
                                message.text
                            )}
                        </div>
                        <div className="chatbot-message-time">
                            {message.timestamp.toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="chatbot-message chatbot-message-ai">
                        <div className="chatbot-message-content chatbot-typing">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {error && (
                <div className="chatbot-error">
                    {error}
                </div>
            )}

            <div className="chatbot-input">
                <textarea
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={placeholder}
                    disabled={isLoading}
                    rows={1}
                    className="chatbot-textarea"
                />
                <button
                    onClick={sendMessage}
                    disabled={isLoading || !currentMessage.trim()}
                    className="chatbot-send-btn"
                >
                    {isLoading ? 'Sending...' : 'Send'}
                </button>
            </div>
        </div>
    );
};

export default ChatbotWidget;
