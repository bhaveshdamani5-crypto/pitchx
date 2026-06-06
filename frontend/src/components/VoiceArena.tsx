import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Mic, ArrowLeft, Send } from 'lucide-react';

interface VoiceArenaProps {
  companyId: string;
  onBack: () => void;
}

export default function VoiceArena({ companyId, onBack }: VoiceArenaProps) {
  const [messages, setMessages] = useState<Array<{role: string, content: string, agent?: string}>>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Initialize Web Speech APIs
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        sendTranscript(transcript);
        setIsRecording(false);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }

    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Initialize WebSocket
  useEffect(() => {
    const wsUrl = `ws://localhost:8000/api/voice/connect/${companyId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'system') {
        setMessages(prev => [...prev, { role: 'system', content: data.message }]);
      } else if (data.type === 'agent_thinking') {
        setActiveAgent(data.agent);
      } else if (data.type === 'agent_start') {
        setActiveAgent(data.agent);
        setMessages(prev => [...prev, { role: 'agent', agent: data.agent, content: '' }]);
      } else if (data.type === 'agent_token') {
        setMessages(prev => {
          const newMsg = [...prev];
          const last = newMsg[newMsg.length - 1];
          if (last.role === 'agent' && last.agent === data.agent) {
            last.content += data.text;
          }
          return newMsg;
        });
      } else if (data.type === 'agent_done') {
        setActiveAgent(null);
        // Speak the response
        if (synthRef.current) {
          const utterance = new SpeechSynthesisUtterance(data.full_text);
          // Try to pick a voice based on agent
          const voices = synthRef.current.getVoices();
          if (data.agent === 'Devil') {
            utterance.pitch = 0.5;
            utterance.rate = 1.1;
          } else if (data.agent === 'CFO') {
            utterance.pitch = 1.2;
            utterance.rate = 1.0;
          }
          synthRef.current.speak(utterance);
        }
      } else if (data.type === 'error') {
        setMessages(prev => [...prev, { role: 'system', content: `Error: ${data.message}` }]);
      }
    };

    return () => {
      ws.close();
      if (synthRef.current) synthRef.current.cancel();
    };
  }, [companyId]);

  const sendTranscript = useCallback((text: string) => {
    if (!text.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    
    // Stop any ongoing speech from agents
    if (synthRef.current) synthRef.current.cancel();

    setMessages(prev => [...prev, { role: 'founder', content: text }]);
    wsRef.current.send(JSON.stringify({
      type: 'founder_transcript',
      text: text
    }));
  }, []);

  const handleSendText = () => {
    if (inputText) {
      sendTranscript(inputText);
      setInputText('');
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch (e) {
        console.error("Speech recognition error:", e);
      }
    }
  };

  const agentStyles: Record<string, {emoji: string, color: string}> = {
    CEO: { emoji: '👔', color: '#3b82f6' },
    CFO: { emoji: '💰', color: '#10b981' },
    CTO: { emoji: '⚙️', color: '#8b5cf6' },
    CMO: { emoji: '📣', color: '#f59e0b' },
    Devil: { emoji: '😈', color: '#ef4444' },
  };

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto', height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <button className="btn btn-ghost" onClick={onBack}>
          <ArrowLeft size={16} /> Back to Boardroom
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ 
            width: 8, height: 8, borderRadius: '50%', 
            background: isConnected ? '#10b981' : '#ef4444',
            boxShadow: `0 0 8px ${isConnected ? '#10b981' : '#ef4444'}`
          }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {isConnected ? 'LIVE CONNECTION' : 'CONNECTING...'}
          </span>
        </div>
      </div>

      <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Avatars Area */}
        <div style={{ padding: 20, display: 'flex', justifyContent: 'center', gap: 20, borderBottom: '1px solid var(--border-color)' }}>
          {Object.keys(agentStyles).map(agent => {
            const isActive = activeAgent === agent;
            return (
              <motion.div 
                key={agent}
                animate={{
                  scale: isActive ? 1.2 : 1,
                  opacity: isActive ? 1 : 0.4
                }}
                style={{
                  width: 60, height: 60, borderRadius: '50%',
                  background: `${agentStyles[agent].color}20`,
                  border: `2px solid ${agentStyles[agent].color}${isActive ? 'ff' : '40'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.5rem',
                  boxShadow: isActive ? `0 0 20px ${agentStyles[agent].color}40` : 'none'
                }}
              >
                {agentStyles[agent].emoji}
              </motion.div>
            )
          })}
        </div>

        {/* Chat Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {messages.map((msg, i) => (
            <div 
              key={i} 
              style={{
                alignSelf: msg.role === 'founder' ? 'flex-end' : (msg.role === 'system' ? 'center' : 'flex-start'),
                background: msg.role === 'founder' ? 'var(--accent-gradient)' : (msg.role === 'system' ? 'transparent' : 'var(--bg-secondary)'),
                color: msg.role === 'founder' ? '#fff' : (msg.role === 'system' ? 'var(--text-secondary)' : 'var(--text-primary)'),
                padding: msg.role === 'system' ? 0 : '12px 16px',
                borderRadius: msg.role === 'founder' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                maxWidth: '80%',
                fontSize: msg.role === 'system' ? '0.8rem' : '0.95rem',
                border: msg.role === 'agent' ? `1px solid ${agentStyles[msg.agent!]?.color}30` : 'none'
              }}
            >
              {msg.role === 'agent' && (
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: agentStyles[msg.agent!]?.color, marginBottom: 4 }}>
                  {msg.agent}
                </div>
              )}
              {msg.content}
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div style={{ padding: 20, borderTop: '1px solid var(--border-color)', display: 'flex', gap: 12 }}>
          <button 
            className="btn"
            style={{
              background: isRecording ? '#ef4444' : 'var(--bg-secondary)',
              color: isRecording ? '#fff' : 'var(--text-primary)',
              width: 50, height: 50, borderRadius: '50%',
              padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            onClick={toggleRecording}
          >
            <Mic size={20} />
          </button>
          <input
            type="text"
            className="input"
            style={{ flex: 1 }}
            placeholder="Type your response or click the mic to speak..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendText()}
          />
          <button className="btn btn-primary" onClick={handleSendText}>
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
