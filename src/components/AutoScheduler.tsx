import React, { useState, useEffect } from 'react';
import { Clock, ShieldCheck, Activity, ToggleLeft, ToggleRight, ListTodo, HelpCircle } from 'lucide-react';

interface AutoSchedulerProps {
  isAuthenticated: boolean;
  onTriggerAutoSynthesis: () => Promise<void>;
  onTriggerAutoLog: () => Promise<void>;
  onTriggerBlueSkyPublish: () => Promise<void>;
  onStateSaveToBackup?: () => Promise<void>;
}

export interface AutoLogEntry {
  timestamp: string;
  type: 'synthesis' | 'sheets_log' | 'bluesky_post' | 'info';
  status: 'success' | 'failed' | 'pending';
  message: string;
}

export default function AutoScheduler({
  isAuthenticated,
  onTriggerAutoSynthesis,
  onTriggerAutoLog,
  onTriggerBlueSkyPublish,
  onStateSaveToBackup
}: AutoSchedulerProps) {
  const [isEnabled, setIsEnabled] = useState<boolean>(true);
  const [autoLogToSheets, setAutoLogToSheets] = useState<boolean>(true);
  const [autoPublishToBlueSky, setAutoPublishToBlueSky] = useState<boolean>(true);
  const [countdownStr, setCountdownStr] = useState<string>('--h --m --s');
  const [currentTimeCST, setCurrentTimeCST] = useState<string>('');
  const [nextExecutionStr, setNextExecutionStr] = useState<string>('');
  const [logs, setLogs] = useState<AutoLogEntry[]>([
    {
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      type: 'info',
      status: 'success',
      message: 'Automated 4:30 PM CST release pipeline initialized & listening.'
    }
  ]);

  // Utility to get current Chicago/Central Standard Time (CST/CDT)
  const getCentralTime = (): Date => {
    const cstStr = new Date().toLocaleString("en-US", { timeZone: "America/Chicago" });
    return new Date(cstStr);
  };

  // Calculate next target occurrence of 16:30:00 Chicago Time
  const getNextTargetTime = (): Date => {
    const now = getCentralTime();
    const target = new Date(now);
    target.setHours(16, 30, 0, 0); // 4:30:00 PM

    if (now.getTime() >= target.getTime()) {
      target.setDate(target.getDate() + 1);
    }
    return target;
  };

  // State to track if we already executed synthesis for today to prevent double triggering in same second
  const [lastExecutedDate, setLastExecutedDate] = useState<string>('');

  useEffect(() => {
    const checkScheduler = () => {
      const now = getCentralTime();
      const target = getNextTargetTime();
      
      // Update countdown string
      const diffMs = target.getTime() - now.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      const hh = String(hours).padStart(2, '0');
      const mm = String(minutes).padStart(2, '0');
      const ss = String(seconds).padStart(2, '0');
      setCountdownStr(`${hh}h ${mm}m ${ss}s`);

      // Keep human-friendly target text
      setNextExecutionStr(target.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }) + ' at 4:30 PM CT');

      // Update current live Central timestamp in header
      setCurrentTimeCST(now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }) + ' Central Time');

      // Trigger automatic synthesis when the countdown drops to zero, or if exactly 16:30:00 CT has been hit
      // We check if now is exactly within the target minute and we haven't logged today's date yet
      const todayDateKey = now.toDateString();
      const isExactlyTargetTime = now.getHours() === 16 && now.getMinutes() === 30 && now.getSeconds() === 0;

      if (isEnabled && isExactlyTargetTime && lastExecutedDate !== todayDateKey) {
        setLastExecutedDate(todayDateKey);
        triggerAutomatedPipeline(todayDateKey);
      }
    };

    // Run immediately then tick every 1000ms
    checkScheduler();
    const interval = setInterval(checkScheduler, 1000);
    return () => clearInterval(interval);
  }, [isEnabled, lastExecutedDate, autoLogToSheets, autoPublishToBlueSky, isAuthenticated]);

  const addLog = (type: 'synthesis' | 'sheets_log' | 'bluesky_post' | 'info', status: 'success' | 'failed' | 'pending', message: string) => {
    const timestamp = getCentralTime().toLocaleTimeString('en-US', { hour12: false });
    setLogs((prev) => [
      { timestamp, type, status, message },
      ...prev.slice(0, 19) // Limit to last 20 events
    ]);
  };

  const triggerAutomatedPipeline = async (dateKey: string) => {
    addLog('synthesis', 'pending', `Initiating scheduled 4:30 PM CST Daily Synthesis for ${dateKey}...`);
    try {
      // 1. Save backup state to server
      if (onStateSaveToBackup) {
        await onStateSaveToBackup();
      }

      // 2. Perform the synthesis
      await onTriggerAutoSynthesis();
      addLog('synthesis', 'success', `Successfully synthesized 8 BlueSky posts using Gemini 3.5.`);

      // 3. Auto-publish straight to BlueSky if armed/configured
      if (autoPublishToBlueSky) {
        addLog('bluesky_post', 'pending', `Auto-publishing 8 category updates directly to BlueSky feeds...`);
        await onTriggerBlueSkyPublish();
        addLog('bluesky_post', 'success', `Successfully posted all 8 updates to BlueSky profile.`);
      }

      // 4. Incrementally log to Workspace Sheets if configured and authenticated
      if (autoLogToSheets) {
        if (isAuthenticated) {
          addLog('sheets_log', 'pending', `Auto-appending daily release to Google Sheets logs...`);
          await onTriggerAutoLog();
          addLog('sheets_log', 'success', `Appended all categories to "Bond Market Bluesky Log" sheets.`);
        } else {
          addLog('sheets_log', 'failed', `Auto-logging skipped: Google Drive is not authorized in this session.`);
        }
      }
    } catch (err: any) {
      console.error('Scheduled pipeline failure:', err);
      addLog('synthesis', 'failed', `Cron execution failure: ${err.message || String(err)}`);
    }
  };

  return (
    <div className="bg-[#16181D] rounded-lg border border-[#1F2937] overflow-hidden" id="auto-scheduler-panel">
      {/* Panel Top header */}
      <div className="bg-[#0F1116] px-5 py-4 border-b border-[#1F2937] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-[#B89C6D]/10 rounded border border-[#B89C6D]/20">
            <Clock className="h-5 w-5 text-[#B89C6D] animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-[#B89C6D] block">Central Standard Cron</span>
            <h3 className="text-sm font-serif font-bold text-[#F3F4F6]">Automated 4:30 PM CST Release</h3>
          </div>
        </div>

        {/* Enabled Power Switch buttons */}
        <div className="flex items-center space-x-4">
          <div className="text-right sm:block hidden">
            <span className="text-[10px] text-[#9CA3AF] font-mono block">CST Clock Feed</span>
            <span className="text-xs text-[#F3F4F6] font-mono font-medium">{currentTimeCST || 'Retrieving...'}</span>
          </div>

          <button
            onClick={() => {
              setIsEnabled(!isEnabled);
              addLog('info', 'success', `Automated crawler pipeline ${!isEnabled ? 'armed and enabled' : 'temporarily paused'}.`);
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
              isEnabled
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}
            id="scheduler-toggle-btn"
          >
            {isEnabled ? (
              <>
                <ToggleRight className="h-4 w-4" />
                <span>ARMED</span>
              </>
            ) : (
              <>
                <ToggleLeft className="h-4 w-4" />
                <span>PAUSED</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="p-5 grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Card: Countdown Timer state */}
        <div className="md:col-span-4 flex flex-col justify-between bg-[#0F1116] p-4 rounded border border-[#1F2937]">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#9CA3AF]">TIME UNTIL DAILY RELEASE</span>
            <div className="text-2xl lg:text-3xl font-mono font-bold text-[#F3F4F6] mt-2 tracking-tight">
              {isEnabled ? countdownStr : 'SYSTEM STANDBY'}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1F2937]">
            <span className="text-[10px] text-[#9CA3AF] block font-mono">TARGET RELEASE SCHEDULE</span>
            <span className="text-xs text-[#E5E7EB] font-sans font-medium mt-1 block">
              {nextExecutionStr || 'Determining next batch...'}
            </span>
          </div>
        </div>

        {/* Center Card: Automation settings dials */}
        <div className="md:col-span-4 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#B89C6D] block">AUTOMATION PARAMETERS</span>
            
            {/* BlueSky Auto-Publish checklist item */}
            <label className="flex items-start space-x-3 cursor-pointer group p-2 rounded hover:bg-[#1C1F26] transition-colors">
              <input
                type="checkbox"
                checked={autoPublishToBlueSky}
                onChange={(e) => {
                  setAutoPublishToBlueSky(e.target.checked);
                  addLog('info', 'success', `Auto-publish to BlueSky set to ${e.target.checked ? 'Active' : 'Bypassed'}.`);
                }}
                className="mt-1 sticky-checkbox rounded border-[#2D3748] accent-[#3b82f6] h-3.5 w-3.5 bg-[#0F1116]"
              />
              <div className="text-xs">
                <span className="font-semibold text-[#F3F4F6] group-hover:text-sky-400 transition-colors block">
                  Auto-Publish to BlueSky 🦋
                </span>
                <p className="text-[10px] text-[#9CA3AF] mt-0.5 leading-snug">
                  Directly dispatch all 8 category posts to the live BlueSky account feed at 4:30 PM CST.
                </p>
              </div>
            </label>

            {/* Auto-Log checklist item */}
            <label className="flex items-start space-x-3 cursor-pointer group p-2 rounded hover:bg-[#1C1F26] transition-colors">
              <input
                type="checkbox"
                checked={autoLogToSheets}
                onChange={(e) => {
                  setAutoLogToSheets(e.target.checked);
                  addLog('info', 'success', `Auto-logging parameter set to ${e.target.checked ? 'Active' : 'Bypassed'}.`);
                }}
                className="mt-1 sticky-checkbox rounded border-[#2D3748] accent-[#B89C6D] h-3.5 w-3.5 bg-[#0F1116]"
              />
              <div className="text-xs">
                <span className="font-semibold text-[#F3F4F6] group-hover:text-[#B89C6D] transition-colors block">
                  Bypass confirmation popup
                </span>
                <p className="text-[10px] text-[#9CA3AF] mt-0.5 leading-snug">
                  Directly append daily posts to Sheets at 4:30 PM CST without requesting manual click.
                </p>
              </div>
            </label>
          </div>

          <div className="p-3 bg-[#0F1116] rounded border border-[#1F2937] flex items-center space-x-2 text-[10px] text-[#9CA3AF] leading-tight mt-1">
            <ShieldCheck className="h-4 w-4 text-[#B89C6D] flex-shrink-0" />
            <span>
              {isAuthenticated
                ? 'Credential safe. Fully authorized to update Google Sheet logs.'
                : 'Authentication needed to append daily release to Sheets.'}
            </span>
          </div>
        </div>

        {/* Right Card: Running Session Logs console */}
        <div className="md:col-span-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#9CA3AF] flex items-center">
              <Activity className="h-3.5 w-3.5 text-[#B89C6D] mr-1" />
              SESSION TELEMETRY LOGS
            </span>
            <button
              onClick={() => {
                setLogs([
                  {
                    timestamp: getCentralTime().toLocaleTimeString('en-US', { hour12: false }),
                    type: 'info',
                    status: 'success',
                    message: 'Telemetry console log cleared.'
                  }
                ]);
              }}
              className="text-[9px] font-mono text-[#B89C6D] hover:underline cursor-pointer"
            >
              Clear
            </button>
          </div>

          <div className="bg-[#0F1116] rounded border border-[#1F2937] p-3 text-[10px] font-mono h-32 overflow-y-auto space-y-2.5 scrollbar-thin scrollbar-thumb-[#1F2937]">
            {logs.map((log, idx) => (
              <div key={idx} className="flex items-start space-x-1.5 leading-normal">
                <span className="text-gray-600 flex-shrink-0">[{log.timestamp}]</span>
                <span
                  className={
                    log.status === 'success'
                      ? 'text-emerald-400'
                      : log.status === 'failed'
                      ? 'text-rose-400'
                      : 'text-amber-400 animate-pulse'
                  }
                >
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
