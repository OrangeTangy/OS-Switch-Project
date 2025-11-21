import React, { useState, useEffect } from 'react';
import { Activity, Server, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { SwitchState, TelemetryPoint, InterfaceStatus } from '../types';
import { ThroughputChart, LatencyChart } from './TelemetryCharts';
import { analyzeLogAnomalies } from '../services/geminiService';

interface DashboardProps {
  state: SwitchState;
  telemetry: TelemetryPoint[];
}

const StatusBadge = ({ status }: { status: InterfaceStatus }) => {
  switch (status) {
    case InterfaceStatus.UP:
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-900 text-emerald-300 border border-emerald-800"><CheckCircle size={10} className="mr-1" /> UP</span>;
    case InterfaceStatus.DOWN:
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-900 text-red-300 border border-red-800"><XCircle size={10} className="mr-1" /> DOWN</span>;
    case InterfaceStatus.ADMIN_DOWN:
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-700 text-slate-300 border border-slate-600">ADMIN</span>;
  }
};

const Dashboard: React.FC<DashboardProps> = ({ state, telemetry }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    const result = await analyzeLogAnomalies(state.logs);
    setAnalysis(result);
    setAnalyzing(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
      <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2 text-blue-400">
          <Activity size={18} />
          <span className="font-bold tracking-tight">CloudVision Telemetry</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Streaming Live
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-xs uppercase font-semibold">Active Interfaces</p>
                <p className="text-2xl font-bold text-slate-100 mt-1">
                  {state.interfaces.filter(i => i.status === InterfaceStatus.UP).length}
                  <span className="text-slate-500 text-sm font-normal">/{state.interfaces.length}</span>
                </p>
              </div>
              <Server className="text-slate-700" size={20} />
            </div>
          </div>
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
             <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-xs uppercase font-semibold">System Uptime</p>
                <p className="text-2xl font-bold text-slate-100 mt-1">4d 12h 30m</p>
              </div>
              <CheckCircle className="text-emerald-700" size={20} />
            </div>
          </div>
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
             <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-xs uppercase font-semibold">Recent Errors</p>
                <p className="text-2xl font-bold text-rose-400 mt-1">
                  {telemetry.length > 0 ? telemetry[telemetry.length - 1].errors : 0}
                </p>
              </div>
              <AlertTriangle className="text-rose-900" size={20} />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
            <ThroughputChart data={telemetry} />
          </div>
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
            <LatencyChart data={telemetry} />
          </div>
        </div>

        {/* Interface Status Grid */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-slate-900 border-b border-slate-800">
            <h3 className="text-xs font-semibold text-slate-300 uppercase">Interface Status</h3>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="bg-slate-900/50 text-xs uppercase font-semibold text-slate-500">
                <tr>
                  <th className="px-4 py-2">Interface</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">VLAN</th>
                  <th className="px-4 py-2">Speed</th>
                  <th className="px-4 py-2">Desc</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {state.interfaces.map(iface => (
                  <tr key={iface.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="px-4 py-2 font-mono text-slate-200">{iface.name}</td>
                    <td className="px-4 py-2"><StatusBadge status={iface.status} /></td>
                    <td className="px-4 py-2 font-mono text-blue-400">{iface.vlan}</td>
                    <td className="px-4 py-2">{iface.speed / 1000}G</td>
                    <td className="px-4 py-2 text-slate-500">{iface.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Anomaly Analysis */}
        <div className="bg-indigo-950/20 border border-indigo-900/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-indigo-300 font-semibold flex items-center gap-2">
               ✨ Gemini Log Analysis
            </h3>
            <button 
              onClick={handleAnalyze}
              disabled={analyzing}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white text-xs rounded transition-colors font-medium"
            >
              {analyzing ? 'Analyzing...' : 'Analyze Logs'}
            </button>
          </div>
          {analysis ? (
            <div className="text-sm text-indigo-200 leading-relaxed whitespace-pre-line animate-in fade-in slide-in-from-bottom-2">
              {analysis}
            </div>
          ) : (
            <p className="text-indigo-400/50 text-sm italic">
              Run analysis to detect anomalies in syslog stream.
            </p>
          )}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;