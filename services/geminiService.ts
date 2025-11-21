import { GoogleGenAI, Type } from "@google/genai";
import { LogEntry, SwitchState } from '../types';

const getAI = () => {
    if (!process.env.API_KEY) {
        console.warn("No API Key provided for Gemini");
        return null;
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateConfigFromIntent = async (intent: string, currentState: SwitchState): Promise<string> => {
    const ai = getAI();
    if (!ai) return "Error: API Key not configured.";

    const prompt = `
    You are an expert Network Engineer specializing in Arista EOS.
    
    Current Switch State Summary:
    Hostname: ${currentState.hostname}
    Interfaces: ${currentState.interfaces.map(i => `${i.name}(${i.status})`).join(', ')}
    VLANs: ${currentState.vlans.join(', ')}

    User Intent: "${intent}"

    Task: Convert the user's natural language intent into valid EOS CLI configuration commands.
    Return ONLY the commands. Do not add markdown formatting like \`\`\`. 
    If the intent is unclear or unsafe, return a comment starting with "!" explaining why.
    
    Example Output:
    enable
    configure terminal
    interface Ethernet2
    switchport access vlan 20
    exit
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Gemini Config Error:", error);
        return "! Error generating configuration. Please check system logs.";
    }
};

export const analyzeLogAnomalies = async (logs: LogEntry[]): Promise<string> => {
    const ai = getAI();
    if (!ai) return "Error: API Key not configured.";

    // Take last 15 logs for context
    const recentLogs = logs.slice(-15).map(l => `[${l.timestamp}] ${l.severity} ${l.process}: ${l.message}`).join('\n');

    const prompt = `
    You are a Cloud Telemetry Analysis AI.
    Analyze the following system logs from a network switch for anomalies, security risks, or root causes of failure.
    
    Logs:
    ${recentLogs}

    Provide a concise, bulleted summary of the health status and any recommended actions.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        return "Error analyzing telemetry data.";
    }
};