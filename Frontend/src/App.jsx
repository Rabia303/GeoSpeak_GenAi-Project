import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TextTranslator from './pages/TextTranslator';
import VoiceTranslator from './pages/VoiceTranslator';
import ImageTranslator from './pages/ImageTranslator';
import ConversationMode from './pages/ConversationMode';
import Phrasebook from './pages/Phrasebook';
import './styles/app.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app load
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('http://localhost:5000/user', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setUser(data.user);
            localStorage.setItem('user', JSON.stringify(data.user));
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    };

    // Check if user data exists in localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setLoading(false);
    } else {
      checkAuthStatus();
    }
  }, []);

  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  return (
    <Router>
      <div className="App">
        <Navbar user={user} setUser={setUser} />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard user={user} />} />
          <Route path="/text-translator" element={<TextTranslator user={user} />} />
          <Route path="/voice-translator" element={<VoiceTranslator user={user} />} />
          <Route path="/image-translator" element={<ImageTranslator user={user} />} />
          <Route path="/conversation" element={<ConversationMode user={user} />} />
          <Route path="/phrasebook" element={<Phrasebook user={user} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;