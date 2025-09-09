import { useState, useEffect } from 'react';
import '../styles/app.css';

const ImageTranslator = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [targetLang, setTargetLang] = useState('en');
  const [backendStatus, setBackendStatus] = useState({ status: 'unknown' });
  const [audioUrl, setAudioUrl] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'ja', name: 'Japanese' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ar', name: 'Arabic' },
    { code: 'ru', name: 'Russian' },
    { code: 'ur', name: 'Urdu' },
    { code: 'hi', name: 'Hindi' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' }
  ];

  useEffect(() => {
    checkBackendStatus();
  }, []);

  const checkBackendStatus = async () => {
    try {
      const response = await fetch('http://localhost:5001/health');
      if (response.ok) {
        const data = await response.json();
        setBackendStatus(data);
      } else {
        setBackendStatus({ status: 'error' });
      }
    } catch (error) {
      console.error('Backend not available:', error);
      setBackendStatus({ status: 'error' });
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const getErrorMessage = (error) => {
    if (error.message.includes('Failed to fetch')) {
      return 'Cannot connect to the server. Please make sure the backend is running.';
    } else if (error.message.includes('No text could be extracted')) {
      return 'No text could be extracted from the image. Please try a clearer image.';
    } else {
      return error.message || 'An unexpected error occurred. Please try again.';
    }
  };

  const handleTranslateImage = async () => {
    if (!selectedImage) return;

    setIsProcessing(true);
    setExtractedText('');
    setTranslatedText('');
    setAudioUrl(null);
    setErrorMessage('');

    try {
      const response = await fetch(selectedImage);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append('image', blob, 'image.png');
      formData.append('target_lang', targetLang);

      const translateResponse = await fetch('http://localhost:5001/image-translate', {
        method: 'POST',
        body: formData,
      });

      if (!translateResponse.ok) {
        const errorData = await translateResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned ${translateResponse.status}`);
      }

      const data = await translateResponse.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setExtractedText(data.extracted_text || 'No text extracted');
      setTranslatedText(data.translated_text || 'Translation failed');

    } catch (error) {
      console.error('Error processing image:', error);
      const errorMessage = getErrorMessage(error);
      setErrorMessage(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const generateSpeech = async (text) => {
    try {
      const response = await fetch('http://localhost:5001/image-text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          lang: targetLang,
        }),
      });

      if (!response.ok) {
        throw new Error(`TTS service returned ${response.status}`);
      }

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }

      setAudioUrl(url);

      const audio = new Audio(url);
      audio.play();
    } catch (error) {
      console.error('Error generating speech:', error);
      alert('Error generating speech. Please try again.');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        alert('Text copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  };

  return (
    <div className="image-translator-container">
      <div className="translator-header">
        <h1>Image Translator</h1>
        <p>Translate text from images, signs, menus, and more</p>
        <div className={`backend-status ${backendStatus.status}`}>
          Backend Status: {backendStatus.status === 'OK' ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      <div className="image-translator-content">
        <div className="language-selector">
          <label htmlFor="target-lang">Translate to:</label>
          <select
            id="target-lang"
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            disabled={isProcessing}
          >
            {languages.map(lang => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </select>
        </div>

        <div className="image-translator-main">
          <div className="upload-section">
            <h3>Upload or Capture Image</h3>
            <div className="upload-options">
              <label htmlFor="image-upload" className="upload-button">
                📁 Upload Image
              </label>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
                disabled={isProcessing || backendStatus.status !== 'OK'}
              />
            </div>

            {selectedImage && (
              <div className="image-preview">
                <img src={selectedImage} alt="Uploaded for translation" />
                <button
                  onClick={() => setSelectedImage(null)}
                  className="remove-image-button"
                  disabled={isProcessing}
                >
                  ×
                </button>
              </div>
            )}
          </div>

          <div className="translation-section">
            <h3>Extracted Text & Translation</h3>
            <div className="translation-result"
              style={{
                minHeight: "200px",
                border: "2px solid #f0f0f0",
                borderRadius: "12px",
                padding: "1.2rem",
                marginBottom: "1.5rem",
                background: "#f9f9f9",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
              }}
            >
              {isProcessing ? (
                <div className="processing-animation">
                  <div className="scanning-effect"></div>
                  <p>Scanning and translating text...</p>
                </div>
              ) : (
                <>
                  {errorMessage && (
                    <div className="error-message" style={{ color: "red", fontWeight: "bold" }}>
                      {errorMessage}
                    </div>
                  )}
                  {extractedText && (
                    <div
                      style={{
                        padding: "1rem",
                        background: "#fff",
                        borderRadius: "10px",
                        border: "1px solid #ddd",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.08)"
                      }}
                    >
                      <h4 style={{ marginBottom: "0.6rem", color: "#333" }}>Original Text:</h4>
                      <p style={{ margin: 0, lineHeight: "1.6", color: "#444" }}>{extractedText}</p>
                    </div>
                  )}
                  {translatedText && (
                    <div
                      style={{
                        padding: "1rem",
                        background: "#fff",
                        borderRadius: "10px",
                        border: "1px solid #ddd",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.08)"
                      }}
                    >
                      <h4 style={{ marginBottom: "0.6rem", color: "#333" }}>Translation:</h4>
                      <p style={{ margin: 0, lineHeight: "1.6", color: "#444" }}>{translatedText}</p>

                      <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "0.8rem" }}>
                        <button className="copy-button" onClick={() => copyToClipboard(translatedText)}>
                          Copy Text
                        </button>
                        <button className="speak-button" onClick={() => generateSpeech(translatedText)}>
                          Speak
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <button
              onClick={handleTranslateImage}
              disabled={!selectedImage || isProcessing || backendStatus.status !== 'OK'}
              className="translate-image-button"
            >
              {isProcessing ? 'Processing...' : 'Translate Text'}
            </button>
          </div>
        </div>

        <div className="usage-tips">
          <h3>Tips for Best Results</h3>
          <ul>
            <li>Ensure text is clear and well-lit</li>
            <li>Hold camera steady when capturing</li>
            <li>For best accuracy, focus on one text area at a time</li>
            <li>Use high contrast between text and background</li>
          </ul>
        </div>

        <div className="recent-translations">
          <h3>Recent Image Translations</h3>
          <div className="recent-items">
            <div className="recent-item">
              <div className="recent-thumbnail"></div>
              <div className="recent-details">
                <p>Menu translation</p>
                <span>2 hours ago</span>
              </div>
            </div>
            <div className="recent-item">
              <div className="recent-thumbnail"></div>
              <div className="recent-details">
                <p>Sign translation</p>
                <span>1 day ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageTranslator;
