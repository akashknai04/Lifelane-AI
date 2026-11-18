import React, { useState } from 'react';
import { Siren, ChevronDown, Menu, X, Play, ShieldAlert, Cpu, Network, Layers } from 'lucide-react';

export default function Navbar({ onOpenPortal }) {
  const [platformOpen, setPlatformOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav style={{
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e0e1e0',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
    }}>
      <div className="container-custom" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '76px'
      }}>
        {/* Brand Logo */}
        <a href="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          textDecoration: 'none',
          color: '#3a3b3a'
        }}>
          <div style={{
            backgroundColor: '#f36e20',
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 10px rgba(243, 110, 32, 0.3)'
          }}>
            <Siren size={24} />
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.03em', lineHeight: 1 }}>
              LifeLane<span style={{ color: '#f36e20' }}>AI</span>
            </div>
            <div style={{ fontSize: '11px', color: '#626462', fontWeight: '600', letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: '3px' }}>
              Predictive Green Corridors
            </div>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '28px'
        }} className="desktop-nav">
          {/* Platform Dropdown */}
          <div 
            style={{ position: 'relative' }}
            onMouseEnter={() => setPlatformOpen(true)}
            onMouseLeave={() => setPlatformOpen(false)}
          >
            <button style={{
              background: 'none',
              border: 'none',
              fontSize: '14px',
              fontWeight: '600',
              color: platformOpen ? '#f36e20' : '#3a3b3a',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              padding: '10px 0'
            }}>
              <span>Platform</span>
              <ChevronDown size={14} style={{ transform: platformOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {platformOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: '-20px',
                width: '280px',
                backgroundColor: '#ffffff',
                border: '1px solid #e0e1e0',
                borderRadius: '16px',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                padding: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                zIndex: 50
              }}>
                <a href="#subsystems" style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  color: '#3a3b3a',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }} className="hover-peach">
                  <Network size={16} color="#f36e20" />
                  <span>Four Subsystems</span>
                </a>
                <a href="#architecture" style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  color: '#3a3b3a',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }} className="hover-peach">
                  <Layers size={16} color="#f36e20" />
                  <span>Three-Tier Architecture</span>
                </a>
                <a href="#ai-modules" style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  color: '#3a3b3a',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }} className="hover-peach">
                  <Cpu size={16} color="#f36e20" />
                  <span>Six AI Modules</span>
                </a>
                <a href="#stepper" style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  color: '#3a3b3a',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }} className="hover-peach">
                  <ShieldAlert size={16} color="#f36e20" />
                  <span>10-Step Workflow</span>
                </a>
                <a href="#innovations" style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  color: '#3a3b3a',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }} className="hover-peach">
                  <Play size={16} color="#f36e20" />
                  <span>Six Innovations</span>
                </a>
                <a href="#tech-stack" style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  color: '#3a3b3a',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }} className="hover-peach">
                  <Cpu size={16} color="#f36e20" />
                  <span>Tech Stack</span>
                </a>
              </div>
            )}
          </div>

          <a href="#problem" style={{ fontSize: '14px', fontWeight: '600', color: '#3a3b3a', textDecoration: 'none' }}>
            Problem
          </a>
          <a href="#objectives" style={{ fontSize: '14px', fontWeight: '600', color: '#3a3b3a', textDecoration: 'none' }}>
            Objectives
          </a>
          <a href="#outcomes" style={{ fontSize: '14px', fontWeight: '600', color: '#3a3b3a', textDecoration: 'none' }}>
            Outcomes
          </a>
          <a href="#research" style={{ fontSize: '14px', fontWeight: '600', color: '#3a3b3a', textDecoration: 'none' }}>
            Research
          </a>
          <a href="#roadmap" style={{ fontSize: '14px', fontWeight: '600', color: '#3a3b3a', textDecoration: 'none' }}>
            Roadmap
          </a>
          <a href="#simulation" style={{ fontSize: '14px', fontWeight: '600', color: '#3a3b3a', textDecoration: 'none' }}>
            Simulation
          </a>
          <a href="#updates" style={{ fontSize: '14px', fontWeight: '600', color: '#3a3b3a', textDecoration: 'none' }}>
            Updates
          </a>

          {/* Action CTAs in Nav */}
          <a 
            href="http://localhost:5174" 
            target="_blank" 
            rel="noreferrer"
            className="btn-secondary"
            style={{ padding: '8px 18px', fontSize: '13px' }}
          >
            Driver App (500ms)
          </a>

          <button 
            onClick={onOpenPortal}
            className="btn-primary"
            style={{ padding: '8px 20px', fontSize: '13px' }}
          >
            Police Console
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div style={{ display: 'none' }} className="mobile-toggle">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}
          >
            {mobileMenuOpen ? <X size={26} color="#3a3b3a" /> : <Menu size={26} color="#3a3b3a" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e0e1e0',
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <a href="#problem" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '15px', fontWeight: '700', color: '#3a3b3a', textDecoration: 'none' }}>The Problem</a>
          <a href="#objectives" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '15px', fontWeight: '700', color: '#3a3b3a', textDecoration: 'none' }}>Objectives</a>
          <a href="#subsystems" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '15px', fontWeight: '700', color: '#3a3b3a', textDecoration: 'none' }}>Four Subsystems</a>
          <a href="#architecture" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '15px', fontWeight: '700', color: '#3a3b3a', textDecoration: 'none' }}>Three-Tier Architecture</a>
          <a href="#ai-modules" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '15px', fontWeight: '700', color: '#3a3b3a', textDecoration: 'none' }}>Six AI Modules</a>
          <a href="#stepper" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '15px', fontWeight: '700', color: '#3a3b3a', textDecoration: 'none' }}>10-Step Workflow</a>
          <a href="#outcomes" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '15px', fontWeight: '700', color: '#3a3b3a', textDecoration: 'none' }}>Expected Outcomes</a>
          <a href="#innovations" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '15px', fontWeight: '700', color: '#3a3b3a', textDecoration: 'none' }}>Six Innovations</a>
          <a href="#research" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '15px', fontWeight: '700', color: '#3a3b3a', textDecoration: 'none' }}>Research Foundation</a>
          <a href="#tech-stack" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '15px', fontWeight: '700', color: '#3a3b3a', textDecoration: 'none' }}>Tech Stack</a>
          <a href="#roadmap" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '15px', fontWeight: '700', color: '#3a3b3a', textDecoration: 'none' }}>Roadmap</a>
          <a href="#simulation" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '15px', fontWeight: '700', color: '#3a3b3a', textDecoration: 'none' }}>Digital Twin</a>
          <a href="#updates" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '15px', fontWeight: '700', color: '#3a3b3a', textDecoration: 'none' }}>Project Updates</a>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '10px', borderTop: '1px solid #e0e1e0' }}>
            <a href="http://localhost:5174" target="_blank" rel="noreferrer" className="btn-secondary" style={{ width: '100%' }}>Driver App Terminal</a>
            <button onClick={() => { setMobileMenuOpen(false); onOpenPortal(); }} className="btn-primary" style={{ width: '100%' }}>Police Console</button>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 992px) {
          .desktop-nav { display: none !important; }
          .mobile-toggle { display: block !important; }
        }
        .hover-peach:hover {
          background-color: #fef2ec;
          color: #f36e20 !important;
        }
      `}</style>
    </nav>
  );
}
