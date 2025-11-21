import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { TelemetryPoint } from '../types';

interface TelemetryChartsProps {
  data: TelemetryPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 p-2 rounded shadow-lg text-xs">
        <p className="text-slate-300">{`Time: ${new Date(label).toLocaleTimeString()}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {`${entry.name}: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const ThroughputChart: React.FC<TelemetryChartsProps> = ({ data }) => {
  return (
    <div className="w-full h-48">
      <h3 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Aggregate Throughput (Gbps)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorThroughput" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis 
            dataKey="timestamp" 
            tick={false} 
            stroke="#475569"
          />
          <YAxis stroke="#475569" tick={{fontSize: 10}} width={30} />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="throughput"
            stroke="#10b981"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorThroughput)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const LatencyChart: React.FC<TelemetryChartsProps> = ({ data }) => {
  return (
    <div className="w-full h-48">
      <h3 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Control Plane Latency (ms)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis 
            dataKey="timestamp" 
            tick={false} 
            stroke="#475569"
          />
          <YAxis stroke="#475569" tick={{fontSize: 10}} width={30} />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="latency"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};