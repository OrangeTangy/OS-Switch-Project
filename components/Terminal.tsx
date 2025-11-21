import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon } from 'lucide-react';
import { SwitchState } from '../types';
import { generateConfigFromIntent } from '../services/geminiService';

interface TerminalProps {
  switchState: SwitchState;
  onCommand: (cmd: string) => void;
  onAIConfigApply: (cmds: string) => void;
}

const Terminal: React.FC<TerminalProps> = ({ switchState, onCommand, onAIConfigApply }) => {
  const [history, setHistory] = useState<string[]>([
    "Stratus EOS (Extensible Operating System)",
    "Software Image: v4.32.1F",
    "Type 'ai <intent>' to use Gemini Intent-Based Networking.",
    ""
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history]);

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const cmd = input.trim();
      if (!cmd) return;

      const newHistory = [...history, `${switchState.hostname}# ${cmd}`];
      setHistory(newHistory);
      setInput('');

      if (cmd === 'clear') {
        setHistory([]);
        return;
      }

      // AI Command Handling
      if (cmd.startsWith('ai ')) {
        setIsProcessing(true);
        const intent = cmd.substring(3);
        setHistory(prev => [...prev, `Analyzing intent with Gemini AI...`]);
        
        const generatedConfig = await generateConfigFromIntent(intent, switchState);
        
        setHistory(prev => [
          ...prev, 
          `Suggested Configuration:`,
          ...generatedConfig.split('\n').map(line => `  ${line}`),
          `Applying configuration...`
        ]);

        onAIConfigApply(generatedConfig);
        setIsProcessing(false);
        return;
      }

      // Local Command Passthrough
      const output = onCommand(cmd);
      if (output) {
        setHistory(prev => [...prev, output]);
      } else {
        // If no output returned (e.g. state change only), assume success unless error
        // For simulation, we rely on onCommand to return string output
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-lg overflow-hidden shadow-2xl font-mono text-sm">
      {/* Terminal Header */}
      <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-400">
          <TerminalIcon size={14} />
          <span className="font-semibold">Console (SSH) - {switchState.hostname}</span>
        </div>
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50"></div>
        </div>
      </div>

      {/* Terminal Output */}
      <div className="flex-1 p-4 overflow-y-auto text-slate-300 space-y-1">
        {history.map((line, i) => (
          <div key={i} className="whitespace-pre-wrap break-words">
            {line}
          </div>
        ))}
        {isProcessing && <div className="text-emerald-400 animate-pulse">Processing...</div>}
        <div ref={endRef} />
      </div>

      {/* Input Area */}
      <div className="p-2 bg-slate-900 border-t border-slate-800 flex items-center">
        <span className="text-emerald-500 mr-2 font-bold">{switchState.hostname}#</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent border-none outline-none text-slate-100 placeholder-slate-600"
          placeholder="Type commands or 'ai <instruction>'"
          autoFocus
          spellCheck={false}
        />
      </div>
    </div>
  );
};

export default Terminal;