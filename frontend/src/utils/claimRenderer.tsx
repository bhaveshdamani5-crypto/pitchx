import type { ClaimTag } from '../types';

const VERIFIED_RE = /\[VERIFIED:([a-z_]+)\]/gi;
const ASSUMPTION_RE = /\[ASSUMPTION\]/gi;

export function parseContentClaims(content: string): ClaimTag[] {
  const claims: ClaimTag[] = [];
  const parts = content.split(/(?=\[VERIFIED:|\[ASSUMPTION\])/i);

  for (const part of parts) {
    const verifiedMatch = part.match(/^\[VERIFIED:([a-z_]+)\]\s*(.*)/is);
    if (verifiedMatch) {
      const text = verifiedMatch[2].split(/\[VERIFIED:|\[ASSUMPTION\]/i)[0].trim();
      if (text) {
        claims.push({
          verified: true,
          source_key: verifiedMatch[1].toLowerCase(),
          text: text.slice(0, 300),
        });
      }
      continue;
    }
    const assumptionMatch = part.match(/^\[ASSUMPTION\]\s*(.*)/is);
    if (assumptionMatch) {
      const text = assumptionMatch[1].split(/\[VERIFIED:|\[ASSUMPTION\]/i)[0].trim();
      if (text) {
        claims.push({ verified: false, text: text.slice(0, 300) });
      }
    }
  }

  return claims;
}

export function stripProvenanceTags(content: string): string {
  return content
    .replace(VERIFIED_RE, '')
    .replace(ASSUMPTION_RE, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function ProvenanceBadges({ claims }: { claims: ClaimTag[] }) {
  if (!claims.length) return null;

  return (
    <div className="provenance-badges">
      {claims.slice(0, 6).map((claim, i) => (
        <span
          key={i}
          className={`provenance-badge ${claim.verified ? 'verified' : 'assumption'}`}
          title={claim.evidence_id ? `${claim.text}\nEvidence: ${claim.evidence_id}` : claim.text}
        >
          {claim.verified ? '✓ Verified' : '⚠ Assumption'}
          {claim.source_key && (
            <span className="provenance-source"> · {claim.source_key.replace(/_/g, ' ')}</span>
          )}
          {claim.evidence_score !== undefined && (
            <span className="provenance-source"> · {Math.round(claim.evidence_score * 100)}%</span>
          )}
        </span>
      ))}
    </div>
  );
}
