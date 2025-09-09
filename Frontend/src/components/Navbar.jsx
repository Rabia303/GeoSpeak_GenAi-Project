import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import '../styles/app.css';

const Navbar = ({ user, setUser }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/dashboard', label: 'Dashboard', auth: true },
    { path: '/text-translator', label: 'Text Translate', auth: true },
    { path: '/voice-translator', label: 'Voice Translate', auth: true },
    { path: '/image-translator', label: 'Image Translate', auth: true },
    { path: '/conversation', label: 'Conversation', auth: true },
    { path: '/phrasebook', label: 'Phrasebook', auth: true },
  ];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5000/logout', {
        method: 'POST',
        credentials: 'include'
      });
      setUser(null);
      localStorage.removeItem('user');
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <>
      <motion.nav 
        className="navbar"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Link to="/" className="logo">GeoSpeak</Link>
        
        {/* Desktop Navigation */}
        <div className="nav-links">
          {navItems.map((item) => {
            // Don't show auth-required items if user is not logged in
            if (item.auth && !user) return null;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Mobile Menu Button */}
        <button 
          className={`mobile-menu-button ${isMenuOpen ? 'open' : ''}`}
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Auth Buttons */}
        <div className="auth-buttons">
          {user ? (
            <div className="user-menu">
              <span className="welcome-text">Hello, {user.name}</span>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </div>
          ) : (
            <>
              {location.pathname !== "/login" && (
                <Link to="/login" className="login-btn">Login</Link>
              )}
              {location.pathname !== "/register" && (
                <Link to="/register" className="register-btn">Register</Link>
              )}
            </>
          )}
        </div>
      </motion.nav>

      {/* Mobile Navigation Menu */}
      <motion.div 
        className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}
        initial={{ opacity: 0, height: 0 }}
        animate={{ 
          opacity: isMenuOpen ? 1 : 0,
          height: isMenuOpen ? 'auto' : 0
        }}
        transition={{ duration: 0.3 }}
      >
        {navItems.map((item) => {
          // Don't show auth-required items if user is not logged in
          if (item.auth && !user) return null;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`mobile-nav-link ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              {item.label}
            </Link>
          );
        })}
        
        <div className="mobile-auth-buttons">
          {user ? (
            <>
              <span className="mobile-welcome-text">Hello, {user.name}</span>
              <button onClick={handleLogout} className="mobile-logout-btn">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="mobile-login-btn" onClick={() => setIsMenuOpen(false)}>Login</Link>
              <Link to="/register" className="mobile-register-btn" onClick={() => setIsMenuOpen(false)}>Register</Link>
            </>
          )}
        </div>
      </motion.div>
    </>
  );
};

export default Navbar;