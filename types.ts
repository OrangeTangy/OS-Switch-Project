export enum InterfaceStatus {
  UP = 'up',
  DOWN = 'down',
  ADMIN_DOWN = 'admin_down'
}

export interface NetworkInterface {
  id: string;
  name: string;
  status: InterfaceStatus;
  vlan: number;
  description: string;
  ipAddress?: string;
  mtu: number;
  speed: number; // Mbps
  rxRate: number; // Current Mbps
  txRate: number; // Current Mbps
  errors: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  process: string;
  message: string;
}

export interface TelemetryPoint {
  timestamp: number;
  throughput: number; // Aggregate Gbps
  latency: number; // ms
  errors: number; // count
}

export interface SwitchState {
  hostname: string;
  interfaces: NetworkInterface[];
  vlans: number[];
  logs: LogEntry[];
}

export interface CommandResult {
  output: string;
  newConfig?: Partial<SwitchState>;
}