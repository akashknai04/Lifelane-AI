import React, { useState } from 'react';
import { 
  TrendingUp, 
  Compass, 
  TrafficCone, 
  Camera, 
  AlertOctagon, 
  GitMerge, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  BookOpen
} from 'lucide-react';

const AI_MODULES = [
  {
    id: 1,
    title: "Traffic Prediction AI",
    model: "GAA-GCN + LSTM",
    desc: "Forecasts spatiotemporal congestion probability per road segment 5–10 minutes downstream, dynamically re-scored every 30 seconds.",
    citation: "Adapted from Xiao, Zou & Xiao (2025), Scientific Reports",
    icon: TrendingUp,
    badge: "Forecasting",
    metric: "Lowest MAE / RMSE"
  },
  {
    id: 2,
    title: "Route Optimisation AI",
    model: "Modified Multi-Factor A*",
    desc: "Evaluates travel time, predicted congestion, signal count, road class, and turn delays to generate optimal corridor paths with waypoints.",
    citation: "High-speed graph search (< 200 ms)",
    icon: Compass,
    badge: "Routing",
    metric: "< 200 ms compute"
  },
  {
    id: 3,
    title: "Signal Timing AI",
    model: "Rules + RL Hybrid Controller",
    desc: "Computes exact green-activation timestamps from vehicle speed and distance, holding phases up to 45s and reverting within 10s of transit.",
    citation: "Adaptive municipal traffic actuation",
    icon: TrafficCone,
    badge: "Actuation",
    metric: "5–8s pre-green trigger"
  },
  {
    id: 4,
    title: "Vehicle Detection AI",
    model: "YOLOv11 Object Detector",
    desc: "Performs real-time emergency-vehicle recognition and verification at 15–30 FPS on intersection camera video feeds and edge accelerators.",
    citation: "Informed by Noor et al. (2024), Applied Sciences (MDPI)",
    icon: Camera,
    badge: "Computer Vision",
    metric: "98.2% recognition accuracy"
  },
  {
    id: 5,
    title: "Incident Detection AI",
    model: "Spatiotemporal Anomaly Detector",
    desc: "Monitors sudden velocity drops and visual lane blockages to classify incident severity (Levels 1–3) and trigger immediate alternate routing.",
    citation: "Statistical anomaly filter (> 3σ variance)",
    icon: AlertOctagon,
    badge: "Safety Intelligence",
    metric: "Severity Levels 1–3"
  },
  {
    id: 6,
    title: "Emergency Priority Engine",
    model: "Deterministic Conflict Resolver",
    desc: "Arbitrates simultaneous emergency vehicles converging on shared intersections, enforcing strict priority rules without conflicting greens.",
    citation: "Parallels Duan, Wu & Xiong (2022), J. Adv. Transportation",
    icon: GitMerge,
    badge: "Conflict Resolution",
    metric: "< 1s automated resolution"
  }
];

export default function ModulesCarousel() {
  const [startIndex, setStartIndex] = useState(0);

  const handlePrev = () => {
    setStartIndex((prev) => (prev === 0 ? AI_MODULES.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setStartIndex((prev) => (prev === AI_MODULES.length - 1 ? 0 : prev + 1));
  };

  // Visible items (showing 3 on desktop, 1-2 on smaller screens)
  const visibleModules = [
    AI_MODULES[startIndex % AI_MODULES.length],
    AI_MODULES[(startIndex + 1) % AI_MODULES.length],
    AI_MODULES[(startIndex + 2) % AI_MODULES.length],
  ];

  return (
    <section id="ai-modules" style={{ padding: '80px 0', backgroundColor: '#ffffff', borderBottom: '1px solid #e0e1e0' }}>
      <div className="container-custom">
        {/* Section Header Rhythm */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div className="pill-badge" style={{ marginBottom: '12px' }}>
              <Sparkles size={13} color="#f36e20" />
              <span>Core Intelligence Architecture</span>
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: '800', letterSpacing: '-0.03em', color: '#3a3b3a' }}>
              Six AI Modules Powering the Platform
            </h2>
            <p style={{ fontSize: '16px', color: '#626462', maxWidth: '640px', marginTop: '8px' }}>
              Grounded in peer-reviewed transportation science, each module operates collaboratively across edge controllers and central cloud pipelines.
            </p>
          </div>

          {/* Navigation Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button 
              onClick={handlePrev}
              aria-label="Previous Module"
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                border: '1px solid #e0e1e0',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3a3b3a',
                transition: 'all 0.2s'
              }}
            >
              <ChevronLeft size={20} />
            </button>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#f36e20', minWidth: '48px', textAlign: 'center' }}>
              0{startIndex + 1} / 06
            </span>
            <button 
              onClick={handleNext}
              aria-label="Next Module"
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                border: '1px solid #e0e1e0',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3a3b3a',
                transition: 'all 0.2s'
              }}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Carousel Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px'
        }}>
          {visibleModules.map((mod) => {
            const Icon = mod.icon;
            return (
              <div 
                key={mod.id}
                className="card-base"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '360px',
                  backgroundColor: '#ffffff'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '14px',
                      backgroundColor: '#fef2ec',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#f36e20'
                    }}>
                      <Icon size={24} />
                    </div>
                    <span className="pill-badge" style={{ fontSize: '10px' }}>
                      {mod.badge}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#3a3b3a', marginBottom: '6px' }}>
                    {mod.title}
                  </h3>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#f36e20', marginBottom: '14px' }}>
                    {mod.model}
                  </div>
                  <p style={{ fontSize: '14px', color: '#626462', lineHeight: 1.6 }}>
                    {mod.desc}
                  </p>
                </div>

                <div style={{ paddingTop: '20px', borderTop: '1px solid #f1f5f9', marginTop: '20px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#10b981', marginBottom: '4px' }}>
                    Target Benchmark: {mod.metric}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#94a3b8' }}>
                    <BookOpen size={12} />
                    <span>{mod.citation}</span>
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
