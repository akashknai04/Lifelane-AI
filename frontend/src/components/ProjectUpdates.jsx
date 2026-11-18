import React from 'react';
import { ArrowRight, Calendar, CheckCircle2 } from 'lucide-react';

import rawUpdates from '../data/projectUpdates.json';

const updates = rawUpdates && rawUpdates.length > 0 ? rawUpdates : [
  {
    phase: 'Phase 00 · Foundation',
    date: 'Oct 16, 2026',
    title: 'Design System & Literature Survey Synthesis',
    summary: 'Analyzed source documentation, student literature survey on intelligent transportation systems, and extracted live design tokens from reference architecture.',
    badge: 'Completed',
    deliverables: ['DESIGN_SYSTEM.md', 'UNDERSTANDING.md', 'GAPS.md', 'Docker Compose']
  }
];

export default function ProjectUpdates() {
  return (
    <section id="updates" style={{
      backgroundColor: '#f8f8f8',
      padding: '96px 0',
      borderTop: '1px solid #e0e1e0',
      borderBottom: '1px solid #e0e1e0'
    }}>
      <div className="container-custom">
        {/* Eyebrow -> Heading -> Body rhythm */}
        <div style={{ maxWidth: '720px', marginBottom: '56px' }}>
          <div className="eyebrow">
            Engineering Milestones
          </div>
          <h2 style={{
            fontSize: '36px',
            fontWeight: '800',
            letterSpacing: '-0.03em',
            color: '#3a3b3a',
            margin: '0 0 16px 0',
            lineHeight: 1.15
          }}>
            Project Updates & Sprint Log
          </h2>
          <p style={{
            fontSize: '17px',
            lineHeight: 1.6,
            color: '#626462',
            margin: 0
          }}>
            Transparent engineering progress tracked phase-by-phase against our 16-week municipal deployment roadmap. All milestones strictly verified with automated test suites.
          </p>
        </div>

        {/* 3 News-Style Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '28px'
        }}>
          {updates.map((item, idx) => (
            <article 
              key={idx}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '32px',
                height: '100%',
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
                backgroundColor: idx === 2 ? '#f36e20' : '#10b981'
              }} />

              <div>
                {/* Meta Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                  fontSize: '12px'
                }}>
                  <span style={{
                    fontWeight: '700',
                    color: '#f36e20',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {item.phase}
                  </span>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#626462'
                  }}>
                    <Calendar size={13} />
                    <span>{item.date}</span>
                  </div>
                </div>

                {/* Title */}
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#3a3b3a',
                  lineHeight: 1.3,
                  margin: '0 0 14px 0'
                }}>
                  {item.title}
                </h3>

                {/* Summary */}
                <p style={{
                  fontSize: '15px',
                  lineHeight: 1.6,
                  color: '#626462',
                  margin: '0 0 20px 0'
                }}>
                  {item.summary}
                </p>

                {/* Deliverables Pills */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                  marginBottom: '24px'
                }}>
                  {item.deliverables.map((d, dIdx) => (
                    <span 
                      key={dIdx}
                      style={{
                        backgroundColor: '#eeefee',
                        color: '#3a3b3a',
                        fontSize: '11px',
                        fontWeight: '600',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <CheckCircle2 size={10} color="#10b981" />
                      {d}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Footer CTA */}
              <div style={{
                borderTop: '1px solid #e0e1e0',
                paddingTop: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  color: idx === 2 ? '#f36e20' : '#10b981',
                  backgroundColor: idx === 2 ? '#fef2ec' : '#ecfdf5',
                  padding: '4px 10px',
                  borderRadius: '9999px'
                }}>
                  {item.badge}
                </span>

                <a 
                  href="#subsystems"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#f36e20',
                    fontSize: '13px',
                    fontWeight: '700',
                    textDecoration: 'none'
                  }}
                >
                  <span>View Details</span>
                  <ArrowRight size={14} />
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
