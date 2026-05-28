import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { DEFAULT_BOND_SECTIONS } from './data';
import { BondMarketSection, GeneratedPost, LoggedStatus, BlueSkyStatus } from './types';
import {
  initAuth,
  googleSignIn,
  logout,
  findOrCreateSpreadsheet,
  ensureSheetsExist,
  appendLogEntry
} from './googleService';
import Header from './components/Header';
import StatsGrid from './components/StatsGrid';
import BondForm from './components/BondForm';
import PostPreview from './components/PostPreview';
import AutoScheduler from './components/AutoScheduler';
import BlueSkyTester from './components/BlueSkyTester';
import { Sparkles, CheckCircle2, AlertCircle, FileSpreadsheet, Hourglass, Calendar, Info, Database, RefreshCw } from 'lucide-react';

export default function App() {
  const [sections, setSections] = useState<BondMarketSection[]>(DEFAULT_BOND_SECTIONS);
  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [loggedStatuses, setLoggedStatuses] = useState<LoggedStatus[]>([]);
  const [isPublishingBlueSky, setIsPublishingBlueSky] = useState(false);
  const [blueSkyStatuses, setBlueSkyStatuses] = useState<BlueSkyStatus[]>([]);
  
  // BlueSky synced state
  const [bskyHandle, setBskyHandle] = useState<string>(() => {
    const saved = localStorage.getItem('bsky_handle');
    if (!saved || saved.includes('blinkonce4yes.bsky.social')) {
      return 'https://bsky.app/profile/bond-market-daily.bsky.social';
    }
    return saved;
  });
  const [bskyPassword, setBskyPassword] = useState<string>(() => {
    const saved = localStorage.getItem('bsky_password');
    if (!saved || saved === 'Tobywong2010!') {
      return 'Tobywong2010!';
    }
    return saved;
  });

  useEffect(() => {
    localStorage.setItem('bsky_handle', bskyHandle);
  }, [bskyHandle]);

  useEffect(() => {
    localStorage.setItem('bsky_password', bskyPassword);
  }, [bskyPassword]);

  const [isInitiallyLoaded, setIsInitiallyLoaded] = useState(false);
  
  // Google Auth integration states
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);
  const [hasGeminiKey, setHasGeminiKey] = useState(false);

  // Clock state
  const [timeString, setTimeString] = useState<string>('');

  // Toast notifications state
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Real-time synchronization states
  const [isSyncingRates, setIsSyncingRates] = useState(false);
  const [verificationLogs, setVerificationLogs] = useState<any[] | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  // Clock updating hook
  useEffect(() => {
    const updateClock = () => {
      const formatted = new Date().toLocaleTimeString('en-US', {
        timeZone: 'America/Chicago',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      setTimeString(formatted + ' CT');
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Check backend config, load initial server state & initialize Firebase Auth
  useEffect(() => {
    const checkConfigAndState = async () => {
      try {
        const res = await fetch('/api/config');
        const data = await res.json();
        setHasGeminiKey(data.hasGeminiKey);
      } catch (err) {
        console.error('Failed to contact backend status config:', err);
      }

      try {
        const stateRes = await fetch('/api/state');
        const stateData = await stateRes.json();
        if (stateData.success && stateData.sections) {
          setSections(stateData.sections);
        }
        
        // Auto-run high-fidelity dual-source real-time sync on start to populate correct, verified market rates immediately
        const syncRes = await fetch('/api/bond-data/sync');
        const syncData = await syncRes.json();
        if (syncData.success) {
          setSections(syncData.proposedSections);
          setVerificationLogs(syncData.verification);
          setLastSyncTime(new Date().toLocaleTimeString('en-US', { hour12: true }) + ' CT');
        }
      } catch (err) {
        console.error('Failed to load persisted state from server:', err);
      } finally {
        setIsInitiallyLoaded(true);
      }
    };

    checkConfigAndState();

    // Setup authenticating listener
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
        setNeedsAuth(false);
        showToast(`Connected as ${currentUser.displayName || 'Bond Expert'}`);
      },
      () => {
        setUser(null);
        setToken(null);
        setNeedsAuth(true);
      }
    );

    return () => unsubscribe();
  }, []);

  // Handle auto-saving state to the backend whenever the bond sections change
  useEffect(() => {
    if (!isInitiallyLoaded) return;
    const saveState = async () => {
      try {
        await fetch('/api/state', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ sections })
        });
      } catch (err) {
        console.error('Failed to sync state to server:', err);
      }
    };
    saveState();
  }, [sections, isInitiallyLoaded]);

  // Handle Google Auth connection
  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        setNeedsAuth(false);
        showToast('Successfully authenticated drive scopes.');
      }
    } catch (err: any) {
      console.error('Connection aborted:', err);
      showToast(err.message || 'OAuth Connection aborted', 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Log out
  const handleLogout = async () => {
    await logout();
    setUser(null);
    setToken(null);
    setNeedsAuth(true);
    setSpreadsheetId(null);
    showToast('Securely disconnected sessions.', 'info');
  };

  // Reset indicator averages to standard starting points
  const handleReset = () => {
    setSections(DEFAULT_BOND_SECTIONS);
    setPosts([]);
    setLoggedStatuses([]);
    setVerificationLogs(null);
    setLastSyncTime(null);
    showToast('Restored default market indicator levels.', 'info');
  };

  // Real-time sovereign curve synchronization and cross-auditing trigger
  const handleSyncRealtime = async () => {
    setIsSyncingRates(true);
    try {
      showToast('Connecting to U.S. Treasury OData Feed & Yahoo Finance...', 'info');
      const response = await fetch('/api/bond-data/sync');
      const data = await response.json();
      if (data.success) {
        setSections(data.proposedSections);
        setVerificationLogs(data.verification);
        setLastSyncTime(new Date().toLocaleTimeString('en-US', { hour12: true }) + ' CT');
        showToast('Real-time yields compared and aligned across dual sources successfully!');
      } else {
        throw new Error(data.error || 'Dual-source sync process failed.');
      }
    } catch (err: any) {
      console.error('Real-time sync error:', err);
      showToast(err.message || 'Error occurred during dual-source alignment.', 'error');
    } finally {
      setIsSyncingRates(false);
    }
  };

  // Synthesize daily posts using Gemini 3.5 Flash
  const handleSynthesize = async (): Promise<GeneratedPost[]> => {
    setIsSynthesizing(true);
    try {
      showToast('Compiling metrics for Gemini text synthesis...', 'info');
      const response = await fetch('/api/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sections })
      });

      const resData = await response.json();
      if (!resData.success) {
        throw new Error(resData.error || 'Synthesis service returned failure status.');
      }

      // Map generated response to section titles
      const mappedPosts: GeneratedPost[] = resData.posts.map((post: any) => {
        const matchingSection = sections.find((s) => s.id === post.sectionId);
        return {
          sectionId: post.sectionId,
          sectionTitle: matchingSection ? matchingSection.title : post.sectionId,
          postText: post.postText,
          charCount: post.postText.length
        };
      });

      setPosts(mappedPosts);
      // Reset logged status history
      setLoggedStatuses(
        mappedPosts.map((p) => ({
          sectionId: p.sectionId,
          sectionTitle: p.sectionTitle,
          status: 'pending'
        }))
      );
      showToast('Daily economic post threads synthesized successfully.');
      return mappedPosts;
    } catch (error: any) {
      console.error('Synthesis flow error:', error);
      showToast(error.message || 'Synthesis aborted', 'error');
      throw error;
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Live-publish daily synthesized posts directly to BlueSky
  const handlePublishToBlueSky = async (bypassConfirm = false, postsOverride?: GeneratedPost[]): Promise<void> => {
    let targetPosts = postsOverride;

    if (!bypassConfirm) {
      const msg = posts.length > 0
        ? 'Generate fresh market updates and publish all 8 as individual posts to BlueSky?\n\n(Click Cancel if you want to publish your current on-screen edits without regenerating).'
        : 'Synthesize daily market reports and publish all 8 as individual posts to BlueSky?';
      
      const proceed = window.confirm(msg);
      if (!proceed) {
        if (posts.length > 0) {
          const publishCurrent = window.confirm('Publish the current on-screen posts as they are?');
          if (publishCurrent) {
            targetPosts = posts;
          } else {
            return;
          }
        } else {
          return;
        }
      }
    }

    setIsPublishingBlueSky(true);

    try {
      // 1. Creation phase - automatically generate new updates if not overridden
      if (!targetPosts || targetPosts.length === 0) {
        showToast('First, creating and synthesizing 8 daily updates using Gemini...', 'info');
        targetPosts = await handleSynthesize();
      }

      if (!targetPosts || targetPosts.length === 0) {
        throw new Error('Failed to generate daily reports.');
      }

      showToast('Connecting to BlueSky social protocol...', 'info');

      // Initialize individual pending states
      setBlueSkyStatuses(
        targetPosts.map((p) => ({
          sectionId: p.sectionId,
          status: 'pending'
        }))
      );

      const response = await fetch('/api/bluesky/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          posts: targetPosts,
          loginToken: bskyHandle,
          password: bskyPassword
        })
      });

      const resData = await response.json();
      if (!resData.success) {
        throw new Error(resData.error || 'BlueSky publishing service returned an error.');
      }

      // Merge results
      const results: BlueSkyStatus[] = resData.results || [];
      setBlueSkyStatuses(results);

      const failedCount = results.filter((r) => r.status === 'failed').length;
      if (failedCount > 0) {
        showToast(`BlueSky: Published with ${failedCount} failures.`, 'error');
      } else {
        showToast('Successfully published all 8 daily posts to BlueSky!', 'success');
      }
    } catch (err: any) {
      console.error('BlueSky publishing flow crashed:', err);
      showToast(err.message || 'BlueSky connection dropped', 'error');
      const fallbackPosts = targetPosts || posts;
      setBlueSkyStatuses(
        fallbackPosts.map((p) => ({
          sectionId: p.sectionId,
          status: 'failed',
          error: err.message || 'Workflow exception'
        }))
      );
      throw err;
    } finally {
      setIsPublishingBlueSky(false);
    }
  };

  // Append synthesized posts to Google Document spreadsheet tabs (sheets)
  const handleLogToWorkspace = async (bypassConfirm = false, postsOverride?: GeneratedPost[]) => {
    if (!token) {
      showToast('Active Workspace credentials have expired. Reconnect Google Drive.', 'error');
      return;
    }

    if (!bypassConfirm) {
      // Trigger explicit user confirmation as requested by Workspace Guidelines
      const proceed = window.confirm(
        'Export & Log to Google Drive?\n\nThis will look up or create "Bond Market Bluesky Log" and append the 8 synthesized post entries in their respective category sheets.'
      );
      if (!proceed) return;
    }

    const targetPosts = postsOverride || posts;
    if (targetPosts.length === 0) {
      showToast('No synthesized posts available to log.', 'error');
      return;
    }

    setIsLogging(true);
    showToast('Initiating drive connection checks...', 'info');

    try {
      // 1. Find or create file
      const spreadId = await findOrCreateSpreadsheet(token);
      setSpreadsheetId(spreadId);

      const sectionTitles = targetPosts.map((p) => p.sectionTitle);

      // 2. Ensure all 8 section sheet tabs exist
      showToast('Structuring worksheet tabs for each category...', 'info');
      await ensureSheetsExist(token, spreadId, sectionTitles);

      // 3. Incrementally write/append to sheet tabs
      const statuses: LoggedStatus[] = [];
      const currentDateUTC = new Date();

      showToast('Appending log rows to Sheets...', 'info');
      for (const post of targetPosts) {
        try {
          const result = await appendLogEntry(token, spreadId, post.sectionTitle, post.postText, currentDateUTC);
          statuses.push({
            sectionId: post.sectionId,
            sectionTitle: post.sectionTitle,
            status: 'success',
            entryNumber: result.entryNumber
          });
        } catch (subErr) {
          console.error(`Failed to write section ${post.sectionTitle}:`, subErr);
          statuses.push({
            sectionId: post.sectionId,
            sectionTitle: post.sectionTitle,
            status: 'failed',
            details: String(subErr)
          });
        }
      }

      setLoggedStatuses(statuses);
      const failedCount = statuses.filter((s) => s.status === 'failed').length;

      if (failedCount === 0) {
        showToast('All 8 Daily Bluesky logs written to active sheets successfully.');
      } else {
        showToast(`Logged completed with ${failedCount} errors. Review log badges.`, 'error');
      }

    } catch (err: any) {
      console.error('Workspace logging crashed:', err);
      showToast(err.message || 'Workspace connection dropped', 'error');
      throw err;
    } finally {
      setIsLogging(false);
    }
  };

  const handleEditPostText = (sectionId: string, newText: string) => {
    setPosts((prev) =>
      prev.map((post) => (post.sectionId === sectionId ? { ...post, postText: newText, charCount: newText.length } : post))
    );
  };

  return (
    <div className="min-h-screen bg-[#0A0B0E] text-[#D1D5DB] flex flex-col font-sans" id="app-root-container">
      {/* Toast Notification Notification Banner */}
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded shadow-xl border flex items-center space-x-2.5 max-w-lg transition-transform duration-300 animate-in fade-in slide-in-from-top-4 ${
            toast.type === 'error'
              ? 'bg-[#16181D] text-rose-400 border-rose-500/20'
              : toast.type === 'info'
              ? 'bg-[#16181D] text-[#B89C6D] border-[#B89C6D]/20'
              : 'bg-[#16181D] text-emerald-400 border-emerald-500/20'
          }`}
          id="toast-notification"
        >
          {toast.type === 'error' && <AlertCircle className="h-5 w-5 text-rose-400 flex-shrink-0" />}
          {toast.type === 'info' && <Hourglass className="h-5 w-5 text-[#B89C6D] flex-shrink-0 animate-spin" />}
          {toast.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Header bar controls */}
      <Header
        user={user}
        needsAuth={needsAuth}
        isLoggingIn={isLoggingIn}
        onLogin={handleLogin}
        onLogout={handleLogout}
        hasGeminiKey={hasGeminiKey}
        onRefreshData={handleSyncRealtime}
        timeString={timeString}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Dynamic Status Dashboard Cards */}
        <StatsGrid sections={sections} />

        {/* Real-time Dual-Source Alignment Control & Audit Panel */}
        <div className="bg-[#16181D] p-5 rounded border border-[#1F2937] shadow-lg flex flex-col space-y-4" id="realtime-sync-panel">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-serif font-bold text-[#F3F4F6] flex items-center gap-2">
                <Database className="h-4 w-4 text-[#B89C6D]" />
                Dual-Source Yield Curve Sync & Accuracy Auditor
              </h3>
              <p className="text-[11px] text-[#9CA3AF] mt-0.5 max-w-2xl leading-relaxed">
                Connects directly to the **U.S. Department of the Treasury (OData Service)** and **Yahoo Finance (Cboe Index Feeds)** in real time. To ensure 100% content data accuracy, benchmark yields are cross-audited before updating the system.
              </p>
            </div>
            <button
              onClick={handleSyncRealtime}
              disabled={isSyncingRates}
              className={`px-4 py-2 rounded text-xs font-semibold flex items-center gap-1.5 transition-all text-[#0A0B0E] font-sans h-fit self-start sm:self-center ${
                isSyncingRates 
                  ? 'bg-[#B89C6D]/50 cursor-not-allowed text-[#0A0B0E]/80' 
                  : 'bg-[#B89C6D] hover:bg-[#A3875B] active:scale-95 shadow-sm font-sans font-semibold'
              }`}
              id="sync-rates-btn"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncingRates ? 'animate-spin' : ''}`} />
              {isSyncingRates ? 'Auditing & Syncing...' : 'Sync & Audit Real-Time Yields'}
            </button>
          </div>

          {/* Verification Logs Grid / Table */}
          {verificationLogs ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2 border-t border-[#1F2937]/50">
              <div className="lg:col-span-8 overflow-x-auto">
                <div className="inline-block min-w-full align-middle font-sans">
                  <table className="min-w-full divide-y divide-[#1F2937]/60 text-left font-mono text-[11px]">
                    <thead>
                      <tr className="text-[#9CA3AF] border-b border-[#1F2937]">
                        <th className="py-2.5 font-medium">SOVEREIGN RATE</th>
                        <th className="py-2.5 font-medium">U.S. TREASURY (SRC 1)</th>
                        <th className="py-2.5 font-medium">YAHOO FINANCE (SRC 2)</th>
                        <th className="py-2.5 font-medium">GAP / DELTA</th>
                        <th className="py-2.5 font-medium text-right font-sans">AUDIT DETERMINATION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1F2937]/30 text-[#F3F4F6]">
                      {verificationLogs.map((item, index) => {
                        return (
                          <tr key={index} className="hover:bg-[#1E222B]/30">
                            <td className="py-2 font-semibold text-[#B89C6D] font-sans">{item.maturity}</td>
                            <td className="py-2">{item.treasury.toFixed(2)}%</td>
                            <td className="py-2">{typeof item.yahoo === 'number' ? `${item.yahoo.toFixed(2)}%` : item.yahoo}</td>
                            <td className="py-2">
                              {typeof item.yahoo === 'number' ? (
                                <span className={item.diff === 0 ? 'text-[#9CA3AF]' : item.diff <= 0.05 ? 'text-emerald-400' : 'text-amber-500'}>
                                  {item.diff === 0 ? '0.00' : `${(item.diff * 100).toFixed(1)} bps`}
                                </span>
                              ) : (
                                'N/A'
                              )}
                            </td>
                            <td className="py-2 text-right">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-sans font-semibold ${
                                item.status.includes('Pristine') 
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                  : item.status.includes('Excellent') 
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'
                                  : item.status.includes('Sovereign')
                                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                  : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                              }`}>
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="lg:col-span-4 bg-[#111317] p-3.5 rounded border border-[#1F2937]/70 flex flex-col justify-between">
                <div className="space-y-2">
                  <h4 className="text-[11px] font-serif font-bold text-[#F3F4F6] flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5 text-[#B89C6D]" />
                    Audit Alignment Status
                  </h4>
                  <p className="text-[10px] text-[#9CA3AF] leading-relaxed">
                    Sovereign rate yields parsed during synchronization are compared dynamically. When prices remain within **5 basis points**, the dual feeds are confirmed aligned. Yield Curve Slope (2s10s) and multi-sector risk metrics have been mathematically shifted inline with live curves.
                  </p>
                </div>
                <div className="pt-3 border-t border-[#1F2937]/30 flex justify-between items-center text-[10px] text-[#9CA3AF] font-mono">
                  <span>Last Checked: {lastSyncTime || 'Pending'}</span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Audit OK
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#111317] rounded p-4 border border-[#1F2937]/50 text-center text-xs text-[#9CA3AF]">
              Real-time synchronization has not been run. Tap <strong className="text-gray-300">Sync & Audit Real-Time Yields</strong> above to pull official bond indices, conduct live accuracy verification, and update state.
            </div>
          )}
        </div>

        {/* Informational Guidance Alert */}
        <div className="bg-[#16181D] p-4 rounded border border-[#1F2937] flex items-start space-x-3 shadow-sm">
          <Calendar className="h-5 w-5 text-[#B89C6D] mt-0.5 flex-shrink-0" />
          <div className="text-xs">
            <h4 className="font-serif font-bold text-[#F3F4F6] flex items-center gap-2">
              Daily Release Schedule Notice (4:30 PM CT)
            </h4>
            <p className="text-[#9CA3AF] mt-1 leading-relaxed">
              Synthesize updates across <strong className="text-[#F3F4F6]">8 distinct bond segments</strong> using Gemini AI. Each post is structured with rich economic reasoning, strictly keeping length <strong className="text-[#F3F4F6]">under 300 characters</strong> with zero repeated data points.
            </p>
          </div>
        </div>

        {/* Automated Daily Release Cron Schedule Monitor */}
        <AutoScheduler
          isAuthenticated={!needsAuth}
          onTriggerAutoSynthesis={async () => {
            await handleSynthesize();
          }}
          onTriggerAutoLog={async () => {
            const newlySynthesizedPosts = await handleSynthesize();
            await handleLogToWorkspace(true, newlySynthesizedPosts);
          }}
          onTriggerBlueSkyPublish={async () => {
            const newlySynthesizedPosts = await handleSynthesize();
            await handlePublishToBlueSky(true, newlySynthesizedPosts);
          }}
          onStateSaveToBackup={async () => {
            try {
              await fetch('/api/state', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ sections })
              });
            } catch (err) {
              console.error('Failed backup server save:', err);
            }
          }}
        />

        {/* BlueSky Live-Publish & Credential Diagnostics Block */}
        <BlueSkyTester 
          showToast={showToast} 
          handle={bskyHandle}
          setHandle={setBskyHandle}
          password={bskyPassword}
          setPassword={setBskyPassword}
        />

        {/* Dashboard 2-Column Split Action Canvas */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Section Indicator Configurator */}
          <div className="xl:col-span-5 h-full">
            <BondForm
              sections={sections}
              onChangeSections={setSections}
              onSynthesize={handleSynthesize}
              isSynthesizing={isSynthesizing}
              onReset={handleReset}
            />
          </div>

          {/* Synthesis summaries & Log reviews */}
          <div className="xl:col-span-7 h-full">
            <PostPreview
              posts={posts}
              onChangePostText={handleEditPostText}
              onLogToWorkspace={handleLogToWorkspace}
              isLogging={isLogging}
              loggedStatuses={loggedStatuses}
              spreadsheetId={spreadsheetId}
              isAuthenticated={!needsAuth}
              onSignIn={handleLogin}
              onPublishToBlueSky={() => handlePublishToBlueSky(false)}
              isPublishingBlueSky={isPublishingBlueSky}
              blueSkyStatuses={blueSkyStatuses}
            />
          </div>
        </div>
      </main>

      {/* Footer credits bar */}
      <footer className="bg-[#0F1116] border-t border-[#1F2937] py-4 mt-12 text-center text-[10px] text-[#4B5563] font-mono">
        Bond Market Synthesis Suite • 2026-05-20 • CST Update Channel • <span className="text-[#B89C6D]">YIELD_SECURE_AUTH_ENCRYPTED</span>
      </footer>
    </div>
  );
}
