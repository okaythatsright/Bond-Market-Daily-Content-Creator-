import { User } from 'firebase/auth';
import { LogOut, RefreshCw, Layers, Sparkles, Database } from 'lucide-react';

interface HeaderProps {
  user: User | null;
  needsAuth: boolean;
  isLoggingIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
  hasGeminiKey: boolean;
  onRefreshData?: () => void;
  timeString: string;
}

export default function Header({
  user,
  needsAuth,
  isLoggingIn,
  onLogin,
  onLogout,
  hasGeminiKey,
  onRefreshData,
  timeString
}: HeaderProps) {
  return (
    <header className="bg-[#0F1116] border-b border-[#1F2937] sticky top-0 z-40 shadow-sm" id="dashboard-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="bg-[#B89C6D] text-[#0A0B0E] p-2 rounded flex items-center justify-center shadow-sm">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-serif font-bold text-[#F3F4F6] tracking-tight leading-none flex items-center gap-1.5">
                YieldWise AI Log <span className="text-[#B89C6D] font-normal italic text-xs ml-1.5 pl-1.5 border-l border-[#374151]">Bond Market Expert</span>
              </h1>
              <p className="text-[10px] text-mono text-[#9CA3AF] tracking-widest mt-1 uppercase">
                Professional Communicator & Daily BlueSky Logger
              </p>
            </div>
          </div>

          {/* Controls & User Profile */}
          <div className="flex items-center space-x-4">
            {/* Clock Widget */}
            <div className="hidden md:flex items-center bg-[#16181D] px-3 py-1.5 rounded border border-[#1F2937] text-xs text-[#9CA3AF] font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
              CT: {timeString}
            </div>

            {/* API Status Indicator */}
            <div className="flex items-center text-xs space-x-1 px-2.5 py-1 rounded bg-[#16181D] border border-[#1F2937]">
              <Sparkles className={`h-3 w-3 ${hasGeminiKey ? 'text-[#B89C6D]' : 'text-amber-500'}`} />
              <span className="text-[#9CA3AF]">Gemini:</span>
              <span className={`font-semibold ${hasGeminiKey ? 'text-emerald-400' : 'text-amber-500'}`}>
                {hasGeminiKey ? 'Active' : 'Missing Key'}
              </span>
            </div>

            {/* Google Authentication Portal */}
            {user ? (
              <div className="flex items-center space-x-3 bg-[#16181D] border border-[#1F2937] rounded-full pl-2 pr-3 py-1">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Google Profile'}
                    className="h-7 w-7 rounded-full shadow-inner border border-[#374151]"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-[#B89C6D] text-[#0A0B0E] flex items-center justify-center text-xs font-semibold">
                    {user.displayName?.charAt(0) || 'G'}
                  </div>
                )}
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-medium text-[#F3F4F6] line-clamp-1">{user.displayName || 'Expert User'}</p>
                  <p className="text-[10px] text-[#9CA3AF] line-clamp-1 leading-none">{user.email}</p>
                </div>
                <button
                  onClick={onLogout}
                  className="text-[#9CA3AF] hover:text-red-400 transition-colors p-1 rounded-full hover:bg-[#1C1F26]"
                  title="Logout from Google"
                  id="google-logout-btn"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                disabled={isLoggingIn}
                className="gsi-material-button text-xs !bg-[#16181D] !text-[#F3F4F6] !border-[#1F2937] hover:!bg-[#1C1F26]"
                id="google-login-btn"
              >
                <div className="gsi-material-button-state"></div>
                <div className="gsi-material-button-content-wrapper">
                  <div className="gsi-material-button-icon">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: "block" }}>
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    </svg>
                  </div>
                  <span className="gsi-material-button-contents mt-0.5 font-sans font-medium !text-[#D1D5DB]">
                    {isLoggingIn ? 'Connecting...' : 'Connect Google Drive'}
                  </span>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
