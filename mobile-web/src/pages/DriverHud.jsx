import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Siren, 
  Navigation, 
  Compass, 
  Gauge, 
  MapPin, 
  ShieldAlert, 
  Radio, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  Sparkles,
  PhoneCall,
  LogOut,
  UserCheck,
  ExternalLink,
  LocateFixed,
  Route
} from 'lucide-react';
import { API_BASE, WS_BASE } from '../config';
import NavigationMap from '../components/NavigationMap';

// Predefined emergency hospital destinations in Bengaluru
const HOSPITALS = [
  {
    id: "HOSP-01",
    name: "Victoria Hospital (BMCRI Trauma Centre)",
    latitude: 12.9634,
    longitude: 77.5756,
    dist_est: "4.8 km"
  },
  {
    id: "HOSP-02",
    name: "St. John's Medical College Hospital",
    latitude: 12.9298,
    longitude: 77.6205,
    dist_est: "2.1 km"
  },
  {
    id: "HOSP-03",
    name: "Bowring & Lady Curzon Hospital",
    latitude: 12.9821,
    longitude: 77.6012,
    dist_est: "6.2 km"
  },
  {
    id: "HOSP-04",
    name: "Manipal Hospital Old Airport Rd",
    latitude: 12.9589,
    longitude: 77.6483,
    dist_est: "5.5 km"
  }
];

const VEHICLES = [
  { plate: "KA-01-EA-1088", type: "ambulance", label: "Ambulance 108 — BLR East" },
  { plate: "KA-02-FE-2012", type: "fire_truck", label: "Fire Heavy Tender #12" },
  { plate: "KA-04-PC-9911", type: "police", label: "Flying Squad Interceptor" }
];

