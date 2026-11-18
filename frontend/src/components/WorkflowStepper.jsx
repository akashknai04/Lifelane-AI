import React, { useState } from 'react';
import { 
  Radio, 
  Database, 
  Brain, 
  Route, 
  TrafficCone, 
  Bell, 
  Split, 
  Gauge, 
  RotateCcw, 
  Monitor,
  CheckCircle,
  Clock
} from 'lucide-react';

const STEPS = [
  {
    step: 1,
    title: "Emergency Registration",
    subsystem: "Vehicle Tracking & Communication",
    timing: "500 ms stream",
    icon: Radio,
    summary: "Driver presses START EMERGENCY on the terminal; GPS, speed, destination, and vehicle class immediately stream to the cloud under a unique session ID."
  },
  {
    step: 2,
    title: "Live Data Fusion",
    subsystem: "AI Traffic Intelligence Engine",
    timing: "Continuous ingestion",
    icon: Database,
    summary: "The AI engine aggregates five live data feeds simultaneously: municipal road graphs, camera vehicle counts, road IoT sensors, weather forecasts, and historical congestion profiles."
  },
  {
    step: 3,
    title: "AI Traffic Prediction",
    subsystem: "AI Traffic Intelligence Engine",
    timing: "30s rescore loop",
    icon: Brain,
    summary: "Adaptive Spatiotemporal GCN + LSTM models forecast congestion probabilities per road segment 5–10 minutes into the future based on network topology."
  },
  {
    step: 4,
    title: "Smart Route Optimisation",
    subsystem: "AI Traffic Intelligence Engine",
    timing: "< 200 ms latency",
    icon: Route,
    summary: "A modified multi-factor A* search evaluates travel time, predicted congestion, signal waits, road grade, and intersection count to identify the quickest corridor."
  },
  {
    step: 5,
    title: "Green Corridor Creation",
    subsystem: "Adaptive Signal Control Network",
    timing: "5–8s pre-green trigger",
    icon: TrafficCone,
    summary: "The Signal Control Network preemptively clears 2–3 intersections ahead, turning signals green 5–8 seconds before vehicle arrival, and restoring them safely within 10s of transit."
  },
  {
    step: 6,
    title: "Intelligent Notification",
    subsystem: "Driver Alert & Diversion",
    timing: "30–45s advance warning",
    icon: Bell,
    summary: "Civilian vehicles within 500 meters receive proactive alerts via consumer navigation push webhooks, roadside LED signs, and simulated C-V2X / FM broadcasts."
  },
  {
    step: 7,
    title: "Traffic Diversion",
    subsystem: "Driver Alert & Diversion",
    timing: "≤ 90s added delay cap",
    icon: Split,
    summary: "The Diversion Engine redirects normal traffic to parallel arterials and extends their green phases, preventing bottleneck formation while strictly capping commuter delay."
  },
  {
    step: 8,
    title: "Dynamic Signal Timing",
    subsystem: "Adaptive Signal Control Network",
    timing: "Speed-distance calculus",
    icon: Gauge,
    summary: "Green-start and hold windows adapt dynamically to approaching velocity: advancing if the emergency vehicle accelerates or holding up to 45 seconds if impeded."
  },
  {
    step: 9,
    title: "Route Recalculation",
    subsystem: "AI Traffic Intelligence Engine",
    timing: "10s check / 3s reroute",
    icon: RotateCcw,
    summary: "A background daemon re-evaluates road conditions every 10 seconds. If an accident or gridlock emerges, an alternate green corridor is issued within 3 seconds."
  },
  {
    step: 10,
    title: "Police Control & Time Saved",
    subsystem: "Command & Control Dashboard",
    timing: "Real-time sync",
    icon: Monitor,
    summary: "Traffic police monitor live vehicle locations, signal phases, and CCTV feeds on a central dashboard, tracking live seconds saved against standard unassisted navigation."
  }
];

