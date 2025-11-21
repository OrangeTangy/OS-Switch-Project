import React, { useState, useEffect, useCallback } from 'react';
import Terminal from './components/Terminal';
import Dashboard from './components/Dashboard';
import { INITIAL_STATE } from './constants';
import { SwitchState, TelemetryPoint, InterfaceStatus, LogEntry } from './types';
import { Layout, Cloud, Server } from 'lucide-react';

const App: React.FC = () => {
  const [switchState, setSwitchState] = useState<SwitchState>(INITIAL_STATE);
  const [telemetryData, setTelemetryData] = useState<TelemetryPoint[]>([]);
  
  // --- SIMULATION ENGINE ---

  // 1. Traffic Generator (runs every second)
  useEffect(() => {
    const interval = setInterval(() => {
      const timestamp = Date.now();
      
      // Calculate traffic based on UP interfaces
      const upCount = switchState.interfaces.filter(i => i.status === InterfaceStatus.UP).length;
      const baseThroughput = upCount * 2.5; // Base Gbps
      const noise = (Math.random() * 1.5) - 0.5; 
      const currentThroughput = Math.max(0, parseFloat((baseThroughput + noise).toFixed(2)));
      
      // Latency spikes if there are errors or heavy load
      const baseLatency = 2;
      const latencySpike = Math.random() > 0.9 ? Math.random() * 15 : 0;
      const currentLatency = parseFloat((baseLatency + latencySpike).toFixed(2));

      // Random errors
      const errors = Math.random() > 0.95 ? Math.floor(Math.random() * 5) : 0;

      const newPoint: TelemetryPoint = {
        timestamp,
        throughput: currentThroughput,
        latency: currentLatency,
        errors
      };

      setTelemetryData(prev => {
        const newData = [...prev, newPoint];
        // Keep last 60 seconds
        if (newData.length > 60) return newData.slice(newData.length - 60);
        return newData;
      });

      // Randomly log things if errors occur
      if (errors > 0) {
        addLog('WARNING', 'Phy', `Input errors detected on Ethernet${Math.floor(Math.random() * 4) + 1}`);
      }

    }, 1000);

    return () => clearInterval(interval);
  }, [switchState.interfaces]);


  // --- LOGIC HELPERS ---

  const addLog = useCallback((severity: LogEntry['severity'], process: string, message: string) => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      severity,
      process,
      message
    };
    setSwitchState(prev => ({
      ...prev,
      logs: [...prev.logs, newLog]
    }));
  }, []);

  // --- COMMAND PARSER (MOCK OS KERNEL) ---

  const handleCommand = (rawCmd: string): string => {
    const parts = rawCmd.trim().split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    // 1. Show Commands
    if (cmd === 'show') {
      if (args[0] === 'interfaces') {
        const header = 'Interface       Status      Protocol    Description\n' +
                       '--------------  ----------  ----------  -------------------------';
        const rows = switchState.interfaces.map(i => {
          const statusStr = i.status.padEnd(10);
          const protoStr = (i.status === InterfaceStatus.UP ? 'up' : 'down').padEnd(10);
          return `${i.name.padEnd(14)}  ${statusStr}  ${protoStr}  ${i.description}`;
        }).join('\n');
        return `${header}\n${rows}`;
      }
      if (args[0] === 'vlan') {
        return `VLANs: ${switchState.vlans.join(', ')}`;
      }
      if (args[0] === 'version') {
        return 'Stratus EOS v4.32.1F (Simulated)';
      }
      if (args[0] === 'log' || args[0] === 'logging') {
        return switchState.logs.slice(-10).map(l => `${l.timestamp} [${l.process}] ${l.severity}: ${l.message}`).join('\n');
      }
      return '% Invalid input detected at marker';
    }

    // 2. Configuration Commands (Simulated simplified parsing)
    // Pattern: interface <name> shutdown | no shutdown
    if (cmd === 'interface' || (cmd === 'int')) {
       // Context switching is hard in simple parser, so we expect single line config for demo
       // e.g. "interface et1 shutdown"
       // But usually users type "conf t", "int et1", "shutdown". 
       // To keep it simple, let's support specific state modifiers.
       return "% Incomplete command. (Simulation Note: Use 'ai <intent>' for complex config changes)";
    }

    // Direct status modification for demo ease
    // "shutdown et1" or "no shutdown et1"
    if (cmd === 'shutdown') {
       const ifaceName = args[0];
       const updatedInterfaces = switchState.interfaces.map(i => {
         if (i.name.toLowerCase() === ifaceName?.toLowerCase() || i.id === ifaceName?.toLowerCase()) {
           addLog('WARNING', 'NbInterface', `Interface ${i.name} changed state to admin_down`);
           return { ...i, status: InterfaceStatus.ADMIN_DOWN };
         }
         return i;
       });
       setSwitchState(prev => ({ ...prev, interfaces: updatedInterfaces }));
       return '';
    }
    
    if (cmd === 'no' && args[0] === 'shutdown') {
       const ifaceName = args[1];
       const updatedInterfaces = switchState.interfaces.map(i => {
         if (i.name.toLowerCase() === ifaceName?.toLowerCase() || i.id === ifaceName?.toLowerCase()) {
            addLog('INFO', 'NbInterface', `Interface ${i.name} changed state to up`);
           return { ...i, status: InterfaceStatus.UP };
         }
         return i;
       });
       setSwitchState(prev => ({ ...prev, interfaces: updatedInterfaces }));
       return '';
    }

    // Hostname
    if (cmd === 'hostname') {
      if (args[0]) {
        setSwitchState(prev => ({ ...prev, hostname: args[0] }));
        addLog('INFO', 'System', `Hostname changed to ${args[0]}`);
        return '';
      }
    }

    if (cmd === 'help' || cmd === '?') {
      return `
Available Commands:
  show interfaces      Show interface status
  show vlan           Show active VLANs
  show version        Show system version
  show logging        Show recent logs
  shutdown <int>      Disable an interface (e.g., shutdown et1)
  no shutdown <int>   Enable an interface
  hostname <name>     Set switch hostname
  ai <intent>         Use Gemini to generate config
  clear               Clear screen
      `;
    }

    return `% Unknown command: ${cmd}`;
  };

  const handleAIConfigApply = (configBlock: string) => {
    // This is a mock "Applier" that interprets the EOS config block returned by Gemini.
    // In a real app, this would need a sophisticated parser.
    // Here, we look for keywords to update our state for the demo.
    
    const lines = configBlock.split('\n');
    let currentInterface: string | null = null;
    
    const newInterfaces = [...switchState.interfaces];
    const newVlans = new Set(switchState.vlans);

    lines.forEach(line => {
      const l = line.trim();
      
      // Detect Interface Context
      if (l.startsWith('interface')) {
        const parts = l.split(' ');
        const ifName = parts[1];
        // Normalized matching
        const foundIndex = newInterfaces.findIndex(i => i.name.toLowerCase() === ifName.toLowerCase() || i.id === ifName.toLowerCase());
        if (foundIndex !== -1) {
            currentInterface = newInterfaces[foundIndex].id;
        }
      }
      
      // Apply Contextual Config
      if (currentInterface) {
          const idx = newInterfaces.findIndex(i => i.id === currentInterface);
          
          if (l === 'shutdown') {
              newInterfaces[idx] = { ...newInterfaces[idx], status: InterfaceStatus.ADMIN_DOWN };
              addLog('WARNING', 'ConfigAgent', `${newInterfaces[idx].name} disabled via AI Agent`);
          }
          if (l === 'no shutdown') {
              newInterfaces[idx] = { ...newInterfaces[idx], status: InterfaceStatus.UP };
              addLog('INFO', 'ConfigAgent', `${newInterfaces[idx].name} enabled via AI Agent`);
          }
          if (l.startsWith('description')) {
              const desc = l.replace('description ', '');
              newInterfaces[idx] = { ...newInterfaces[idx], description: desc };
          }
          if (l.startsWith('switchport access vlan')) {
              const vlanId = parseInt(l.split(' ').pop() || '1');
              newInterfaces[idx] = { ...newInterfaces[idx], vlan: vlanId };
              newVlans.add(vlanId); // Auto-create VLAN
          }
      }
      
      if (l === 'exit') {
          currentInterface = null;
      }
    });

    setSwitchState(prev => ({
        ...prev,
        interfaces: newInterfaces,
        vlans: Array.from(newVlans).sort((a: number, b: number) => a - b)
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans selection:bg-emerald-500/30">
      
      {/* Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur flex items-center px-6 justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-lg shadow-lg shadow-emerald-900/20">
            <Cloud className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100 tracking-tight">Stratus EOS Simulator</h1>
            <p className="text-xs text-slate-500 font-mono">Project #1: System & Telemetry</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-400">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800">
                <Server size={14} />
                <span className="font-mono text-emerald-400">{switchState.hostname}</span>
            </div>
            <div className="h-4 w-px bg-slate-700"></div>
            <span className="text-xs">v4.32.1F-sim</span>
        </div>
      </header>

      {/* Main Content Split */}
      <main className="flex-1 p-4 lg:p-6 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-7rem)]">
          
          {/* Left Pane: Switch OS (CLI) */}
          <section className="flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Layout size={16} /> Control Plane
                </h2>
                <span className="text-xs text-slate-600">SSH-2.0-OpenSSH_8.9p1</span>
            </div>
            <Terminal 
                switchState={switchState} 
                onCommand={handleCommand} 
                onAIConfigApply={handleAIConfigApply}
            />
          </section>

          {/* Right Pane: Cloud Telemetry */}
          <section className="flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Cloud size={16} /> Telemetry Stream
                </h2>
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs text-emerald-500 font-mono">CONNECTED</span>
                </div>
            </div>
            <Dashboard state={switchState} telemetry={telemetryData} />
          </section>

        </div>
      </main>
    </div>
  );
};

export default App;