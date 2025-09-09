import { useState, useEffect } from 'react'; 
import { 
  FaHandPeace, 
  FaUtensils, 
  FaCar, 
  FaShoppingCart, 
  FaFirstAid, 
  FaCompass, 
  FaHotel, 
  FaSortNumericDown,
  FaVolumeUp,
  FaStar,
  FaRegStar,
  FaDownload,
  FaGlobe,
  FaClock,
  FaCloudSun,
  FaHeart,
  FaBriefcase
} from 'react-icons/fa';
import '../styles/app.css';

// API base URL
const API_BASE = 'http://localhost:5002';

const Phrasebook = () => {
  const [selectedCategory, setSelectedCategory] = useState('greetings');
  const [favorites, setFavorites] = useState([]);
  const [targetLang, setTargetLang] = useState('es');
  const [practiceQuestion, setPracticeQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [phrases, setPhrases] = useState({});
  const [categories, setCategories] = useState([]);
  const [practiceQuestions, setPracticeQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFavorites, setShowFavorites] = useState(false);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'ja', name: 'Japanese' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ar', name: 'Arabic' },
    { code: 'ru', name: 'Russian' }
  ];

  // Default categories in case API fails
// In your Phrasebook.jsx, update the defaultCategories array:
const defaultCategories = [
  { id: 'greetings', name: 'Greetings', icon: <FaHandPeace /> },
  { id: 'food', name: 'Food & Dining', icon: <FaUtensils /> },
  { id: 'transportation', name: 'Transportation', icon: <FaCar /> },
  { id: 'shopping', name: 'Shopping', icon: <FaShoppingCart /> },
  { id: 'emergency', name: 'Emergency', icon: <FaFirstAid /> },
  { id: 'directions', name: 'Directions', icon: <FaCompass /> },
  { id: 'accommodation', name: 'Accommodation', icon: <FaHotel /> },
  { id: 'numbers', name: 'Numbers', icon: <FaSortNumericDown /> },
  { id: 'time', name: 'Time & Dates', icon: <FaClock /> },
  { id: 'weather', name: 'Weather', icon: <FaCloudSun /> },
  { id: 'health', name: 'Health', icon: <FaHeart /> },
  { id: 'business', name: 'Business', icon: <FaBriefcase /> }
];

  // Default phrases in case API fails
  const defaultPhrases = {
    greetings: [
      { id: 1, english: 'Hello', translation: 'Hola', pronunciation: 'OH-lah' },
      { id: 2, english: 'Good morning', translation: 'Buenos días', pronunciation: 'BWEH-nos DEE-as' },
      { id: 3, english: 'Good evening', translation: 'Buenas tardes', pronunciation: 'BWEH-nas TAR-des' },
      { id: 4, english: 'How are you?', translation: '¿Cómo estás?', pronunciation: 'KOH-mo es-TAS' },
      { id: 5, english: 'My name is...', translation: 'Me llamo...', pronunciation: 'meh YAH-mo' },
      { id: 6, english: 'Nice to meet you', translation: 'Mucho gusto', pronunciation: 'MOO-cho GOOS-to' }
    ],
    food: [
      { id: 7, english: 'I would like to order', translation: 'Me gustaría ordenar', pronunciation: 'meh goos-ta-REE-ah or-den-AR' },
      { id: 8, english: 'The menu, please', translation: 'El menú, por favor', pronunciation: 'el meh-NOO por fa-VOR' },
      { id: 9, english: 'What do you recommend?', translation: '¿Qué recomienda?', pronunciation: 'keh reh-koh-MYEN-da' },
      { id: 10, english: 'I am vegetarian', translation: 'Soy vegetariano/a', pronunciation: 'soy veh-he-ta-RYAH-no/na' },
      { id: 11, english: 'Cheers!', translation: '¡Salud!', pronunciation: 'sa-LOOD' },
      { id: 12, english: 'The bill, please', translation: 'La cuenta, por favor', pronunciation: 'la KWEN-ta por fa-VOR' }
    ],
    emergency: [
      { id: 13, english: 'Help!', translation: '¡Ayuda!', pronunciation: 'ah-YOO-da' },
      { id: 14, english: 'I need a doctor', translation: 'Necesito un médico', pronunciation: 'neh-seh-SEE-to oon MEH-dee-ko' },
      { id: 15, english: 'Call the police', translation: 'Llame a la policía', pronunciation: 'YAH-meh a la po-lee-SEE-ah' },
      { id: 16, english: 'Where is the hospital?', translation: '¿Dónde está el hospital?', pronunciation: 'DON-deh es-TA el os-pee-TAL' },
      { id: 17, english: 'I am lost', translation: 'Estoy perdido/a', pronunciation: 'es-TOY per-DEE-do/da' }
    ],
    transportation: [
    { id: 41, english: 'Where is the bus stop?', translation: '¿Dónde está la parada de autobús?', pronunciation: 'DON-deh es-TA la pa-RA-da de ow-to-BOOS' },
    { id: 42, english: 'How much is a ticket?', translation: '¿Cuánto cuesta un boleto?', pronunciation: 'KWAN-to KWES-ta oon bo-LE-to' }
  ],
  shopping: [
    { id: 61, english: 'How much does this cost?', translation: '¿Cuánto cuesta esto?', pronunciation: 'KWAN-to KWES-ta ES-to' },
    { id: 62, english: 'Do you accept credit cards?', translation: '¿Aceptan tarjetas de crédito?', pronunciation: 'a-SEP-tan tar-HE-tas de CRE-di-to' }
  ],

  directions: [
    { id: 101, english: 'Where is...?', translation: '¿Dónde está...?', pronunciation: 'DON-deh es-TA' },
    { id: 102, english: 'How do I get to...?', translation: '¿Cómo llego a...?', pronunciation: 'KO-mo YE-go a' }
  ],
  accommodation: [
    { id: 121, english: 'I have a reservation', translation: 'Tengo una reservación', pronunciation: 'TEN-go oo-na re-ser-va-SYON' },
    { id: 122, english: 'Do you have any rooms available?', translation: '¿Tienen habitaciones disponibles?', pronunciation: 'TYE-nen a-bee-ta-SYO-nes dis-po-nee-BLES' }
  ],
  numbers: [
    { id: 141, english: 'One', translation: 'Uno', pronunciation: 'OO-no' },
    { id: 142, english: 'Two', translation: 'Dos', pronunciation: 'DOS' },
    { id: 143, english: 'Three', translation: 'Tres', pronunciation: 'TRES' }
  ]
  };

  // Default practice questions in case API fails
  const defaultPracticeQuestions = [
    {
      question: 'How would you say "Hello" in Spanish?',
      options: ['Hola', 'Adiós', 'Gracias'],
      correctAnswer: 0
    },
    {
      question: 'How would you say "Thank you" in Japanese?',
      options: ['Konnichiwa', 'Arigato', 'Sayonara'],
      correctAnswer: 1
    },
    {
      question: 'How would you say "Good morning" in French?',
      options: ['Bonsoir', 'Bonjour', 'Bonne nuit'],
      correctAnswer: 1
    }
  ];

  // Fetch data from backend on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Try to fetch from API, fall back to defaults if it fails
        try {
          const [categoriesRes, phrasesRes, practiceRes, favoritesRes] = await Promise.all([
            fetch(`${API_BASE}/api/categories`).then(res => {
              if (!res.ok) throw new Error('Categories fetch failed');
              return res.json();
            }),
            fetch(`${API_BASE}/api/phrases`).then(res => {
              if (!res.ok) throw new Error('Phrases fetch failed');
              return res.json();
            }),
            fetch(`${API_BASE}/api/practice-questions`).then(res => {
              if (!res.ok) throw new Error('Practice questions fetch failed');
              return res.json();
            }),
            fetch(`${API_BASE}/api/favorites`).then(res => {
              if (!res.ok) throw new Error('Favorites fetch failed');
              return res.json();
            })
          ]);

          setCategories(categoriesRes);
          setPhrases(phrasesRes);
          setPracticeQuestions(practiceRes);
          setFavorites(favoritesRes);
        } catch (apiError) {
          console.warn('API not available, using default data:', apiError);
          setCategories(defaultCategories);
          setPhrases(defaultPhrases);
          setPracticeQuestions(defaultPracticeQuestions);
          setFavorites([]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Using default phrases.');
        setCategories(defaultCategories);
        setPhrases(defaultPhrases);
        setPracticeQuestions(defaultPracticeQuestions);
        setFavorites([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleFavorite = async (phraseId) => {
    try {
      const response = await fetch(`${API_BASE}/api/favorites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phraseId }),
      });
      
      if (response.ok) {
        const updatedFavorites = await response.json();
        setFavorites(updatedFavorites);
      } else {
        // Fallback: toggle locally if API fails
        if (favorites.includes(phraseId)) {
          setFavorites(favorites.filter(id => id !== phraseId));
        } else {
          setFavorites([...favorites, phraseId]);
        }
      }
    } catch (error) {
      console.error('Error toggling favorite, using local storage:', error);
      // Fallback: toggle locally if API fails
      if (favorites.includes(phraseId)) {
        setFavorites(favorites.filter(id => id !== phraseId));
      } else {
        setFavorites([...favorites, phraseId]);
      }
    }
  };

  const playAudio = async (phrase) => {
    try {
      // Use browser's speech synthesis as fallback if API fails
      if (!window.speechSynthesis) {
        throw new Error('Speech synthesis not supported');
      }
      
      // Try to use the API first
      try {
        const response = await fetch(`${API_BASE}/api/audio`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            text: phrase.translation, 
            language: targetLang 
          }),
        });
        
        if (response.ok) {
          const audioBlob = await response.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          audio.play();
          return;
        }
      } catch (apiError) {
        console.warn('Audio API not available, using browser speech synthesis:', apiError);
      }
      
      // Fallback to browser's speech synthesis
      const speech = new SpeechSynthesisUtterance(phrase.translation);
      speech.lang = targetLang;
      window.speechSynthesis.speak(speech);
    } catch (error) {
      console.error('Error playing audio:', error);
      alert('Could not play audio. Please check your browser supports speech synthesis.');
    }
  };

  const checkAnswer = (index) => {
    setSelectedAnswer(index);
    setShowFeedback(true);
  };

  const nextQuestion = () => {
    setPracticeQuestion((practiceQuestion + 1) % practiceQuestions.length);
    setSelectedAnswer(null);
    setShowFeedback(false);
  };

  const downloadPhrases = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ language: targetLang }),
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${targetLang}_phrasebook.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        // Fallback: create a simple text download
        const textContent = Object.entries(phrases)
          .map(([category, phrases]) => {
            return `=== ${category.toUpperCase()} ===\n${phrases
              .map(p => `${p.english}: ${p.translation} (${p.pronunciation})`)
              .join('\n')}\n\n`;
          })
          .join('');
        
        const blob = new Blob([textContent], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${targetLang}_phrasebook.txt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading phrases:', error);
      alert('Could not download phrases. Please try again later.');
    }
  };

  // Get phrases to display based on current view
  const getDisplayPhrases = () => {
    if (showFavorites) {
      // Return all favorite phrases from all categories
      const favoritePhrases = [];
      Object.values(phrases).forEach(categoryPhrases => {
        categoryPhrases.forEach(phrase => {
          if (favorites.includes(phrase.id)) {
            favoritePhrases.push(phrase);
          }
        });
      });
      return favoritePhrases;
    } else {
      // Return phrases for the selected category
      return phrases[selectedCategory] || [];
    }
  };

  if (isLoading) {
    return <div className="phrasebook-container loading">Loading phrases...</div>;
  }

  return (
    <div className="phrasebook-container">
      <div className="translator-header">
        <h1>Phrasebook</h1>
        <p>Essential phrases for your travels</p>
        {error && <div className="error-banner">{error}</div>}
      </div>

      <div className="phrasebook-content">
        <div className="phrasebook-controls">
          <div className="language-selector">
            <FaGlobe className="selector-icon" />
            <label htmlFor="target-lang">Translate to:</label>
            <select 
              id="target-lang" 
              value={targetLang} 
              onChange={(e) => setTargetLang(e.target.value)}
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
          </div>

          <div className="view-options">
            <button 
              className={`view-option ${showFavorites ? 'active' : ''} ${favorites.length > 0 ? 'has-favorites' : ''}`}
              onClick={() => setShowFavorites(!showFavorites)}
            >
              Favorites ({favorites.length})
            </button>
          </div>
        </div>

        {!showFavorites && (
          <div className="categories-section">
            <h3>Categories</h3>
            <div className="categories-grid">
              {categories.map(category => (
                <button
                  key={category.id}
                  className={`category-button ${selectedCategory === category.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <span className="category-icon">{category.icon}</span>
                  <span className="category-name">{category.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="main-content-grid">
          <div className="phrases-section">
            <h3>{showFavorites ? 'Favorite Phrases' : `${categories.find(c => c.id === selectedCategory)?.name} Phrases`}</h3>
            
            <div className="phrases-list">
              {getDisplayPhrases().length > 0 ? (
                getDisplayPhrases().map(phrase => (
                  <div key={phrase.id} className="phrase-card">
                    <div className="phrase-content">
                      <div className="phrase-text">
                        <h4>{phrase.english}</h4>
                        <p className="translation">{phrase.translation}</p>
                        <p className="pronunciation">{phrase.pronunciation}</p>
                      </div>
                      <div className="phrase-actions">
                        <button 
                          onClick={() => playAudio(phrase)}
                          className="play-button"
                          aria-label="Play pronunciation"
                        >
                          <FaVolumeUp />
                        </button>
                        <button 
                          onClick={() => toggleFavorite(phrase.id)}
                          className={`favorite-button ${favorites.includes(phrase.id) ? 'favorited' : ''}`}
                          aria-label={favorites.includes(phrase.id) ? "Remove from favorites" : "Add to favorites"}
                        >
                          {favorites.includes(phrase.id) ? <FaStar /> : <FaRegStar />}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-phrases">
                  {showFavorites ? 'No favorite phrases yet. Add some by clicking the star icon!' : 'No phrases available for this category.'}
                </div>
              )}
            </div>
          </div>

          <div className="side-sections">
            <div className="practice-section">
              <h3>Practice Phrases</h3>
              <div className="practice-card">
                <div className="practice-question">
                  <p>{practiceQuestions[practiceQuestion]?.question}</p>
                </div>
                <div className="practice-options">
                  {practiceQuestions[practiceQuestion]?.options.map((option, index) => (
                    <button 
                      key={index}
                      className={`practice-option ${selectedAnswer === index ? 'selected' : ''} ${showFeedback && index === practiceQuestions[practiceQuestion].correctAnswer ? 'correct' : ''} ${showFeedback && selectedAnswer === index && selectedAnswer !== practiceQuestions[practiceQuestion].correctAnswer ? 'incorrect' : ''}`}
                      onClick={() => checkAnswer(index)}
                      disabled={showFeedback}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                <div className="practice-feedback">
                  {showFeedback && (
                    <>
                      <p className={selectedAnswer === practiceQuestions[practiceQuestion].correctAnswer ? 'correct-text' : 'incorrect-text'}>
                        {selectedAnswer === practiceQuestions[practiceQuestion].correctAnswer 
                          ? 'Correct! Well done!' 
                          : `Incorrect. The right answer is: ${practiceQuestions[practiceQuestion].options[practiceQuestions[practiceQuestion].correctAnswer]}`}
                      </p>
                      <button className="next-question-button" onClick={nextQuestion}>
                        Next Question
                      </button>
                    </>
                  )}
                  {!showFeedback && <p>Select an answer to check</p>}
                </div>
              </div>
            </div>

            <div className="download-section">
              <h3>Offline Access</h3>
              <div className="download-card">
                <p>Download phrases for offline use</p>
                <button className="download-button" onClick={downloadPhrases}>
                  <FaDownload /> Download {languages.find(lang => lang.code === targetLang)?.name} Phrases
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Phrasebook;