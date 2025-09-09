import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaGlobe, 
  FaMicrophone, 
  FaCamera, 
  FaComments, 
  FaBook, 
  FaInfoCircle,
  FaArrowRight,
  FaPlay,
  FaPlus,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaHistory,
  FaStar
} from 'react-icons/fa';
import '../styles/app.css';

const Dashboard = ({ user }) => {
  const [upcomingTrips, setUpcomingTrips] = useState([]);
  const [recentTranslations, setRecentTranslations] = useState([]);
  const [savedPhrases, setSavedPhrases] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Load user-specific data
    setUpcomingTrips([
      { destination: 'Tokyo, Japan', date: 'Aug 15-30, 2023', flag: '🇯🇵' },
      { destination: 'Paris, France', date: 'Sep 10-20, 2023', flag: '🇫🇷' }
    ]);
    
    setRecentTranslations([
      { id: 1, text: 'Where is the nearest restaurant?', from: 'English', to: 'Japanese', date: '2 hours ago' },
      { id: 2, text: 'How much does this cost?', from: 'English', to: 'French', date: '1 day ago' },
      { id: 3, text: 'I need a doctor', from: 'English', to: 'Spanish', date: '3 days ago' }
    ]);
    
    setSavedPhrases([
      { id: 1, phrase: 'Hello', translation: 'Hola', language: 'Spanish', favorite: true },
      { id: 2, phrase: 'Thank you', translation: 'Arigato', language: 'Japanese', favorite: false },
      { id: 3, phrase: 'How much?', translation: 'Combien?', language: 'French', favorite: true }
    ]);
  }, [user, navigate]);

  const quickActions = [
    { title: 'Text Translation', icon: <FaGlobe />, link: '/text-translator', color: '#8B84D7' },
    { title: 'Voice Translator', icon: <FaMicrophone />, link: '/voice-translator', color: '#FF6E9F' },
    { title: 'Image Translation', icon: <FaCamera />, link: '/image-translator', color: '#5A6FD8' },
    { title: 'Conversation Mode', icon: <FaComments />, link: '/conversation', color: '#4CAF50' },
    { title: 'Phrasebook', icon: <FaBook />, link: '/phrasebook', color: '#FF9800' },
    { title: 'Cultural Guide', icon: <FaInfoCircle />, link: '/culture', color: '#9C27B0' }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Welcome back, {user?.name}!
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Your AI travel translation assistant is ready to help
        </motion.p>
      </div>

      <motion.div 
        className="dashboard-content"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Quick Actions Grid */}
        <motion.div className="quick-actions-section" variants={itemVariants}>
          <h2>Quick Actions</h2>
          <div className="quick-actions-grid">
            {quickActions.map((action, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -5, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link to={action.link} className="quick-action-card">
                  <div className="action-icon" style={{ backgroundColor: action.color }}>
                    {action.icon}
                  </div>
                  <h3>{action.title}</h3>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Main Content Area with Side-by-Side Layout */}
        <div className="main-dashboard-content">
          {/* Left Column */}
          <div className="dashboard-left-column">
            {/* Recent Translations */}
            <motion.div className="dashboard-card" variants={itemVariants}>
              <div className="card-header">
                <h2><FaHistory /> Recent Translations</h2>
                <Link to="/text-translator" className="view-all-link">View All <FaArrowRight /></Link>
              </div>
              <div className="translations-list">
                {recentTranslations.map(translation => (
                  <motion.div 
                    key={translation.id} 
                    className="translation-item"
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="translation-text">
                      <p className="original-text">{translation.text}</p>
                      <div className="translation-meta">
                        <span className="language-pair">{translation.from} → {translation.to}</span>
                        <span className="translation-date">{translation.date}</span>
                      </div>
                    </div>
                    <button className="icon-button"><FaArrowRight /></button>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Saved Phrases */}
            <motion.div className="dashboard-card" variants={itemVariants}>
              <div className="card-header">
                <h2><FaStar /> Saved Phrases</h2>
                <Link to="/phrasebook" className="view-all-link">View All <FaArrowRight /></Link>
              </div>
              <div className="phrases-list">
                {savedPhrases.map(phrase => (
                  <motion.div 
                    key={phrase.id} 
                    className="phrase-item"
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="phrase-content">
                      <p className="phrase-text">{phrase.phrase}</p>
                      <p className="phrase-translation">{phrase.translation}</p>
                      <span className="phrase-language">{phrase.language}</span>
                    </div>
                    <button className={`icon-button play-button ${phrase.favorite ? 'favorite' : ''}`}>
                      <FaPlay />
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="dashboard-right-column">
            {/* Upcoming Trips */}
            <motion.div className="dashboard-card" variants={itemVariants}>
              <div className="card-header">
                <h2><FaMapMarkerAlt /> Upcoming Trips</h2>
              </div>
              <div className="trips-list">
                {upcomingTrips.map((trip, index) => (
                  <motion.div 
                    key={index} 
                    className="trip-item"
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="trip-icon">
                      <span className="trip-flag">{trip.flag}</span>
                    </div>
                    <div className="trip-details">
                      <div className="trip-destination">{trip.destination}</div>
                      <div className="trip-date">
                        <FaCalendarAlt /> {trip.date}
                      </div>
                    </div>
                    <button className="trip-prep-button">Prepare Phrases</button>
                  </motion.div>
                ))}
              </div>
              <button className="add-trip-button"><FaPlus /> Add New Trip</button>
            </motion.div>

            {/* Stats Card */}
            <motion.div className="dashboard-card stats-card" variants={itemVariants}>
              <div className="card-header">
                <h2>Your Translation Stats</h2>
              </div>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-number">42</div>
                  <div className="stat-label">Translations</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">7</div>
                  <div className="stat-label">Languages</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">15</div>
                  <div className="stat-label">Saved Phrases</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;