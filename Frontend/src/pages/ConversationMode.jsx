import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/app.css';

const ConversationMode = () => {
  const [conversation, setConversation] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('es');
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷' }
  ];

  // Scroll to bottom of conversation
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  // Initialize speech recognition
  const initSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = sourceLang;

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setUserInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        setError('Speech recognition error: ' + event.error);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    } else {
      console.error('Speech recognition not supported in this browser');
      setError('Speech recognition is not supported in your browser');
    }
  };

  useEffect(() => {
    initSpeechRecognition();
  }, [sourceLang]);

  const startListening = () => {
    if (recognitionRef.current) {
      setIsListening(true);
      setError('');
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        setIsListening(false);
        setError('Error starting speech recognition');
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
      }
      setIsListening(false);
    }
  };

  // Send message to backend for translation
  const sendMessage = async () => {
    if (!userInput.trim()) return;
    
    const userMessage = {
      id: Date.now(),
      text: userInput,
      sender: 'user',
      language: sourceLang,
      timestamp: new Date(),
      status: 'sending'
    };
    
    // Add user message to conversation immediately
    setConversation(prev => [...prev, userMessage]);
    setIsTranslating(true);
    setUserInput('');
    setError('');
    
    try {
      // Send to backend for translation
      const response = await fetch('http://localhost:5000/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: userInput,
          source_lang: sourceLang,
          target_lang: targetLang
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Translation failed');
      }
      
      const data = await response.json();
      
      // Update message status to sent
      setConversation(prev => 
        prev.map(msg => 
          msg.id === userMessage.id 
            ? { ...msg, status: 'sent' } 
            : msg
        )
      );
      
      // Add bot response
      const botResponse = {
        id: Date.now() + 1,
        text: data.translated_text,
        sender: 'bot',
        language: targetLang,
        timestamp: new Date(),
        status: 'received'
      };
      
      setConversation(prev => [...prev, botResponse]);
      
    } catch (error) {
      console.error('Translation error:', error);
      // Update message status to error
      setConversation(prev => 
        prev.map(msg => 
          msg.id === userMessage.id 
            ? { ...msg, status: 'error', error: error.message } 
            : msg
        )
      );
      setError(error.message || 'Translation failed. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearConversation = () => {
    setConversation([]);
    setError('');
  };

  const saveConversation = async () => {
    try {
      const response = await fetch('http://localhost:5000/save-conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation,
          source_lang: sourceLang,
          target_lang: targetLang
        })
      });
      
      if (response.ok) {
        alert('Conversation saved successfully!');
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save conversation');
      }
    } catch (error) {
      console.error('Save error:', error);
      setError(error.message || 'Error saving conversation.');
    }
  };

  const swapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    stopListening(); // Stop listening when languages are swapped
  };

  // Clean up speech recognition on component unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return (
    <div className="conversation-container">
      <div className="translator-header">
        <h1>Conversation Mode</h1>
        <p>Have a natural conversation with real-time translation</p>
      </div>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="conversation-content">
        {/* Language Controls */}
        <div className="conversation-controls">
          <div className="language-selectors">
            <div className="language-selector">
              <label htmlFor="source-lang">Your Language:</label>
              <select 
                id="source-lang" 
                value={sourceLang} 
                onChange={(e) => setSourceLang(e.target.value)}
                className="language-dropdown"
                disabled={isTranslating || isListening}
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>
            
            <button onClick={swapLanguages} className="swap-languages-btn" disabled={isTranslating || isListening}>
              ⇄
            </button>
            
            <div className="language-selector">
              <label htmlFor="target-lang">Their Language:</label>
              <select 
                id="target-lang" 
                value={targetLang} 
                onChange={(e) => setTargetLang(e.target.value)}
                className="language-dropdown"
                disabled={isTranslating || isListening}
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="conversation-actions">
            <button onClick={clearConversation} className="action-button" disabled={isTranslating || isListening}>
              Clear Chat
            </button>
            <button onClick={saveConversation} className="action-button primary" disabled={conversation.length === 0 || isTranslating || isListening}>
              Save Conversation
            </button>
          </div>
        </div>

        {/* Conversation Window */}
        <div className="conversation-window">
          <div className="conversation-header">
            <h3>Live Conversation</h3>
            <div className="conversation-status">
              <div className={`status-indicator ${isTranslating ? 'translating' : 'active'}`}></div>
              <span>{isTranslating ? 'Translating...' : 'Active'}</span>
            </div>
          </div>

          <div className="messages-container">
            {conversation.length === 0 ? (
              <div className="empty-conversation">
                <div className="empty-icon">💬</div>
                <p>Start a conversation by typing or speaking below</p>
                <p>Your words will be translated in real-time</p>
              </div>
            ) : (
              <AnimatePresence>
                {conversation.map(message => (
                  <motion.div 
                    key={message.id}
                    className={`message ${message.sender}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: message.sender === 'user' ? -50 : 50 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="message-bubble">
                      <div className="message-text">
                        <p>{message.text}</p>
                        {message.status === 'sending' && (
                          <div className="message-status">
                            <div className="typing-dots">
                              <span></span>
                              <span></span>
                              <span></span>
                            </div>
                          </div>
                        )}
                        {message.status === 'error' && (
                          <div className="message-status error">
                            ❌ {message.error || 'Translation failed'}
                          </div>
                        )}
                      </div>
                      <div className="message-meta">
                        <span className="message-time">
                          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="message-language">
                          {languages.find(l => l.code === message.language)?.name}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="input-area">
            <div className="text-input-container">
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message or click the mic to speak..."
                className="message-input"
                rows="1"
                disabled={isTranslating || isListening}
              />
              <div className="input-actions">
                <button 
                  onClick={isListening ? stopListening : startListening}
                  className={`voice-button ${isListening ? 'listening' : ''}`}
                  disabled={isTranslating}
                  type="button"
                >
                  {isListening ? (
                    <div className="pulse-ring">
                      <span>⏹</span>
                    </div>
                  ) : (
                    '🎤'
                  )}
                </button>
                <button 
                  onClick={sendMessage}
                  disabled={!userInput.trim() || isTranslating || isListening}
                  className="send-button"
                  type="button"
                >
                  {isTranslating ? (
                    <div className="sending-animation">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  ) : (
                    'Send'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Phrases */}
        <div className="quick-phrases">
          <h3>Quick Phrases</h3>
          <div className="phrase-buttons">
            {[
              'Hello', 'Thank you', 'How much?', 
              'Where is the bathroom?', 'I need help',
              'Goodbye', 'Please', 'Excuse me'
            ].map(phrase => (
              <button 
                key={phrase}
                onClick={() => setUserInput(phrase)}
                className="phrase-button"
                disabled={isTranslating || isListening}
                type="button"
              >
                {phrase}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationMode;