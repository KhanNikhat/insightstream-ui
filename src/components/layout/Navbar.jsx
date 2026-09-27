import React, { useState, useRef, useEffect } from 'react';

export default function Navbar({ 
  user, 
  activeDatasetName, 
  onLogout, 
  onOpenAuth, 
  onSaveSession, 
  hasDataset, 
  activeTab 
}) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Extract initial for avatar
  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'U';

  return (
    <header className="h-16 px-6 bg-white/80 backdrop-blur-md border-b border-pink-100/60 flex items-center justify-between relative z-30">
      {/* Workspace Indicator */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Analytics Workspace
        </span>

        {activeDatasetName && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-pink-50 text-pink-600 border border-pink-200/50">
            <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
            Active: {activeDatasetName}
          </span>
        )}
      </div>

      {/* Right Section: Actions & Auth State */}
      <div className="flex items-center gap-3">
        {/* Save Session Button - Appears when a dataset is loaded on the workspace tab */}
        {hasDataset && activeTab === 'workspace' && (
          <button
            onClick={onSaveSession}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-pink-50 hover:bg-pink-100/80 text-pink-700 border border-pink-200/60 text-xs font-bold transition-all shadow-sm active:scale-95"
            title="Save current session to MongoDB Atlas"
          >
            <span>💾</span>
            <span className="hidden sm:inline">Save Session</span>
          </button>
        )}

        {user ? (
          /* LOGGED IN: Displays ONLY the avatar circle button */
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-9 h-9 rounded-full bg-pink-100 border-2 border-pink-200 text-pink-700 font-bold flex items-center justify-center text-sm shadow-sm hover:ring-2 hover:ring-pink-300 transition-all focus:outline-none"
              title={user.email}
            >
              {userInitial}
            </button>

            {/* Profile Dropdown Box */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-pink-100 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Signed in as</p>
                  <p className="text-xs font-bold text-slate-700 truncate mt-0.5">{user.email}</p>
                </div>

                <div className="p-1">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      onLogout && onLogout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                  >
                    <span>🚪</span>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* LOGGED OUT: Displays User Icon + Login / Register Button */
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 border border-slate-200 flex items-center justify-center text-xs font-semibold">
              👤
            </div>
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 text-white text-xs font-bold shadow-sm hover:opacity-95 transition-all"
            >
              Login / Register
            </button>
          </div>
        )}
      </div>
    </header>
  );
}