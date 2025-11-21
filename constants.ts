import { SwitchState, InterfaceStatus } from './types';

export const INITIAL_INTERFACES = [
  { id: 'et1', name: 'Ethernet1', status: InterfaceStatus.UP, vlan: 1, description: 'Uplink to Core', mtu: 1500, speed: 10000, rxRate: 0, txRate: 0, errors: 0 },
  { id: 'et2', name: 'Ethernet2', status: InterfaceStatus.UP, vlan: 10, description: 'Server Farm A', mtu: 1500, speed: 10000, rxRate: 0, txRate: 0, errors: 0 },
  { id: 'et3', name: 'Ethernet3', status: InterfaceStatus.DOWN, vlan: 20, description: 'Guest WiFi', mtu: 1500, speed: 1000, rxRate: 0, txRate: 0, errors: 0 },
  { id: 'et4', name: 'Ethernet4', status: InterfaceStatus.ADMIN_DOWN, vlan: 1, description: 'Reserved', mtu: 1500, speed: 1000, rxRate: 0, txRate: 0, errors: 0 },
  { id: 'ma1', name: 'Management1', status: InterfaceStatus.UP, vlan: 0, description: 'OOB Mgmt', ipAddress: '192.168.1.10/24', mtu: 1500, speed: 1000, rxRate: 0, txRate: 0, errors: 0 },
];

export const INITIAL_STATE: SwitchState = {
  hostname: 'stratus-sw01',
  interfaces: INITIAL_INTERFACES,
  vlans: [1, 10, 20, 99],
  logs: [
    { id: '1', timestamp: new Date().toISOString(), severity: 'INFO', process: 'System', message: 'System initialization complete' },
    { id: '2', timestamp: new Date().toISOString(), severity: 'INFO', process: 'NbInterface', message: 'Interface Ethernet1 is up' },
  ]
};

export const WELCOME_MESSAGE = `
Stratus EOS (Extensible Operating System)
Software Image: v4.32.1F
(c) Copyright 2025 Stratus Networks, Inc.

Type '?' for available commands.
Type 'enable' to enter privileged mode.
`;
