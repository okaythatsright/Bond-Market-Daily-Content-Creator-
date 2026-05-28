import React, { useState } from 'react';
import { Send, Shield, Activity, HelpCircle, AlertTriangle, CheckCircle, Wifi, Key, Eye, EyeOff } from 'lucide-react';

interface BlueSkyTesterProps {
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  handle: string;
  setHandle: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
}

export default function BlueSkyTester({
  showToast,
  handle,
  setHandle,
  password,
  setPassword
}: BlueSkyTesterProps) {
  const [showPassword, setShowPassword] = React.useState<boolean>(false);
  const [testText, setTestText] = React.useState<string>(
    `Broad Aggregate Bond Market Update: US Aggregate Yield rose to 4.62% (+0.04%) reflecting slightly tighter monetary sentiments. US Agg Option-Adjusted Spread (OAS) compressed to 74 bps (-1 bp) as liquidity held robust. Total Return Index eased 0.12% to 2,114.50. #BondMarket`
  );
  const [isTesting, setIsTesting] = React.useState<boolean>(false);
  const [isSending, setIsSending] = React.useState<boolean>(false);
  const [consoleLogs, setConsoleLogs] = React.useState<{ time: string; text: string; mode: 'info' | 'success' | 'error' }[]>([
    {
      time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      text: 'BlueSky SDK Diagnosis Subsystem Initialized. Insert credentials to test.',
      mode: 'info'
    }
  ]);

  const [testResult, setTestResult] = useState<{
    profile?: { handle: string; service: string };
    postResult?: { uri: string; cid: string } | null;
  } | null>(null);

  const writeLog = (text: string, mode: 'info' | 'success' | 'error' = 'info') => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    setConsoleLogs((prev) => [{ time, text, mode }, ...prev]);
  };

  const handleTestConnection = async (onlyConnect: boolean) => {
    if (onlyConnect) {
      setIsTesting(true);
      writeLog(`Initiating BlueSky authentication handshake for "${handle}"...`, 'info');
    } else {
      setIsSending(true);
      writeLog(`Attempting authentication to publish single test post...`, 'info');
    }

    try {
      const response = await fetch('/api/bluesky/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loginToken: handle,
          password: password,
          testText: onlyConnect ? '' : testText
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Authentication rejected by BlueSky server.');
      }

      setTestResult(data);
      
      if (onlyConnect) {
        writeLog(`Handshake accomplished! Connected as ${data.profile?.handle || handle}. Protocol: https://bsky.social`, 'success');
        showToast('BlueSky Connection Diagnostic Passed!', 'success');
      } else {
        writeLog(`Single Test Post Dispatched Successfully!`, 'success');
        if (data.postResult?.uri) {
          writeLog(`URI: ${data.postResult.uri}`, 'success');
          writeLog(`CID: ${data.postResult.cid}`, 'info');
        }
        showToast('BlueSky Diagnostic Post published live!', 'success');
      }
    } catch (err: any) {
      console.error(err);
      writeLog(`API Error: ${err.message || String(err)}`, 'error');
      showToast(err.message || 'BlueSky integration test failed', 'error');
    } finally {
      setIsTesting(false);
      setIsSending(false);
    }
  };

  return (
    <div className="bg-[#16181D] rounded-lg border border-[#1F2937] overflow-hidden" id="bluesky-diagnostic-tester">
      {/* Header bar */}
      <div className="bg-[#0F1116] px-5 py-4 border-b border-[#1F2937] flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-sky-500/10 rounded border border-sky-500/20">
            <span className="text-base">🦋</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-sky-400 block">Social Protocol Diagnostic</span>
            <h3 className="text-sm font-serif font-bold text-[#F3F4F6]">BlueSky API SDK Console</h3>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold uppercase tracking-wide">
          <Wifi className="h-3 w-3 inline mr-1" />
          ATProto Live
        </div>
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Connection Setup and Parameters */}
        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Handle/Identifier Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-[#9CA3AF] flex items-center gap-1">
                <Shield className="h-3 w-3 text-sky-400" />
                Identifier (Handle / Match Profile)
              </label>
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="e.g. handle.bsky.social"
                className="w-full bg-[#0F1116] border border-[#2D3748] rounded px-3 py-2 text-xs text-[#E5E7EB] focus:outline-none focus:border-sky-500 font-mono"
                id="tester-bsky-handle"
              />
            </div>

            {/* App Password Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-[#9CA3AF] flex items-center gap-1">
                <Key className="h-3 w-3 text-sky-400" />
                App-Specific Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="xxxx-xxxx-xxxx-xxxx"
                  className="w-full bg-[#0F1116] border border-[#2D3748] rounded pl-3 pr-10 py-2 text-xs text-[#E5E7EB] focus:outline-none focus:border-sky-500 font-mono"
                  id="tester-bsky-pwd"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Test Custom Message Area */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-[#9CA3AF] flex items-center justify-between">
              <span>CUSTOM TEST POST TEXT</span>
              <span className={`font-mono text-[9px] ${testText.length > 300 ? 'text-rose-400' : 'text-gray-500'}`}>
                {testText.length} / 300 chars
              </span>
            </label>
            <input
              type="text"
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              maxLength={300}
              placeholder="Draft a diagnostic test post payload to publish..."
              className="w-full bg-[#0F1116] border border-[#2D3748] rounded px-3 py-2 text-xs text-[#E5E7EB] focus:outline-none focus:border-sky-500"
              id="tester-bsky-custom-payload"
            />
            {/* Presets loader */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[9px] uppercase font-bold tracking-wider text-gray-400 self-center mr-1">Indicators:</span>
              <button
                type="button"
                onClick={() => setTestText("Broad Aggregate Bond Market Update: US Aggregate Yield rose to 4.62% (+0.04%) reflecting slightly tighter monetary sentiments. US Agg Option-Adjusted Spread (OAS) compressed to 74 bps (-1 bp) as liquidity held robust. Total Return Index eased 0.12% to 2,114.50. #BondMarket")}
                className="px-2 py-0.5 bg-[#1C1F26] hover:bg-sky-500/15 text-[9px] font-mono rounded text-sky-400 border border-[#2D3748] hover:border-sky-500/30 transition-all cursor-pointer"
              >
                📊 Broad Aggregate
              </button>
              <button
                type="button"
                onClick={() => setTestText("U.S. Treasury Bond Averages: 2-Year Treasury Yield rose to 4.52% (+0.06%) on stronger retail sales data, while the 10-Year bench yield rose to 4.25% (+0.04%). Curve inversion remained at -27 bps as short-term policy anxiety drove bonds higher today. #Treasuries")}
                className="px-2 py-0.5 bg-[#1C1F26] hover:bg-sky-500/15 text-[9px] font-mono rounded text-sky-400 border border-[#2D3748] hover:border-sky-500/30 transition-all cursor-pointer"
              >
                🏛️ U.S. Treasuries
              </button>
              <button
                type="button"
                onClick={() => setTestText("Corporate Bond Averages: Investment Grade average yields rose to 5.32% (+0.03%) tracking Treasuries, while credit appetite narrowed high-yield spreads down to 312 bps (-0.08%). BBB spreads closed tighter at 118 bps as corporate bids held extremely resilient. #Credit")}
                className="px-2 py-0.5 bg-[#1C1F26] hover:bg-sky-500/15 text-[9px] font-mono rounded text-sky-400 border border-[#2D3748] hover:border-sky-500/30 transition-all cursor-pointer"
              >
                💼 Corporates
              </button>
            </div>
            <p className="text-[9px] text-[#9CA3AF] leading-snug pt-1">
              * Note: Running "Verify Connection only" checks credentials without sending any post payload.
            </p>
          </div>

          {/* Diagnosis Control Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <button
              onClick={() => handleTestConnection(true)}
              disabled={isTesting || isSending}
              className={`px-4 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                isTesting
                  ? 'bg-sky-500/10 text-sky-400/50 border-sky-500/15 cursor-not-allowed'
                  : 'bg-[#1C1F26] border-[#2D3748] text-sky-400 hover:bg-sky-500/10 hover:border-sky-500/30'
              }`}
              id="btn-verify-connection"
            >
              <Activity className="h-4 w-4 text-sky-400" />
              {isTesting ? 'Verifying Handshake...' : 'Verify Connection Handshake'}
            </button>

            <button
              onClick={() => handleTestConnection(false)}
              disabled={isTesting || isSending || testText.length === 0 || testText.length > 300}
              className={`px-4 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                isSending || testText.length === 0 || testText.length > 300
                  ? 'bg-sky-500/10 text-sky-400/30 cursor-not-allowed'
                  : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white shadow-lg active:translate-y-px'
              }`}
              id="btn-publish-test-post"
            >
              <Send className="h-3.5 w-3.5" />
              {isSending ? 'Sending Post...' : 'Publish Custom Test Post'}
            </button>
          </div>
        </div>

        {/* Diagnostic Logs & Console View */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#9CA3AF]">SDK HANDSHAKE TRACE LOGS</span>
              <button
                onClick={() => setConsoleLogs([])}
                className="text-[9px] font-mono text-gray-500 hover:text-gray-300 underline cursor-pointer"
              >
                Clear Trace
              </button>
            </div>
            
            <div className="bg-[#0F1116] border border-[#1F2937] p-3 rounded font-mono text-[10px] h-36 overflow-y-auto space-y-2.5 scrollbar-thin scrollbar-thumb-[#1F2937]">
              {consoleLogs.length === 0 ? (
                <div className="text-gray-600 italic">No diagnostic events recorded. Click "Verify Connection Handshake".</div>
              ) : (
                consoleLogs.map((log, idx) => (
                  <div key={idx} className="flex items-start space-x-1.5 leading-relaxed">
                    <span className="text-gray-600 flex-shrink-0">[{log.time}]</span>
                    <span className={
                      log.mode === 'success'
                        ? 'text-emerald-400 font-bold'
                        : log.mode === 'error'
                        ? 'text-rose-400'
                        : 'text-sky-300'
                    }>
                      {log.text}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Test Outcomes Visual Box */}
          {testResult && (
            <div className="p-3 bg-sky-505/5 border border-sky-500/15 rounded flex items-start space-x-2 text-[10px] leading-tight text-gray-300 bg-sky-500/[0.02]">
              <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              <div className="space-y-1">
                <span className="font-bold text-sky-400 block uppercase tracking-tight">Active Profile Connection Verified</span>
                <p>Authenticated using ATProtocol endpoint. Handle resolved to:</p>
                <code className="text-emerald-400 bg-emerald-900/15 px-1 py-0.5 rounded text-[9px] block max-w-full truncate">
                  {testResult.profile?.handle || 'Unknown Handle'}
                </code>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
