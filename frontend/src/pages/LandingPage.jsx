import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Activity, Shield, Brain, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0a0f1c]">
      {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Navbar */}
      <nav className="w-full px-8 py-6 flex justify-between items-center max-w-7xl mx-auto relative z-10">
        <div className="flex items-center gap-2">
          <Activity className="text-blue-500 w-8 h-8" />
          <span className="text-2xl font-bold tracking-wider text-white">NEURAID</span>
        </div>
        <div className="flex gap-4">
          <Link to="/login" className="btn-secondary">Log In</Link>
          <Link to="/register" className="btn-primary">Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-8 pt-20 pb-32 relative z-10 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl"
        >
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-white to-purple-400">
            Neuro-Evidence and Unseen Response AI Diagnostic System
          </h1>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Passive behavioral monitoring that builds your digital fingerprint and predicts neurological risks with state-of-the-art AI.
          </p>
          
          <div className="flex justify-center gap-6">
            <Link to="/register" className="btn-primary flex items-center gap-2 text-lg">
              Start Monitoring <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#how-it-works" className="btn-secondary text-lg">
              Learn More
            </a>
          </div>
        </motion.div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 mt-32 w-full">
          {[
            {
              icon: <Activity className="w-8 h-8 text-blue-400" />,
              title: "Passive Monitoring",
              desc: "Analyzes typing dynamics in the background without recording actual keystrokes, ensuring 100% privacy."
            },
            {
              icon: <Brain className="w-8 h-8 text-purple-400" />,
              title: "AI Risk Prediction",
              desc: "Multi-layer LSTM models analyze your behavioral baseline to detect micro-deviations over time."
            },
            {
              icon: <Shield className="w-8 h-8 text-green-400" />,
              title: "Secure & Explainable",
              desc: "SHAP-powered insights tell you exactly why a risk score changed. Your data is encrypted and secure."
            }
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.2, duration: 0.5 }}
              className="glass-card hover:translate-y-[-5px] transition-transform duration-300"
            >
              <div className="bg-white/5 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
