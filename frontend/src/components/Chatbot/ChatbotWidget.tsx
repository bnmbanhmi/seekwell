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
            return `👋 Hello! I'm your SeekWell AI assistant for community health.

🔍 **What I can help with:**
- Learn about **SeekWell's AI skin cancer detection**
- Get guidance on **capturing photos** for analysis
- Understand **skin health basics** and prevention
- Find **community health centers** and services
- Connect with **local health cadres** in your area

💡 **About SeekWell:** We're building a network of AI-powered community health services across ASEAN, focusing on early skin cancer detection and connecting you with local health workers.

How can I assist you today? 🌟`;
        }

        switch (userRole) {
            case 'PATIENT':
                return `👋 Welcome back! I'm your personal SeekWell health assistant.

🏥 **I can help you with:**
- **Track your health journey** and AI analysis results
- **Prepare for visits** with community health cadres
- **Understand your skin health** and prevention tips
- **Schedule appointments** with local health workers
- **Navigate the referral pathway** to specialists when needed

📱 **Quick Tips:** 
- Use the mobile-friendly skin analysis anytime
- Your local health cadre can provide follow-up care
- Regular check-ups help catch issues early

What would you like to know today? 💚`;

            case 'OFFICIAL':
                return `🌟 Welcome, Health Official! I'm here to support your vital work.

🤝 **I can assist with:**
- Understanding AI analysis results.
- Guidance on how to handle urgent cases.
- Information on connecting with doctors for case reviews.

How can I support you today? 🌟`;

            case 'DOCTOR':
                return `👩‍⚕️ Welcome, Doctor! I'm your clinical support assistant.

🏥 **I can help with:**
- Reviewing urgent cases flagged by the AI.
- Accessing patient analysis history.
- Understanding the AI model's performance.

What clinical support do you need today? 🩺`;

            case 'ADMIN':
                return `⚙️ Welcome, Administrator! I'm your SeekWell system management assistant.

📊 **I can help with:**
- **System analytics** and performance monitoring
- **Cadre management** - assignments, training, coverage
- **Health center network** coordination and resources
- **User management** and access control
- **Data insights** and community health trends
- **Platform configuration** and workflow optimization

🌐 **System Overview:** You're managing a community health network that combines AI technology with human expertise to serve ASEAN communities effectively.

What would you like to manage today? 🛠️`;

            default:
                return `👋 Hello! I'm the SeekWell AI assistant for community health.

🌟 I can provide information about our platform, community health services, and skin health guidance. How can I help you today?`;
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