export default function WorkflowStepper() {
  const [activeStep, setActiveStep] = useState(1);
  const current = STEPS[activeStep - 1];
  const Icon = current.icon;

  return (
    <section id="stepper" style={{ padding: '96px 0', backgroundColor: '#ffffff', borderBottom: '1px solid #e0e1e0' }}>
      <div className="container-custom">
        {/* Section Header Rhythm */}
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 48px' }}>
          <div className="pill-badge" style={{ margin: '0 auto 16px' }}>
            <span>Operational Methodology</span>
          </div>
          <h2 style={{ fontSize: 'clamp(32px, 4.5vw, 48px)', fontWeight: '800', letterSpacing: '-0.03em', color: '#3a3b3a', marginBottom: '16px' }}>
            The 10-Step Closed-Loop Workflow
          </h2>
          <p style={{ fontSize: '18px', color: '#626462', lineHeight: 1.6 }}>
            From emergency registration to live police command, explore each automated step in the moving green-corridor pipeline.
          </p>
        </div>

        {/* Stepper Track / Selector */}
        <div style={{
          display: 'flex',
          overflowX: 'auto',
          gap: '8px',
          paddingBottom: '16px',
          marginBottom: '32px',
          scrollbarWidth: 'none'
        }}>
          {STEPS.map((s) => {
            const isSel = s.step === activeStep;
            return (
              <button
                key={s.step}
                onClick={() => setActiveStep(s.step)}
                style={{
                  flex: '0 0 auto',
                  padding: '12px 18px',
                  borderRadius: '16px',
                  backgroundColor: isSel ? '#fef2ec' : '#f8f8f8',
                  border: isSel ? '2px solid #f36e20' : '1px solid #e0e1e0',
                  color: isSel ? '#f36e20' : '#3a3b3a',
                  fontWeight: '700',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: isSel ? '#f36e20' : '#e0e1e0',
                  color: isSel ? '#ffffff' : '#626462',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px'
                }}>
                  {s.step}
                </span>
                <span>{s.title}</span>
              </button>
            );
          })}
        </div>

        {/* Active Step Showcase Card */}
        <div className="card-base" style={{
          backgroundColor: '#ffffff',
          borderRadius: '32px',
          padding: '48px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '40px',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span className="pill-badge" style={{ fontSize: '12px' }}>
                Step {current.step} of 10
              </span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={14} /> {current.timing}
              </span>
            </div>

            <h3 style={{ fontSize: '32px', fontWeight: '800', color: '#3a3b3a', marginBottom: '12px', letterSpacing: '-0.025em' }}>
              {current.title}
            </h3>

            <div style={{ fontSize: '14px', fontWeight: '700', color: '#f36e20', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '20px' }}>
              Subsystem: {current.subsystem}
            </div>

            <p style={{ fontSize: '17px', color: '#626462', lineHeight: 1.7, marginBottom: '28px' }}>
              {current.summary}
            </p>

            {/* Stepper Pagination Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                disabled={activeStep === 1}
                onClick={() => setActiveStep(prev => prev - 1)}
                className="btn-secondary"
                style={{ opacity: activeStep === 1 ? 0.4 : 1, cursor: activeStep === 1 ? 'not-allowed' : 'pointer' }}
              >
                Previous Step
              </button>
              <button
                disabled={activeStep === 10}
                onClick={() => setActiveStep(prev => prev + 1)}
                className="btn-primary"
                style={{ opacity: activeStep === 10 ? 0.4 : 1, cursor: activeStep === 10 ? 'not-allowed' : 'pointer' }}
              >
                Next Step ({activeStep + 1}/10)
              </button>
            </div>
          </div>

          {/* Graphical Step Visual */}
          <div style={{
            backgroundColor: '#fef3ed',
            borderRadius: '24px',
            border: '1px solid rgba(243, 110, 32, 0.2)',
            padding: '40px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center'
          }}>
            <div style={{
              width: '84px',
              height: '84px',
              borderRadius: '24px',
              backgroundColor: '#f36e20',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 15px 30px -5px rgba(243, 110, 32, 0.4)',
              marginBottom: '24px'
            }}>
              <Icon size={44} />
            </div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#3a3b3a', marginBottom: '8px' }}>
              {current.title}
            </div>
            <div style={{ fontSize: '13px', color: '#626462', maxWidth: '280px' }}>
              Automated municipal closed-loop protocol with sub-second feedback.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
