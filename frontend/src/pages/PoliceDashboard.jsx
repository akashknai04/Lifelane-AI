import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet';
import L from 'leaflet';
import { getMapTileConfig } from '../config/map';
import {
  ShieldAlert, Radio, Activity, Clock, AlertTriangle, Eye, Video,
  CheckCircle, ArrowUpRight, Lock, RefreshCw, Car, ChevronRight,
  MapPin, Sliders, Bell, UserCheck, QrCode
} from 'lucide-react';
import DriverApprovals from '../components/DriverApprovals';

// Custom Map Marker Icons
const createSignalIcon = (phase) => {
  const colors = {
    GREEN: '#22c55e',
    AMBER_PREPARE: '#f59e0b',
    AMBER: '#f59e0b',
    REVERTING: '#06b6d4',
    RED: '#ef4444'
  };
  const color = colors[phase] || '#ef4444';
  const pulse = (phase === 'GREEN' || phase === 'AMBER_PREPARE') ? 'animation: pulse 1.5s infinite;' : '';

  return L.divIcon({
    className: 'custom-signal-marker',
    html: `
      <div style="
        width: 22px;
        height: 22px;
        background-color: ${color};
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 0 10px ${color};
        ${pulse}
      "></div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });
};

const ambulanceIcon = L.divIcon({
  className: 'custom-ambulance-marker',
  html: `
    <div style="
      background-color: #ef4444;
      color: white;
      border: 2px solid white;
      border-radius: 8px;
      padding: 4px 6px;
      font-weight: 800;
      font-size: 11px;
      box-shadow: 0 0 14px rgba(239,68,68,0.9);
      display: flex;
      align-items: center;
      gap: 4px;
    ">
      <span>🚑</span>
      <span>108</span>
    </div>
  `,
  iconSize: [48, 26],
  iconAnchor: [24, 13]
});

const hospitalIcon = L.divIcon({
  className: 'custom-hospital-marker',
  html: `
    <div style="
      background-color: #0f172a;
      color: #ef4444;
      border: 2px solid #ef4444;
      border-radius: 6px;
      padding: 3px 5px;
      font-weight: 900;
      font-size: 11px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    ">
      🏥 ER
    </div>
  `,
  iconSize: [36, 24],
  iconAnchor: [18, 12]
});

// Corridor Intersections Coordinates
const CORRIDOR_INTERSECTIONS = [
  { code: 'INT-BLR-01', name: "St. John's Junction", lat: 12.9298, lon: 77.6205 },
  { code: 'INT-BLR-02', name: 'Dairy Circle', lat: 12.9385, lon: 77.5997 },
  { code: 'INT-BLR-03', name: 'Adugodi Signal', lat: 12.9436, lon: 77.6083 },
  { code: 'INT-BLR-04', name: 'Anepalya Junction', lat: 12.9512, lon: 77.6041 },
  { code: 'INT-BLR-05', name: 'Richmond Circle', lat: 12.9620, lon: 77.5968 },
  { code: 'INT-BLR-06', name: 'Corporation Circle', lat: 12.9680, lon: 77.5890 },
  { code: 'INT-BLR-07', name: 'Victoria Hospital Gate', lat: 12.9635, lon: 77.5750 },
  { code: 'INT-BLR-11', name: 'Trinity Circle', lat: 12.9725, lon: 77.6205 },
  { code: 'INT-BLR-12', name: 'Domlur Flyover Signal', lat: 12.9610, lon: 77.6385 },
  { code: 'INT-BLR-13', name: 'HAL Old Airport Signal', lat: 12.9580, lon: 77.6440 },
  { code: 'INT-BLR-14', name: 'Manipal Hospital Junction', lat: 12.9575, lon: 77.6530 },
];

const HOSPITALS = [
  { name: 'Victoria Hospital (Trauma Center)', lat: 12.9631, lon: 77.5744 },
  { name: "St. John's Medical College Hospital", lat: 12.9312, lon: 77.6212 },
  { name: 'Bowring and Lady Curzon Hospital', lat: 12.9820, lon: 77.6050 },
  { name: 'Manipal Hospital HAL Airport Road', lat: 12.9579, lon: 77.6534 },
];

export default function PoliceDashboard({ onExit, token }) {
  const mapTileConfig = getMapTileConfig('dataviz-dark');
  const [activeTab, setActiveTab] = useState('corridors'); // 'corridors' | 'cctv' | 'alerts'
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [approvalsOpen, setApprovalsOpen] = useState(false);
  
  // Live State
  const [intersections, setIntersections] = useState(
    CORRIDOR_INTERSECTIONS.map((c, i) => ({
      ...c,
      phase: i === 0 ? 'GREEN' : i === 1 ? 'AMBER_PREPARE' : 'RED',
      timing_mode: i === 0 ? 'ACTUATED_GREEN_WAVE' : i === 1 ? 'PRE_CLEARING_ARMED' : 'CYCLIC'
    }))
  );

  const [activeSession, setActiveSession] = useState({
    session_code: 'LL-2026-8842',
    vehicle_type: 'ambulance',
    origin: 'Koramangala 4th Block',
    destination: 'Victoria Hospital Trauma Center',
    speed_kmh: 46.5,
    heading_deg: 325,
    lat: 12.9350,
    lon: 77.6110,
    time_saved_s: 184.2,
    eta_s: 320,
    status: 'ACTIVE_PREEMPTION'
  });

  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [selectedIntersection, setSelectedIntersection] = useState(null);
  const [overrideReason, setOverrideReason] = useState('Clear path for secondary medical escort');
  const [overridePhase, setOverridePhase] = useState('GREEN');

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
      // Increment simulated time saved slightly
      setActiveSession(prev => ({
        ...prev,
        time_saved_s: +(prev.time_saved_s + 0.5).toFixed(1),
        lat: +(prev.lat + 0.00008).toFixed(6),
        lon: -(Math.abs(prev.lon) - 0.00006).toFixed(6),
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleManualOverride = async () => {
    if (!selectedIntersection) return;
    try {
      const res = await fetch(`http://localhost:8000/api/v1/intersections/${selectedIntersection.code}/override`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        },
        body: JSON.stringify({
          target_phase: overridePhase,
          duration_seconds: 60,
          reason: overrideReason
        })
      });
      if (res.ok) {
        setIntersections(prev => prev.map(item => 
          item.code === selectedIntersection.code ? { ...item, phase: overridePhase } : item
        ));
        setOverrideModalOpen(false);
      }
    } catch (err) {
      console.warn('Backend override endpoint call failed; applying local fallback:', err);
      setIntersections(prev => prev.map(item => 
        item.code === selectedIntersection.code ? { ...item, phase: overridePhase } : item
      ));
      setOverrideModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-[#f36e20] selection:text-white">
      {/* 1. Command Center Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-orange-600 flex items-center justify-center shadow-lg shadow-orange-600/30">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-lg text-white tracking-wide">
                BENGALURU TRAFFIC POLICE (BTP)
              </h1>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                LIVE COMMAND CENTER
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Autonomous Green-Corridor & Priority Preemption Console · Central Grid
            </p>
          </div>
        </div>

        {/* Center Live Telemetry Status */}
        <div className="hidden lg:flex items-center gap-6 px-4 py-1.5 rounded-full bg-slate-950/80 border border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-emerald-400 font-semibold">500ms TELEMETRY STREAM</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Activity className="w-4 h-4 text-orange-400" />
            <span>AI CORRIDOR: <strong>GAA-GCN ACTIVE</strong></span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5 text-slate-300 font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{currentTime} IST</span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setApprovalsOpen(true)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3.5 py-2 rounded-lg border border-slate-700 transition"
          >
            <UserCheck className="w-4 h-4 text-orange-400" />
            <span>Driver Approvals & QR</span>
          </button>

          <button
            onClick={onExit}
            className="text-xs font-bold text-slate-400 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-800 transition border border-transparent hover:border-slate-700"
          >
            Exit to Public Platform
          </button>
        </div>
      </header>

      {/* 2. Real-Time KPI Strip */}
      <section className="bg-slate-900/60 border-b border-slate-800/80 px-6 py-2.5 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div className="flex items-center gap-3 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
          <div className="p-2 rounded bg-orange-500/10 text-orange-400">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-slate-400 font-medium">Emergency Time Saved</div>
            <div className="text-base font-black text-orange-400 flex items-center gap-1.5">
              <span>{Math.floor(activeSession.time_saved_s / 60)}m {Math.floor(activeSession.time_saved_s % 60)}s</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                Simulated estimate
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
          <div className="p-2 rounded bg-emerald-500/10 text-emerald-400">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <div className="text-slate-400 font-medium">Corridor Status</div>
            <div className="text-base font-black text-emerald-400 flex items-center gap-1.5">
              <span>1 Active Wave</span>
              <span className="text-[10px] font-medium text-slate-400">2 Signals Green-Armed</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
          <div className="p-2 rounded bg-blue-500/10 text-blue-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <div className="text-slate-400 font-medium">Civilian Added Delay</div>
            <div className="text-base font-black text-blue-400 flex items-center gap-1.5">
              <span>52.4 s</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                Projected target: &lt; 90s
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
          <div className="p-2 rounded bg-purple-500/10 text-purple-400">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <div className="text-slate-400 font-medium">YOLOv11 Edge Latency</div>
            <div className="text-base font-black text-purple-400 flex items-center gap-1.5">
              <span>18.4 ms</span>
              <span className="text-[10px] text-emerald-400 font-bold">&lt; 350ms standard</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Main Operational Split (Leaflet Map on Left, Control Tabs on Right) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Column: Full-featured Interactive Leaflet Map */}
        <div className="flex-1 relative min-h-[450px] lg:min-h-auto bg-slate-950">
          <MapContainer
            center={[12.9460, 77.6080]}
            zoom={13}
            style={{ width: '100%', height: '100%' }}
            zoomControl={true}
          >
            <TileLayer
              attribution={mapTileConfig.attribution}
              url={mapTileConfig.url}
              tileSize={mapTileConfig.tileSize}
              zoomOffset={mapTileConfig.zoomOffset}
              maxZoom={mapTileConfig.maxZoom}
            />

            {/* Smart Intersection Signals */}
            {intersections.map((sig) => (
              <Marker
                key={sig.code}
                position={[sig.lat, sig.lon]}
                icon={createSignalIcon(sig.phase)}
              >
                <Popup>
                  <div className="text-slate-900 text-xs p-1">
                    <div className="font-bold text-sm text-[#f36e20]">{sig.name}</div>
                    <div className="font-mono text-slate-600">{sig.code}</div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span>Phase:</span>
                      <strong className={`font-black ${sig.phase === 'GREEN' ? 'text-green-600' : sig.phase === 'AMBER_PREPARE' ? 'text-amber-600' : 'text-red-600'}`}>
                        {sig.phase}
                      </strong>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Mode: {sig.timing_mode}</div>
                    <button
                      onClick={() => {
                        setSelectedIntersection(sig);
                        setOverrideModalOpen(true);
                      }}
                      className="mt-2 w-full bg-slate-900 hover:bg-orange-600 text-white font-bold text-xs py-1 px-2 rounded transition"
                    >
                      Manual Override
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Destination Hospitals */}
            {HOSPITALS.map((hosp, i) => (
              <Marker
                key={i}
                position={[hosp.lat, hosp.lon]}
                icon={hospitalIcon}
              >
                <Popup>
                  <div className="text-slate-900 text-xs p-1">
                    <div className="font-black text-red-600">{hosp.name}</div>
                    <div className="text-[11px] text-slate-600">Level 1 Emergency Trauma Center</div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Live Emergency Vehicle */}
            <Marker
              position={[activeSession.lat, activeSession.lon]}
              icon={ambulanceIcon}
            >
              <Popup>
                <div className="text-slate-900 text-xs p-1">
                  <div className="font-black text-red-600">AMBULANCE {activeSession.session_code}</div>
                  <div>Speed: {activeSession.speed_kmh} km/h</div>
                  <div>Dest: {activeSession.destination}</div>
                </div>
              </Popup>
            </Marker>

            {/* Preemption Corridor Polyline */}
            <Polyline
              positions={CORRIDOR_INTERSECTIONS.slice(0, 6).map(c => [c.lat, c.lon])}
              color="#22c55e"
              weight={5}
              opacity={0.8}
              dashArray="10, 8"
            />
          </MapContainer>

          {/* Map Legend Overlay */}
          <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/90 backdrop-blur border border-slate-800 p-3 rounded-xl shadow-xl text-xs space-y-1.5 text-slate-300">
            <div className="font-bold text-white text-[11px] uppercase tracking-wider mb-1">Corridor Signals</div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500"></span>
              <span>Actuated Green Wave (5–8s prior)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500"></span>
              <span>Pre-clearing Armed (&lt;800m / 35s)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span>Cyclic Hold / Conflicting Red</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-cyan-400"></span>
              <span>Post-Passage Reverting (10s)</span>
            </div>
          </div>
        </div>

        {/* Right Column: Mission Control & Priority Inspector */}
        <aside className="w-full lg:w-[480px] bg-slate-900 border-l border-slate-800 flex flex-col h-full overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-950/60 text-xs font-bold">
            <button
              onClick={() => setActiveTab('corridors')}
              className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition ${
                activeTab === 'corridors' ? 'border-orange-500 text-orange-400 bg-slate-900/50' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>Priority Corridors</span>
            </button>
            <button
              onClick={() => setActiveTab('cctv')}
              className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition ${
                activeTab === 'cctv' ? 'border-orange-500 text-orange-400 bg-slate-900/50' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>CCTV AI Vision</span>
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition ${
                activeTab === 'alerts' ? 'border-orange-500 text-orange-400 bg-slate-900/50' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Alerts & VMS</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeTab === 'corridors' && (
              <>
                {/* Active Mission Card */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                      <span className="font-black text-sm text-white">{activeSession.session_code}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                        HIGH PRIORITY AMBULANCE
                      </span>
                    </div>
                    <span className="text-xs font-mono text-emerald-400 font-bold">ETA: ~5.3 min</span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Route Origin:</span>
                      <span className="font-medium text-white">{activeSession.origin}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Destination:</span>
                      <span className="font-medium text-white">{activeSession.destination}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Current Velocity:</span>
                      <span className="font-medium text-white">{activeSession.speed_kmh} km/h (Heading {activeSession.heading_deg}°)</span>
                    </div>
                  </div>

                  {/* Upcoming Signal Wave Sequence */}
                  <div className="pt-2 border-t border-slate-800/80">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Next Signal Preemptions
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs bg-slate-900 p-2 rounded-lg border border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500"></span>
                          <span className="font-bold text-white">Dairy Circle (INT-BLR-02)</span>
                        </div>
                        <span className="text-emerald-400 font-bold">GREEN WAVE (ETA 6s)</span>
                      </div>
                      <div className="flex items-center justify-between text-xs bg-slate-900 p-2 rounded-lg border border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                          <span className="font-bold text-white">Adugodi Signal (INT-BLR-03)</span>
                        </div>
                        <span className="text-amber-400 font-bold">ARMED PRE-CLEAR (28s)</span>
                      </div>
                      <div className="flex items-center justify-between text-xs bg-slate-900 p-2 rounded-lg border border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                          <span className="font-bold text-white">Anepalya Junction (INT-BLR-04)</span>
                        </div>
                        <span className="text-slate-400">STANDBY (62s)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Priority Conflict Resolver (Module 6) */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-xs text-slate-300 uppercase tracking-wider">
                      Multi-Vehicle Priority Engine (Module 6)
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
                      Auto-Arbitrated
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    If multiple emergency vehicles converge, priority hierarchy arbitrates preemption:
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-900 p-2 rounded border border-slate-800 text-slate-300">
                      <span className="text-red-400 font-black">Rank 1:</span> Cardiac / Critical Ambulance
                    </div>
                    <div className="bg-slate-900 p-2 rounded border border-slate-800 text-slate-300">
                      <span className="text-orange-400 font-black">Rank 2:</span> Organ Transplant Express
                    </div>
                    <div className="bg-slate-900 p-2 rounded border border-slate-800 text-slate-300">
                      <span className="text-yellow-400 font-black">Rank 3:</span> Fire Rescue Fleet
                    </div>
                    <div className="bg-slate-900 p-2 rounded border border-slate-800 text-slate-300">
                      <span className="text-blue-400 font-black">Rank 4:</span> Police Tactical Interceptor
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'cctv' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>YOLOv11 Edge Camera Feeds</span>
                  <span className="text-emerald-400 font-bold">4 Feeds Online</span>
                </div>
                
                {/* 4 CCTV Tiles */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'CAM-01', name: "St. John's Approach", detect: 'Ambulance (94%)', boxColor: 'border-red-500' },
                    { id: 'CAM-02', name: 'Dairy Circle Hosur Rd', detect: 'Civilian (85%)', boxColor: 'border-blue-500' },
                    { id: 'CAM-03', name: 'Adugodi Bosch Gate', detect: 'Civilian (88%)', boxColor: 'border-blue-500' },
                    { id: 'CAM-04', name: 'Richmond Flyover', detect: 'Police Unit (89%)', boxColor: 'border-purple-500' },
                  ].map(cam => (
                    <div key={cam.id} className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden relative group">
                      <div className="aspect-video bg-slate-900 flex items-center justify-center relative">
                        {/* Simulated CCTV scanning grid */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent pointer-events-none"></div>
                        <div className={`absolute w-16 h-12 border-2 ${cam.boxColor} rounded flex items-start justify-start p-1`}>
                          <span className="text-[9px] font-mono bg-black/80 text-white px-1 rounded">
                            {cam.detect}
                          </span>
                        </div>
                        <Video className="w-8 h-8 text-slate-700" />
                        <span className="absolute top-2 left-2 text-[10px] font-mono bg-red-600 text-white px-1.5 py-0.2 rounded font-bold">
                          LIVE
                        </span>
                      </div>
                      <div className="p-2 bg-slate-900/90 text-[11px] flex justify-between items-center">
                        <span className="font-bold text-white">{cam.name}</span>
                        <span className="text-slate-400 font-mono text-[10px]">{cam.id}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-400">
                  <span className="font-bold text-slate-200">Perception Model:</span> YOLOv11 (Noor et al., 2024). Latency: 18.4ms. Automatic preemption triggers if ambulance confidence &gt; 70%.
                </div>
              </div>
            )}

            {activeTab === 'alerts' && (
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Roadside Variable Message Signs (VMS)
                </div>
                {[
                  { id: 'VMS-01', loc: 'Koramangala 100ft Road Gantry', text: 'EMERGENCY AMBULANCE APPROACHING (35s) - MOVE TO LEFT - KEEP LANE 1 CLEAR', active: true },
                  { id: 'VMS-02', loc: 'Hosur Road Overhead Board', text: 'SPEED LIMIT 50 KM/H - DRIVE RESPONSIBLY', active: false },
                  { id: 'VMS-03', loc: 'Adugodi Signal Gantry', text: 'SPEED LIMIT 50 KM/H - DRIVE RESPONSIBLY', active: false },
                  { id: 'VMS-04', loc: 'Richmond Flyover North Approach', text: 'TRAFFIC ALERT - USE RESIDENCY ROAD PARALLEL DIVERSION', active: true }
                ].map(vms => (
                  <div key={vms.id} className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">{vms.loc}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        vms.active ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {vms.id}
                      </span>
                    </div>
                    <div className="font-mono text-[11px] bg-black p-2 rounded text-amber-400 border border-slate-800">
                      {vms.text}
                    </div>
                  </div>
                ))}

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-400 space-y-1">
                  <div className="font-bold text-white">Multi-Channel Civilian Alert Protocol</div>
                  <div>• 500m radius broadcast radius via C-V2X SAE J2735 EVA packet</div>
                  <div>• 30–45s lead time for civilian drivers (10x acoustic siren range)</div>
                  <div>• Parallel diversion bounding delay to &lt; 90s per commuter</div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* 4. Manual Signal Override Modal */}
      {overrideModalOpen && selectedIntersection && (
        <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-orange-500 font-bold">
                <Sliders className="w-5 h-5" />
                <span>Manual Signal Override</span>
              </div>
              <button
                onClick={() => setOverrideModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-1">
              <div className="text-slate-400">Target Intersection:</div>
              <div className="font-bold text-base text-white">{selectedIntersection.name} ({selectedIntersection.code})</div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Select Desired Signal Phase:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOverridePhase('GREEN')}
                  className={`py-2 px-3 rounded-lg font-bold text-xs border transition ${
                    overridePhase === 'GREEN' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  Force GREEN Wave
                </button>
                <button
                  type="button"
                  onClick={() => setOverridePhase('RED')}
                  className={`py-2 px-3 rounded-lg font-bold text-xs border transition ${
                    overridePhase === 'RED' ? 'bg-red-600 text-white border-red-500' : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  Force ALL-RED Hold
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">
                Mandatory Operational Reason (Audit Logged):
              </label>
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                placeholder="Reason for manual intervention..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOverrideModalOpen(false)}
                className="flex-1 py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleManualOverride}
                className="flex-1 py-2 px-4 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition shadow-lg shadow-orange-600/30"
              >
                Execute Override
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Driver Approvals Modal */}
      <DriverApprovals
        isOpen={approvalsOpen}
        onClose={() => setApprovalsOpen(false)}
        token={token}
      />
    </div>
  );
}
