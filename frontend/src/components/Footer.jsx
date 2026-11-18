import React from 'react';
import { Siren, Shield, Cpu, BookOpen, Layers, Terminal, ExternalLink } from 'lucide-react';

export default function Footer({ onOpenPortal, onRequestDemo }) {
  return (
    <footer style={{
      backgroundColor: '#ffffff',
      borderTop: '1px solid #e0e1e0',
      padding: '80px 0 36px 0',
      color: '#626462'
    }}>
      <div className="container-custom">
        {/* Main 4-column Links Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '40px',
          marginBottom: '56px'
        }}>
          {/* Column 1: Brand & Academic Mission */}
          <div style={{ maxWidth: '300px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <div style={{
                backgroundColor: '#f36e20',
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}>
                <Siren size={20} />
              </div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#3a3b3a', letterSpacing: '-0.02em' }}>
                LifeLane<span style={{ color: '#f36e20' }}>AI</span>
              </div>
            </div>

            <p style={{
              fontSize: '14px',
              lineHeight: 1.6,
              color: '#626462',
              marginBottom: '20px'
            }}>
              A proactive AI system creating dynamic green-light corridors for emergency responders while minimizing normal traffic disruption.
            </p>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#fef2ec',
              color: '#f36e20',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '700',
              letterSpacing: '0.04em',
              textTransform: 'uppercase'
            }}>
              <span>Projected Target Metric Rule</span>
            </div>
          </div>

          {/* Column 2: Platform & Architecture */}
          <div>
            <h4 style={{
              fontSize: '14px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#3a3b3a',
              margin: '0 0 16px 0'
            }}>
              Platform
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
              <li>
                <a href="#subsystems" style={{ color: '#626462', textDecoration: 'none' }} className="footer-link">
                  Four Subsystems
                </a>
              </li>
              <li>
                <a href="#ai-modules" style={{ color: '#626462', textDecoration: 'none' }} className="footer-link">
                  Six AI Modules
                </a>
              </li>
              <li>
                <a href="#stepper" style={{ color: '#626462', textDecoration: 'none' }} className="footer-link">
                  10-Step Workflow Stepper
                </a>
              </li>
              <li>
                <a href="#outcomes" style={{ color: '#626462', textDecoration: 'none' }} className="footer-link">
                  Projected Outcomes Table
                </a>
              </li>
              <li>
                <button 
                  onClick={onOpenPortal}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: '#f36e20',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Shield size={14} />
                  <span>Police Control Portal</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Research Foundations */}
          <div>
            <h4 style={{
              fontSize: '14px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#3a3b3a',
              margin: '0 0 16px 0'
            }}>
              Research Foundation
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
              <li>
                <a href="#research" style={{ color: '#626462', textDecoration: 'none' }} className="footer-link">
                  Xiao et al. (2025) · GAA-GCN
                </a>
              </li>
              <li>
                <a href="#research" style={{ color: '#626462', textDecoration: 'none' }} className="footer-link">
                  Noor et al. (2024) · YOLOv8 Vision
                </a>
              </li>
              <li>
                <a href="#research" style={{ color: '#626462', textDecoration: 'none' }} className="footer-link">
                  Duan et al. (2022) · Preemption Review
                </a>
              </li>
              <li>
                <a href="#updates" style={{ color: '#626462', textDecoration: 'none' }} className="footer-link">
                  Sprint & Phase Log
                </a>
              </li>
              <li>
                <a href="https://doi.org" target="_blank" rel="noreferrer" style={{ color: '#626462', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }} className="footer-link">
                  <span>IEEE ITS Survey (Scanned)</span>
                  <ExternalLink size={12} />
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Client & Digital Twin */}
          <div>
            <h4 style={{
              fontSize: '14px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#3a3b3a',
              margin: '0 0 16px 0'
            }}>
              Simulated Services
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
              <li>
                <a 
                  href="http://localhost:5174" 
                  target="_blank" 
                  rel="noreferrer" 
                  style={{ color: '#f36e20', textDecoration: 'none', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Terminal size={14} />
                  <span>Driver Terminal (Port 5174)</span>
                </a>
              </li>
              <li>
                <a href="#simulation" style={{ color: '#626462', textDecoration: 'none' }} className="footer-link">
                  Bengaluru Central Grid Twin
                </a>
              </li>
              <li>
                <button 
                  onClick={onRequestDemo}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: '#626462',
                    fontSize: '14px',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  className="footer-link"
                >
                  Schedule Municipal Briefing
                </button>
              </li>
              <li>
                <a href="tel:+918000000000" style={{ color: '#626462', textDecoration: 'none' }} className="footer-link">
                  Emergency Line: +91 80 0000 0000 (Demo Line)
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Mandatory Academic Disclaimer & Privacy/Terms Disclosures */}
        <div id="terms" style={{
          backgroundColor: '#f8f8f8',
          border: '1px solid #e0e1e0',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '16px',
          fontSize: '13px',
          lineHeight: 1.6,
          color: '#626462'
        }}>
          <strong style={{ color: '#3a3b3a' }}>Academic Project Disclaimer:</strong> LifeLane AI is an engineering research prototype developed for intelligent urban transportation. All speed-up figures (30–40% reduction in response time, ~90% fewer intersection stops, and under 90 s added diversion delay) are <em>projected targets</em> modeled against simulated baselines. Real-world municipal deployments require calibrated local sensor telemetry and regulatory approvals.
        </div>

        <div id="privacy" style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e0e1e0',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '32px',
          fontSize: '12px',
          lineHeight: 1.6,
          color: '#626462'
        }}>
          <div id="telemetry" style={{ fontWeight: '700', color: '#3a3b3a', marginBottom: '4px' }}>
            Data Privacy, Telemetry Retention & Licence Handling Notice (30-Day Automated Purge)
          </div>
          Emergency driver GPS telemetry, signal actuation records, and rejected driver registration documents are retained for a maximum of 30 days pursuant to municipal audit requirements, after which records and uploaded licence images are permanently purged. Uploaded licence images are stored under non-public restricted storage and accessible solely to authenticated traffic police operators. Automated OCR extraction assists reviewers with consistency checks; all approval and suspension decisions are made by authorized human reviewers.
        </div>

        {/* Bottom Bar: Copyright & Legal */}
        <div style={{
          borderTop: '1px solid #e0e1e0',
          paddingTop: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          fontSize: '13px',
          color: '#626462'
        }}>
          <div>
            © {new Date().getFullYear()} LifeLane AI Systems. Reference UI Pattern Replicated from trafficmanagement.com.
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <a href="#privacy" style={{ color: '#626462', textDecoration: 'none' }} className="footer-link">Privacy Policy</a>
            <a href="#terms" style={{ color: '#626462', textDecoration: 'none' }} className="footer-link">Terms of Simulation</a>
            <a href="#telemetry" style={{ color: '#626462', textDecoration: 'none' }} className="footer-link">Telemetry Agreement</a>
          </div>
        </div>
      </div>

      <style>{`
        .footer-link:hover {
          color: #f36e20 !important;
        }
      `}</style>
    </footer>
  );
}
