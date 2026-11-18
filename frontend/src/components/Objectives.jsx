import React from 'react';
import { Target, CheckCircle2, TrendingDown, Clock, ShieldCheck, Radio, Eye, Cpu, WifiOff, Users } from 'lucide-react';

const OBJECTIVES = [
  {
    num: "1",
    goal: "Reduce Emergency Travel Time by 30–40%",
    detail: "Cut average ambulance transit durations from 12–18 minutes down to 7–11 minutes across dense metropolitan arterials.",
    badge: "Projected target",
    icon: TrendingDown
  },
  {
    num: "2",
    goal: "Fully Automated Green Corridor Pre-Clearing",
    detail: "Transition traffic signals into green waves 5–8 seconds before emergency vehicle arrival, clearing 2–3 intersections downstream.",
    badge: "Core Capability",
    icon: ShieldCheck
  },
  {
    num: "3",
    goal: "Predict Congestion 5–10 Minutes Ahead",
    detail: "Employ deep spatiotemporal graph neural networks (GAA-GCN + LSTM) to forecast dynamic road bottlenecks before they form.",
    badge: "AI Powered",
    icon: Eye
  },
  {
    num: "4",
    goal: "Intelligent Multi-Channel Driver Alerting",
    detail: "Notify surrounding motorists within 500 meters 30–45 seconds in advance via navigation push alerts, roadside LED matrix displays, and V2X.",
    badge: "Multi-Channel",
    icon: Radio
  },
  {
    num: "5",
    goal: "Real-Time Police Command & Control",
    detail: "Equip municipal traffic police with live Leaflet corridor mapping, emergency CCTV feeds, real-time Time-Saved counters, and manual override.",
    badge: "Command Portal",
    icon: Users
  },
  {
    num: "6",
    goal: "Multi-Vehicle Intelligent Priority Queue",
    detail: "Arbitrate conflicting emergency routes in <1s using strict categorical priority tiers (cardiac/trauma > fire tender > police) and ETA sequencing.",
    badge: "Deterministic",
    icon: Cpu
  },
  {
    num: "7",
    goal: "Offline Edge Computing Continuity",
    detail: "Maintain localized green-corridor coordination through edge controller peer-to-peer state machines when cloud cellular backhaul drops.",
    badge: "Fail-Safe",
    icon: WifiOff
  },
  {
    num: "8",
    goal: "Minimal Normal Traffic Disruption (<90s added)",
    detail: "Bound collateral commuter delay to <90 seconds per background vehicle through parallel green extensions and active traffic diversion.",
    badge: "Projected target",
    icon: Clock
  }
];

export default function Objectives() {
  return (
    <section id="objectives" style={{
      backgroundColor: '#f8f8f8',
      padding: '96px 0',
      borderBottom: '1px solid #e0e1e0'
    }}>
      <div className="container-custom">
        {/* Eyebrow -> Heading -> Body Rhythm */}
        <div style={{ maxWidth: '780px', marginBottom: '56px' }}>
          <div className="eyebrow">
            System Objectives
          </div>
          <h2 style={{
            fontSize: 'clamp(32px, 4.5vw, 48px)',
            fontWeight: '800',
            letterSpacing: '-0.03em',
            color: '#3a3b3a',
            lineHeight: 1.15,
            margin: '0 0 16px 0'
          }}>
            What LifeLane AI Sets Out to Achieve
          </h2>
          <p style={{
            fontSize: '17px',
            lineHeight: 1.6,
            color: '#626462',
            margin: 0
          }}>
            Eight measurable engineering goals designed to transform urban emergency mobility from hazardous manual scrambles into coordinated, deterministic municipal green corridors.
          </p>
        </div>

        {/* 8 Goals Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px'
        }}>
          {OBJECTIVES.map((obj) => {
            const Icon = obj.icon;
            const isTarget = obj.badge === "Projected target";
            return (
              <div 
                key={obj.num}
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
                    justifyContent: 'space-between',
                    marginBottom: '14px'
                  }}>
                    <span style={{
                      fontFamily: 'monospace',
                      fontSize: '15px',
                      fontWeight: '800',
                      color: '#f36e20'
                    }}>
                      Goal 0{obj.num}
                    </span>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      padding: '3px 8px',
                      borderRadius: '9999px',
                      backgroundColor: isTarget ? '#fef2ec' : '#eeefee',
                      color: isTarget ? '#f36e20' : '#3a3b3a',
                      border: isTarget ? '1px solid rgba(243, 110, 32, 0.3)' : '1px solid #dfe0df'
                    }}>
                      {obj.badge}
                    </span>
                  </div>

                  <h3 style={{
                    fontSize: '17px',
                    fontWeight: '700',
                    color: '#3a3b3a',
                    lineHeight: 1.3,
                    margin: '0 0 10px 0'
                  }}>
                    {obj.goal}
                  </h3>

                  <p style={{
                    fontSize: '13px',
                    lineHeight: 1.6,
                    color: '#626462',
                    margin: 0
                  }}>
                    {obj.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
