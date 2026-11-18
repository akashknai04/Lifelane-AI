import React, { useState } from 'react';
import { Binary, Play, ShieldAlert, Cpu, Network, ArrowRight, ExternalLink, Activity, CheckCircle, Clock } from 'lucide-react';

const SCENARIOS = [
  {
    id: "peak_morning_rush",
    code: "SCN-01",
    title: "Single Emergency Corridor (Baseline vs LifeLane)",
    description: "Ambulance dispatched from St. John's Medical College Hospital to Victoria Hospital BMCRI Trauma Centre across 6 traffic signals.",
    metrics: "Compares unassisted fixed-signal transit against 5–8s pre-cleared green corridor.",
    status: "Active Digital Twin Simulation"
  },
  {
    id: "dual_ambulance_conflict",
    code: "SCN-02",
    title: "Converging Multi-Vehicle Priority Arbitration",
    description: "Two simultaneous emergency vehicles (Cardiac Ambulance + Fire Heavy Tender) approach Richmond Circle junction concurrently.",
    metrics: "Evaluates deterministic priority queue scheduling in <1 second.",
    status: "Active Digital Twin Simulation"
  },
  {
    id: "sudden_arterial_incident",
    code: "SCN-03",
    title: "Peak-Hour Dynamic Bottleneck Spike",
    description: "Unplanned vehicle breakdown on Hosur Road causing sudden arterial saturation while an ambulance is en route.",
    metrics: "Tests 10-second recalculation loop and dynamic diversion onto parallel roads.",
    status: "Active Digital Twin Simulation"
  },
  {
    id: "monsoon_downpour_waterlogged",
    code: "SCN-04",
    title: "Heavy Monsoon Flood / Waterlogged Arterial",
    description: "Simulates severe waterlogging at Dairy Circle underpass, dynamically activating alternate high-elevation route.",
    metrics: "Validates multimodal weather fusion and speed degradation adaptation.",
    status: "Active Digital Twin Simulation"
  }
];

