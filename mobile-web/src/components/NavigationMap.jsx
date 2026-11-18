import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Compass, Navigation, AlertCircle, ExternalLink, ShieldAlert } from 'lucide-react';
import { createTileLayer } from '../config/map';

export default function NavigationMap({
  vehiclePos,
  route,
  destination,
  signals = [],
  nextInstruction = "Proceed to destination",
  remainingDistanceM = 0,
  etaS = 0,
  isRealGps = false,
  accuracyM = 5,
  isOffRoute = false,
  onRecenter
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const vehicleMarkerRef = useRef(null);
  const accuracyCircleRef = useRef(null);
  const routePolylineRef = useRef(null);
  const destinationMarkerRef = useRef(null);
  const signalMarkersRef = useRef({});
  const [userInteracted, setUserInteracted] = useState(false);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = vehiclePos?.latitude || 12.9320;
    const initialLon = vehiclePos?.longitude || 77.6180;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLon],
      zoom: 15,
      zoomControl: false,
      attributionControl: true
    });
    if (map.attributionControl) {
      map.attributionControl.setPrefix(false);
    }

    // MapTiler streets-v2 basemap with OSM fallback
    createTileLayer('streets-v2').addTo(map);

    map.on('dragstart', () => setUserInteracted(true));
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Route Polyline & Destination
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // 1. Draw Route Polyline
    if (route && route.polyline && route.polyline.length >= 2) {
      // Polyline coordinates in OSRM are [lon, lat], Leaflet expects [lat, lon]
      const latLngs = route.polyline.map(coord => [coord[1], coord[0]]);

      if (routePolylineRef.current) {
        routePolylineRef.current.setLatLngs(latLngs);
        routePolylineRef.current.setStyle({
          color: route.route_source === 'fallback_straight_line' ? '#f59e0b' : '#10b981',
          dashArray: route.route_source === 'fallback_straight_line' ? '6, 8' : null
        });
      } else {
        const poly = L.polyline(latLngs, {
          color: route.route_source === 'fallback_straight_line' ? '#f59e0b' : '#10b981',
          weight: 6,
          opacity: 0.85,
          dashArray: route.route_source === 'fallback_straight_line' ? '6, 8' : null
        }).addTo(map);
        routePolylineRef.current = poly;
      }

      // Initial fit to route if not yet interacted
      if (!userInteracted) {
        map.fitBounds(L.latLngBounds(latLngs), { padding: [40, 40] });
      }
    }

    // 2. Draw Destination Marker
    if (destination && destination.latitude && destination.longitude) {
      const destLatLng = [destination.latitude, destination.longitude];
      const destIcon = L.divIcon({
        className: 'custom-dest-marker',
        html: `
          <div style="
            background: #ef4444;
            color: #ffffff;
            width: 32px;
            height: 32px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.6);
            border: 2px solid #ffffff;
          ">
            <span style="transform: rotate(45deg); font-weight: 900; font-size: 16px;">+</span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      });

      if (destinationMarkerRef.current) {
        destinationMarkerRef.current.setLatLng(destLatLng);
      } else {
        const marker = L.marker(destLatLng, { icon: destIcon }).addTo(map);
        marker.bindPopup(`<b>${destination.name || 'Emergency Destination'}</b>`);
        destinationMarkerRef.current = marker;
      }
    }
  }, [route, destination]);

  // Update Vehicle Position & Heading
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !vehiclePos) return;

    const latLng = [vehiclePos.latitude, vehiclePos.longitude];
    const heading = vehiclePos.heading_deg || 0;

    const vehicleIcon = L.divIcon({
      className: 'custom-vehicle-marker',
      html: `
        <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
          <div style="
            position: absolute;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: rgba(243, 110, 32, 0.25);
            animation: pulse 1.5s infinite;
          "></div>
          <div style="
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: #f36e20;
            border: 3px solid #ffffff;
            box-shadow: 0 2px 8px rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            transform: rotate(${heading}deg);
          ">
            <div style="
              width: 0;
              height: 0;
              border-left: 5px solid transparent;
              border-right: 5px solid transparent;
              border-bottom: 9px solid #ffffff;
              transform: translateY(-2px);
            "></div>
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    if (vehicleMarkerRef.current) {
      vehicleMarkerRef.current.setLatLng(latLng);
      vehicleMarkerRef.current.setIcon(vehicleIcon);
    } else {
      const marker = L.marker(latLng, { icon: vehicleIcon, zIndexOffset: 1000 }).addTo(map);
      vehicleMarkerRef.current = marker;
    }

    // Accuracy Circle when using Real GPS
    if (isRealGps && accuracyM) {
      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.setLatLng(latLng);
        accuracyCircleRef.current.setRadius(accuracyM);
      } else {
        const circle = L.circle(latLng, {
          radius: accuracyM,
          color: '#38bdf8',
          fillColor: '#38bdf8',
          fillOpacity: 0.15,
          weight: 1
        }).addTo(map);
        accuracyCircleRef.current = circle;
      }
    } else if (accuracyCircleRef.current) {
      accuracyCircleRef.current.remove();
      accuracyCircleRef.current = null;
    }

    if (!userInteracted) {
      map.panTo(latLng, { animate: true, duration: 0.5 });
    }
  }, [vehiclePos, isRealGps, accuracyM, userInteracted]);

  // Update Signals Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !signals) return;

    const currentCodes = new Set();

    signals.forEach((sig) => {
      const code = sig.code || sig.intersection_code;
      if (!code || !sig.latitude || !sig.longitude) return;
      currentCodes.add(code);

      const isGreen = sig.phase === 'GREEN';
      const isAmber = (sig.phase || '').includes('AMBER');
      const isRed = sig.phase === 'RED';
      const bgColor = isGreen ? '#10b981' : isAmber ? '#f59e0b' : isRed ? '#ef4444' : '#64748b';

      const sigIcon = L.divIcon({
        className: 'custom-sig-marker',
        html: `
          <div style="
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: ${bgColor};
            border: 2px solid #ffffff;
            box-shadow: 0 0 10px ${bgColor};
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-size: 9px;
            font-weight: 800;
          ">
            ${isGreen ? '✓' : ''}
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      if (signalMarkersRef.current[code]) {
        signalMarkersRef.current[code].setLatLng([sig.latitude, sig.longitude]);
        signalMarkersRef.current[code].setIcon(sigIcon);
      } else {
        const marker = L.marker([sig.latitude, sig.longitude], { icon: sigIcon }).addTo(map);
        marker.bindPopup(`<b>${sig.name || code}</b><br/>Status: <b>${sig.phase}</b>`);
        signalMarkersRef.current[code] = marker;
      }
    });

    // Remove markers that are no longer in signals
    Object.keys(signalMarkersRef.current).forEach((code) => {
      if (!currentCodes.has(code)) {
        signalMarkersRef.current[code].remove();
        delete signalMarkersRef.current[code];
      }
    });
  }, [signals]);

  // Recenter handler
  const handleRecenter = () => {
    setUserInteracted(false);
    if (mapInstanceRef.current && vehiclePos) {
      mapInstanceRef.current.setView([vehiclePos.latitude, vehiclePos.longitude], 16, { animate: true });
    }
    if (onRecenter) onRecenter();
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '360px', borderRadius: '18px', overflow: 'hidden', border: '1px solid #334155' }}>
      {/* Map DOM Container */}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%', backgroundColor: '#0b1120' }} />

      {/* Turn-by-Turn Instruction Banner */}
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        right: '12px',
        zIndex: 500,
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        backdropFilter: 'blur(8px)',
        border: '1px solid #334155',
        borderRadius: '12px',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <div style={{
            backgroundColor: '#10b981',
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            flexShrink: 0
          }}>
            <Navigation size={18} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: '13px',
              fontWeight: '700',
              color: '#f8fafc',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {nextInstruction}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              {remainingDistanceM >= 1000
                ? `${(remainingDistanceM / 1000).toFixed(1)} km remaining`
                : `${Math.round(remainingDistanceM)} m remaining`} · ETA {Math.round(etaS)}s
            </div>
          </div>
        </div>

        {isOffRoute && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid #ef4444',
            borderRadius: '6px',
            fontSize: '10px',
            color: '#ef4444',
            fontWeight: '700',
            flexShrink: 0
          }}>
            <AlertCircle size={12} />
            <span>REROUTING</span>
          </div>
        )}
      </div>

      {/* Honest Badges Overlay (Bottom Left) */}
      <div style={{
        position: 'absolute',
        bottom: '12px',
        left: '12px',
        zIndex: 500,
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        <div style={{
          fontSize: '9px',
          padding: '3px 8px',
          borderRadius: '4px',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(4px)',
          border: '1px solid #334155',
          color: '#94a3b8',
          fontWeight: '600'
        }}>
          Free-flow routing; live traffic not included
        </div>
        {route?.route_source === 'fallback_straight_line' && (
          <div style={{
            fontSize: '9px',
            padding: '3px 8px',
            borderRadius: '4px',
            backgroundColor: 'rgba(245, 158, 11, 0.2)',
            border: '1px solid #f59e0b',
            color: '#f59e0b',
            fontWeight: '700'
          }}>
            Simulated route (Straight-line fallback)
          </div>
        )}
      </div>

      {/* Recenter Button (Bottom Right) */}
      <button
        onClick={handleRecenter}
        title="Recenter Map"
        style={{
          position: 'absolute',
          bottom: '12px',
          right: '12px',
          zIndex: 500,
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          backgroundColor: '#1e293b',
          border: '1px solid #475569',
          color: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
        }}
      >
        <Compass size={20} color="#f36e20" />
      </button>
    </div>
  );
}
