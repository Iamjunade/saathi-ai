'use client';

import React, { useState } from 'react';
import {
  MapPin,
  Ambulance,
  Flame,
  Building2,
  ShieldAlert,
  Hospital as HospitalIcon,
  Navigation,
  ZoomIn,
  ZoomOut,
  Layers,
  Activity,
  Crosshair,
} from 'lucide-react';
import type { Case, Hospital, CaseType } from '@saathi/shared-types';

interface IncidentMapProps {
  cases: Case[];
  hospitals: Hospital[];
  selectedCaseId?: string | null;
  onSelectCase: (caseItem: Case) => void;
  filterType: string;
}

export default function IncidentMap({
  cases,
  hospitals,
  selectedCaseId,
  onSelectCase,
  filterType,
}: IncidentMapProps) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showHospitals, setShowHospitals] = useState(true);

  // Map Bounds for Hyderabad Metro area (Lat 17.38 - 17.48, Lng 78.36 - 78.53)
  const MAP_BOUNDS = {
    minLat: 17.37,
    maxLat: 17.48,
    minLng: 78.36,
    maxLng: 78.54,
  };

  // Convert lat/lng to percentage X/Y
  const getCoordinatesPct = (lat: number, lng: number) => {
    const clampedLat = Math.max(MAP_BOUNDS.minLat, Math.min(MAP_BOUNDS.maxLat, lat));
    const clampedLng = Math.max(MAP_BOUNDS.minLng, Math.min(MAP_BOUNDS.maxLng, lng));

    const x = ((clampedLng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) * 100;
    const y = (1 - (clampedLat - MAP_BOUNDS.minLat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * 100;

    return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
  };

  const filteredCases = cases.filter((c) => {
    if (filterType !== 'ALL' && c.caseType !== filterType) return false;
    return true;
  });

  const getCaseTypeIcon = (type: CaseType) => {
    switch (type) {
      case 'MEDICAL':
        return <Ambulance className="w-4 h-4 text-rose-300" />;
      case 'DISASTER':
        return <Flame className="w-4 h-4 text-amber-300" />;
      case 'CIVIC':
        return <Building2 className="w-4 h-4 text-blue-300" />;
      default:
        return <ShieldAlert className="w-4 h-4 text-purple-300" />;
    }
  };

  const getMarkerColor = (type: CaseType, risk: string) => {
    if (risk === 'CRITICAL') return 'bg-rose-600 shadow-[0_0_20px_#e11d48] border-rose-300';
    if (type === 'MEDICAL') return 'bg-rose-500 shadow-[0_0_15px_#f43f5e] border-rose-300';
    if (type === 'DISASTER') return 'bg-amber-500 shadow-[0_0_15px_#f59e0b] border-amber-300';
    if (type === 'CIVIC') return 'bg-blue-500 shadow-[0_0_15px_#3b82f6] border-blue-300';
    return 'bg-purple-500 shadow-[0_0_15px_#a855f7] border-purple-300';
  };

  return (
    <div className="relative w-full h-[520px] rounded-3xl overflow-hidden glass-panel border border-slate-700/60 shadow-2xl">
      {/* High-Tech Tactical Grid Background */}
      <div className="absolute inset-0 bg-[#060b17] overflow-hidden">
        {/* Subtle grid lines */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              'linear-gradient(to right, #3b82f6 1px, transparent 1px), linear-gradient(to bottom, #3b82f6 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Tactical Radar Ring Sweeper */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-blue-500/10 pointer-events-none">
          <div className="absolute inset-8 rounded-full border border-blue-500/15" />
          <div className="absolute inset-28 rounded-full border border-blue-500/20" />
          <div className="absolute inset-48 rounded-full border border-blue-500/25" />
          <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-blue-500/20" />
          <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-blue-500/20" />
        </div>

        {/* Sector Labels */}
        <div className="absolute top-4 left-6 text-[10px] font-mono text-blue-400/60 tracking-widest uppercase">
          SECTOR: HYD-METRO • LAT 17.40N • LNG 78.45E
        </div>
        <div className="absolute bottom-4 left-6 text-[10px] font-mono text-emerald-400/70 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          LIVE GPS TELEMETRY ACTIVE
        </div>
      </div>

      {/* Map Control Tools */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/80 shadow-lg">
        <button
          onClick={() => setShowHospitals(!showHospitals)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            showHospitals
              ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <HospitalIcon className="w-3.5 h-3.5" />
          Hospitals ({hospitals.length})
        </button>

        <div className="h-4 w-[1px] bg-slate-700 mx-1" />

        <button
          onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.1))}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.1))}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
      </div>

      {/* Map Content Layer with Scale */}
      <div
        className="relative w-full h-full transition-transform duration-300"
        style={{ transform: `scale(${zoomLevel})` }}
      >
        {/* Hospital Markers */}
        {showHospitals &&
          hospitals.map((hosp) => {
            const { x, y } = getCoordinatesPct(hosp.lat, hosp.lng);
            return (
              <div
                key={hosp.id}
                style={{ left: `${x}%`, top: `${y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-10 group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-slate-900/90 border border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.3)] flex items-center justify-center text-emerald-400 hover:scale-125 transition-all">
                  <HospitalIcon className="w-4 h-4" />
                </div>

                {/* Hover Tooltip */}
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-30 w-48 p-2.5 rounded-xl bg-slate-950/95 border border-emerald-500/40 shadow-2xl text-xs pointer-events-none">
                  <p className="font-bold text-white truncate">{hosp.name}</p>
                  <p className="text-[11px] text-emerald-400 mt-0.5">
                    Available Beds: <span className="font-bold">{hosp.availableBeds}</span> / {hosp.capacity}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">{hosp.contactPhone}</p>
                </div>
              </div>
            );
          })}

        {/* Case Incident Markers */}
        {filteredCases.map((caseItem) => {
          const { x, y } = getCoordinatesPct(caseItem.location.lat, caseItem.location.lng);
          const isSelected = selectedCaseId === caseItem.id;
          const isCritical = caseItem.riskLevel === 'CRITICAL';

          return (
            <div
              key={caseItem.id}
              style={{ left: `${x}%`, top: `${y}%` }}
              onClick={() => onSelectCase(caseItem)}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group cursor-pointer"
            >
              {/* Concentric Pulse Rings for Critical & High Risk */}
              {isCritical && (
                <div className="absolute inset-0 -m-3 rounded-full bg-rose-500/30 animate-ping pointer-events-none" />
              )}
              {isSelected && (
                <div className="absolute inset-0 -m-4 rounded-full border-2 border-dashed border-blue-400 animate-spin pointer-events-none" />
              )}

              {/* Marker Icon Pin */}
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 ${getMarkerColor(
                  caseItem.caseType,
                  caseItem.riskLevel
                )} ${isSelected ? 'scale-125 ring-4 ring-white/40' : 'hover:scale-115'}`}
              >
                {getCaseTypeIcon(caseItem.caseType)}
              </div>

              {/* Hover/Selected Card Tooltip */}
              <div
                className={`absolute left-1/2 -translate-x-1/2 bottom-full mb-3 z-30 w-60 p-3 rounded-2xl bg-slate-950/95 border shadow-2xl text-xs transition-all pointer-events-none ${
                  isSelected
                    ? 'block border-blue-400 ring-2 ring-blue-500/30'
                    : 'hidden group-hover:block border-slate-700/80'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                    {caseItem.caseType}
                  </span>
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                      isCritical ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {caseItem.riskLevel}
                  </span>
                </div>

                <h4 className="font-bold text-white text-xs line-clamp-1">{caseItem.title || 'Emergency Case'}</h4>
                <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                  <span className="truncate">{caseItem.location.address || 'Hyderabad Region'}</span>
                </p>

                <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Status:</span>
                  <span className="text-[10px] font-bold text-blue-400">{caseItem.status}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Map Legend Footer */}
      <div className="absolute bottom-3 right-4 z-20 flex items-center gap-3 bg-slate-950/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-800/80 text-[11px]">
        <div className="flex items-center gap-1.5 text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_6px_#f43f5e]" /> Medical
        </div>
        <div className="flex items-center gap-1.5 text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_6px_#f59e0b]" /> Disaster
        </div>
        <div className="flex items-center gap-1.5 text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_6px_#3b82f6]" /> Civic
        </div>
        <div className="flex items-center gap-1.5 text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" /> Hospital
        </div>
      </div>
    </div>
  );
}
