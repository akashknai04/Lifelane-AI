import React from 'react';
import { Layout, Server, Brain, Database, MapPin, Radio, Camera, ShieldCheck } from 'lucide-react';

const STACK_CATEGORIES = [
  {
    category: "Frontend & Mobile",
    description: "Responsive React.js + Leaflet.js dashboard · React Native & PWA touch terminal",
    techs: ["React 18", "Leaflet", "Vite", "PWA Manifest", "Lucide Icons", "Tailwind/Tokens"],
    icon: Layout
  },
  {
    category: "Backend & API Gateway",
    description: "FastAPI async Python framework with high-frequency WebSocket channels",
    techs: ["FastAPI", "Uvicorn", "AsyncIO", "WebSockets", "Pydantic V2", "JWT RBAC"],
    icon: Server
  },
  {
    category: "AI & Machine Learning",
    description: "Deep spatiotemporal prediction, modified A* heuristics, and anomaly models",
    techs: ["PyTorch", "GAA-GCN", "LSTM", "YOLOv11", "XGBoost", "Scikit-Learn"],
    icon: Brain
  },
  {
    category: "Geospatial Databases",
    description: "Enterprise spatial storage and sub-millisecond in-memory caching",
    techs: ["PostgreSQL 16", "PostGIS 3.4", "Redis 7", "SQLAlchemy 2.0 Async", "SQLite aiosqlite"],
    icon: Database
  },
  {
    category: "Maps & Routing Engine",
    description: "OpenStreetMap network graphs with multi-factor cost heuristic solver",
    techs: ["OpenStreetMap", "OSRM", "Modified A* Heuristic", "Haversine Distance", "GeoJSON"],
    icon: MapPin
  },
  {
    category: "IoT & Telemetry Protocols",
    description: "500 ms bi-directional vehicle streams and roadside sensor mesh",
    techs: ["MQTT (Mosquitto)", "WebSockets", "GPS NMEA", "V2X Stubs", "VMS LED API"],
    icon: Radio
  },
  {
    category: "Computer Vision & Edge",
    description: "Real-time edge recognition deployed on embedded GPU controllers",
    techs: ["YOLOv11 (Ultralytics)", "NVIDIA Jetson Nano", "OpenCV", "15–30 FPS Pipeline"],
    icon: Camera
  },
  {
    category: "Security & Municipal Cloud",
    description: "Zero-trust RBAC, anti-spoofing telemetry filters, and audit trail",
    techs: ["TLS 1.3", "PBKDF2-SHA256", "JWT Auth", "Immutable Audit Logs", "Docker Compose"],
    icon: ShieldCheck
  }
];

export default function TechStack() {
  return (
    <section id="tech-stack" style={{
      backgroundColor: '#f8f8f8',
      padding: '96px 0',
      borderBottom: '1px solid #e0e1e0'
    }}>
      <div className="container-custom">
        {/* Eyebrow -> Heading -> Body Rhythm */}
        <div style={{ maxWidth: '820px', marginBottom: '56px' }}>
          <div className="eyebrow">
            Engineering Core
          </div>
          <h2 style={{
            fontSize: 'clamp(32px, 4.5vw, 48px)',
            fontWeight: '800',
            letterSpacing: '-0.03em',
            color: '#3a3b3a',
            lineHeight: 1.15,
            margin: '0 0 16px 0'
          }}>
            Built on a Modern, Production-Ready Stack
          </h2>
          <p style={{
            fontSize: '17px',
            lineHeight: 1.6,
            color: '#626462',
            margin: 0
          }}>
            Constructed from battle-tested open-source geospatial engines, asynchronous Python services, and state-of-the-art computer vision models.
          </p>
        </div>

        {/* 8 Categories Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px'
        }}>
          {STACK_CATEGORIES.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div 
                key={idx}
                className="card"
                style={{
                  padding: '28px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  backgroundColor: '#ffffff'
                }}
              >
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '14px'
                  }}>
                    <div style={{
                      backgroundColor: '#fef2ec',
                      padding: '8px',
                      borderRadius: '10px',
                      color: '#f36e20'
                    }}>
                      <Icon size={20} />
                    </div>
                    <h3 style={{
                      fontSize: '17px',
                      fontWeight: '700',
                      color: '#3a3b3a',
                      margin: 0
                    }}>
                      {cat.category}
                    </h3>
                  </div>

                  <p style={{
                    fontSize: '13px',
                    color: '#626462',
                    lineHeight: 1.5,
                    marginBottom: '16px'
                  }}>
                    {cat.description}
                  </p>

                  {/* Tech Pills */}
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px'
                  }}>
                    {cat.techs.map((t, tIdx) => (
                      <span 
                        key={tIdx}
                        style={{
                          backgroundColor: '#eeefee',
                          color: '#3a3b3a',
                          fontSize: '11px',
                          fontWeight: '600',
                          padding: '3px 8px',
                          borderRadius: '6px'
                        }}
                      >
                        {t}
                      </span>
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
