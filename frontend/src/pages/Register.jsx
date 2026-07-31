import { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, User, Mail, Lock, Briefcase, Phone, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_URL = "http://localhost:8000/api";

export default function Register({ onLogin }) {
  const [formData, setFormData] = useState({
    name: '', age: '', gender: 'Male', occupation: '', 
    email: '', phone: '', password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const payload = { ...formData, age: parseInt(formData.age, 10) };
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Registration failed');
      
      // Auto login after register
      onLogin({ user_id: data.user_id, name: data.name });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f1c] relative overflow-hidden p-4">
      <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px]" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full max-w-2xl relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <Activity className="text-purple-500 w-12 h-12 mb-4" />
          <h2 className="text-3xl font-bold">Create Account</h2>
          <p className="text-gray-400 mt-2">Start your personalized health monitoring journey</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative md:col-span-2">
            <User className="absolute left-4 top-3.5 text-gray-500 w-5 h-5" />
            <input name="name" type="text" placeholder="Full Name" className="input-field pl-12" required onChange={handleChange} />
          </div>
          
          <div className="relative">
            <Calendar className="absolute left-4 top-3.5 text-gray-500 w-5 h-5" />
            <input name="age" type="number" placeholder="Age" className="input-field pl-12" required onChange={handleChange} />
          </div>
          
          <div className="relative">
            <User className="absolute left-4 top-3.5 text-gray-500 w-5 h-5" />
            <select name="gender" className="input-field pl-12 appearance-none" onChange={handleChange}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div className="relative md:col-span-2">
            <Briefcase className="absolute left-4 top-3.5 text-gray-500 w-5 h-5" />
            <input name="occupation" type="text" placeholder="Occupation" className="input-field pl-12" required onChange={handleChange} />
          </div>
          
          <div className="relative">
            <Mail className="absolute left-4 top-3.5 text-gray-500 w-5 h-5" />
            <input name="email" type="email" placeholder="Email Address" className="input-field pl-12" required onChange={handleChange} />
          </div>
          
          <div className="relative">
            <Phone className="absolute left-4 top-3.5 text-gray-500 w-5 h-5" />
            <input name="phone" type="tel" placeholder="Phone Number" className="input-field pl-12" required onChange={handleChange} />
          </div>
          
          <div className="relative md:col-span-2">
            <Lock className="absolute left-4 top-3.5 text-gray-500 w-5 h-5" />
            <input name="password" type="password" placeholder="Password" className="input-field pl-12" required onChange={handleChange} />
          </div>
          
          <div className="md:col-span-2 mt-4">
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "Creating..." : "Complete Registration"}
            </button>
          </div>
        </form>
        
        <p className="text-center text-gray-400 mt-6">
          Already have an account? <Link to="/login" className="text-purple-400 hover:text-purple-300">Sign In</Link>
        </p>
      </motion.div>
    </div>
  );
}
