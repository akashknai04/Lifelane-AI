import React from 'react';
import { AlertOctagon, Car, VolumeX, TrafficCone, Compass, EyeOff, GitMerge, ArrowRight } from 'lucide-react';

const OBSTACLES = [
  {
    num: "01",
    title: "Heavy Urban Congestion",
    body: "Dense peak-hour gridlock physically traps emergency vehicles in lanes with nowhere for civilian cars to maneuver aside, even when drivers intend to yield.",
    icon: Car
  },
  {
    num: "02",
    title: "Driver Unawareness",
    body: "Traditional sirens and strobe beacons are inaudible inside modern acoustically insulated cabins and masked by high-volume commuter infotainment systems.",
    icon: VolumeX
  },
  {
    num: "03",
    title: "Static Traffic Signals",
    body: "Pre-timed or semi-actuated traffic lights cannot anticipate arriving emergency responders, forcing ambulances into dangerous blind-intersection stops.",
    icon: TrafficCone
  },
  {
    num: "04",
    title: "No Coordinated Routing",
    body: "Emergency drivers rely on personal road familiarity and consumer navigation apps that optimize for individual transit rather than municipal green corridors.",
    icon: Compass
  },
  {
    num: "05",
    title: "Absence of Predictive Capability",
    body: "Standard navigation reflects bottlenecks where they already exist; it cannot forecast jams that will materialize 5–10 minutes downstream along the response route.",
    icon: EyeOff
  },
  {
    num: "06",
    title: "Lack of Multi-Vehicle Priority",
    body: "When two emergency responders (e.g. cardiac ambulance and fire tender) converge on the same junction, no automated protocol exists to arbitrate right-of-way safely.",
    icon: GitMerge
  }
];

export default function TheProblem() {
  return (
    <section id="problem" style={{
      backgroundColor: '#ffffff',
      padding: '96px 0',
      borderBottom: '1px solid #e0e1e0'
    }}>
      <div className="container-custom">
        {/* Eyebrow -> Heading -> Body Rhythm */}
        <div style={{ maxWidth: '840px', marginBottom: '56px' }}>
          <div className="eyebrow">
            The Urban Crisis
          </div>
          <h2 style={{
            fontSize: 'clamp(32px, 4.5vw, 48px)',
            fontWeight: '800',
            letterSpacing: '-0.03em',
            color: '#3a3b3a',
            lineHeight: 1.15,
            margin: '0 0 20px 0'
          }}>
            Every Minute Costs Lives in an Emergency
          </h2>
          <div style={{
            backgroundColor: '#fef2ec',
            borderLeft: '4px solid #f36e20',
            padding: '16px 20px',
            borderRadius: '0 12px 12px 0',
            marginBottom: '24px'
          }}>
            <p style={{
              fontSize: '17px',
              fontWeight: '700',
              color: '#3a3b3a',
              lineHeight: 1.5,
              margin: 0
            }}>
              "A delay of even 60–90 seconds can be fatal in acute trauma and cardiac-arrest cases — yet emergency vehicles in Indian and global cities still fight the same six avoidable bottlenecks."
            </p>
          </div>
          <p style={{
            fontSize: '16px',
            lineHeight: 1.6,
            color: '#626462',
            margin: 0
          }}>
            Urban emergency dispatch today is fundamentally reactive. Ambulances depart with sirens blazing, only to be stalled by static signal timers, oblivious motorists, and bottlenecked intersections.
          </p>
        </div>

        {/* Six Obstacles Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '28px'
        }}>
          {OBSTACLES.map((obs) => {
            const Icon = obs.icon;
            return (
              <div 
                key={obs.num}
                className="card"
                style={{
                  padding: '32px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderTop: '3px solid #dfe0df',
                  transition: 'all 0.25s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderTopColor = '#f36e20'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderTopColor = '#dfe0df'; }}
              >
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px'
                  }}>
                    <span style={{
                      fontFamily: 'monospace',
                      fontSize: '14px',
                      fontWeight: '800',
                      color: '#f36e20',
                      backgroundColor: '#fef2ec',
                      padding: '4px 10px',
                      borderRadius: '8px'
                    }}>
                      {obs.num}
                    </span>
                    <div style={{
                      backgroundColor: '#eeefee',
                      padding: '8px',
                      borderRadius: '10px',
                      color: '#3a3b3a'
                    }}>
                      <Icon size={18} />
                    </div>
                  </div>

                  <h3 style={{
                    fontSize: '19px',
                    fontWeight: '700',
                    color: '#3a3b3a',
                    margin: '0 0 12px 0'
                  }}>
                    {obs.title}
                  </h3>

                  <p style={{
                    fontSize: '14px',
                    lineHeight: 1.6,
                    color: '#626462',
                    margin: 0
                  }}>
                    {obs.body}
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
