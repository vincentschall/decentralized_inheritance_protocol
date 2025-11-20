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
        return "text-emerald-600";
      case "error":
        return "text-red-600";
      case "warning":
        return "text-amber-600";
      case "event":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  const getTypeBg = (type: LogEntry["type"]) => {
    switch (type) {
      case "success":
        return "bg-emerald-50";
      case "error":
        return "bg-red-50";
      case "warning":
        return "bg-amber-50";
      case "event":
        return "bg-blue-50";
      default:
        return "bg-gray-50";
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-card h-full flex flex-col max-h-[600px]">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Terminal className="w-5 h-5 text-gray-400" />
          Event Log
        </h2>
        <button
          onClick={onClear}
          className="p-1.5 hover:bg-red-50 rounded-lg transition text-red-500 hover:text-red-600"
          title="Clear logs"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Log Container */}
      <div className="flex-1 bg-gray-50 rounded-lg overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto space-y-1 p-3" style={{ maxHeight: '400px' }}>
          {logs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p className="text-sm">Waiting for events...</p>
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className={`text-xs font-mono p-2 rounded ${getTypeBg(
                  log.type
                )} ${getTypeColor(log.type)}`}
              >
                <div className="flex gap-2">
                  <span className="text-gray-400 flex-shrink-0">
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
      <p className="text-gray-400 text-xs mt-3 flex-shrink-0">
        {logs.length} event{logs.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
