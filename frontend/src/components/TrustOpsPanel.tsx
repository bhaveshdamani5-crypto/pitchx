import { ShieldCheck, Database, CheckCircle, AlertTriangle, LockKeyhole } from 'lucide-react';
import type { ReactNode } from 'react';
import type { TrustOpsState } from '../types';

interface TrustOpsPanelProps {
  trustOps: TrustOpsState;
}

export default function TrustOpsPanel({ trustOps }: TrustOpsPanelProps) {
  const provider = trustOps.provider || 'NVIDIA TrustOps';

  return (
    <div className="trustops-panel">
      <div className="trustops-header">
        <div>
          <div className="trustops-kicker">Agent TrustOps</div>
          <h4>{provider}</h4>
        </div>
        <ShieldCheck size={20} color="#34d399" />
      </div>

      <div className="trustops-grid">
        <TrustMetric icon={<Database size={14} />} label="Evidence ranked" value={trustOps.evidenceRanked} />
        <TrustMetric icon={<CheckCircle size={14} />} label="Verified claims" value={trustOps.verifiedClaims} tone="safe" />
        <TrustMetric icon={<AlertTriangle size={14} />} label="Assumptions" value={trustOps.assumptions} tone="warning" />
        <TrustMetric icon={<LockKeyhole size={14} />} label="Guards passed" value={trustOps.guardChecksPassed} tone="safe" />
      </div>

      {(trustOps.downgradedClaims > 0 || trustOps.guardChecksFailed > 0 || trustOps.actionsAwaitingApproval > 0) && (
        <div className="trustops-alert-row">
          {trustOps.downgradedClaims > 0 && <span>{trustOps.downgradedClaims} downgraded</span>}
          {trustOps.guardChecksFailed > 0 && <span>{trustOps.guardChecksFailed} blocked</span>}
          {trustOps.actionsAwaitingApproval > 0 && <span>{trustOps.actionsAwaitingApproval} action approvals</span>}
        </div>
      )}

      {trustOps.latestEvents.length > 0 && (
        <div className="trustops-events">
          {trustOps.latestEvents.map((event, index) => (
            <div key={`${event.type}-${index}`} className={`trustops-event ${event.status}`}>
              <span />
              {event.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TrustMetric({
  icon,
  label,
  value,
  tone = 'info',
}: {
  icon: ReactNode;
  label: string;
  value: number;
  tone?: 'info' | 'safe' | 'warning';
}) {
  return (
    <div className={`trustops-metric ${tone}`}>
      <div className="trustops-metric-icon">{icon}</div>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}
