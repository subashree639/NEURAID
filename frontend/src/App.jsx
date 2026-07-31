import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import KeystrokeListener from './components/KeystrokeListener';

function App() {
  const [user, setUser] = useState(null);

  // Simple auth persistence for demo
  useEffect(() => {
    const storedUser = localStorage.getItem('neuraid_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('neuraid_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('neuraid_user');
  };

  return (
    <Router>
      <div className="min-h-screen bg-healthcare-dark text-white font-sans selection:bg-blue-500/30 selection:text-blue-200">
        {/* Render KeystrokeListener globally when user is logged in */}
        {user && <KeystrokeListener userId={user.user_id} />}
        
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />} />
          <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register onLogin={handleLogin} />} />
          <Route 
            path="/dashboard" 
            element={user ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
