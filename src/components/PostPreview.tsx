import { useState } from 'react';
import { GeneratedPost, LoggedStatus, BlueSkyStatus } from '../types';
import { FileSpreadsheet, Eye, ClipboardCheck, Edit3, Database, Sparkles, CheckCircle, HelpCircle, AlertTriangle, FileCheck, Check } from 'lucide-react';

interface PostPreviewProps {
  posts: GeneratedPost[];
  onChangePostText: (sectionId: string, newText: string) => void;
  onLogToWorkspace: () => void;
  isLogging: boolean;
  loggedStatuses: LoggedStatus[];
  spreadsheetId: string | null;
  isAuthenticated: boolean;
  onSignIn: () => void;
  onPublishToBlueSky: () => void;
  isPublishingBlueSky: boolean;
  blueSkyStatuses: BlueSkyStatus[];
}

export default function PostPreview({
  posts,
  onChangePostText,
  onLogToWorkspace,
  isLogging,
  loggedStatuses,
  spreadsheetId,
  isAuthenticated,
  onSignIn,
  onPublishToBlueSky,
  isPublishingBlueSky,
  blueSkyStatuses
}: PostPreviewProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getLogStatus = (sectionId: string) => {
    return loggedStatuses.find((status) => status.sectionId === sectionId);
  };

  if (posts.length === 0) {
    return (
      <div className="bg-[#16181D] rounded-lg border border-[#1F2937] p-8 text-center" id="empty-posts-preview">
        <Sparkles className="h-8 w-8 text-[#B89C6D] mx-auto mb-3" />
        <h3 className="text-xs font-bold text-[#F3F4F6] tracking-wider uppercase">No Summaries Synthesized Yet</h3>
        <p className="text-xs text-[#9CA3AF] mt-2 max-w-sm mx-auto mb-4">
          Configure indicator changes on the left, then click "Synthesize 8 Daily BlueSky Posts" to generate expert updates.
        </p>
        <div className="flex justify-center">
          <button
            onClick={onPublishToBlueSky}
            disabled={isPublishingBlueSky}
            className={`px-5 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isPublishingBlueSky
                ? 'bg-sky-500/20 text-sky-400/50 border border-sky-500/10 cursor-not-allowed'
                : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white shadow-lg active:translate-y-px'
            }`}
            id="bluesky-publish-empty-state-btn"
          >
            <span className="text-sm">🦋</span>
            {isPublishingBlueSky ? 'Creating & Publishing...' : 'Create & Publish to BlueSky'}
          </button>
        </div>
      </div>
    );
  }

  // Count posts exceeding limit
  const numExceeding = posts.filter((p) => p.postText.length > 300).length;

  return (
    <div className="space-y-6" id="post-preview-container">
      {/* Container Header */}
      <div className="bg-[#16181D] p-5 rounded-lg border border-[#1F2937] shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-[#F3F4F6] flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#B89C6D]" />
            Synthesized BlueSky Updates Preview
          </h2>
          <p className="text-xs text-[#9CA3AF] mt-1">
            Macro-analysis completed. Review and tweak summaries before sending to Google Docs logs.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            {/* BlueSky Live-Publishing Action */}
            <button
              onClick={onPublishToBlueSky}
              disabled={isPublishingBlueSky || numExceeding > 0}
              className={`px-4 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                isPublishingBlueSky || numExceeding > 0
                  ? 'bg-sky-500/20 text-sky-400/50 border border-sky-500/10 cursor-not-allowed'
                  : 'bg-sky-500 hover:bg-sky-600 text-white shadow-md active:translate-y-px'
              }`}
              id="bluesky-publish-btn"
            >
              <span className="text-sm">🦋</span>
              {isPublishingBlueSky ? 'Publishing...' : 'Publish to BlueSky'}
            </button>

            {/* Google Sheets Logging Actions */}
            {isAuthenticated ? (
              <button
                onClick={onLogToWorkspace}
                disabled={isLogging || numExceeding > 0}
                className={`px-4 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  isLogging || numExceeding > 0
                    ? 'bg-[#B89C6D]/40 text-[#0F1116]/65 cursor-not-allowed'
                    : 'bg-[#B89C6D] hover:bg-[#977E55] text-[#0F1116] shadow-md active:translate-y-px'
                }`}
                id="append-to-sheets-btn"
              >
                <FileSpreadsheet className="h-4 w-4" />
                {isLogging ? 'Logging...' : 'Log to Sheets'}
              </button>
            ) : (
              <button
                onClick={onSignIn}
                className="px-4 py-2.5 bg-[#1C1F26] text-[#B89C6D] border border-[#2D3748] hover:bg-[#252A34] text-xs font-bold tracking-wider rounded transition-all cursor-pointer flex items-center justify-center gap-1.5"
                id="post-signin-btn"
              >
                <Database className="h-4 w-4 text-[#B89C6D]" />
                Authorize Sheets
              </button>
            )}
          </div>
          
          {numExceeding > 0 && (
            <span className="text-[10px] text-rose-400 font-semibold flex items-center mt-1 mr-1">
              <AlertTriangle className="h-3 w-3 mr-1 text-rose-400" />
              Fix posts exceeding 300 character limit
            </span>
          )}
        </div>
      </div>

      {/* Spreadsheet Status Link */}
      {spreadsheetId && isAuthenticated && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-emerald-400 font-medium font-mono">
            <FileCheck className="h-4 w-4 text-emerald-400" />
            <span>Connected Logs: <strong className="text-emerald-300">Bond Market Bluesky Log</strong></span>
          </div>
          <a
            href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-[#B89C6D] hover:text-[#977E55] font-bold hover:underline"
          >
            Open in Google Sheets ↗
          </a>
        </div>
      )}

      {/* Grid of Section Posts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {posts.map((post) => {
          const charCount = post.postText.length;
          const isOverLimit = charCount > 300;
          const status = getLogStatus(post.sectionId);
          const bskyStatus = blueSkyStatuses.find((s) => s.sectionId === post.sectionId);

          return (
            <div
              key={post.sectionId}
              className={`bg-[#16181D] rounded-lg border p-4 shadow-sm flex flex-col justify-between transition-all ${
                status?.status === 'success' || bskyStatus?.status === 'success'
                  ? 'border-[#B89C6D]/30 shadow-[#B89C6D]/5 shadow-md bg-[#B89C6D]/[0.02]'
                  : isOverLimit
                  ? 'border-rose-500/50 ring-1 ring-rose-500/10'
                  : 'border-[#1F2937] hover:border-[#374151]'
              }`}
              id={`post-card-${post.sectionId}`}
            >
              {/* Header inside post card */}
              <div className="flex items-start justify-between mb-3">
                <div className="mr-2 space-y-1">
                  <h4 className="text-xs font-serif font-bold text-[#F3F4F6] tracking-tight leading-none mb-1">
                    {post.sectionTitle}
                  </h4>
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {status?.status === 'success' && (
                      <span className="text-[10px] font-mono font-semibold text-emerald-400 flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1 text-emerald-400 flex-shrink-0" />
                        Sheets Logged (Entry #{status.entryNumber})
                      </span>
                    )}
                    {status?.status === 'failed' && (
                      <span className="text-[10px] font-mono font-semibold text-rose-400 flex items-center">
                        <AlertTriangle className="h-3 w-3 mr-1 text-rose-400 flex-shrink-0" />
                        Sheets Failed
                      </span>
                    )}
                    
                    {bskyStatus?.status === 'success' && (
                      <span className="text-[10px] font-mono font-semibold text-sky-400 flex items-center" title={`URI: ${bskyStatus.uri}`}>
                        <span className="mr-1 text-[11px] leading-none">🦋</span>
                        BlueSky Live
                      </span>
                    )}
                    {bskyStatus?.status === 'pending' && (
                      <span className="text-[10px] font-mono font-semibold text-sky-400/80 animate-pulse flex items-center">
                        <span className="mr-1 inline-block animate-spin text-[10px] leading-none">🌀</span>
                        Publishing...
                      </span>
                    )}
                    {bskyStatus?.status === 'failed' && (
                      <span className="text-[10px] font-mono font-semibold text-rose-400/90 flex items-center" title={bskyStatus.error}>
                        <AlertTriangle className="h-3 w-3 mr-1 text-rose-400 flex-shrink-0" />
                        BlueSky Failed
                      </span>
                    )}
                  </div>
                </div>

                {/* Character Counter Meter */}
                <span
                  className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-tight ${
                    isOverLimit
                      ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                      : charCount > 280
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                      : 'bg-[#1C1F26] text-[#B89C6D] border border-[#2D3748]'
                  }`}
                  id={`char-badge-${post.sectionId}`}
                >
                  {charCount} / 300
                </span>
              </div>

              {/* Editable Post Textarea */}
              <textarea
                value={post.postText}
                onChange={(e) => onChangePostText(post.sectionId, e.target.value)}
                maxLength={400}
                rows={4}
                className="w-full bg-[#0F1116] border border-[#2D3748] rounded p-3 text-xs text-[#E5E7EB] focus:bg-[#16181D] focus:border-[#B89C6D] focus:ring-1 focus:ring-[#B89C6D]/20 outline-none resize-none font-sans leading-relaxed"
                placeholder="BlueSky post draft synthesis..."
                id={`post-textarea-${post.sectionId}`}
              />

              {/* Card Footer Actions */}
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-[#1F2937]">
                <div className="text-[9px] text-[#9CA3AF] font-mono whitespace-nowrap">
                  300 CHAR MAX LIMIT
                </div>

                <div className="flex items-center space-x-1">
                  {/* Copy button */}
                  <button
                    onClick={() => handleCopy(post.sectionId, post.postText)}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-[#F3F4F6] hover:text-[#0A0B0E] bg-[#1C1F26] hover:bg-[#B89C6D] border border-[#2D3748] py-1 px-2.5 rounded transition-all cursor-pointer"
                  >
                    {copiedId === post.sectionId ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400 font-bold" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <ClipboardCheck className="h-3 w-3 text-[#9CA3AF] pointer-events-none" />
                        <span>Copy Draft</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
