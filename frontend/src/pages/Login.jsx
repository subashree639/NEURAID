import { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Mail, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_URL = "http://localhost:8000/api";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Login failed');
      
      onLogin(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f1c] relative overflow-hidden p-4">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card w-full max-w-md relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <Activity className="text-blue-500 w-12 h-12 mb-4" />
          <h2 className="text-3xl font-bold">Welcome Back</h2>
          <p className="text-gray-400 mt-2">Log in to monitor your cognitive health</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <Mail className="absolute left-4 top-3.5 text-gray-500 w-5 h-5" />
            <input 
              type="email" 
              placeholder="Email address"
              className="input-field pl-12"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="relative">
            <Lock className="absolute left-4 top-3.5 text-gray-500 w-5 h-5" />
            <input 
              type="password" 
              placeholder="Password"
              className="input-field pl-12"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="btn-primary w-full flex justify-center items-center"
            disabled={loading}
          >
            {loading ? <span className="animate-pulse">Authenticating...</span> : "Sign In"}
          </button>
        </form>
        
        <p className="text-center text-gray-400 mt-6">
          Don't have an account? <Link to="/register" className="text-blue-400 hover:text-blue-300">Register</Link>
        </p>
      </motion.div>
    </div>
  );
}
