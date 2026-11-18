import React from 'react';
import { Calendar, CheckCircle2, Clock, ArrowRight, PlayCircle } from 'lucide-react';

const PHASES = [
  {
    phase: "P1",
    weeks: "Wk 1–3",
    title: "Foundation & Telemetry",
    status: "Completed",
    badgeColor: "#10b981",
    bgColor: "#ecfdf5",
    scope: "FastAPI async backend, PostgreSQL/SQLite fallback, JWT auth with RBAC, OpenStreetMap indexing for Central Bengaluru, 500 ms bi-directional WebSocket telemetry stream, and emergency driver terminal."
  },
  {
    phase: "P2",
    weeks: "Wk 4–6",
    title: "Public Platform & System UI",
    status: "Active Release",
    badgeColor: "#f36e20",
    bgColor: "#fef2ec",
    scope: "13 reference-styled responsive sections, measured tokens (#f36e20), peer-reviewed research foundation slider, 10-step interactive workflow stepper, and dynamic sprint log generator."
  },
  {
    phase: "P3",
    weeks: "Wk 7–9",
    title: "AI Routing & Congestion Engine",
    status: "Next Up",
    badgeColor: "#3b82f6",
    bgColor: "#eff6ff",
    scope: "OSRM graph integration + modified A* heuristic with five-factor cost function (<200 ms latency), LSTM+GNN spatiotemporal congestion model trained on PeMS benchmark, 30s rescoring, 10s recalculation."
  },
  {
    phase: "P4",
    weeks: "Wk 10–12",
    title: "Adaptive Signal Control Grid",
    status: "Planned",
    badgeColor: "#626462",
    bgColor: "#eeefee",
    scope: "Hardware-in-the-loop signal controllers, 2-stage preemption logic (35s preparation window, 5–8s green wave actuation), 10s reversion, 45s green cap, and G7 stale-telemetry fail-safe."
  },
  {
    phase: "P5",
    weeks: "Wk 13–14",
    title: "Vision, Alerts & Diversion",
    status: "Planned",
    badgeColor: "#626462",
    bgColor: "#eeefee",
    scope: "YOLOv11 emergency vehicle detection on sample camera video, incident anomaly detector, driver alert dispatcher (500m / 30–45s), roadside LED board API, and parallel arterial traffic diversion."
  },
  {
    phase: "P6",
    weeks: "Wk 15–16",
    title: "Police Dashboard & Edge Hardening",
    status: "Planned",
    badgeColor: "#626462",
    bgColor: "#eeefee",
    scope: "Police command wall dashboard, live Leaflet corridor map, Time Saved counter, multi-vehicle priority arbitration queue, offline edge mode (cloud-drop survival), and MQTT security hardening."
  }
];

export default function Roadmap() {
  return (
    <section id="roadmap" style={{
      backgroundColor: '#ffffff',
      padding: '96px 0',
      borderBottom: '1px solid #e0e1e0'
    }}>
      <div className="container-custom">
        {/* Eyebrow -> Heading -> Body Rhythm */}
        <div style={{ maxWidth: '820px', marginBottom: '56px' }}>
          <div className="eyebrow">
            Implementation Timeline
          </div>
          <h2 style={{
            fontSize: 'clamp(32px, 4.5vw, 48px)',
            fontWeight: '800',
            letterSpacing: '-0.03em',
            color: '#3a3b3a',
            lineHeight: 1.15,
            margin: '0 0 16px 0'
          }}>
            A 16-Week, Six-Phase Build Plan
          </h2>
          <p style={{
            fontSize: '17px',
            lineHeight: 1.6,
            color: '#626462',
            margin: 0
          }}>
            Disciplined phased execution progressing from core telemetry ingestion to spatiotemporal graph intelligence, edge signal controllers, and municipal command centers. Real-time status synced with project tracking logs.
          </p>
        </div>

        {/* 6 Phases Timeline Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '28px'
        }}>
          {PHASES.map((p, idx) => (
            <div 
              key={idx}
              className="card"
              style={{
                padding: '32px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                backgroundColor: p.badgeColor
              }} />

              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontFamily: 'monospace',
                      fontSize: '16px',
                      fontWeight: '800',
                      color: '#3a3b3a'
                    }}>
                      {p.phase}
                    </span>
                    <span style={{
                      fontSize: '12px',
                      color: '#626462',
                      fontWeight: '600',
                      backgroundColor: '#eeefee',
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}>
                      {p.weeks}
                    </span>
                  </div>

                  <span style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    color: p.badgeColor,
                    backgroundColor: p.bgColor
                  }}>
                    {p.status}
                  </span>
                </div>

                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#3a3b3a',
                  margin: '0 0 12px 0'
                }}>
                  {p.title}
                </h3>

                <p style={{
                  fontSize: '14px',
                  lineHeight: 1.6,
                  color: '#626462',
                  margin: 0
                }}>
                  {p.scope}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
