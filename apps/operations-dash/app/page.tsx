'use client';

import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  Ambulance,
  Building2,
  CheckCircle2,
  Clock,
  Compass,
  FileText,
  Flame,
  Globe,
  Layers,
  MapPin,
  Phone,
  Radio,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  Sparkles,
  User,
  Users,
  X,
  Zap,
} from 'lucide-react';
import type { Case, Hospital, AuditLog, CaseType, CaseStatus } from '@saathi/shared-types';
import IncidentMap from '../components/IncidentMap';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function OperationsDashboard() {
  const [cases, setCases] = useState<Case[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch initial telemetry
  const fetchData = async () => {
    try {
      setLoading(true);
      const [casesRes, hospRes, auditRes] = await Promise.all([
        fetch(`${API_BASE}/api/cases`),
        fetch(`${API_BASE}/api/hospitals`),
        fetch(`${API_BASE}/api/audit-logs?limit=40`),
      ]);

      const casesData = await casesRes.json();
      const hospData = await hospRes.json();
      const auditData = await auditRes.json();

      if (casesData.success) setCases(casesData.data);
      if (hospData.success) setHospitals(hospData.data);
      if (auditData.success) setAuditLogs(auditData.data);
    } catch (err) {
      console.error('Error fetching ops data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Socket.io Real-Time Stream
    const socket: Socket = io(API_BASE, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join:room', 'ops-dashboard');
      console.log('Connected to SAATHI Operations WebSocket Stream');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('case:created', (data: { case: Case }) => {
      showToast(`🚨 New Incident Registered: ${data.case.title || data.case.caseType}`, 'info');
      setCases((prev) => [data.case, ...prev.filter((c) => c.id !== data.case.id)]);
    });

    socket.on('case:status_changed', (data: { case: Case; newStatus: CaseStatus; actor: string }) => {
      showToast(`🔄 Case ${data.case.id.slice(-6)} moved to ${data.newStatus} by ${data.actor}`, 'info');
      setCases((prev) => prev.map((c) => (c.id === data.case.id ? data.case : c)));
      if (selectedCase && selectedCase.id === data.case.id) {
        setSelectedCase(data.case);
      }
    });

    socket.on('action:approved', (data: { actionId: string; caseId: string }) => {
      fetchData();
    });

    socket.on('audit:logged', (data: { log: AuditLog }) => {
      setAuditLogs((prev) => [data.log, ...prev.slice(0, 50)]);
    });

    socket.on('hospital:capacity_updated', (data: { hospital: Hospital }) => {
      setHospitals((prev) => prev.map((h) => (h.id === data.hospital.id ? data.hospital : h)));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Quick State Transition from Ops Dashboard
  const handleTransitionStatus = async (caseId: string, nextStatus: CaseStatus) => {
    try {
      const res = await fetch(`${API_BASE}/api/cases/${caseId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          actor: 'OPS_DISPATCHER',
          reason: `Dispatched from Operations Command Center`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Case status transitioned to ${nextStatus}`, 'success');
        setCases((prev) => prev.map((c) => (c.id === caseId ? data.data : c)));
        if (selectedCase && selectedCase.id === caseId) {
          setSelectedCase(data.data);
        }
      } else {
        showToast(data.error || 'Transition failed', 'error');
      }
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  // Simulate Multi-Type Incidents
  const handleSimulateDisaster = async (type: CaseType = 'DISASTER') => {
    try {
      const scenarios = {
        DISASTER: {
          title: 'Urban Flash Flood & Road Collapse',
          desc: 'Sudden cloudburst caused 4ft water accumulation. Multiple vehicles stranded near underpass.',
          risk: 'HIGH',
          coords: { lat: 17.4421, lng: 78.4912 },
          action: 'DISASTER_EVACUATION',
        },
        CIVIC: {
          title: 'Damaged High Voltage Transformer & Cable Sparking',
          desc: 'High tension cable snapped over main commercial walkway. High risk of electrocution.',
          risk: 'CRITICAL',
          coords: { lat: 17.4198, lng: 78.4411 },
          action: 'CIVIC_TICKET_ESCALATION',
        },
        MEDICAL: {
          title: 'Multi-Vehicle Highway Collision with Trapped Victims',
          desc: '3-car pileup on Outer Ring Road. 2 passengers critically injured.',
          risk: 'CRITICAL',
          coords: { lat: 17.4325, lng: 78.4071 },
          action: 'AMBULANCE_DISPATCH',
        },
      };

      const scenario = scenarios[type as keyof typeof scenarios] || scenarios.DISASTER;

      const res = await fetch(`${API_BASE}/api/cases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseType: type,
          riskLevel: scenario.risk,
          userName: `Citizen Dispatcher #${Math.floor(100 + Math.random() * 900)}`,
          userPhone: '+9198' + Math.floor(10000000 + Math.random() * 90000000),
          title: scenario.title,
          description: scenario.desc,
          location: {
            lat: scenario.coords.lat + (Math.random() - 0.5) * 0.03,
            lng: scenario.coords.lng + (Math.random() - 0.5) * 0.03,
            address: 'Secunderabad - Begumpet Corridor',
            city: 'Hyderabad',
          },
          initialAction: {
            actionType: scenario.action,
            riskLevel: scenario.risk,
            requiresApproval: true,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`⚡ Incident (${type}) Created & Broadcaster Triggered!`, 'success');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filtered cases
  const filteredCases = cases.filter((c) => {
    if (filterType !== 'ALL' && c.caseType !== filterType) return false;
    if (filterStatus !== 'ALL' && c.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = c.title?.toLowerCase().includes(q);
      const matchUser = c.user?.name?.toLowerCase().includes(q);
      const matchLoc = c.location.address?.toLowerCase().includes(q);
      const matchId = c.id.toLowerCase().includes(q);
      if (!matchTitle && !matchUser && !matchLoc && !matchId) return false;
    }
    return true;
  });

  const criticalCount = cases.filter((c) => c.riskLevel === 'CRITICAL' && c.status !== 'RESOLVED').length;
  const activeCount = cases.filter((c) => c.status !== 'RESOLVED').length;
  const totalBeds = hospitals.reduce((acc, h) => acc + h.availableBeds, 0);

  return (
    <div className="min-h-screen pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border transition-all duration-300 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
              : toastMessage.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
              : 'bg-blue-950/90 border-blue-500/50 text-blue-200'
          }`}
        >
          {toastMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          {toastMessage.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-400" />}
          {toastMessage.type === 'info' && <Radio className="w-5 h-5 text-blue-400 animate-pulse" />}
          <span className="text-sm font-medium">{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-600/30 ring-1 ring-white/20">
              <Compass className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-wider bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  SAATHI OPS
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">
                  COMMAND CENTER
                </span>
              </div>
              <p className="text-xs text-slate-400">TechFusion 2026 • Emergency Response & State Machine</p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-3">
            {/* Live WebSocket Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-xs">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isConnected ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-rose-400 shadow-[0_0_8px_#f87171]'
                }`}
              />
              <span className="text-slate-300 font-medium">{isConnected ? 'SOCKET STREAM ACTIVE' : 'OFFLINE'}</span>
            </div>

            {/* Quick Scenario Simulators */}
            <div className="hidden md:flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => handleSimulateDisaster('MEDICAL')}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/50 transition-all"
              >
                + Medical
              </button>
              <button
                onClick={() => handleSimulateDisaster('DISASTER')}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-800/50 transition-all"
              >
                + Disaster
              </button>
              <button
                onClick={() => handleSimulateDisaster('CIVIC')}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 border border-blue-800/50 transition-all"
              >
                + Civic
              </button>
            </div>

            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-blue-500">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Active Incidents</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-white">{activeCount}</span>
              <span className="text-xs text-slate-400 font-medium">/ {cases.length} total</span>
            </div>
            <p className="text-xs text-blue-400 mt-2 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" /> Real-time state tracking
            </p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-rose-500">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Critical Red-Alerts</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-rose-400">{criticalCount}</span>
              <span className="text-xs text-rose-300/80 font-medium">requiring dispatch</span>
            </div>
            <p className="text-xs text-rose-400 mt-2 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> High priority triage
            </p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-emerald-500">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Hospital Bed Capacity</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-emerald-400">{totalBeds}</span>
              <span className="text-xs text-slate-400 font-medium">beds across {hospitals.length} centers</span>
            </div>
            <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Live telemetry connected
            </p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-purple-500">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Avg AI Triage Time</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-purple-400">1.4s</span>
              <span className="text-xs text-slate-400 font-medium">decision latency</span>
            </div>
            <p className="text-xs text-purple-400 mt-2 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" /> Sub-second state engine
            </p>
          </div>
        </div>

        {/* Tactical Map View */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-bold text-white">Live Tactical Incident Map</h2>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
              {['ALL', 'MEDICAL', 'DISASTER', 'CIVIC'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    filterType === type
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <IncidentMap
            cases={cases}
            hospitals={hospitals}
            selectedCaseId={selectedCase?.id}
            onSelectCase={(c) => setSelectedCase(c)}
            filterType={filterType}
          />
        </div>

        {/* Two-Column Grid: Active Cases Table & Live Audit Trail */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Cases Grid (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  Active Incident Grid & State Engine
                </h3>
                <p className="text-xs text-slate-400">Click any incident to inspect lifecycle or transition state</p>
              </div>

              {/* Status Filters & Search */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search cases..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-slate-900/90 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-300 focus:outline-none"
                >
                  <option value="ALL">All States</option>
                  <option value="CREATED">CREATED</option>
                  <option value="ASSESSING">ASSESSING</option>
                  <option value="AWAITING_USER">AWAITING_USER</option>
                  <option value="AUTHORIZED">AUTHORIZED</option>
                  <option value="ACTION_EXECUTING">ACTION_EXECUTING</option>
                  <option value="ACTION_COMPLETED">ACTION_COMPLETED</option>
                  <option value="RESOLVED">RESOLVED</option>
                </select>
              </div>
            </div>

            {/* Cases Table */}
            <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Incident / Type</th>
                      <th className="px-4 py-3">Location</th>
                      <th className="px-4 py-3">Risk</th>
                      <th className="px-4 py-3">State</th>
                      <th className="px-4 py-3 text-right">Quick Transition</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {filteredCases.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                          No incidents matching filters.
                        </td>
                      </tr>
                    ) : (
                      filteredCases.map((caseItem) => {
                        const isSelected = selectedCase?.id === caseItem.id;
                        return (
                          <tr
                            key={caseItem.id}
                            onClick={() => setSelectedCase(caseItem)}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? 'bg-blue-900/30' : 'hover:bg-slate-800/40'
                            }`}
                          >
                            <td className="px-4 py-3.5">
                              <div className="font-bold text-white text-xs">{caseItem.title || 'Emergency Case'}</div>
                              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                                #{caseItem.id.slice(-6)} • {caseItem.caseType}
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="text-slate-300 truncate max-w-[150px]">
                                {caseItem.location.landmark || caseItem.location.address || 'Hyderabad'}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {new Date(caseItem.createdAt).toLocaleTimeString()}
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <span
                                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                  caseItem.riskLevel === 'CRITICAL'
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                    : caseItem.riskLevel === 'HIGH'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                }`}
                              >
                                {caseItem.riskLevel}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <span
                                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
                                  caseItem.status === 'RESOLVED'
                                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                    : caseItem.status === 'ACTION_EXECUTING' || caseItem.status === 'AUTHORIZED'
                                    ? 'bg-blue-500/15 text-blue-300 border-blue-500/30 animate-pulse'
                                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                }`}
                              >
                                {caseItem.status}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                              {caseItem.status === 'AWAITING_USER' && (
                                <button
                                  onClick={() => handleTransitionStatus(caseItem.id, 'AUTHORIZED')}
                                  className="px-2 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold"
                                >
                                  Authorize
                                </button>
                              )}
                              {caseItem.status === 'AUTHORIZED' && (
                                <button
                                  onClick={() => handleTransitionStatus(caseItem.id, 'ACTION_EXECUTING')}
                                  className="px-2 py-1 rounded-md bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold"
                                >
                                  Execute
                                </button>
                              )}
                              {caseItem.status === 'ACTION_EXECUTING' && (
                                <button
                                  onClick={() => handleTransitionStatus(caseItem.id, 'ACTION_COMPLETED')}
                                  className="px-2 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold"
                                >
                                  Complete
                                </button>
                              )}
                              {caseItem.status === 'ACTION_COMPLETED' && (
                                <button
                                  onClick={() => handleTransitionStatus(caseItem.id, 'RESOLVED')}
                                  className="px-2 py-1 rounded-md bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-bold"
                                >
                                  Resolve
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Selected Case Detail Drawer */}
            {selectedCase && (
              <div className="glass-panel p-5 rounded-2xl border border-blue-500/40 relative animate-fadeIn">
                <button
                  onClick={() => setSelectedCase(null)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-md bg-blue-600 text-white">
                    {selectedCase.caseType}
                  </span>
                  <h4 className="text-base font-bold text-white">{selectedCase.title || 'Emergency Case'}</h4>
                </div>

                <p className="text-xs text-slate-300 mt-2">{selectedCase.description}</p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Reporter</span>
                    <p className="font-bold text-slate-200 mt-0.5">{selectedCase.user?.name || 'Direct Caller'}</p>
                    <p className="text-[10px] text-slate-400">{selectedCase.user?.phone || 'N/A'}</p>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Location</span>
                    <p className="font-bold text-slate-200 mt-0.5 truncate">{selectedCase.location.address || 'GPS'}</p>
                    <p className="text-[10px] text-slate-400">
                      {selectedCase.location.lat.toFixed(4)}, {selectedCase.location.lng.toFixed(4)}
                    </p>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Risk Level</span>
                    <p className="font-bold text-rose-400 mt-0.5">{selectedCase.riskLevel}</p>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Lifecycle Status</span>
                    <p className="font-bold text-blue-400 mt-0.5">{selectedCase.status}</p>
                  </div>
                </div>

                {/* State Machine Transition Bar */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-semibold">Manual State Transition:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'CREATED',
                      'ASSESSING',
                      'AWAITING_USER',
                      'AUTHORIZED',
                      'ACTION_EXECUTING',
                      'ACTION_COMPLETED',
                      'FOLLOW_UP',
                      'RESOLVED',
                    ].map((st) => (
                      <button
                        key={st}
                        onClick={() => handleTransitionStatus(selectedCase.id, st as CaseStatus)}
                        className={`px-2 py-1 rounded-md text-[10px] font-bold border transition-all ${
                          selectedCase.status === st
                            ? 'bg-blue-600 border-blue-400 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Live Audit Trail Stream (1 Col) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-blue-400 animate-pulse" />
                Live Audit Trail Feed
              </h3>
              <span className="text-[11px] font-mono text-slate-400">{auditLogs.length} events logged</span>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-slate-800 max-h-[640px] overflow-y-auto space-y-3">
              {auditLogs.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">No audit logs recorded yet.</div>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-all text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] font-bold text-blue-400 px-1.5 py-0.5 rounded bg-blue-950/50 border border-blue-900/50">
                        {log.actor}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <p className="font-bold text-white text-xs mt-1.5">{log.action}</p>

                    {log.caseId && (
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">Case: #{log.caseId.slice(-6)}</p>
                    )}

                    {log.details && (
                      <div className="mt-1 text-[11px] text-slate-400 font-mono bg-slate-900/90 p-2 rounded-lg border border-slate-800/60 overflow-x-auto">
                        {JSON.stringify(log.details)}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
