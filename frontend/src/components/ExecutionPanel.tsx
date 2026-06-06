import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, CheckCircle, AlertCircle, Play, Linkedin, MapPin } from 'lucide-react';
import { executeHR, streamPostSSE } from '../api';

interface ExecutionPanelProps {
  companyId: string;
  hrResult: any;
}

export default function ExecutionPanel({ companyId, hrResult }: ExecutionPanelProps) {
  const [logs, setLogs] = useState<{ id: string; type: string; text: string; details?: any }[]>([]);
  const [sourcedProfiles, setSourcedProfiles] = useState<any[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (type: string, text: string, details?: any) => {
    setLogs((prev) => [
      ...prev,
      { id: Math.random().toString(36).substr(2, 9), type, text, details },
    ]);
  };

  const handleExecute = async () => {
    if (isExecuting || isDone) return;
    setIsExecuting(true);
    setLogs([]);

    try {
      addLog('info', 'Connecting to NVIDIA NIM Tool Calling API...');
      const response = await executeHR({
        company_id: companyId,
        hr_result: hrResult,
      });

      await streamPostSSE(
        response,
        (event) => {
          if (event.type === 'execution_start' || event.type === 'execution_progress') {
            addLog('info', event.message);
          } else if (event.type === 'tool_call') {
            addLog('tool', `Calling tool \`${event.function}\``, event.arguments);
          } else if (event.type === 'action_guard') {
            addLog(
              event.safe ? 'success' : 'error',
              `${event.provider || 'NVIDIA TrustOps'} ${event.safe ? 'approved' : 'blocked'} \`${event.function}\` — ${event.status?.replace(/_/g, ' ')}`,
            );
          } else if (event.type === 'tool_result') {
            addLog('success', event.message);
          } else if (event.type === 'error') {
            addLog('error', event.message);
          } else if (event.type === 'execution_done') {
            addLog('done', event.message);
          } else if (event.type === 'sourced_profiles') {
            setSourcedProfiles(event.profiles);
          }
        },
        () => {
          setIsExecuting(false);
          setIsDone(true);
        }
      );
    } catch (err: any) {
      addLog('error', `Execution failed: ${err.message}`);
      setIsExecuting(false);
    }
  };

  return (
    <div className="glass-card" style={{ marginTop: 20, border: '1px solid var(--accent-primary)', overflow: 'hidden' }}>
      <div
        style={{
          background: 'rgba(59, 130, 246, 0.1)',
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Terminal size={18} color="var(--accent-primary)" />
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>NVIDIA Execution Agent</h3>
        </div>

        {!isExecuting && !isDone && (
          <button className="btn btn-primary btn-sm" onClick={handleExecute}>
            <Play size={14} /> Approve & Execute Actions
          </button>
        )}
        {isExecuting && (
          <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)' }}>
            <span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> Executing...
          </span>
        )}
        {isDone && (
          <span style={{ fontSize: '0.8rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle size={14} /> Completed
          </span>
        )}
      </div>

      <div
        style={{
          background: '#0a0a0a',
          padding: 20,
          minHeight: 200,
          maxHeight: 400,
          overflowY: 'auto',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.85rem',
        }}
      >
        {logs.length === 0 && !isExecuting && (
          <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px 0' }}>
            Click "Approve & Execute Actions" to let the agent autonomously send emails and post jobs.
          </div>
        )}

        {logs.map((log) => (
          <motion.div
            key={log.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ marginBottom: 12, display: 'flex', gap: 10, color: '#e5e5e5' }}
          >
            <div style={{ marginTop: 2 }}>
              {log.type === 'info' && <span style={{ color: '#60a5fa' }}>▶</span>}
              {log.type === 'tool' && <span style={{ color: '#a78bfa' }}>⚡</span>}
              {log.type === 'success' && <CheckCircle size={14} color="#34d399" />}
              {log.type === 'error' && <AlertCircle size={14} color="#f87171" />}
              {log.type === 'done' && <CheckCircle size={14} color="#34d399" />}
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={{ 
                color: log.type === 'error' ? '#f87171' : 
                       log.type === 'tool' ? '#a78bfa' : 
                       log.type === 'success' || log.type === 'done' ? '#34d399' : '#e5e5e5' 
              }}>
                {log.text}
              </div>
              
              {log.details && (
                <div style={{ 
                  marginTop: 8, 
                  background: 'rgba(255,255,255,0.05)', 
                  padding: 10, 
                  borderRadius: 4,
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  {log.details.to_email && (
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ color: '#9ca3af' }}>To:</span> {log.details.to_email} <br />
                      <span style={{ color: '#9ca3af' }}>Subject:</span> {log.details.subject}
                    </div>
                  )}
                  {log.details.job_title && (
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ color: '#9ca3af' }}>Job Title:</span> {log.details.job_title} <br />
                      <span style={{ color: '#9ca3af' }}>Platforms:</span> {log.details.platforms?.join(', ')}
                    </div>
                  )}
                  {log.details.body && (
                    <div style={{ color: '#d1d5db', whiteSpace: 'pre-wrap', marginTop: 8, fontSize: '0.8rem', paddingLeft: 8, borderLeft: '2px solid #4b5563' }}>
                      {log.details.body}
                    </div>
                  )}
                  {log.details.job_description && (
                    <div style={{ color: '#d1d5db', whiteSpace: 'pre-wrap', marginTop: 8, fontSize: '0.8rem', paddingLeft: 8, borderLeft: '2px solid #4b5563' }}>
                      {log.details.job_description}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ))}
        <div ref={logsEndRef} />
      </div>

      {/* Sourced Profiles Grid */}
      <AnimatePresence>
        {sourcedProfiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            style={{
              padding: 20,
              background: 'rgba(10, 10, 10, 0.5)',
              borderTop: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <h4 style={{ 
              fontSize: '0.85rem', 
              fontWeight: 700, 
              color: '#60a5fa', 
              textTransform: 'uppercase', 
              letterSpacing: '0.06em', 
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <Linkedin size={16} /> Live Sourced Candidates
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              {sourcedProfiles.map((profile, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: i * 0.15 }}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <img 
                      src={profile.avatar_url} 
                      alt={profile.name} 
                      style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)' }} 
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#fff' }}>{profile.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{profile.title}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={12} /> {profile.location}
                  </div>
                  <button 
                    className="btn btn-ghost btn-sm" 
                    onClick={() => window.open(profile.linkedin_url, '_blank')}
                    style={{ width: '100%', marginTop: 'auto', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.2)' }}
                  >
                    <Linkedin size={14} /> View Profile
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
