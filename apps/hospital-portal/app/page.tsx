'use client';

import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  Activity,
  AlertTriangle,
  Ambulance,
  Bed,
  CheckCircle2,
  Clock,
  HeartPulse,
  Hospital as HospitalIcon,
  MapPin,
  Phone,
  RefreshCw,
  ShieldAlert,
  User,
  Volume2,
  XCircle,
  Plus,
  Minus,
  Sparkles,
} from 'lucide-react';
import type { Case, Hospital } from '@saathi/shared-types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function HospitalPortal() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('hosp_apollo_jubilee');
  const [cases, setCases] = useState<Case[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  // Play audio alert on new emergency
  const playAlertChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      // Audio context might be restricted before user gesture
    }
  };

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch Hospitals & Cases
  const fetchData = async () => {
    try {
      setLoading(true);
      const [hospRes, casesRes] = await Promise.all([
        fetch(`${API_BASE}/api/hospitals`),
        fetch(`${API_BASE}/api/cases?caseType=MEDICAL`),
      ]);

      const hospData = await hospRes.json();
      const casesData = await casesRes.json();

      if (hospData.success) {
        setHospitals(hospData.data);
      }
      if (casesData.success) {
        setCases(casesData.data);
      }
    } catch (err) {
      console.error('Error fetching portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Socket.io setup
    const socket: Socket = io(API_BASE, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join:room', 'hospital-intake');
      console.log('Connected to SAATHI Real-Time WebSocket server');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Event listeners
    socket.on('hospital:incoming_case', (data: { case: Case }) => {
      playAlertChime();
      showToast(`🚨 Incoming Medical Emergency: ${data.case.title || 'Trauma Incident'}`, 'error');
      setCases((prev) => {
        const exists = prev.some((c) => c.id === data.case.id);
        if (exists) return prev.map((c) => (c.id === data.case.id ? data.case : c));
        return [data.case, ...prev];
      });
    });

    socket.on('case:created', (data: { case: Case }) => {
      if (data.case.caseType === 'MEDICAL') {
        playAlertChime();
        setCases((prev) => [data.case, ...prev.filter((c) => c.id !== data.case.id)]);
      }
    });

    socket.on('case:status_changed', (data: { case: Case }) => {
      if (data.case.caseType === 'MEDICAL') {
        setCases((prev) => prev.map((c) => (c.id === data.case.id ? data.case : c)));
      }
    });

    socket.on('hospital:capacity_updated', (data: { hospital: Hospital }) => {
      setHospitals((prev) => prev.map((h) => (h.id === data.hospital.id ? data.hospital : h)));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const currentHospital = hospitals.find((h) => h.id === selectedHospitalId) || hospitals[0];

  // Actions
  const handleAcceptCase = async (caseItem: Case) => {
    try {
      setActionInProgress(caseItem.id);
      const res = await fetch(`${API_BASE}/api/cases/${caseItem.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'ACTION_COMPLETED',
          actor: currentHospital?.name || 'HOSPITAL_INTAKE',
          reason: `Case accepted by ${currentHospital?.name}. Trauma Bay reserved.`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`✅ Case ${caseItem.id.slice(-6)} Accepted! Bed Reserved & Response Dispatched.`, 'success');
        setCases((prev) => prev.map((c) => (c.id === caseItem.id ? data.data : c)));

        // Decrement available beds by 1 if available
        if (currentHospital && currentHospital.availableBeds > 0) {
          handleUpdateBeds(currentHospital.availableBeds - 1);
        }
      } else {
        showToast(data.error || 'Failed to accept case', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleRequestInfo = async (caseItem: Case) => {
    try {
      setActionInProgress(caseItem.id);
      showToast(`📡 Telemetry & vitals request sent to dispatch team.`, 'info');
      // Call audit or status API
      await fetch(`${API_BASE}/api/audit-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actor: currentHospital?.name || 'HOSPITAL_INTAKE',
          action: 'INFO_REQUESTED',
          caseId: caseItem.id,
          details: { request: 'Continuous ECG & BP telemetry requested' },
        }),
      });
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDeclineCase = async (caseItem: Case) => {
    try {
      setActionInProgress(caseItem.id);
      showToast(`⚠️ Case ${caseItem.id.slice(-6)} declined. Rerouting to next nearest trauma center.`, 'info');
      await fetch(`${API_BASE}/api/audit-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actor: currentHospital?.name || 'HOSPITAL_INTAKE',
          action: 'CASE_DECLINED_REROUTING',
          caseId: caseItem.id,
          details: { hospitalId: selectedHospitalId, reason: 'ICU Capacity constrained' },
        }),
      });
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleUpdateBeds = async (newBedCount: number) => {
    if (!currentHospital) return;
    try {
      const count = Math.max(0, Math.min(currentHospital.capacity, newBedCount));
      const res = await fetch(`${API_BASE}/api/hospitals/${currentHospital.id}/capacity`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availableBeds: count }),
      });
      const data = await res.json();
      if (data.success) {
        setHospitals((prev) => prev.map((h) => (h.id === currentHospital.id ? data.data : h)));
      }
    } catch (err) {
      console.error('Error updating capacity:', err);
    }
  };

  // Demo simulation trigger
  const handleSimulateEmergency = async () => {
    try {
      const symptomsList = [
        ['Acute Angina Pectoris', 'Diaphoresis', 'Tachycardia'],
        ['Compound Femur Fracture', 'Severe Blood Loss'],
        ['Anaphylactic Shock', 'Stridor', 'Hypotension'],
      ];
      const randomIdx = Math.floor(Math.random() * symptomsList.length);
      const chosenSymptoms = symptomsList[randomIdx];

      const res = await fetch(`${API_BASE}/api/cases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseType: 'MEDICAL',
          riskLevel: 'CRITICAL',
          userName: `Patient #${Math.floor(1000 + Math.random() * 9000)}`,
          userPhone: '+9198' + Math.floor(10000000 + Math.random() * 90000000),
          title: `Emergency: ${chosenSymptoms[0]}`,
          description: `Rapid dispatch alert. Patient exhibiting: ${chosenSymptoms.join(', ')}.`,
          location: {
            lat: 17.4325 + (Math.random() - 0.5) * 0.04,
            lng: 78.4071 + (Math.random() - 0.5) * 0.04,
            address: 'HITEC City Metro Junction, Hyderabad',
            city: 'Hyderabad',
          },
          metadata: {
            symptoms: chosenSymptoms,
            spo2: 89 + Math.floor(Math.random() * 8),
            pulse: 105 + Math.floor(Math.random() * 30),
            targetHospitalId: selectedHospitalId,
            estimatedEtaMins: 5 + Math.floor(Math.random() * 8),
          },
          initialAction: {
            actionType: 'AMBULANCE_DISPATCH',
            riskLevel: 'CRITICAL',
            payload: { priority: 'ALS_TRAUMA' },
            requiresApproval: true,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast('🚑 New Emergency Simulated & Dispatched Live!', 'success');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border transition-all duration-300 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
              : toastMessage.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/50 text-rose-200 animate-bounce'
              : 'bg-blue-950/90 border-blue-500/50 text-blue-200'
          }`}
        >
          {toastMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          {toastMessage.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-400" />}
          {toastMessage.type === 'info' && <Volume2 className="w-5 h-5 text-blue-400" />}
          <span className="text-sm font-medium">{toastMessage.text}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-600/30 ring-1 ring-white/20">
              <HeartPulse className="w-7 h-7 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-wider bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  SAATHI
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30">
                  TRAUMA & INTAKE PORTAL
                </span>
              </div>
              <p className="text-xs text-slate-400">TechFusion 2026 • Emergency Response System</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Hospital Selector */}
            <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/60 px-3 py-1.5 rounded-xl">
              <HospitalIcon className="w-4 h-4 text-blue-400" />
              <select
                value={selectedHospitalId}
                onChange={(e) => setSelectedHospitalId(e.target.value)}
                className="bg-transparent text-sm font-medium text-slate-200 focus:outline-none cursor-pointer"
              >
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id} className="bg-slate-900 text-slate-100">
                    {h.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Live WebSocket Status */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-xs">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isConnected ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-rose-400 shadow-[0_0_8px_#f87171]'
                }`}
              />
              <span className="text-slate-300 font-medium">{isConnected ? 'LIVE SYNC' : 'OFFLINE'}</span>
            </div>

            {/* Simulate Button */}
            <button
              onClick={handleSimulateEmergency}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-bold tracking-wide shadow-lg shadow-rose-600/30 active:scale-95 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              + Simulate Emergency
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Capacity & Hospital Status Overview */}
        {currentHospital && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-blue-500 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Hospital Facility</p>
                <h3 className="text-lg font-bold text-white mt-1 truncate max-w-[200px]">{currentHospital.name}</h3>
                <p className="text-xs text-blue-400 mt-1 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {currentHospital.contactPhone}
                </p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                <HospitalIcon className="w-6 h-6" />
              </div>
            </div>

            {/* Available Emergency Beds */}
            <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-emerald-500 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Available Emergency Beds</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-emerald-400">{currentHospital.availableBeds}</span>
                  <span className="text-xs text-slate-400 font-medium">/ {currentHospital.capacity} total</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => handleUpdateBeds(currentHospital.availableBeds - 1)}
                    className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300"
                    title="Reserve Bed"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleUpdateBeds(currentHospital.availableBeds + 1)}
                    className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300"
                    title="Release Bed"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                <Bed className="w-6 h-6" />
              </div>
            </div>

            {/* Active Trauma Cases */}
            <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-amber-500 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Active Medical Cases</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-amber-400">{cases.length}</span>
                  <span className="text-xs text-slate-400 font-medium">in triage stream</span>
                </div>
                <p className="text-xs text-amber-300/80 mt-1">
                  {cases.filter((c) => c.status === 'CREATED' || c.status === 'AWAITING_USER').length} awaiting admission
                </p>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
                <Activity className="w-6 h-6" />
              </div>
            </div>

            {/* Critical Response Status */}
            <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-rose-500 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Trauma Center Status</p>
                <h3 className="text-lg font-bold text-rose-400 mt-1 flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                  </span>
                  LEVEL-1 READY
                </h3>
                <p className="text-xs text-slate-400 mt-1">Cath Lab & Neuro OT Standby</p>
              </div>
              <div className="p-3 bg-rose-500/10 rounded-xl text-rose-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
            </div>
          </div>
        )}

        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Ambulance className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Live Emergency Case Stream</h2>
              <p className="text-xs text-slate-400">Real-time incoming ambulance dispatches and hospital triage queue</p>
            </div>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-xs font-semibold text-slate-300 border border-slate-700/60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Emergency Case Cards List */}
        {cases.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl text-center">
            <HeartPulse className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h4 className="text-lg font-bold text-slate-300">No Active Emergency Cases in Queue</h4>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              All incoming trauma cases have been accepted or resolved. Click "Simulate Emergency" to trigger a live test.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {cases.map((caseItem) => {
              const isCritical = caseItem.riskLevel === 'CRITICAL';
              const isAccepted = caseItem.status === 'ACTION_COMPLETED' || caseItem.status === 'RESOLVED';
              const isExecuting = caseItem.status === 'ACTION_EXECUTING';
              const symptoms = caseItem.metadata?.symptoms || ['Emergency Medical Assistance Required'];
              const spo2 = caseItem.metadata?.spo2;
              const pulse = caseItem.metadata?.pulse;

              return (
                <div
                  key={caseItem.id}
                  className={`rounded-3xl p-6 transition-all duration-300 relative overflow-hidden ${
                    isCritical && !isAccepted
                      ? 'glass-panel-critical ring-1 ring-rose-500/50'
                      : isAccepted
                      ? 'glass-panel border border-emerald-500/30'
                      : 'glass-panel-glow'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${
                          isCritical
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        }`}
                      >
                        <HeartPulse className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-white">{caseItem.title || 'Medical Emergency'}</h3>
                          <span
                            className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${
                              isCritical
                                ? 'bg-rose-600 text-white animate-pulse'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {caseItem.riskLevel}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-500" /> Case ID: {caseItem.id.slice(-8)} •{' '}
                          {new Date(caseItem.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-xl border ${
                        isAccepted
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : isExecuting
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 animate-pulse'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {caseItem.status}
                    </span>
                  </div>

                  {/* Patient Info & Vitals */}
                  <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Patient</p>
                      <p className="text-xs font-bold text-slate-200 mt-0.5 flex items-center gap-1">
                        <User className="w-3 h-3 text-blue-400" />
                        {caseItem.user?.name || 'Emergency Caller'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{caseItem.user?.phone || 'Direct SOS'}</p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Location / ETA</p>
                      <p className="text-xs font-bold text-slate-200 mt-0.5 flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-rose-400" />
                        {caseItem.location.landmark || caseItem.location.city || 'Hyderabad'}
                      </p>
                      <p className="text-[11px] text-emerald-400 font-semibold mt-0.5">
                        ETA: ~{caseItem.metadata?.estimatedEtaMins || 6} mins
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Triage Vitals</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {spo2 && (
                          <span className="text-[11px] font-bold text-slate-200 bg-slate-800/90 px-2 py-0.5 rounded-md border border-slate-700">
                            SpO2: <span className={spo2 < 92 ? 'text-rose-400' : 'text-emerald-400'}>{spo2}%</span>
                          </span>
                        )}
                        {pulse && (
                          <span className="text-[11px] font-bold text-slate-200 bg-slate-800/90 px-2 py-0.5 rounded-md border border-slate-700">
                            HR: <span className="text-amber-400">{pulse} bpm</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Symptoms Tags */}
                  <div className="mt-4">
                    <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-1.5">
                      Reported Symptoms & Conditions:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {symptoms.map((symptom: string, i: number) => (
                        <span
                          key={i}
                          className="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-800/70 border border-slate-700/60 text-slate-300"
                        >
                          {symptom}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRequestInfo(caseItem)}
                        disabled={actionInProgress === caseItem.id}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700/80 transition-all flex items-center gap-1.5"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                        Request Info
                      </button>

                      <button
                        onClick={() => handleDeclineCase(caseItem)}
                        disabled={actionInProgress === caseItem.id}
                        className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 text-xs font-semibold border border-slate-800 transition-all flex items-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Decline
                      </button>
                    </div>

                    <button
                      onClick={() => handleAcceptCase(caseItem)}
                      disabled={actionInProgress === caseItem.id || isAccepted}
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide shadow-lg transition-all flex items-center gap-2 ${
                        isAccepted
                          ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 cursor-default'
                          : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30 active:scale-95'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {isAccepted ? 'Case Accepted & Bed Reserved' : 'Accept Case'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
