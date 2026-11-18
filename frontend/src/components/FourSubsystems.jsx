import React from 'react';
import { Navigation, BrainCircuit, TrafficCone, BellRing, ArrowRight, Activity, ShieldAlert } from 'lucide-react';

const SUBSYSTEMS = [
  {
    num: "01",
    title: "Vehicle Tracking & Communication",
    tag: "High-Frequency Telemetry",
    headline: "Continuous 500 ms GPS stream connecting emergency vehicles to city grid.",
    body: "GPS-enabled mobile terminal sends precision vehicle location, speed, heading, and destination over bidirectional WebSocket channels. Incorporates G6 signed frames, anti-spoofing anomaly filters, and G7 stale-telemetry detectors.",
    specs: ["500 ms update frequency", "WebSocket & MQTT fallback", "Driver heads-up navigation", "Anti-spoofing velocity filter"],
    icon: Navigation
  },
  {
    num: "02",
    title: "AI Traffic Intelligence Engine",
    tag: "Spatiotemporal Prediction & Routing",
    headline: "Deep graph forecasting and multi-factor heuristic route optimization.",
    body: "Fuses live CCTV vehicle counts, IoT road sensors, weather, and historical flow using an Adaptive Graph Convolutional Network + LSTM. Selects optimal corridors in under 200 ms based on road quality, signal count, and 10-minute predicted congestion.",
    specs: ["< 200 ms route calculation", "5–10 min congestion forecast", "30 s dynamic rescoring", "10 s recalculation loop"],
    icon: BrainCircuit
  },
  {
    num: "03",
    title: "Adaptive Signal Control Network",
    tag: "Predictive Preemption Grid",
    headline: "Pre-clears traffic signals into green waves before responders arrive.",
    body: "Interfaces with smart signal controllers (SCATS / SCOOT compatible). Preemption triggers into armed pre-clearing within an 800m / 35s window, turns green 5–8 seconds before arrival, and reverts within 10 seconds after passing.",
    specs: ["5–8 s pre-green arrival actuation", "2–3 intersections lookahead", "10 s post-passage reversion", "45 s dynamic green duration cap"],
    icon: TrafficCone
  },
  {
    num: "04",
    title: "Driver Alert & Diversion System",
    tag: "Multi-Channel Municipal Broadcast",
    headline: "Proactive warnings and parallel arterial load balancing for commuters.",
    body: "Notifies civilian motorists 30–45 seconds ahead within a 500m radius via navigation push feeds, roadside variable message (VMS) LED matrix displays, and V2X stubs. Diverts normal traffic onto parallel corridors, bounding added delay to < 90 seconds.",
    specs: ["500 m / 30–45 s alert horizon", "Roadside LED boards API", "Parallel route diversion", "< 90 s delay cap (Projected target)"],
    icon: BellRing
  }
];

export default function FourSubsystems() {
  return (
    <section id="subsystems" style={{
      backgroundColor: '#ffffff',
      padding: '96px 0',
      borderBottom: '1px solid #e0e1e0'
    }}>
      <div className="container-custom">
        {/* Eyebrow -> Heading -> Body Rhythm */}
        <div style={{ maxWidth: '820px', marginBottom: '56px' }}>
          <div className="eyebrow">
            Core Architecture
          </div>
          <h2 style={{
            fontSize: 'clamp(32px, 4.5vw, 48px)',
            fontWeight: '800',
            letterSpacing: '-0.03em',
            color: '#3a3b3a',
            lineHeight: 1.15,
            margin: '0 0 16px 0'
          }}>
            Four Subsystems, Working in Closed-Loop Real Time
          </h2>
          <p style={{
            fontSize: '17px',
            lineHeight: 1.6,
            color: '#626462',
            margin: 0
          }}>
            LifeLane AI is not an isolated dispatch app — it is a cohesive intelligent transportation platform combining vehicular telemetry, deep-learning prediction, adaptive traffic light actuation, and civic alert dissemination.
          </p>
        </div>

        {/* 4 Subsystems Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '32px'
        }}>
          {SUBSYSTEMS.map((sub) => {
            const Icon = sub.icon;
            return (
              <div 
                key={sub.num}
                className="card"
                style={{
                  padding: '36px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderTop: '4px solid #f36e20'
                }}
              >
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '18px'
                  }}>
                    <span style={{
                      fontFamily: 'monospace',
                      fontSize: '16px',
                      fontWeight: '800',
                      color: '#f36e20',
                      backgroundColor: '#fef2ec',
                      padding: '4px 12px',
                      borderRadius: '8px'
                    }}>
                      Subsystem {sub.num}
                    </span>
                    <div style={{
                      backgroundColor: '#fef2ec',
                      padding: '10px',
                      borderRadius: '12px',
                      color: '#f36e20'
                    }}>
                      <Icon size={22} />
                    </div>
                  </div>

                  <div style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: '#f36e20',
                    marginBottom: '6px'
                  }}>
                    {sub.tag}
                  </div>

                  <h3 style={{
                    fontSize: '22px',
                    fontWeight: '800',
                    color: '#3a3b3a',
                    lineHeight: 1.25,
                    margin: '0 0 12px 0'
                  }}>
                    {sub.title}
                  </h3>

                  <p style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#3a3b3a',
                    lineHeight: 1.5,
                    marginBottom: '10px'
                  }}>
                    {sub.headline}
                  </p>

                  <p style={{
                    fontSize: '14px',
                    lineHeight: 1.6,
                    color: '#626462',
                    margin: '0 0 24px 0'
                  }}>
                    {sub.body}
                  </p>
                </div>

                {/* Specs List */}
                <div style={{
                  borderTop: '1px solid #e0e1e0',
                  paddingTop: '18px'
                }}>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: '#626462',
                    marginBottom: '10px'
                  }}>
                    Key Specifications
                  </div>
                  <ul style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    {sub.specs.map((spec, sIdx) => (
                      <li key={sIdx} style={{
                        fontSize: '12px',
                        color: '#3a3b3a',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: '#f36e20'
                        }} />
                        <span>{spec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
