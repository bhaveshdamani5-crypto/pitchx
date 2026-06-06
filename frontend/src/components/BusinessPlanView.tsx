import { motion } from 'framer-motion';
import type { BusinessPlan } from '../types';

interface BusinessPlanViewProps {
  plan: BusinessPlan;
}

export default function BusinessPlanView({ plan }: BusinessPlanViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Executive Summary */}
      {plan.executive_summary && (
        <div className="plan-section">
          <h3>🎯 Executive Summary</h3>
          <p>{plan.executive_summary}</p>
        </div>
      )}

      {/* Market Opportunity */}
      {plan.market_opportunity && (
        <div className="plan-section">
          <h3>📈 Market Opportunity</h3>
          <p><strong>Target Market:</strong> {plan.market_opportunity.target_market}</p>
          <p><strong>Market Size:</strong> {plan.market_opportunity.market_size}</p>
          <p><strong>Growth Rate:</strong> {plan.market_opportunity.growth_rate}</p>
          {plan.market_opportunity.key_trends && plan.market_opportunity.key_trends.length > 0 && (
            <>
              <p style={{ marginTop: 8 }}><strong>Key Trends:</strong></p>
              <ul>
                {plan.market_opportunity.key_trends.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {/* Value Proposition */}
      {plan.value_proposition && (
        <div className="plan-section">
          <h3>💎 Value Proposition</h3>
          <p>{plan.value_proposition}</p>
        </div>
      )}

      {/* Competitive Advantage */}
      {plan.competitive_advantage && plan.competitive_advantage.length > 0 && (
        <div className="plan-section">
          <h3>🛡️ Competitive Advantage</h3>
          <ul>
            {plan.competitive_advantage.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Business Model */}
      {plan.business_model && (
        <div className="plan-section">
          <h3>💰 Business Model</h3>
          <p><strong>Pricing:</strong> {plan.business_model.pricing_strategy}</p>
          <p><strong>Unit Economics:</strong> {plan.business_model.unit_economics}</p>
          {plan.business_model.revenue_streams && (
            <>
              <p style={{ marginTop: 8 }}><strong>Revenue Streams:</strong></p>
              <ul>
                {plan.business_model.revenue_streams.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {/* Go-To-Market */}
      {plan.go_to_market && (
        <div className="plan-section">
          <h3>🚀 Go-To-Market Strategy</h3>
          <p><strong>ICP:</strong> {plan.go_to_market.icp}</p>
          <p><strong>First 90 Days:</strong> {plan.go_to_market.first_90_days}</p>
          {plan.go_to_market.channels && (
            <>
              <p style={{ marginTop: 8 }}><strong>Channels:</strong></p>
              <ul>
                {plan.go_to_market.channels.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {/* Technical Plan */}
      {plan.technical_plan && (
        <div className="plan-section">
          <h3>⚙️ Technical Plan</h3>
          <p><strong>Build Timeline:</strong> {plan.technical_plan.build_timeline}</p>
          {plan.technical_plan.tech_stack && (
            <p>
              <strong>Tech Stack:</strong>{' '}
              {plan.technical_plan.tech_stack.join(', ')}
            </p>
          )}
          {plan.technical_plan.mvp_features && (
            <>
              <p style={{ marginTop: 8 }}><strong>MVP Features:</strong></p>
              <ul>
                {plan.technical_plan.mvp_features.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {/* Financial Projections */}
      {plan.financial_projections && (
        <div className="plan-section">
          <h3>📊 Financial Projections</h3>
          <p><strong>Initial Investment:</strong> {plan.financial_projections.initial_investment}</p>
          <p><strong>Monthly Burn:</strong> {plan.financial_projections.monthly_burn}</p>
          <p><strong>Revenue Timeline:</strong> {plan.financial_projections.revenue_timeline}</p>
          <p><strong>Break Even:</strong> {plan.financial_projections.break_even}</p>
        </div>
      )}

      {/* Risk Matrix */}
      {plan.risk_matrix && plan.risk_matrix.length > 0 && (
        <div className="plan-section">
          <h3>⚠️ Risk Matrix</h3>
          <table>
            <thead>
              <tr>
                <th>Risk</th>
                <th>Severity</th>
                <th>Mitigation</th>
              </tr>
            </thead>
            <tbody>
              {plan.risk_matrix.map((r, i) => (
                <tr key={i}>
                  <td>{r.risk}</td>
                  <td>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 8,
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background:
                          r.severity === 'high'
                            ? 'rgba(239, 68, 68, 0.15)'
                            : r.severity === 'medium'
                            ? 'rgba(245, 158, 11, 0.15)'
                            : 'rgba(16, 185, 129, 0.15)',
                        color:
                          r.severity === 'high'
                            ? '#f87171'
                            : r.severity === 'medium'
                            ? '#fbbf24'
                            : '#34d399',
                      }}
                    >
                      {r.severity}
                    </span>
                  </td>
                  <td>{r.mitigation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Unresolved Questions */}
      {plan.unresolved_questions && plan.unresolved_questions.length > 0 && (
        <div className="plan-section">
          <h3>❓ Unresolved Questions</h3>
          <ul>
            {plan.unresolved_questions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Next Steps */}
      {plan.next_steps && plan.next_steps.length > 0 && (
        <div className="plan-section">
          <h3>📋 Next Steps</h3>
          <ul>
            {plan.next_steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
