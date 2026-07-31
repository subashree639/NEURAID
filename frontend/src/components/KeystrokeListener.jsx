import { useEffect, useRef } from 'react';

const API_URL = "http://localhost:8000/api"; // Dev URL

export default function KeystrokeListener({ userId }) {
  const sessionData = useRef([]);
  const sessionStartTime = useRef(Date.now());
  
  useEffect(() => {
    if (!userId) return;
    
    // Reset session start time when listener mounts for a user
    sessionStartTime.current = Date.now();
    sessionData.current = [];

    const handleKeyDown = (e) => {
      // Don't record modifier keys alone
      if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return;
      
      const keyType = e.key === 'Backspace' ? 'backspace' : 
                      e.key === ' ' ? 'space' : 
                      'alphanumeric'; // Anonymize key
                      
      sessionData.current.push({
        event_type: 'keydown',
        timestamp: Date.now(),
        key_type: keyType
      });
    };

    const handleKeyUp = (e) => {
      if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return;
      
      const keyType = e.key === 'Backspace' ? 'backspace' : 
                      e.key === ' ' ? 'space' : 
                      'alphanumeric';
                      
      sessionData.current.push({
        event_type: 'keyup',
        timestamp: Date.now(),
        key_type: keyType
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Batch send data every 30 seconds
    const interval = setInterval(() => {
      if (sessionData.current.length > 0) {
        const payload = {
          user_id: userId,
          events: sessionData.current,
          session_duration: Date.now() - sessionStartTime.current
        };
        
        fetch(`${API_URL}/metrics/session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(err => console.error("Error sending keystroke data:", err));
        
        // Reset after send
        sessionData.current = [];
      }
    }, 30000);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      clearInterval(interval);
      
      // Send any remaining data on unmount
      if (sessionData.current.length > 0) {
        const payload = {
          user_id: userId,
          events: sessionData.current,
          session_duration: Date.now() - sessionStartTime.current
        };
        // Use keepalive for unmount fetches
        fetch(`${API_URL}/metrics/session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true
        }).catch(() => {});
      }
    };
  }, [userId]);

  return null; // This component doesn't render anything
}
