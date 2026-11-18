import React, { useState } from 'react';
import UtilityBar from './components/UtilityBar';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import TheProblem from './components/TheProblem';
import Objectives from './components/Objectives';
import FourSubsystems from './components/FourSubsystems';
import ThreeTierArchitecture from './components/ThreeTierArchitecture';
import ModulesCarousel from './components/ModulesCarousel';
import WhyLifeLane from './components/WhyLifeLane';
import WorkflowStepper from './components/WorkflowStepper';
import ExpectedOutcomes from './components/ExpectedOutcomes';
import Innovations from './components/Innovations';
import CorridorStats from './components/CorridorStats';
import ResearchSlider from './components/ResearchSlider';
import TechStack from './components/TechStack';
import Roadmap from './components/Roadmap';
import DigitalTwinSection from './components/DigitalTwinSection';
import ProjectUpdates from './components/ProjectUpdates';
import ContactBand from './components/ContactBand';
import Footer from './components/Footer';
import CookieBanner from './components/CookieBanner';
import { RequestDemoModal, PolicePortalModal } from './components/Modals';
import DriverApprovals from './components/DriverApprovals';
import PoliceDashboard from './pages/PoliceDashboard';

export default function App() {
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [portalModalOpen, setPortalModalOpen] = useState(false);
  const [approvalsModalOpen, setApprovalsModalOpen] = useState(false);
  const [dashboardActive, setDashboardActive] = useState(false);
  const [policeToken, setPoliceToken] = useState(null);

  const handleOpenDemo = () => setDemoModalOpen(true);
  const handleCloseDemo = () => setDemoModalOpen(false);

  const handleOpenPortal = () => setPortalModalOpen(true);
  const handleClosePortal = () => setPortalModalOpen(false);

  const handleOpenDashboard = (token) => {
    if (token) setPoliceToken(token);
    setDashboardActive(true);
  };

  const handleOpenApprovals = (token) => {
    if (token) setPoliceToken(token);
    setApprovalsModalOpen(true);
  };
  const handleCloseApprovals = () => setApprovalsModalOpen(false);

  if (dashboardActive) {
    return (
      <PoliceDashboard 
        onExit={() => setDashboardActive(false)} 
        token={policeToken} 
      />
    );
  }


  return (
    <div className="min-h-screen flex flex-col bg-white text-[#3a3b3a]">
      {/* 1. Top Utility Bar */}
      <UtilityBar 
        onRequestDemo={handleOpenDemo}
        onOpenPortal={handleOpenPortal}
      />

      {/* 2. Main Sticky Navigation */}
      <Navbar 
        onOpenPortal={handleOpenPortal}
      />

      <main>
        {/* 3. Hero Section */}
        <Hero 
          onExplore={() => {
            const el = document.getElementById('problem');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          onRunSim={() => {
            window.open('http://localhost:5174', '_blank');
          }}
        />

        {/* 4. The Problem — Slide 2: 60-90s statement + 6 obstacles */}
        <TheProblem />

        {/* 5. Objectives — Slide 3: 8 measurable targets */}
        <Objectives />

        {/* 6. Four Subsystems — Slide 5: Edge, Cloud, Driver, Police/Signal */}
        <FourSubsystems />

        {/* 7. Three-Tier Architecture — Slide 6: Edge / Cloud / Client */}
        <ThreeTierArchitecture />

        {/* 8. AI Modules Carousel — Slide 7 */}
        <ModulesCarousel />

        {/* 9. "Why LifeLane AI?" — 3 Numbered Cards */}
        <WhyLifeLane 
          onExplore={() => {
            const el = document.getElementById('stepper');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* 10. Interactive 10-Step Lifecycle Stepper */}
        <WorkflowStepper />

        {/* 11. Expected Outcomes Table — Slide 12 with Projected target badges */}
        <ExpectedOutcomes />

        {/* 12. Six Key Innovations — Slide 11 */}
        <Innovations />

        {/* 13. Operational Corridor Statistics (Bengaluru Central Grid) */}
        <CorridorStats 
          onOpenSim={() => {
            window.open('http://localhost:5174', '_blank');
          }}
        />

        {/* 14. Research & Scientific Foundations Slider (Xiao 2025, Noor 2024, Duan 2022) */}
        <ResearchSlider />

        {/* 15. Categorized Tech Stack — Slide 10 */}
        <TechStack />

        {/* 16. Implementation Roadmap — Slide 13 (16 weeks, 6 phases) */}
        <Roadmap />

        {/* 17. Digital Twin & Multi-Agent Simulator Preview — Slide 11 */}
        <DigitalTwinSection />

        {/* 18. Project Updates & Engineering Log */}
        <ProjectUpdates />

        {/* 19. 24/7 Operations & Emergency Contact Band */}
        <ContactBand 
          onRequestDemo={handleOpenDemo}
        />
      </main>

      {/* 10. Multi-column Site Footer */}
      <Footer 
        onOpenPortal={handleOpenPortal}
        onRequestDemo={handleOpenDemo}
      />

      {/* 11. Cookie & Privacy Consent Banner */}
      <CookieBanner />

      {/* 12. Interactive Modals */}
      <RequestDemoModal 
        isOpen={demoModalOpen}
        onClose={handleCloseDemo}
      />

      <PolicePortalModal 
        isOpen={portalModalOpen}
        onClose={handleClosePortal}
        onOpenApprovals={handleOpenApprovals}
        onOpenDashboard={handleOpenDashboard}
      />

      <DriverApprovals
        isOpen={approvalsModalOpen}
        onClose={handleCloseApprovals}
        token={policeToken}
      />
    </div>
  );
}
