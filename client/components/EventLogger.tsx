"use client";

import { useEffect, useRef } from "react";
import { Terminal, Trash2 } from "lucide-react";

export interface LogEntry {
  id: string;
  timestamp: Date;
  type: "info" | "success" | "error" | "warning" | "event";
  message: string;
}

interface EventLoggerProps {
  logs: LogEntry[];
  onClear: () => void;
}

export default function EventLogger({ logs, onClear }: EventLoggerProps) {
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const getTypeColor = (type: LogEntry["type"]) => {
    switch (type) {
      case "success":
        return "text-green-400";
      case "error":
        return "text-red-400";
      case "warning":
        return "text-yellow-400";
      case "event":
        return "text-blue-400";
      default:
        return "text-gray-300";
    }
  };

  const getTypeBg = (type: LogEntry["type"]) => {
    switch (type) {
      case "success":
        return "bg-green-500/20";
      case "error":
        return "bg-red-500/20";
      case "warning":
        return "bg-yellow-500/20";
      case "event":
        return "bg-blue-500/20";
      default:
        return "bg-gray-500/20";
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 h-full flex flex-col max-h-[600px]">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Terminal className="w-6 h-6 text-cyan-400" />
          Event Log
        </h2>
        <button
          onClick={onClear}
          className="p-2 hover:bg-red-500/20 rounded-lg transition text-red-400 hover:text-red-300"
          title="Clear logs"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Log Container */}
      <div className="flex-1 bg-black/20 rounded-xl border border-white/10 overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto space-y-1 p-4" style={{ maxHeight: '400px' }}>
          {logs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>Waiting for events...</p>
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className={`text-xs font-mono p-2 rounded border-l-2 ${getTypeBg(
                  log.type
                )} ${getTypeColor(log.type)} border-current`}
              >
                <div className="flex gap-2">
                  <span className="text-gray-500 flex-shrink-0">
                    {log.timestamp.toLocaleTimeString()}
                  </span>
                  <span className="flex-1 break-words">{log.message}</span>
                </div>
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      </div>

      {/* Log Count */}
      <p className="text-gray-400 text-xs mt-4 flex-shrink-0">
        {logs.length} event{logs.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
