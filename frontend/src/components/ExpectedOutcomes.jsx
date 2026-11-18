import React from 'react';
import { Target, AlertCircle } from 'lucide-react';

const OUTCOMES = [
  {
    metric: "Ambulance response time",
    baseline: "12–18 min (urban)",
    withLifeLane: "7–11 min",
    improvement: "~35–40% faster",
    note: "Saves critical 4–7 minutes in acute cardiac/trauma cases"
  },
  {
    metric: "Signal stops per trip",
    baseline: "6–10 stops",
    withLifeLane: "0–1 stops",
    improvement: "~90% reduction",
    note: "Automated green preemption 2–3 intersections ahead"
  },
  {
    metric: "Fuel consumption",
    baseline: "Standard city baseline",
    withLifeLane: "~15% lower",
    improvement: "Fewer idle stops",
    note: "Eliminates repeated braking and idling at red signals"
  },
  {
    metric: "Overall civilian traffic delay",
    baseline: "Uncoordinated gridlock",
    withLifeLane: "< 90s added / vehicle",
    improvement: "Minimal disruption",
    note: "Parallel arterial green phase extension and diversion"
  },
  {
    metric: "Driver alert lead time",
    baseline: "Siren only (~3s audibility)",
    withLifeLane: "30–45 seconds ahead",
    improvement: "10x earlier warning",
    note: "500m radius notification via push, roadside LED, and V2X"
  },
  {
    metric: "Multi-vehicle conflicts",
    baseline: "Manual driver hesitation",
    withLifeLane: "Automated in < 1s",
    improvement: "Conflict-free schedule",
    note: "Deterministic emergency priority queue arbitration"
  }
];

export default function ExpectedOutcomes() {
  return (
    <section id="outcomes" style={{ padding: '96px 0', backgroundColor: '#f8f8f8', borderBottom: '1px solid #e0e1e0' }}>
      <div className="container-custom">
        {/* Section Header Rhythm */}
        <div style={{ textAlign: 'center', maxWidth: '760px', margin: '0 auto 48px' }}>
          <div className="pill-badge" style={{ margin: '0 auto 16px' }}>
            <Target size={14} color="#f36e20" />
            <span>Target Performance Benchmarks</span>
          </div>
          <h2 style={{ fontSize: 'clamp(32px, 4.5vw, 48px)', fontWeight: '800', letterSpacing: '-0.03em', color: '#3a3b3a', marginBottom: '16px' }}>
            Expected Outcomes vs. Today's Baseline
          </h2>
          <p style={{ fontSize: '18px', color: '#626462', lineHeight: 1.6 }}>
            Comprehensive impact comparison across critical urban emergency and commuter metrics (Deck Slide 12).
          </p>
        </div>

        {/* Scientific Honesty Disclaimer Banner */}
        <div style={{
          backgroundColor: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: '16px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '32px'
        }}>
          <AlertCircle size={20} color="#d97706" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '13px', color: '#92400e', lineHeight: 1.5 }}>
            <strong>Scientific & Engineering Honesty:</strong> Figures listed in this benchmark comparison represent <strong>projected design targets</strong> informed by peer-reviewed literature. Live deployed metrics in the Digital Twin simulator are computed strictly from real-time model execution.
          </div>
        </div>

        {/* Outcomes Table */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          border: '1px solid #e0e1e0',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #e0e1e0' }}>
                  <th style={{ padding: '18px 24px', fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', color: '#3a3b3a', letterSpacing: '0.04em' }}>Performance Metric</th>
                  <th style={{ padding: '18px 20px', fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', color: '#626462', letterSpacing: '0.04em' }}>Today's Baseline</th>
                  <th style={{ padding: '18px 20px', fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', color: '#f36e20', letterSpacing: '0.04em' }}>With LifeLane AI</th>
                  <th style={{ padding: '18px 24px', fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', color: '#10b981', letterSpacing: '0.04em' }}>Projected Target</th>
                </tr>
              </thead>
              <tbody>
                {OUTCOMES.map((item, index) => (
                  <tr 
                    key={item.metric}
                    style={{
                      borderBottom: index !== OUTCOMES.length - 1 ? '1px solid #e0e1e0' : 'none',
                      backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafafa'
                    }}
                  >
                    <td style={{ padding: '18px 24px' }}>
                      <div style={{ fontSize: '15px', fontWeight: '800', color: '#3a3b3a' }}>{item.metric}</div>
                      <div style={{ fontSize: '12px', color: '#626462', marginTop: '2px' }}>{item.note}</div>
                    </td>
                    <td style={{ padding: '18px 20px', fontSize: '14px', color: '#64748b', fontWeight: '600' }}>
                      {item.baseline}
                    </td>
                    <td style={{ padding: '18px 20px', fontSize: '14px', color: '#3a3b3a', fontWeight: '800' }}>
                      {item.withLifeLane}
                    </td>
                    <td style={{ padding: '18px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '14px', fontWeight: '800', color: '#10b981' }}>{item.improvement}</span>
                        <span className="target-badge">Projected target</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