export default function DigitalTwinSection() {
  const [selectedScenario, setSelectedScenario] = useState('peak_morning_rush');
  const [loading, setLoading] = useState(false);
  const [benchmarkResult, setBenchmarkResult] = useState(null);

  const handleRunSimulation = async (scenarioId) => {
    setLoading(true);
    setSelectedScenario(scenarioId);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/simulation/run-scenario?scenario_id=${scenarioId}`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        setBenchmarkResult(data);
      }
    } catch (err) {
      console.warn('Simulation API call fallback:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="simulation" style={{
      backgroundColor: '#3a3b3a',
      color: '#ffffff',
      padding: '96px 0',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Glow */}
      <div style={{
        position: 'absolute',
        top: '-150px',
        right: '-150px',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        backgroundColor: 'rgba(243, 110, 32, 0.1)',
        filter: 'blur(90px)',
        pointerEvents: 'none'
      }} />

      <div className="container-custom" style={{ position: 'relative', zIndex: 1 }}>
        {/* Eyebrow -> Heading -> Body Rhythm */}
        <div style={{ maxWidth: '820px', marginBottom: '56px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(243, 110, 32, 0.15)',
            border: '1px solid rgba(243, 110, 32, 0.3)',
            borderRadius: '9999px',
            padding: '6px 14px',
            fontSize: '12px',
            fontWeight: '700',
            color: '#f36e20',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '16px'
          }}>
            <Binary size={14} />
            <span>Phase 7 · Simulation & Evaluation</span>
          </div>

          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 42px)',
            fontWeight: '800',
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            color: '#ffffff',
            margin: '0 0 16px 0'
          }}>
            Multi-Agent Digital Twin & Benchmark Engine
          </h2>

          <p style={{
            fontSize: '16px',
            lineHeight: 1.6,
            color: '#dfe0df',
            margin: 0
          }}>
            Before actuating physical municipal infrastructure, LifeLane AI executes against a closed-loop digital twin modeling Bengaluru Central Grid. Run synthetic emergency runs and evaluate live benchmark physics.
          </p>
        </div>

        {/* 4 Scenario Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '24px',
          marginBottom: '40px'
        }}>
          {SCENARIOS.map((sc) => (
            <div 
              key={sc.id}
              style={{
                backgroundColor: selectedScenario === sc.id ? 'rgba(243, 110, 32, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                border: selectedScenario === sc.id ? '2px solid #f36e20' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
              }}
            >
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '14px'
                }}>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '800',
                    fontFamily: 'monospace',
                    color: '#f36e20',
                    backgroundColor: 'rgba(243, 110, 32, 0.1)',
                    padding: '3px 8px',
                    borderRadius: '6px'
                  }}>
                    {sc.code}
                  </span>

                  <span style={{
                    fontSize: '11px',
                    color: '#10b981',
                    fontWeight: '600'
                  }}>
                    {sc.status}
                  </span>
                </div>

                <h3 style={{
                  fontSize: '17px',
                  fontWeight: '700',
                  color: '#ffffff',
                  lineHeight: 1.3,
                  margin: '0 0 10px 0'
                }}>
                  {sc.title}
                </h3>

                <p style={{
                  fontSize: '13px',
                  lineHeight: 1.6,
                  color: '#dfe0df',
                  margin: '0 0 14px 0'
                }}>
                  {sc.description}
                </p>
              </div>

              <div>
                <div style={{
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  paddingTop: '12px',
                  fontSize: '12px',
                  color: '#a1a3a1',
                  marginBottom: '14px'
                }}>
                  <strong style={{ color: '#ffffff' }}>Evaluation:</strong> {sc.metrics}
                </div>

                <button
                  type="button"
                  onClick={() => handleRunSimulation(sc.id)}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    backgroundColor: selectedScenario === sc.id ? '#f36e20' : '#4a4b4a',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                >
                  <Play size={14} />
                  <span>{loading && selectedScenario === sc.id ? 'Simulating Run...' : 'Run Simulation'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Live Benchmark Evaluation Panel */}
        {benchmarkResult && (
          <div style={{
            backgroundColor: '#272827',
            border: '2px solid #f36e20',
            borderRadius: '20px',
            padding: '32px',
            marginBottom: '40px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', pb: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#f36e20', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Live Benchmark Results
                </span>
                <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#ffffff', margin: '4px 0 0 0' }}>
                  {benchmarkResult.title} ({benchmarkResult.distance_km} km)
                </h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '6px', backgroundColor: 'rgba(243, 110, 32, 0.2)', color: '#f36e20', fontWeight: '700' }}>
                  Weather: {benchmarkResult.weather}
                </span>
                <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '6px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10b981', fontWeight: '700' }}>
                  Signals: {benchmarkResult.total_signals_en_route} En Route
                </span>
              </div>
            </div>

            {/* Comparison Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '12px', color: '#a1a3a1', marginBottom: '4px' }}>Travel Time Saved</div>
                <div style={{ fontSize: '26px', fontWeight: '900', color: '#f36e20' }}>
                  {benchmarkResult.comparison_metrics.time_saved_formatted}
                </div>
                <div style={{ fontSize: '11px', color: '#10b981', fontWeight: '700', marginTop: '4px' }}>
                  {benchmarkResult.comparison_metrics.travel_time_reduction_percentage}% faster transit
                </div>
                <span style={{ fontSize: '10px', backgroundColor: '#3a3b3a', padding: '2px 6px', borderRadius: '4px', color: '#dfe0df', display: 'inline-block', marginTop: '6px' }}>
                  {benchmarkResult.honesty_badges.time_saved}
                </span>
              </div>

              <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '12px', color: '#a1a3a1', marginBottom: '4px' }}>Signal Stops</div>
                <div style={{ fontSize: '26px', fontWeight: '900', color: '#10b981' }}>
                  {benchmarkResult.lifelane_ai.signal_stops_count} <span style={{ fontSize: '14px', color: '#a1a3a1', fontWeight: '400' }}>vs {benchmarkResult.unassisted_baseline.signal_stops_count} baseline</span>
                </div>
                <div style={{ fontSize: '11px', color: '#10b981', fontWeight: '700', marginTop: '4px' }}>
                  {benchmarkResult.comparison_metrics.signal_stops_reduction_percentage}% stop reduction
                </div>
                <span style={{ fontSize: '10px', backgroundColor: '#3a3b3a', padding: '2px 6px', borderRadius: '4px', color: '#dfe0df', display: 'inline-block', marginTop: '6px' }}>
                  {benchmarkResult.honesty_badges.percentage_claims}
                </span>
              </div>

              <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '12px', color: '#a1a3a1', marginBottom: '4px' }}>Civilian Delay Bound</div>
                <div style={{ fontSize: '26px', fontWeight: '900', color: '#38bdf8' }}>
                  {benchmarkResult.comparison_metrics.civilian_added_delay_seconds} s
                </div>
                <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '700', marginTop: '4px' }}>
                  Capped at &lt; 90.0s (Duan et al. 2022)
                </div>
                <span style={{ fontSize: '10px', backgroundColor: '#3a3b3a', padding: '2px 6px', borderRadius: '4px', color: '#dfe0df', display: 'inline-block', marginTop: '6px' }}>
                  {benchmarkResult.honesty_badges.civilian_delay}
                </span>
              </div>

              <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '12px', color: '#a1a3a1', marginBottom: '4px' }}>Emissions Prevented</div>
                <div style={{ fontSize: '26px', fontWeight: '900', color: '#a855f7' }}>
                  {benchmarkResult.comparison_metrics.co2_emissions_saved_kg} kg
                </div>
                <div style={{ fontSize: '11px', color: '#a855f7', fontWeight: '700', marginTop: '4px' }}>
                  Idle deceleration elimination
                </div>
                <span style={{ fontSize: '10px', backgroundColor: '#3a3b3a', padding: '2px 6px', borderRadius: '4px', color: '#dfe0df', display: 'inline-block', marginTop: '6px' }}>
                  Simulated estimate
                </span>
              </div>
            </div>

            {/* Side-by-Side Comparison Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px' }}>
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontWeight: '800', color: '#f87171', marginBottom: '8px' }}>Unassisted Civilian Baseline</div>
                <div>Total Drive Time: <strong>{benchmarkResult.unassisted_baseline.travel_time_formatted}</strong></div>
                <div>Average Speed: <strong>{benchmarkResult.unassisted_baseline.average_speed_kmh} km/h</strong></div>
                <div>Red Light Wait: <strong>{benchmarkResult.unassisted_baseline.total_signal_delay_seconds}s</strong> across {benchmarkResult.unassisted_baseline.signal_stops_count} stops</div>
              </div>

              <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontWeight: '800', color: '#4ade80', marginBottom: '8px' }}>LifeLane AI Green Wave</div>
                <div>Total Drive Time: <strong>{benchmarkResult.lifelane_ai.travel_time_formatted}</strong></div>
                <div>Average Speed: <strong>{benchmarkResult.lifelane_ai.average_speed_kmh} km/h</strong></div>
                <div>Preempted Signals: <strong>{benchmarkResult.total_signals_en_route - benchmarkResult.lifelane_ai.signal_stops_count} continuous greens</strong></div>
              </div>
            </div>
          </div>
        )}

        {/* Driver Terminal CTA */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          padding: '24px 32px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px'
        }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff', marginBottom: '4px' }}>
              Real-Time Emergency Driver Terminal Connected
            </div>
            <div style={{ fontSize: '13px', color: '#dfe0df' }}>
              Experience the active corridor preemption simulation live on port 5174 with real GPS or polyline simulator.
            </div>
          </div>

          <a 
            href="http://localhost:5174" 
            target="_blank" 
            rel="noreferrer"
            className="btn-primary"
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>Launch Live Driver Terminal</span>
            <ExternalLink size={15} />
          </a>
        </div>
      </div>
    </section>
  );
}
