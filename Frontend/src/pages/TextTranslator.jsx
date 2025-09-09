
import { useState, useEffect } from 'react';
import '../styles/app.css';

const TextTranslator = () => {
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('ur');
  const [isTranslating, setIsTranslating] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [error, setError] = useState('');
  const [languages, setLanguages] = useState([]);
  const [serverStatus, setServerStatus] = useState('checking');

  // Check server status and fetch supported languages on component mount
  useEffect(() => {
    checkServerStatus();
  }, []);

  const checkServerStatus = async () => {
    try {
      const response = await fetch('http://localhost:5001/health');
      if (response.ok) {
        setServerStatus('online');
        fetchSupportedLanguages();
      } else {
        setServerStatus('offline');
        setError('Translation server is offline. Please make sure the backend server is running.');
        loadFallbackLanguages();
      }
    } catch (err) {
      setServerStatus('offline');
      setError('Cannot connect to translation server. Please make sure the backend server is running on port 5001.');
      loadFallbackLanguages();
    }
  };

  const loadFallbackLanguages = () => {
    setLanguages([
      { code: 'auto', name: 'Auto Detect' },
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Spanish' },
      { code: 'fr', name: 'French' },
      { code: 'de', name: 'German' },
      { code: 'it', name: 'Italian' },
      { code: 'pt', name: 'Portuguese' },
      { code: 'ru', name: 'Russian' },
      { code: 'zh', name: 'Chinese' },
      { code: 'ja', name: 'Japanese' },
      { code: 'ko', name: 'Korean' },
      { code: 'ar', name: 'Arabic' },
      { code: 'hi', name: 'Hindi' },
      { code: 'ur', name: 'Urdu' },
      { code: 'tr', name: 'Turkish' },
      { code: 'nl', name: 'Dutch' },
      { code: 'sv', name: 'Swedish' },
      { code: 'pl', name: 'Polish' },
      { code: 'id', name: 'Indonesian' },
      { code: 'vi', name: 'Vietnamese' },
      { code: 'th', name: 'Thai' },
    ]);
  };

  const fetchSupportedLanguages = async () => {
    try {
      const response = await fetch('http://localhost:5001/languages');
      if (response.ok) {
        const data = await response.json();
        setLanguages(data);
      } else {
        loadFallbackLanguages();
      }
    } catch (err) {
      console.error('Error fetching languages:', err);
      loadFallbackLanguages();
    }
  };

  const handleTranslate = async () => {
    if (!inputText.trim()) {
      setError('Please enter text to translate');
      return;
    }
    
    if (serverStatus === 'offline') {
      setError('Translation server is offline. Please start the backend server.');
      return;
    }
    
    setIsTranslating(true);
    setError('');
    
    try {
      const requestBody = {
        text: inputText,
        target_lang: targetLang,
      };
      
      // Only include source_lang if it's not auto
      if (sourceLang !== 'auto') {
        requestBody.source_lang = sourceLang;
      }
      
      const response = await fetch('http://localhost:5001/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Translation failed. Please try again.');
      }
      
      const data = await response.json();
      setTranslatedText(data.translated_text);
    } catch (err) {
      console.error('Translation error:', err);
      setError(err.message || 'Failed to translate text. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSwapLanguages = () => {
    // Store current values
    const currentSource = sourceLang;
    const currentTarget = targetLang;
    const currentInput = inputText;
    const currentTranslated = translatedText;
    
    // Swap source and target languages
    setSourceLang(currentTarget);
    setTargetLang(currentSource === 'auto' ? 'en' : currentSource);
    
    // Also swap the text if we have a translation
    if (currentTranslated) {
      setInputText(currentTranslated);
      setTranslatedText(currentInput);
    }
  };

  const handleInputChange = (e) => {
    const text = e.target.value;
    setInputText(text);
    setCharCount(text.length);
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(translatedText);
    // Show success message
    alert('Copied to clipboard!');
  };

  const handleClearText = () => {
    setInputText('');
    setTranslatedText('');
    setCharCount(0);
    setError('');
  };

  const handleRetryConnection = () => {
    setServerStatus('checking');
    setError('');
    checkServerStatus();
  };

  return (
    <div className="translator-container">
      <div className="translator-header">
        <h1>Text Translator</h1>
        <p>Translate text between 20+ languages instantly</p>
      </div>

      {serverStatus === 'offline' && (
        <div className="server-error">
          <strong>Server Offline:</strong> Translation server is not running. 
          <button onClick={handleRetryConnection} className="retry-button">
            Retry Connection
          </button>
        </div>
      )}

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
          <button onClick={() => setError('')} className="dismiss-error">×</button>
        </div>
      )}

      <div className="translator-content">
        <div className="language-selectors">
          <div className="language-selector">
            <label htmlFor="source-lang">From:</label>
            <select 
              id="source-lang" 
              value={sourceLang} 
              onChange={(e) => setSourceLang(e.target.value)}
              disabled={isTranslating}
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
          </div>
          
          <div className="swap-languages">
            <button 
              onClick={handleSwapLanguages} 
              disabled={isTranslating}
              title="Swap languages"
              className="swap-btn"
            >
              ⇄
            </button>
          </div>
          
          <div className="language-selector">
            <label htmlFor="target-lang">To:</label>
            <select 
              id="target-lang" 
              value={targetLang} 
              onChange={(e) => setTargetLang(e.target.value)}
              disabled={isTranslating}
            >
              {languages.filter(l => l.code !== 'auto').map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="translation-panels">
          <div className="input-panel">
            <div className="panel-header">
              <h3>Original Text</h3>
              <span className="char-count">{charCount}/5000</span>
            </div>
            <textarea
              value={inputText}
              onChange={handleInputChange}
              placeholder="Enter text to translate..."
              maxLength={5000}
              className="translation-textarea"
              disabled={isTranslating}
              rows={8}
            />
            <div className="input-actions">
              <button 
                onClick={handleClearText} 
                disabled={!inputText || isTranslating}
                className="clear-button"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="output-panel">
            <div className="panel-header">
              <h3>Translation</h3>
              <div className="output-actions">
                <button 
                  onClick={handleCopy} 
                  disabled={!translatedText || isTranslating} 
                  className="icon-button" 
                  title="Copy to clipboard"
                >
                  📋
                </button>
              </div>
            </div>
            <div className="translation-output">
              {isTranslating ? (
                <div className="loading-animation">
                  <div className="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <p>Translating...</p>
                </div>
              ) : (
                <div className="translated-text">
                  {translatedText || 'Translation will appear here...'}
                </div>
              )}
            </div>
            <div className="output-actions-bottom">
              <button 
                onClick={handleTranslate} 
                disabled={!inputText.trim() || isTranslating || serverStatus === 'offline'}
                className="translate-button"
              >
                {isTranslating ? 'Translating...' : 'Translate'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextTranslator;