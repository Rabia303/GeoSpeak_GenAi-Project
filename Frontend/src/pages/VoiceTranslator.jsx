
import { useState, useRef, useEffect } from 'react';
import '../styles/app.css';

const VoiceTranslator = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('es');
  const [transcript, setTranscript] = useState('');
  const [translation, setTranslation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [backendStatus, setBackendStatus] = useState({ status: 'unknown', ffmpeg_available: false });
  const [isPlaying, setIsPlaying] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const audioRef = useRef(null);

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
    { code: 'pt', name: 'Portuguese' },
    { code: 'ko', name: 'Korean' }
  ];

  // Check backend status on component mount
  useEffect(() => {
    checkBackendStatus();
    
    // Clean up on component unmount
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Setup audio event listeners
    const audioElement = audioRef.current;
    if (audioElement) {
      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      const handleEnded = () => setIsPlaying(false);
      
      audioElement.addEventListener('play', handlePlay);
      audioElement.addEventListener('pause', handlePause);
      audioElement.addEventListener('ended', handleEnded);
      
      return () => {
        audioElement.removeEventListener('play', handlePlay);
        audioElement.removeEventListener('pause', handlePause);
        audioElement.removeEventListener('ended', handleEnded);
      };
    }
  }, [audioUrl]);

  const checkBackendStatus = async () => {
    try {
      const response = await fetch('http://localhost:5000/health');
      if (response.ok) {
        const data = await response.json();
        setBackendStatus(data);
      } else {
        setBackendStatus({ status: 'error', ffmpeg_available: false });
      }
    } catch (error) {
      console.error('Backend not available:', error);
      setBackendStatus({ status: 'error', ffmpeg_available: false });
    }
  };

  const startRecording = async () => {
    try {
      // Check backend status before recording
      if (backendStatus.status !== 'OK') {
        alert('Backend service is not available. Please make sure the server is running on port 5000.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          sampleSize: 16,
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      
      const options = { mimeType: 'audio/webm;codecs=opus' };
      const mediaRecorder = new MediaRecorder(stream, options);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        // Don't process automatically - wait for translate button
        setIsRecording(false);
        
        // Clear recording timer
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
      };
      
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
        setIsRecording(false);
        alert('Recording error. Please try again.');
      };
      
      // Start recording
      mediaRecorder.start(100); // Collect data in 100ms chunks
      setIsRecording(true);
      
      // Start recording timer
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      if (error.name === 'NotAllowedError') {
        alert('Microphone access denied. Please allow microphone access to use this feature.');
      } else {
        alert('Error accessing microphone. Please check your audio settings and try again.');
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const processRecording = async () => {
    setIsLoading(true);
    setIsTranslating(true);
    setTranscript('');
    setTranslation('');
    setAudioUrl(null);
    
    try {
      if (audioChunksRef.current.length === 0) {
        throw new Error('No audio data recorded');
      }

      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');
      formData.append('source_lang', sourceLang);
      formData.append('target_lang', targetLang);

      // Send to backend for transcription and translation
      const response = await fetch('http://localhost:5000/translate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      setTranscript(data.transcript);
      setTranslation(data.translated_text);
      
      // Generate speech from translation
      if (data.translated_text && !data.translated_text.includes('Error')) {
        await generateSpeech(data.translated_text, targetLang);
      }
    } catch (error) {
      console.error('Error processing recording:', error);
      setTranscript('Error processing audio. Please try again.');
      setTranslation('Translation failed. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
      setIsTranslating(false);
    }
  };

  const generateSpeech = async (text, lang) => {
    try {
      const response = await fetch('http://localhost:5000/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          lang: lang,
        }),
      });

      if (!response.ok) {
        throw new Error(`TTS service returned ${response.status}`);
      }

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      
      // Clean up previous audio URL if exists
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      
      setAudioUrl(url);
    } catch (error) {
      console.error('Error generating speech:', error);
      alert('Error generating speech. Please try again.');
    }
  };

  const playTranslation = () => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play().catch(e => console.error('Error playing audio:', e));
    }
  };

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const swapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setTranscript('');
    setTranslation('');
    setAudioUrl(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const handlePhraseClick = async (phrase) => {
    setIsLoading(true);
    setTranscript(phrase);
    setTranslation('');
    setAudioUrl(null);
    
    try {
      // Translate the phrase
      const response = await fetch('http://localhost:5000/text-translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: phrase,
          source_lang: sourceLang,
          target_lang: targetLang,
        }),
      });

      if (!response.ok) {
        throw new Error(`Translation service returned ${response.status}`);
      }

      const data = await response.json();
      setTranslation(data.translated_text);
      
      // Generate speech from translation
      if (data.translated_text) {
        await generateSpeech(data.translated_text, targetLang);
      }
    } catch (error) {
      console.error('Error translating phrase:', error);
      setTranslation('Translation failed. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="voice-translator-container">
      <div className="translator-header">
        <h1>Voice Translator</h1>
        <p>Speak in your language, hear the translation instantly</p>
        <div className={`backend-status ${backendStatus.status}`}>
          Backend Status: {backendStatus.status === 'OK' ? 'Connected' : 'Disconnected'}
          {backendStatus.status === 'OK' && (
            <span className="ffmpeg-status">
              {backendStatus.ffmpeg_available ? ' (FFmpeg available)' : ' (FFmpeg not available)'}
            </span>
          )}
        </div>
      </div>

      <div className="voice-translator-content">
        <div className="language-selectors">
          <div className="language-selector">
            <label htmlFor="source-lang">Speak:</label>
            <select 
              id="source-lang" 
              value={sourceLang} 
              onChange={(e) => setSourceLang(e.target.value)}
              disabled={isRecording || isLoading}
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
          </div>
          
          <div className="swap-languages">
            <button onClick={swapLanguages} disabled={isRecording || isLoading}>⇄</button>
          </div>
          
          <div className="language-selector">
            <label htmlFor="target-lang">Hear:</label>
            <select 
              id="target-lang" 
              value={targetLang} 
              onChange={(e) => setTargetLang(e.target.value)}
              disabled={isRecording || isLoading}
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="voice-translator-main">
          <div className="mic-section">
            <div className={`mic-button ${isRecording ? 'recording' : ''}`}>
              <button 
                onClick={isRecording ? stopRecording : startRecording}
                className="mic-circle"
                disabled={isLoading || backendStatus.status !== 'OK'}
              >
                <div className="mic-icon">
                  {isRecording ? '⏹' : '🎤'}
                </div>
                {isRecording && (
                  <div className="recording-time">{formatTime(recordingTime)}</div>
                )}
              </button>
              {isRecording && (
                <div className="recording-animation">
                  <div className="pulse-ring"></div>
                  <div className="pulse-ring delay-1"></div>
                  <div className="pulse-ring delay-2"></div>
                </div>
              )}
            </div>
            <p className="mic-status">
              {isLoading ? 'Processing...' : 
               isRecording ? 'Listening... Speak now' : 
               backendStatus.status !== 'OK' ? 'Backend not available' : 'Tap to start speaking'}
            </p>
            
            {audioChunksRef.current.length > 0 && !isRecording && (
              <div className="translation-controls">
                <button 
                  onClick={processRecording}
                  disabled={isTranslating || backendStatus.status !== 'OK'}
                  className="translate-button"
                >
                  {isTranslating ? 'Translating...' : 'Start Translation'}
                </button>
              </div>
            )}
          </div>

          <div className="translation-result">
            <div className="transcript-section">
              <h3>What you said:</h3>
              <div className="transcript-text">
                {transcript || 'Speech will appear here...'}
              </div>
            </div>

            <div className="translation-section">
              <h3>Translation:</h3>
              <div className="translation-text">
                {translation || 'Translation will appear here...'}
              </div>
              {audioUrl && (
                <div className="audio-controls">
                  <button 
                    onClick={isPlaying ? stopPlayback : playTranslation} 
                    className={`play-button ${isPlaying ? 'playing' : ''}`}
                  >
                    {isPlaying ? '⏹ Stop' : '▶ Listen'} in {languages.find(l => l.code === targetLang)?.name}
                  </button>
                  <audio 
                    ref={audioRef} 
                    src={audioUrl} 
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="saved-phrases-section">
          <h3>Common Phrases</h3>
          <div className="phrase-chips">
            <button 
              className="phrase-chip" 
              onClick={() => handlePhraseClick('Hello')}
              disabled={isLoading || isRecording || backendStatus.status !== 'OK'}
            >
              Hello
            </button>
            <button 
              className="phrase-chip" 
              onClick={() => handlePhraseClick('Thank you')}
              disabled={isLoading || isRecording || backendStatus.status !== 'OK'}
            >
              Thank you
            </button>
            <button 
              className="phrase-chip" 
              onClick={() => handlePhraseClick('Where is the bathroom?')}
              disabled={isLoading || isRecording || backendStatus.status !== 'OK'}
            >
              Where is...?
            </button>
            <button 
              className="phrase-chip" 
              onClick={() => handlePhraseClick('How much does this cost?')}
              disabled={isLoading || isRecording || backendStatus.status !== 'OK'}
            >
              How much?
            </button>
            <button 
              className="phrase-chip" 
              onClick={() => handlePhraseClick('I need help')}
              disabled={isLoading || isRecording || backendStatus.status !== 'OK'}
            >
              I need help
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceTranslator;