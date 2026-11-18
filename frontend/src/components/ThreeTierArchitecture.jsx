import React from 'react';
import { Layers, Cpu, Cloud, Smartphone, Server, Radio, Database, Shield } from 'lucide-react';

const TIERS = [
  {
    tier: "Tier 1: Edge Layer",
    location: "At the Intersection & Roadside",
    headline: "Local intelligence preserving green corridors during backhaul drops.",
    description: "Distributed compute hardware deployed directly on roadside cabinets and signal control boxes. Executes real-time video processing, MQTT device coordination, and autonomous fallback state machines.",
    components: [
      { name: "Smart Signal Controllers", role: "Direct preemption interface (SCATS/SCOOT)" },
      { name: "YOLOv11 Edge Modules", role: "Real-time emergency vehicle recognition (15–30 FPS)" },
      { name: "MQTT Broker (Mosquitto)", role: "Sub-10ms peer-to-peer sensor messaging" },
      { name: "Offline Fallback Daemon", role: "Local corridor state machine when central cloud disconnects" }
    ],
    icon: Cpu,
    color: "#f36e20"
  },
  {
    tier: "Tier 2: Cloud Layer",
    location: "Central Municipal Infrastructure",
    headline: "High-throughput asynchronous ingest and spatiotemporal AI modeling.",
    description: "Scalable async cloud cluster orchestrating urban telemetry, 5–10 minute deep learning forecasts, multi-vehicle priority arbitration, and real-time police command broadcasts.",
    components: [
      { name: "FastAPI Async Engine", role: "500ms WebSocket hub & REST API gateway" },
      { name: "AI Traffic Intelligence", role: "GAA-GCN + LSTM predictor & modified A* router" },
      { name: "PostgreSQL 16 + PostGIS", role: "Geospatial road network & audit logging" },
      { name: "Redis 7 In-Memory Cache", role: "Sub-millisecond state caching & pub/sub pipeline" }
    ],
    icon: Cloud,
    color: "#3b82f6"
  },
  {
    tier: "Tier 3: Client Layer",
    location: "Command Center & In-Vehicle Displays",
    headline: "Tactile, responsive heads-up displays for drivers and municipal operators.",
    description: "Specialized front-end applications serving emergency response drivers on touch terminals and traffic police commanders on multi-monitor command walls.",
    components: [
      { name: "Driver Web Terminal", role: "500ms tactile HUD, pre-cleared signals countdown, speed HUD" },
      { name: "Police Control Console", role: "Live Leaflet map, corridor override, CCTV surveillance tiles" },
      { name: "Public Navigation API", role: "Civilian diversion hooks into Apple Maps / Google Maps" },
      { name: "Roadside LED Board API", role: "Variable Message Sign (VMS) driver clearance alerts" }
    ],
    icon: Smartphone,
    color: "#10b981"
  }
];

export default function ThreeTierArchitecture() {
  return (
    <section id="architecture" style={{
      backgroundColor: '#f8f8f8',
      padding: '96px 0',
      borderBottom: '1px solid #e0e1e0'
    }}>
      <div className="container-custom">
        {/* Eyebrow -> Heading -> Body Rhythm */}
        <div style={{ maxWidth: '820px', marginBottom: '56px' }}>
          <div className="eyebrow">
            Distributed Infrastructure
          </div>
          <h2 style={{
            fontSize: 'clamp(32px, 4.5vw, 48px)',
            fontWeight: '800',
            letterSpacing: '-0.03em',
            color: '#3a3b3a',
            lineHeight: 1.15,
            margin: '0 0 16px 0'
          }}>
            A Three-Tier System Architecture
          </h2>
          <p style={{
            fontSize: '17px',
            lineHeight: 1.6,
            color: '#626462',
            margin: 0
          }}>
            Edge intelligence guarantees municipal resilience. If central cloud connectivity drops, intersection signal controllers maintain green-wave coordination locally through peer-to-peer fail-safe state machines.
          </p>
        </div>

        {/* 3 Tier Columns Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '32px'
        }}>
          {TIERS.map((tier, idx) => {
            const Icon = tier.icon;
            return (
              <div 
                key={idx}
                className="card"
                style={{
                  padding: '36px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  backgroundColor: '#ffffff',
                  borderTop: `4px solid ${tier.color}`
                }}
              >
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px'
                  }}>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: tier.color
                    }}>
                      {tier.tier}
                    </span>
                    <div style={{
                      backgroundColor: '#f8f8f8',
                      padding: '8px',
                      borderRadius: '10px',
                      color: tier.color
                    }}>
                      <Icon size={20} />
                    </div>
                  </div>

                  <h3 style={{
                    fontSize: '22px',
                    fontWeight: '800',
                    color: '#3a3b3a',
                    margin: '0 0 6px 0'
                  }}>
                    {tier.location}
                  </h3>

                  <p style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#3a3b3a',
                    lineHeight: 1.5,
                    marginBottom: '12px'
                  }}>
                    {tier.headline}
                  </p>

                  <p style={{
                    fontSize: '13px',
                    lineHeight: 1.6,
                    color: '#626462',
                    margin: '0 0 24px 0'
                  }}>
                    {tier.description}
                  </p>

                  {/* Components Breakdown */}
                  <div style={{
                    backgroundColor: '#f8f8f8',
                    border: '1px solid #e0e1e0',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    {tier.components.map((c, cIdx) => (
                      <div key={cIdx} style={{ fontSize: '13px' }}>
                        <div style={{ fontWeight: '700', color: '#3a3b3a' }}>
                          {c.name}
                        </div>
                        <div style={{ color: '#626462', fontSize: '12px', marginTop: '2px' }}>
                          {c.role}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
