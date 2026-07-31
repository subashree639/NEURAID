import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, LogOut, Download, AlertTriangle, ShieldCheck, ActivitySquare, AlertCircle, PlayCircle, Sparkles } from 'lucide-react';
import { TrendGraph, SHAPChart } from '../components/Charts';

const API_URL = "http://localhost:8000/api";
const BATCH_DURATION = 30;
const REST_DURATION = 5;

const PARAGRAPHS = {
  batch1: "The quick brown fox jumps over the lazy dog near the riverbank. She carefully opened the old wooden door and stepped inside the quiet room. The morning sunlight streamed through the window as birds sang softly outside.",
  batch2: "Artificial intelligence is transforming the way we understand human health. Every keystroke tells a story about the brain behind the fingers. Small changes in timing, rhythm, and pressure reveal what eyes cannot see."
};

const createBatchState = () => ({
  keystrokes: [],
  holdTimes: [],
  flightTimes: [],
  latencies: [],
  backspaceCount: 0,
  totalKeys: 0,
  errors: 0,
  correctChars: 0,
  startedAt: null,
  lastKeydownAt: null,
  lastKeyupAt: null,
  value: ''
});

export default function Dashboard({ user, onLogout }) {
  const [metrics, setMetrics] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState('');

  const [phase, setPhase] = useState('idle');
  const [currentBatch, setCurrentBatch] = useState(1);
  const [timeLeft, setTimeLeft] = useState(BATCH_DURATION);
  const [restLeft, setRestLeft] = useState(REST_DURATION);
  const [timerStarted, setTimerStarted] = useState(false);
  const [textareaValue, setTextareaValue] = useState('');
  const [batchMessage, setBatchMessage] = useState('');
  const [liveStats, setLiveStats] = useState({ wpm: 0, keystrokes: 0, accuracy: 100 });
  const [batch1Data, setBatch1Data] = useState(null);
  const [batch2Data, setBatch2Data] = useState(null);

  const batchRef = useRef(createBatchState());
  const batch1DataRef = useRef(null);
  const batch2DataRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const restIntervalRef = useRef(null);

  const stepIndex = useMemo(() => {
    if (phase === 'idle') return 0;
    if (phase === 'batch1') return 0;
    if (phase === 'rest') return 1;
    if (phase === 'batch2') return 2;
    return 3;
  }, [phase]);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => () => {
    clearInterval(timerIntervalRef.current);
    clearInterval(restIntervalRef.current);
  }, []);

  useEffect(() => {
    if (phase !== 'batch1' && phase !== 'batch2') {
      clearInterval(timerIntervalRef.current);
      return;
    }

    clearInterval(timerIntervalRef.current);
    if (!timerStarted) {
      setTimeLeft(BATCH_DURATION);
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          finalizeBatch();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerIntervalRef.current);
  }, [phase, timerStarted]);

  useEffect(() => {
    if (phase !== 'rest') {
      clearInterval(restIntervalRef.current);
      return;
    }

    restIntervalRef.current = setInterval(() => {
      setRestLeft((prev) => {
        if (prev <= 1) {
          clearInterval(restIntervalRef.current);
          beginBatch(2);
          return REST_DURATION;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(restIntervalRef.current);
  }, [phase]);

  const fetchMetrics = async () => {
    try {
      const res = await fetch(`${API_URL}/metrics/history/${user.user_id}`);
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (err) {
      console.error('Failed to fetch metrics', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePredict = async () => {
    setPredicting(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/ml/predict/${user.user_id}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Prediction failed');
      setPrediction(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setPredicting(false);
    }
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'Green': return 'text-green-500 bg-green-500/10 border-green-500/50';
      case 'Yellow': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/50';
      case 'Orange': return 'text-orange-500 bg-orange-500/10 border-orange-500/50';
      case 'Red': return 'text-red-500 bg-red-500/10 border-red-500/50';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/50';
    }
  };

  const getRiskIcon = (level) => {
    switch (level) {
      case 'Green': return <ShieldCheck className="w-8 h-8 text-green-500" />;
      case 'Yellow': return <ActivitySquare className="w-8 h-8 text-yellow-500" />;
      case 'Orange': return <AlertTriangle className="w-8 h-8 text-orange-500" />;
      case 'Red': return <AlertCircle className="w-8 h-8 text-red-500" />;
      default: return <ShieldCheck className="w-8 h-8 text-gray-400" />;
    }
  };

  const resetStats = () => {
    setLiveStats({ wpm: 0, keystrokes: 0, accuracy: 100 });
    setTextareaValue('');
    setBatchMessage('');
  };

  const beginBatch = (batchNumber) => {
    batchRef.current = createBatchState();
    setCurrentBatch(batchNumber);
    setPhase(batchNumber === 1 ? 'batch1' : 'batch2');
    setTimeLeft(BATCH_DURATION);
    setRestLeft(REST_DURATION);
    setTimerStarted(false);
    resetStats();
  };

  const buildBatchSummary = () => {
    const batch = batchRef.current;
    const elapsedSeconds = batch.startedAt ? Math.max(1, (Date.now() - batch.startedAt) / 1000) : 1;
    const durationMinutes = elapsedSeconds / 60;
    const wpm = durationMinutes > 0 ? (batch.correctChars / 5) / durationMinutes : 0;
    const errorRate = batch.totalKeys > 0 ? (batch.errors / batch.totalKeys) * 100 : 0;

    return {
      keystrokes: batch.keystrokes,
      wpm: Number(wpm.toFixed(1)),
      holdTimes: batch.holdTimes,
      flightTimes: batch.flightTimes,
      latencies: batch.latencies,
      errorRate: Number(errorRate.toFixed(1)),
      backspaceFreq: batch.totalKeys > 0 ? batch.backspaceCount / batch.totalKeys : 0
    };
  };

  const finalizeBatch = () => {
    const summary = buildBatchSummary();
    if (phase === 'batch1') {
      batch1DataRef.current = summary;
      setBatch1Data(summary);
      setBatchMessage('✅ Batch 1 Complete! Rest for 5 seconds...');
      setPhase('rest');
      setTimerStarted(false);
      setTextareaValue('');
      setLiveStats({ wpm: 0, keystrokes: 0, accuracy: 100 });
      return;
    }

    batch2DataRef.current = summary;
    setBatch2Data(summary);
    setBatchMessage('✅ Both batches complete! Running AI Assessment...');
    setPhase('analyzing');
    void handleTypingAssessment(summary);
  };

  const updateLiveStats = (nextValue) => {
    const target = currentBatch === 1 ? PARAGRAPHS.batch1 : PARAGRAPHS.batch2;
    let errors = 0;
    const comparisonLength = Math.min(nextValue.length, target.length);
    for (let i = 0; i < comparisonLength; i += 1) {
      if (nextValue[i] !== target[i]) {
        errors += 1;
      }
    }
    if (nextValue.length > target.length) {
      errors += nextValue.length - target.length;
    }

    const correctChars = Math.max(0, comparisonLength - errors);
    const batch = batchRef.current;
    const elapsedSeconds = batch.startedAt ? Math.max(1, (Date.now() - batch.startedAt) / 1000) : 1;
    const durationMinutes = elapsedSeconds / 60;
    const wpm = durationMinutes > 0 ? (correctChars / 5) / durationMinutes : 0;
    const accuracy = nextValue.length === 0 ? 100 : Math.max(0, 100 - (errors / Math.max(1, nextValue.length)) * 100);

    batch.errors = errors;
    batch.correctChars = correctChars;
    batch.value = nextValue;

    setLiveStats({
      wpm: Number(wpm.toFixed(1)),
      keystrokes: batch.keystrokes.length,
      accuracy: Number(accuracy.toFixed(1))
    });
  };

  const handleKeyDown = (event) => {
    if (phase !== 'batch1' && phase !== 'batch2') return;
    if (event.key === 'Shift' || event.key === 'Control' || event.key === 'Alt' || event.key === 'Meta' || event.key === 'Tab' || event.key === 'Enter' || event.key === 'Escape') return;

    const batch = batchRef.current;
    const now = Date.now();

    if (event.key.length === 1 || event.key === ' ') {
      if (!timerStarted) {
        batch.startedAt = now;
        setTimerStarted(true);
      }
    }

    if (event.key === 'Backspace') {
      batch.backspaceCount += 1;
    }

    const keyInfo = {
      key: event.key,
      pressedAt: now,
      releasedAt: null,
      holdTime: 0,
      flightTime: batch.lastKeyupAt ? now - batch.lastKeyupAt : 0,
      latency: batch.lastKeydownAt ? now - batch.lastKeydownAt : 0
    };

    batch.totalKeys += 1;
    batch.keystrokes.push(keyInfo);
    batch.lastKeydownAt = now;
  };

  const handleKeyUp = (event) => {
    if (phase !== 'batch1' && phase !== 'batch2') return;
    if (event.key === 'Shift' || event.key === 'Control' || event.key === 'Alt' || event.key === 'Meta' || event.key === 'Tab' || event.key === 'Enter' || event.key === 'Escape') return;

    const batch = batchRef.current;
    if (batch.keystrokes.length === 0) return;

    const now = Date.now();
    const latestEvent = batch.keystrokes[batch.keystrokes.length - 1];
    if (latestEvent && latestEvent.releasedAt === null) {
      latestEvent.releasedAt = now;
      latestEvent.holdTime = now - latestEvent.pressedAt;
      batch.holdTimes.push(latestEvent.holdTime);
      batch.flightTimes.push(latestEvent.flightTime);
      batch.latencies.push(latestEvent.latency);
    }

    batch.lastKeyupAt = now;
    updateLiveStats(textareaValue);
  };

  const handleTextChange = (event) => {
    if (phase !== 'batch1' && phase !== 'batch2') return;
    const nextValue = event.target.value;
    setTextareaValue(nextValue);
    updateLiveStats(nextValue);
  };

  const handleTypingAssessment = async (batch2Summary) => {
    setPredicting(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/ml/typing-assessment/${user.user_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch1Data: batch1DataRef.current,
          batch2Data: batch2Summary
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Typing assessment failed');
      setPrediction(data);
      setPhase('results');
    } catch (err) {
      setError(err.message);
      setPhase('results');
    } finally {
      setPredicting(false);
    }
  };

  const startTypingTest = () => {
    beginBatch(1);
  };

  const getTimerColor = () => {
    if (timeLeft <= 5) return 'text-red-500';
    if (timeLeft <= 10) return 'text-orange-500';
    return 'text-emerald-400';
  };

  const getTimerBarColor = () => {
    if (timeLeft <= 5) return 'from-red-500 to-rose-400';
    if (timeLeft <= 10) return 'from-orange-500 to-amber-400';
    return 'from-emerald-500 to-cyan-400';
  };

  const formatTimer = (seconds) => {
    const safe = Math.max(0, seconds);
    const mins = String(Math.floor(safe / 60)).padStart(2, '0');
    const secs = String(safe % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const isInputActive = phase === 'batch1' || phase === 'batch2';

  const getStepClasses = (index) => {
    if (index < stepIndex) return 'text-emerald-400';
    if (index === stepIndex) return 'text-cyan-400';
    return 'text-slate-500';
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading dashboard...</div>;
  }

  return (
    <div className="min-h-screen p-8 bg-[#0a0f1c]">
      <header className="flex justify-between items-center mb-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <Activity className="text-blue-500 w-8 h-8" />
          <h1 className="text-2xl font-bold">NEURAID Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400">Welcome, <strong className="text-white">{user.name}</strong></span>
          <button onClick={onLogout} className="btn-secondary flex items-center gap-2">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-8">
          <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Typing Test</h2>
              <div className="flex items-center gap-2 text-sm text-cyan-300">
                <Sparkles className="w-4 h-4" />
                <span>Two-batch assessment</span>
              </div>
            </div>

            <div className="mb-6 flex flex-wrap items-center justify-center gap-3 text-sm font-medium">
              {[{ label: 'Batch 1', index: 0 }, { label: 'Rest', index: 1 }, { label: 'Batch 2', index: 2 }, { label: 'Analysis', index: 3 }].map((step) => (
                <div key={step.label} className="flex items-center gap-2">
                  <span className={`text-lg ${getStepClasses(step.index)}`}>{step.index < stepIndex ? '●' : step.index === stepIndex ? '●' : '○'}</span>
                  <span className={step.index <= stepIndex ? 'text-white' : 'text-slate-500'}>{step.label}</span>
                </div>
              ))}
            </div>

            {phase === 'idle' && (
              <div className="space-y-4">
                <p className="text-sm text-slate-400">Complete two short typing samples to generate a behavioral risk assessment from your timing patterns.</p>
                <button onClick={startTypingTest} className="btn-primary w-full flex items-center justify-center gap-2">
                  <PlayCircle className="w-5 h-5" /> Start Typing Test
                </button>
              </div>
            )}

            {phase === 'batch1' && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-cyan-400/20 bg-slate-950/70 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-cyan-200">Typing Test — Batch 1 of 2</h3>
                    <span className={`text-lg font-mono font-semibold ${getTimerColor()} ${timeLeft <= 5 ? 'animate-pulse' : ''}`}>⏱ {formatTimer(timeLeft)}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div className={`h-full rounded-full bg-gradient-to-r ${getTimerBarColor()} ${timeLeft <= 5 ? 'animate-pulse' : ''}`} style={{ width: `${(timeLeft / BATCH_DURATION) * 100}%`, transition: 'width 0.3s ease' }} />
                  </div>
                  <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm leading-7 text-slate-200 shadow-inner">
                    {PARAGRAPHS.batch1}
                  </div>
                  <textarea
                    value={textareaValue}
                    onChange={handleTextChange}
                    onKeyDown={handleKeyDown}
                    onKeyUp={handleKeyUp}
                    disabled={!isInputActive}
                    className="mt-4 min-h-40 w-full rounded-xl border border-slate-700 bg-slate-900/80 p-4 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
                    placeholder="Type the suggested paragraph here..."
                  />
                  <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                    <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-3">
                      <div className="text-slate-400">Current WPM</div>
                      <div className="text-xl font-semibold text-white">{liveStats.wpm}</div>
                    </div>
                    <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-3">
                      <div className="text-slate-400">Keystrokes</div>
                      <div className="text-xl font-semibold text-white">{liveStats.keystrokes}</div>
                    </div>
                    <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-3">
                      <div className="text-slate-400">Accuracy</div>
                      <div className="text-xl font-semibold text-white">{liveStats.accuracy.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {phase === 'rest' && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-6 text-center">
                <h3 className="text-xl font-semibold text-amber-200">⏳ Rest Period — Batch 2 starts in {restLeft}...</h3>
                <p className="mt-2 text-sm text-slate-300">{batchMessage}</p>
              </motion.div>
            )}

            {phase === 'batch2' && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-cyan-400/20 bg-slate-950/70 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-cyan-200">Typing Test — Batch 2 of 2</h3>
                    <span className={`text-lg font-mono font-semibold ${getTimerColor()} ${timeLeft <= 5 ? 'animate-pulse' : ''}`}>⏱ {formatTimer(timeLeft)}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div className={`h-full rounded-full bg-gradient-to-r ${getTimerBarColor()} ${timeLeft <= 5 ? 'animate-pulse' : ''}`} style={{ width: `${(timeLeft / BATCH_DURATION) * 100}%`, transition: 'width 0.3s ease' }} />
                  </div>
                  <div className="mt-4 rounded-xl border border-violet-400/20 bg-violet-500/10 p-4 text-sm leading-7 text-slate-200 shadow-inner">
                    {PARAGRAPHS.batch2}
                  </div>
                  <textarea
                    value={textareaValue}
                    onChange={handleTextChange}
                    onKeyDown={handleKeyDown}
                    onKeyUp={handleKeyUp}
                    disabled={!isInputActive}
                    className="mt-4 min-h-40 w-full rounded-xl border border-slate-700 bg-slate-900/80 p-4 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
                    placeholder="Type the second paragraph here..."
                  />
                  <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                    <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-3">
                      <div className="text-slate-400">Current WPM</div>
                      <div className="text-xl font-semibold text-white">{liveStats.wpm}</div>
                    </div>
                    <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-3">
                      <div className="text-slate-400">Keystrokes</div>
                      <div className="text-xl font-semibold text-white">{liveStats.keystrokes}</div>
                    </div>
                    <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-3">
                      <div className="text-slate-400">Accuracy</div>
                      <div className="text-xl font-semibold text-white">{liveStats.accuracy.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {phase === 'analyzing' && (
              <div className="rounded-2xl border border-cyan-400/20 bg-slate-950/70 p-8 text-center">
                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                <p className="text-lg font-medium text-cyan-200">Running AI Assessment...</p>
                <p className="mt-2 text-sm text-slate-400">Comparing both typing batches for deviation and trend insights.</p>
              </div>
            )}

            {phase === 'results' && (
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-6 text-sm text-slate-200">
                <p className="font-semibold text-emerald-200">Typing test complete. Your latest assessment is ready.</p>
                {batch1Data && batch2Data && (
                  <div className="mt-3 space-y-2 text-sm text-slate-300">
                    <div>Batch 1 WPM: {batch1Data.wpm}</div>
                    <div>Batch 2 WPM: {batch2Data.wpm}</div>
                    <div>Batch 2 error rate: {batch2Data.errorRate.toFixed(1)}%</div>
                  </div>
                )}
              </div>
            )}
          </motion.div>

          <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h2 className="text-xl font-semibold mb-4">Risk Assessment</h2>

            {prediction ? (
              <div className={`p-6 rounded-xl border flex flex-col items-center mb-6 ${getRiskColor(prediction.risk_level)}`}>
                {getRiskIcon(prediction.risk_level)}
                <div className="text-4xl font-bold mt-2">{prediction.risk_percentage.toFixed(1)}%</div>
                <div className="text-sm font-medium mt-1 uppercase tracking-wider">{prediction.risk_level} RISK</div>
                <div className="text-xs opacity-75 mt-2">Confidence: {prediction.confidence.toFixed(1)}%</div>
              </div>
            ) : (
              <div className="p-6 rounded-xl border border-dashed border-gray-600 flex flex-col items-center justify-center text-gray-400 mb-6 h-40">
                Run an assessment to see risk score
              </div>
            )}

            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

            <button
              onClick={handlePredict}
              disabled={predicting}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {predicting ? <span className="animate-pulse">Analyzing Data...</span> : 'Run AI Assessment'}
            </button>
          </motion.div>

          <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="text-xl font-semibold mb-4">Monitoring Status</h2>
            <div className="flex items-center gap-3 mb-4">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="text-gray-300">Passive listener active</span>
            </div>
            <div className="text-sm text-gray-400">
              Total Sessions Recorded: <strong className="text-white">{metrics.length}</strong>
            </div>
            {metrics.length > 0 && (
              <div className="text-sm text-gray-400 mt-2">
                Last recorded: {new Date(metrics[metrics.length - 1].timestamp).toLocaleTimeString()}
              </div>
            )}
          </motion.div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-semibold">Behavioral Trend</h2>
              <button className="text-gray-400 hover:text-white transition-colors">
                <Download className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-400 mb-4">Typing speed and latency over time</p>
            <TrendGraph data={metrics} />
          </motion.div>

          <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <h2 className="text-xl font-semibold mb-2">Explainable AI (SHAP)</h2>
            <p className="text-sm text-gray-400 mb-4">Feature impact driving your current risk score</p>
            {prediction && prediction.shap_explanation ? (
              <SHAPChart data={prediction.shap_explanation} />
            ) : (
              <div className="h-64 flex items-center justify-center border border-dashed border-gray-600 rounded-xl text-gray-400">
                Run an assessment to generate SHAP explanations
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
