import React from 'react';

export default function Sidebar({ activeTab, setActiveTab }) {
  return (
    <aside className="w-64 bg-white border-r border-pink-100/80 p-5 flex flex-col justify-between min-h-screen">
      <div className="space-y-6">
        {/* Brand Logo */}
        <div className="flex items-center gap-2 px-2">
          <h1 className="text-xl font-black text-slate-800 tracking-tight">
            InsightStream<span className="text-pink-500">.AI</span>
          </h1>
        </div>

        {/* Navigation Tabs */}
        <nav className="space-y-1.5">
          <button
            onClick={() => setActiveTab('workspace')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
              activeTab === 'workspace'
                ? 'bg-pink-50 text-pink-600 shadow-sm border border-pink-100'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <span>📊</span>
            <span>Workspace</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-pink-50 text-pink-600 shadow-sm border border-pink-100'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <span>📁</span>
            <span>Project History</span>
          </button>
        </nav>
      </div>

      {/* Sidebar Footer Indicator */}
      <div className="pt-4 border-t border-slate-100 text-center">
        <span className="text-[10px] font-semibold text-slate-400">
          InsightStream v1.0 • Pro
        </span>
      </div>
    </aside>
  );
}