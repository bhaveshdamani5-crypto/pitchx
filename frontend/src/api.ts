/* ── API Client for PitchX Backend ── */

const API_BASE = 'http://localhost:8000';

export async function createCompany(data: {
  name: string;
  website?: string;
  mode: string;
  industry?: string;
  stage?: string;
  monthly_revenue?: number;
  team_size?: number;
}) {
  const res = await fetch(`${API_BASE}/api/company/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to create company: ${res.statusText}`);
  return res.json();
}

export async function listCompanies() {
  const res = await fetch(`${API_BASE}/api/companies`);
  if (!res.ok) throw new Error('Failed to list companies');
  return res.json();
}

export async function getCompanyMemory(companyId: string) {
  const res = await fetch(`${API_BASE}/api/company/${companyId}/memory`);
  if (!res.ok) throw new Error('Failed to get company memory');
  return res.json();
}

export async function startPitch(data: {
  company_id: string;
  mode: string;
  idea: string;
  challenge?: string;
  founder_background?: string;
  budget?: number;
  market?: string;
  timeline_months?: number;
}) {
  const res = await fetch(`${API_BASE}/api/pitch/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to start pitch');
  return res.json();
}

export async function startResearch(data: {
  company_id: string;
  company_name: string;
  website_url?: string;
  industry?: string;
}) {
  const res = await fetch(`${API_BASE}/api/research/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to start research');
  return res;  // Returns SSE stream
}

export async function startHR(data: {
  company_id: string;
  session_id?: string;
  position: {
    title: string;
    level: string;
    team?: string;
    budget?: string;
  };
  candidates: Array<{
    id: string;
    name: string;
    resume_text: string;
    interview_transcript?: string;
  }>;
  business_plan_context?: string;
}) {
  const res = await fetch(`${API_BASE}/api/hr/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to start HR evaluation');
  return res.json();
}

export function createSSEStream(url: string, onEvent: (event: any) => void, onDone?: () => void) {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
  const eventSource = new EventSource(fullUrl);
  
  eventSource.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      onEvent(data);
      if (data.type === 'done' || data.type === 'stream_end') {
        eventSource.close();
        onDone?.();
      }
    } catch (err) {
      console.error('SSE parse error:', err);
    }
  };

  eventSource.onerror = () => {
    eventSource.close();
    onDone?.();
  };

  return eventSource;
}

// SSE from POST response (for research ingestion which returns SSE from POST)
export async function streamPostSSE(
  response: Response,
  onEvent: (event: any) => void,
  onDone?: () => void,
) {
  const reader = response.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            onEvent(data);
            if (data.type === 'stream_end') {
              onDone?.();
              return;
            }
          } catch {
            // skip malformed
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
    onDone?.();
  }
}