function haversineM(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function interpolateAlongPolyline(polyline, targetDistM) {
  if (!polyline || polyline.length === 0) return null;
  if (polyline.length === 1) return { lat: polyline[0][1], lon: polyline[0][0], heading: 0 };

  let accumulatedDist = 0;
  for (let i = 0; i < polyline.length - 1; i++) {
    const p1 = polyline[i];
    const p2 = polyline[i+1];
    const segDist = haversineM(p1[1], p1[0], p2[1], p2[0]);

    if (accumulatedDist + segDist >= targetDistM || i === polyline.length - 2) {
      const remaining = Math.max(0, targetDistM - accumulatedDist);
      const t = segDist > 0 ? Math.min(1.0, remaining / segDist) : 0;
      const lat = p1[1] + t * (p2[1] - p1[1]);
      const lon = p1[0] + t * (p2[0] - p1[0]);
      
      const y = Math.sin((p2[0] - p1[0]) * Math.PI / 180) * Math.cos(p2[1] * Math.PI / 180);
      const x = Math.cos(p1[1] * Math.PI / 180) * Math.sin(p2[1] * Math.PI / 180) -
                Math.sin(p1[1] * Math.PI / 180) * Math.cos(p2[1] * Math.PI / 180) * Math.cos((p2[0] - p1[0]) * Math.PI / 180);
      const heading = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;

      return { lat, lon, heading };
    }
    accumulatedDist += segDist;
  }
  const last = polyline[polyline.length - 1];
  return { lat: last[1], lon: last[0], heading: 0 };
}

export default function DriverHud() {
  const navigate = useNavigate();
  const [token, setToken] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const [selectedVehicle, setSelectedVehicle] = useState(VEHICLES[0]);
  const [selectedHospital, setSelectedHospital] = useState(HOSPITALS[0]);
  const [session, setSession] = useState(null);
  const [route, setRoute] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  // Real GPS and Simulator states
  const [isRealGps, setIsRealGps] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [showGmapsModal, setShowGmapsModal] = useState(false);

  // Vehicle position state
  const [vehiclePos, setVehiclePos] = useState({
    latitude: 12.9320,
    longitude: 77.6180,
    speed_kmh: 52.0,
    heading_deg: 325.0,
    accuracy_m: 4.2
  });

  const [hudFeedback, setHudFeedback] = useState({
    next_signals: [],
    time_saved_seconds: 0.0,
    active_corridor_signals: []
  });

  const [remainingDistanceM, setRemainingDistanceM] = useState(0);
  const [etaS, setEtaS] = useState(0);
  const [nextInstruction, setNextInstruction] = useState("Proceed to emergency destination");
  const [isOffRoute, setIsOffRoute] = useState(false);

  const [speedSlider, setSpeedSlider] = useState(55);
  const socketRef = useRef(null);
  const intervalRef = useRef(null);
  const routeRef = useRef(null);
  const simulatorDistAlongRef = useRef(0);
  const watchIdRef = useRef(null);

  // Check auth from sessionStorage on mount
  useEffect(() => {
    const savedToken = sessionStorage.getItem('lifelane_driver_token');
    const savedUser = sessionStorage.getItem('lifelane_driver_user');

    if (!savedToken) {
      navigate('/login');
      return;
    }

    setToken(savedToken);
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        setCurrentUser(null);
      }
    }
  }, [navigate]);

  // Clean up GPS watcher and intervals on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (socketRef.current) socketRef.current.close();
    };
  }, []);

  const handleLogout = () => {
    if (socketRef.current) socketRef.current.close();
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    sessionStorage.removeItem('lifelane_driver_token');
    sessionStorage.removeItem('lifelane_driver_user');
    navigate('/login');
  };

  // Toggle Real GPS mode
  const toggleRealGps = () => {
    if (!isRealGps) {
      if (!navigator.geolocation) {
        setGpsError("Geolocation is not supported by your device");
        return;
      }
      setGpsError(null);
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          setVehiclePos(prev => ({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            speed_kmh: pos.coords.speed !== null ? pos.coords.speed * 3.6 : prev.speed_kmh,
            heading_deg: pos.coords.heading !== null ? pos.coords.heading : prev.heading_deg,
            accuracy_m: pos.coords.accuracy || 5.0
          }));
        },
        (err) => {
          setGpsError(`GPS access error: ${err.message}. Reverting to route simulation.`);
          setIsRealGps(false);
          if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
      watchIdRef.current = id;
      setIsRealGps(true);
    } else {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsRealGps(false);
      setGpsError(null);
    }
  };

  // START EMERGENCY Handler
  const handleStartEmergency = async () => {
    if (!token) return;
    setIsStarting(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/emergency/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          vehicle_plate: selectedVehicle.plate,
          vehicle_type: selectedVehicle.type,
          origin_lat: vehiclePos.latitude,
          origin_lon: vehiclePos.longitude,
          dest_lat: selectedHospital.latitude,
          dest_lon: selectedHospital.longitude,
          destination_name: selectedHospital.name
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || `Session start rejected (${res.status})`);
      }

      const sessionData = await res.json();
      setSession(sessionData);
      simulatorDistAlongRef.current = 0;
      connectTelemetryWebSocket(sessionData.id);
    } catch (err) {
      alert("Error starting emergency session: " + err.message);
    } finally {
      setIsStarting(false);
    }
  };

  // Connect 500 ms Telemetry WebSocket with JWT auth
  const connectTelemetryWebSocket = (sessionId) => {
    const ws = new WebSocket(`${WS_BASE}/api/v1/ws/telemetry/${sessionId}?token=${token}`);
    socketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      // Explicitly request route geometry
      ws.send(JSON.stringify({ type: "GET_ROUTE" }));

      // Start 500 ms high-frequency GPS stream
      intervalRef.current = setInterval(() => {
        sendTelemetryFrame(ws);
      }, 500);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "ROUTE_UPDATE") {
          setRoute(msg.route);
          routeRef.current = msg.route;
          if (msg.route && msg.route.steps && msg.route.steps.length > 0) {
            setNextInstruction(msg.route.steps[0].instruction);
          }
          if (msg.intersections) {
            setHudFeedback(prev => ({
              ...prev,
              next_signals: msg.intersections
            }));
          }
        } else if (msg.type === "TELEMETRY_ACK") {
          setHudFeedback({
            next_signals: msg.next_signals || [],
            time_saved_seconds: msg.time_saved_seconds || 0,
            active_corridor_signals: msg.active_corridor_signals || []
          });
          if (msg.remaining_distance_m !== undefined) setRemainingDistanceM(msg.remaining_distance_m);
          if (msg.eta_s !== undefined) setEtaS(msg.eta_s);
          if (msg.next_instruction) setNextInstruction(msg.next_instruction);
          if (msg.off_route !== undefined) setIsOffRoute(msg.off_route);
        }
      } catch (err) {
        console.error("WS parse error:", err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  };

  // Advance simulated vehicle position along polyline and transmit 500ms frame
  const sendTelemetryFrame = (ws) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    if (isRealGps) {
      // Send real GPS position
      const frame = {
        latitude: parseFloat(vehiclePos.latitude.toFixed(6)),
        longitude: parseFloat(vehiclePos.longitude.toFixed(6)),
        speed_kmh: parseFloat(vehiclePos.speed_kmh || speedSlider),
        heading_deg: parseFloat((vehiclePos.heading_deg || 0).toFixed(1)),
        accuracy_m: parseFloat((vehiclePos.accuracy_m || 4.0).toFixed(1))
      };
      ws.send(JSON.stringify(frame));
      return;
    }

    // Dev Route Simulator: advance along the actual route polyline
    const curRoute = routeRef.current;
    if (curRoute && curRoute.polyline && curRoute.polyline.length >= 2) {
      const stepM = (speedSlider * 1000 / 3600) * 0.5; // distance per 500ms
      simulatorDistAlongRef.current += stepM;

      const pt = interpolateAlongPolyline(curRoute.polyline, simulatorDistAlongRef.current);
      if (pt) {
        const frame = {
          latitude: parseFloat(pt.lat.toFixed(6)),
          longitude: parseFloat(pt.lon.toFixed(6)),
          speed_kmh: parseFloat(speedSlider),
          heading_deg: parseFloat(pt.heading.toFixed(1)),
          accuracy_m: 4.0
        };
        ws.send(JSON.stringify(frame));

        setVehiclePos({
          latitude: pt.lat,
          longitude: pt.lon,
          speed_kmh: speedSlider,
          heading_deg: pt.heading,
          accuracy_m: 4.0
        });
        return;
      }
    }

    // Fallback straight-line step before route geometry loads
    setVehiclePos((prev) => {
      const destLat = selectedHospital.latitude;
      const destLon = selectedHospital.longitude;
      const dLat = (destLat - prev.latitude) * 0.003;
      const dLon = (destLon - prev.longitude) * 0.003;

      const nextLat = prev.latitude + dLat;
      const nextLon = prev.longitude + dLon;

      const frame = {
        latitude: parseFloat(nextLat.toFixed(6)),
        longitude: parseFloat(nextLon.toFixed(6)),
        speed_kmh: parseFloat(speedSlider),
        heading_deg: 325.0,
        accuracy_m: 4.2
      };

      ws.send(JSON.stringify(frame));

      return {
        ...prev,
        latitude: nextLat,
        longitude: nextLon,
        speed_kmh: speedSlider
      };
    });
  };

  // Cancel / Conclude Emergency
  const handleCancelEmergency = async () => {
    if (!session || !token) return;
    try {
      await fetch(`${API_BASE}/api/v1/emergency/sessions/${session.id}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ reason: "Arrived at hospital destination safely" })
      });
      if (socketRef.current) socketRef.current.close();
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      setSession(null);
      setRoute(null);
      routeRef.current = null;
      setIsConnected(false);
      setIsRealGps(false);
    } catch (err) {
      console.error("Cancel error:", err);
    }
  };

  const confirmOpenGoogleMaps = () => {
    setShowGmapsModal(false);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedHospital.latitude},${selectedHospital.longitude}&travelmode=driving`;
    window.open(url, '_blank');
  };

  if (!token) return null;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#0f172a',
      color: '#f8fafc',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>
      {/* Top Header with Driver Profile & Logout */}
      <header style={{
        padding: '12px 18px',
        backgroundColor: '#1e293b',
        borderBottom: '1px solid #334155',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            backgroundColor: '#f36e20',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff'
          }}>
            <Siren size={20} />
          </div>
          <div>
            <div style={{ fontWeight: '800', fontSize: '15px', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>LifeLane Driver HUD</span>
              <span style={{
                fontSize: '9px',
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: 'rgba(243, 110, 32, 0.2)',
                color: '#f36e20',
                fontWeight: '700',
                textTransform: 'uppercase'
              }}>
                Phase 1 Active
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              {currentUser ? `${currentUser.full_name} (${currentUser.agency || 'Emergency Command'})` : 'Authenticated Driver Terminal'}
            </div>
          </div>
        </div>

        {/* Right side: Status indicator + Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '999px',
            backgroundColor: isConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(148, 163, 184, 0.1)',
            border: isConnected ? '1px solid #10b981' : '1px solid #475569',
            fontSize: '11px',
            fontWeight: '600',
            color: isConnected ? '#10b981' : '#94a3b8'
          }}>
            <Radio size={12} className={isConnected ? "animate-pulse" : ""} />
            <span>{isConnected ? "500ms TELEMETRY LIVE" : "STANDBY"}</span>
          </div>

          <button
            onClick={handleLogout}
            title="Sign Out"
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              backgroundColor: '#334155',
              border: 'none',
              color: '#cbd5e1',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: '600'
            }}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '16px 20px', maxWidth: '640px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {!session ? (
          /* Pre-Mission Setup Screen */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              backgroundColor: '#1e293b',
              padding: '16px',
              borderRadius: '16px',
              border: '1px solid #334155'
            }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>
                Step 1 · Vehicle Assignment
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {VEHICLES.map((v) => (
                  <div
                    key={v.plate}
                    onClick={() => setSelectedVehicle(v)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: selectedVehicle.plate === v.plate ? '2px solid #f36e20' : '1px solid #334155',
                      backgroundColor: selectedVehicle.plate === v.plate ? 'rgba(243, 110, 32, 0.08)' : '#0f172a',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '13px' }}>{v.label}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>Plate: {v.plate} · Category: {v.type}</div>
                    </div>
                    {selectedVehicle.plate === v.plate && (
                      <CheckCircle2 size={18} color="#f36e20" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              backgroundColor: '#1e293b',
              padding: '16px',
              borderRadius: '16px',
              border: '1px solid #334155'
            }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>
                Step 2 · Emergency Hospital Destination
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {HOSPITALS.map((h) => (
                  <div
                    key={h.id}
                    onClick={() => setSelectedHospital(h)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: selectedHospital.id === h.id ? '2px solid #f36e20' : '1px solid #334155',
                      backgroundColor: selectedHospital.id === h.id ? 'rgba(243, 110, 32, 0.08)' : '#0f172a',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '13px' }}>{h.name}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>Est. straight-line: {h.dist_est}</div>
                    </div>
                    {selectedHospital.id === h.id && (
                      <CheckCircle2 size={18} color="#f36e20" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Big Action Button */}
            <button
              onClick={handleStartEmergency}
              disabled={isStarting}
              style={{
                marginTop: '8px',
                padding: '20px',
                borderRadius: '18px',
                backgroundColor: '#f36e20',
                color: '#fff',
                border: 'none',
                fontWeight: '900',
                fontSize: '18px',
                letterSpacing: '0.05em',
                cursor: isStarting ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                boxShadow: '0 10px 30px rgba(243, 110, 32, 0.4)',
                opacity: isStarting ? 0.7 : 1
              }}
            >
              <Siren size={26} />
              <span>{isStarting ? "ESTABLISHING CORRIDOR..." : "START EMERGENCY"}</span>
            </button>

            <div style={{ textAlign: 'center', fontSize: '11px', color: '#64748b' }}>
              Enforces G6 operator approval & anti-spoofing verification before corridor reservation.
            </div>
          </div>
        ) : (
          /* Active Corridor Live HUD Screen */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Mission Info & Destination Banner */}
            <div style={{
              backgroundColor: '#1e293b',
              padding: '12px 16px',
              borderRadius: '16px',
              border: '1px solid #334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '10px', fontWeight: '800', color: '#f36e20', textTransform: 'uppercase' }}>
                  ACTIVE MISSION: {session.session_code}
                </div>
                <div style={{ fontWeight: '700', fontSize: '14px' }}>
                  {selectedHospital.name}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Vehicle: {selectedVehicle.plate} ({selectedVehicle.type})
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>BASELINE ETA</div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#cbd5e1' }}>
                  {Math.round(session.baseline_eta_seconds)}s
                </div>
              </div>
            </div>

            {/* LIVE EMERGENCY NAVIGATION MAP */}
            <NavigationMap
              vehiclePos={vehiclePos}
              route={route}
              destination={{
                latitude: selectedHospital.latitude,
                longitude: selectedHospital.longitude,
                name: selectedHospital.name
              }}
              signals={hudFeedback.next_signals}
              nextInstruction={nextInstruction}
              remainingDistanceM={remainingDistanceM}
              etaS={etaS}
              isRealGps={isRealGps}
              accuracyM={vehiclePos.accuracy_m}
              isOffRoute={isOffRoute}
            />

            {/* Navigation Auxiliary Bar: Real GPS Toggle & Google Maps Fallback */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              flexWrap: 'wrap'
            }}>
              {/* Real GPS Toggle */}
              <button
                onClick={toggleRealGps}
                style={{
                  flex: 1,
                  minWidth: '150px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  backgroundColor: isRealGps ? '#0284c7' : '#1e293b',
                  border: isRealGps ? '1px solid #38bdf8' : '1px solid #334155',
                  color: '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                <LocateFixed size={16} color={isRealGps ? '#ffffff' : '#38bdf8'} />
                <span>{isRealGps ? "REAL GPS ACTIVE" : "USE REAL GPS"}</span>
              </button>

              {/* Google Maps External Fallback Button */}
              <button
                onClick={() => setShowGmapsModal(true)}
                style={{
                  flex: 1,
                  minWidth: '150px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  color: '#cbd5e1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <ExternalLink size={15} color="#94a3b8" />
                <span>Open Google Maps</span>
              </button>
            </div>

            {gpsError && (
              <div style={{
                padding: '8px 12px',
                borderRadius: '10px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #ef4444',
                color: '#fca5a5',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <AlertTriangle size={14} />
                <span>{gpsError}</span>
              </div>
            )}

            {/* Live Time Saved Metric Card */}
            <div style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              padding: '16px',
              borderRadius: '18px',
              border: '1px solid #334155',
              textAlign: 'center'
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(243, 110, 32, 0.1)',
                padding: '3px 8px',
                borderRadius: '999px',
                fontSize: '10px',
                color: '#f36e20',
                fontWeight: '700',
                marginBottom: '6px'
              }}>
                <Sparkles size={11} />
                <span>DYNAMIC TIME SAVED · Simulated estimate</span>
              </div>

              <div style={{ fontSize: '42px', fontWeight: '900', color: '#10b981', lineHeight: 1 }}>
                +{hudFeedback.time_saved_seconds.toFixed(1)}<span style={{ fontSize: '18px' }}>s</span>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                Computed dynamically against unassisted baseline (22 km/h + 35s signal delay)
              </div>
            </div>

            {/* Upcoming Intersections Corridor Status */}
            <div style={{
              backgroundColor: '#1e293b',
              padding: '14px',
              borderRadius: '16px',
              border: '1px solid #334155'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>
                  CORRIDOR SIGNALS (ALONG-ROUTE PRE-EMPTION)
                </span>
                <span style={{ fontSize: '10px', color: '#10b981', fontWeight: '700' }}>
                  {hudFeedback.active_corridor_signals.length} PREEMPTED
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {hudFeedback.next_signals && hudFeedback.next_signals.length > 0 ? (
                  hudFeedback.next_signals.map((sig, idx) => (
                    <div 
                      key={sig.code || sig.intersection_code || idx}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        backgroundColor: '#0f172a',
                        border: sig.is_cleared ? '1px solid #10b981' : '1px solid #334155',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: sig.phase === 'GREEN' ? '#10b981' : (sig.phase.includes('AMBER') ? '#f59e0b' : '#ef4444')
                        }} />
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: '700', color: '#f8fafc' }}>
                            {idx + 1}. {sig.name}
                          </div>
                          <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                            {sig.distance_m}m · ETA {sig.seconds_until_arrival}s
                          </div>
                        </div>
                      </div>

                      <span style={{
                        fontSize: '11px',
                        fontWeight: '800',
                        color: sig.phase === 'GREEN' ? '#10b981' : '#f59e0b'
                      }}>
                        {sig.phase}
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', padding: '10px' }}>
                    Signals synchronized along the approach corridor...
                  </div>
                )}
              </div>
            </div>

            {/* Test Speed Slider (Simulation Tool) */}
            <div style={{
              backgroundColor: '#1e293b',
              padding: '12px 16px',
              borderRadius: '14px',
              border: '1px solid #334155'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '700', color: '#94a3b8' }}>
                <span>SPEED SIMULATOR (ADVANCES ALONG POLYLINE)</span>
                <span>{speedSlider} KM/H</span>
              </div>
              <input 
                type="range"
                min="20"
                max="90"
                value={speedSlider}
                onChange={(e) => setSpeedSlider(parseInt(e.target.value))}
                style={{ width: '100%', marginTop: '6px', accentColor: '#f36e20' }}
              />
            </div>

            {/* Conclude Emergency Button */}
            <button
              onClick={handleCancelEmergency}
              style={{
                marginTop: '4px',
                width: '100%',
                padding: '14px',
                borderRadius: '999px',
                backgroundColor: '#ef4444',
                color: '#fff',
                border: 'none',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              ARRIVED / END EMERGENCY (REVERT SIGNALS)
            </button>
          </div>
        )}
      </div>

      {/* Mandatory Reversion Warning Modal for Google Maps Fallback */}
      {showGmapsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#1e293b',
            border: '1px solid #475569',
            borderRadius: '16px',
            maxWidth: '440px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f59e0b', marginBottom: '12px' }}>
              <AlertTriangle size={24} />
              <div style={{ fontWeight: '800', fontSize: '16px', color: '#f8fafc' }}>
                Telemetry Pause Warning
              </div>
            </div>
            
            <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5, margin: '0 0 16px 0' }}>
              Switching apps will pause LifeLane telemetry. Signals may revert after 3 seconds of inactivity. Keep LifeLane open in split-screen or PIP if your device supports it.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setShowGmapsModal(false)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#334155',
                  border: 'none',
                  color: '#cbd5e1',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmOpenGoogleMaps}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  backgroundColor: '#f36e20',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Proceed to Google Maps
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Status Bar */}
      <footer style={{
        padding: '10px 18px',
        backgroundColor: '#0f172a',
        borderTop: '1px solid #1e293b',
        fontSize: '10px',
        color: '#64748b',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>GPS: {vehiclePos.latitude.toFixed(4)}, {vehiclePos.longitude.toFixed(4)} ({isRealGps ? 'Real device sensor' : 'Route simulator'})</span>
        <span>LifeLane Driver HUD v0.3.0</span>
      </footer>
    </div>
  );
}
