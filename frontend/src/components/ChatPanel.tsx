import { useState, useEffect, useRef } from 'react';
import { Send, Loader } from 'lucide-react';
import type { ChatMessage } from '../types';

interface ChatPanelProps {
  companyId: string;
}

const AGENTS = ['Board', 'CEO', 'CFO', 'CTO', 'CMO', 'HR', 'Devil'];

export default function ChatPanel({ companyId }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('Board');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch initial chat history
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`http://localhost:8000/api/chat/${companyId}`);
        const data = await res.json();
        if (data.history) {
          setMessages(data.history);
        }
      } catch (err) {
        console.error("Failed to load chat history", err);
      } finally {
        setIsLoading(false);
      }
    };
    if (companyId) {
      fetchHistory();
    }
  }, [companyId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage: ChatMessage = { role: 'user', content: inputValue, agent_name: selectedAgent };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await fetch(`http://localhost:8000/api/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: companyId, message: userMessage.content, agent: selectedAgent }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMsg = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '', agent_name: selectedAgent }]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'token') {
                assistantMsg += data.content;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1].content = assistantMsg;
                  return updated;
                });
              } else if (data.type === 'done' || data.type === 'error') {
                setIsTyping(false);
              }
            } catch (e) {
              // Parse error on incomplete chunks, safe to ignore
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to send message", err);
      setIsTyping(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: 30, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Loader className="spinner" />
      </div>
    );
  }

  const displayMessages = messages.filter(
    (m) => selectedAgent === 'Board' || m.agent_name === selectedAgent || (m.role === 'user' && (!m.agent_name || m.agent_name === selectedAgent)) || (m.role === 'assistant' && !m.agent_name)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Agent Selector */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: 8, overflowX: 'auto', background: 'var(--bg-secondary)' }}>
        {AGENTS.map(agent => (
          <button
            key={agent}
            onClick={() => setSelectedAgent(agent)}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              border: '1px solid',
              borderColor: selectedAgent === agent ? 'var(--accent-color)' : 'var(--border-color)',
              background: selectedAgent === agent ? 'var(--accent-color)' : 'transparent',
              color: selectedAgent === agent ? '#fff' : 'var(--text-secondary)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            {agent === 'Board' ? 'The Board' : agent}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {displayMessages.length === 0 && (
          <div className="empty-state" style={{ margin: 'auto' }}>
            <span className="icon">💬</span>
            <p>Start a conversation with {selectedAgent === 'Board' ? 'the AI Board' : `the ${selectedAgent}`} about your business plan.</p>
          </div>
        )}
        {displayMessages.map((msg, i) => (
          <div 
            key={i} 
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              background: msg.role === 'user' ? 'var(--accent-gradient)' : 'var(--bg-secondary)',
              color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
              padding: '12px 16px',
              borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              maxWidth: '85%',
              fontSize: '0.95rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            {msg.role === 'assistant' && (
              <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-accent)', marginBottom: 4 }}>
                {msg.agent_name && msg.agent_name !== 'Board' ? `PitchX ${msg.agent_name}` : 'PitchX Board'}
              </div>
            )}
            <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
          </div>
        ))}
        {isTyping && (
          <div style={{ alignSelf: 'flex-start', color: 'var(--text-secondary)', fontSize: '0.8rem', fontStyle: 'italic', paddingLeft: 10 }}>
            {selectedAgent === 'Board' ? 'Board is typing...' : `${selectedAgent} is typing...`}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div style={{ padding: 16, borderTop: '1px solid var(--border-color)', display: 'flex', gap: 12, background: 'var(--bg-primary)' }}>
        <input
          type="text"
          className="input"
          style={{ flex: 1 }}
          placeholder={`Ask ${selectedAgent === 'Board' ? 'the board' : 'the ' + selectedAgent} about your business...`}
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          disabled={isTyping}
        />
        <button className="btn btn-primary" onClick={handleSend} disabled={isTyping || !inputValue.trim()}>
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
