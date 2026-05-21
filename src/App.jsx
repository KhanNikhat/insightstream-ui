function App() {
  return (
    // 1. The Main Wrapper: Full screen height, ultra-dark background, text color, and Flexbox to put children side-by-side
    <div className="flex h-screen bg-neutral-950 text-neutral-100 font-sans">
      
      {/* 2. The Sidebar: Fixed width (w-64 = 16rem), subtle right border*/}
      <aside className="w-64 border-r border-neutral-800 bg-neutral-900/50 p-6 flex flex-col">
        <h1 className="text-xl font-bold tracking-tight text-white mb-8">
          InsightStream<span className="text-emerald-400">.AI</span>
        </h1>
        
        <nav className="flex flex-col gap-4 text-sm text-neutral-400">
          <a href="#" className="hover:text-white transition-colors">Dashboard</a>
          <a href="#" className="hover:text-white transition-colors">Data Upload</a>
          <a href="#" className="hover:text-white transition-colors">Chat Assistant</a>
          <a href="#" className="hover:text-white transition-colors">Settings</a>
        </nav>
      </aside>

      {/* 3. The Main Content Area: flex-1 makes it take up all remaining space*/}
      <main className="flex-1 flex flex-col">
        
        {/* 4. The Top Navbar: Fixed height, subtle bottom border*/}
        <header className="h-16 border-b border-neutral-800 flex items-center justify-between px-8">
          <div className="text-sm text-neutral-400">Workspace / Analytics</div>
          <div className="h-8 w-8 rounded-full bg-neutral-800 border border-neutral-700"></div>
        </header>

        {/* 5. The Dashboard Canvas: Where our charts and upload boxes will go*/}
        <section className="p-8">
          <h2 className="text-2xl font-semibold mb-6">Overview</h2>
          
          {/* Placeholder for a chart or upload zone */}
          <div className="h-64 rounded-xl border border-neutral-800 bg-neutral-900/30 flex items-center justify-center border-dashed">
            <p className="text-neutral-500 text-sm">Drop CSV file here to begin analysis...</p>
          </div>
        </section>

      </main>
      
    </div>
  )
}

export default App