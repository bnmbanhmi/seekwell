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
            return `Hello! I am the AI assistant for SeekWell.

I can help you with:
- **Information about SeekWell** (services, how it works)
- **Guidance on using the AI skin analysis**
- **Basic skin health advice**
- **Frequently asked questions**

Feel free to ask me anything!`;
        }

        switch (userRole) {
            case 'PATIENT':
                return `Hello! I am your personal AI assistant at SeekWell.

I can help you with:
- **Understanding your skin health**
- **Guiding you through the skin analysis process**
- **Explaining your AI results**
- **Preparing for your consultation**

Just ask, and I'll assist you!`;

            case 'DOCTOR':
            case 'LOCAL_CADRE':
            case 'ADMIN':
                return `Welcome! I am the AI assistant for healthcare professionals at SeekWell.

I can assist with:
- **Reviewing AI-based preliminary diagnoses**
- **Accessing medical information**
- **Navigating operational procedures**
- **Managing patient cases**

I'm here to support your work!`;

            default:
                return `Hello! I am the SeekWell AI assistant. 

I can provide general information about our platform and skin health. How can I help you today?`;
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
                    }
                    // For staff roles, we could use a different endpoint or the existing one
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
            let errorMessage = 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.';
            
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
                                    <h4>Trợ lý Phòng khám</h4>
                                    <span className="chatbot-status">Trực tuyến</span>
                                </div>
                            </div>
                            <div className="chatbot-header-actions">
                                <button
                                    onClick={clearChat}
                                    className="chatbot-action-btn"
                                    title="Xóa lịch sử chat"
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
