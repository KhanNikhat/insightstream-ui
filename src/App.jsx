import { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';
import DashboardCanvas from './components/workspace/DashboardCanvas';
import DataVisualizer from './components/workspace/DataVisualizer';
import ChatAssistant from './components/workspace/ChatAssistant';
import ProjectHistory from './components/history/ProjectHistory';
import AuthModal from './components/auth/AuthModal';

function App() {
  // Navigation & Modal State
  const [activeTab, setActiveTab] = useState('workspace'); // 'workspace' | 'history'
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  // Workspace Data, AI Blueprint, Chat & Active Session Tracking
  const [activeProjectId, setActiveProjectId] = useState(null); // Tracks loaded MongoDB project ID
  const [selectedFile, setSelectedFile] = useState(null);
  const [datasetFileName, setDatasetFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [dataset, setDataset] = useState([]);
  const [aiChartConfig, setAiChartConfig] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);

  const openAuth = () => setIsAuthOpen(true);
  const closeAuth = () => setIsAuthOpen(false);

  // 1. Function to save a NEW session to MongoDB Atlas
  const handleSaveSession = async () => {
    if (!dataset || dataset.length === 0) {
      alert("⚠️ Please upload a CSV dataset before saving a project session!");
      return;
    }

    const activeFileName = datasetFileName || (typeof selectedFile === 'string' ? selectedFile : selectedFile?.name) || 'Dataset';
    const title = prompt("Enter a title for this exploration session:", `Analysis - ${activeFileName}`);
    if (!title) return; // User canceled

    const payload = {
      userId: user?.email || user?.id || 'default_user',
      title,
      datasetName: activeFileName,
      rowCount: dataset.length,
      colCount: dataset.length > 0 ? Object.keys(dataset[0]).length : 0,
      completeness: '100%',
      chartConfig: aiChartConfig || { type: 'bar', xAxis: '', yAxis: '' },
      rawDataset: dataset,
      chatHistory: chatMessages || [],
      notes: 'Saved from dashboard session'
    };

    try {
      const res = await fetch('https://insightstream-backend-hcpi.onrender.com/api/projects/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resData = await res.json();

      if (res.ok) {
        // Track the newly created MongoDB ID so subsequent clicks can update it
        const savedId = resData.project?._id || resData._id || resData.id;
        if (savedId) setActiveProjectId(savedId);

        alert('✅ Session saved successfully to MongoDB Atlas!');
      } else {
        alert(`⚠️ Save failed: ${resData.error || 'Server error'}`);
      }
    } catch (err) {
      console.error('Save session error:', err);
      alert('⚠️ Server connection error. Ensure backend is running.');
    }
  };

  // 2. Function to UPDATE an existing session in MongoDB Atlas
  const handleUpdateSession = async () => {
    if (!activeProjectId) {
      alert("⚠️ No saved session selected. Please save as a new session first!");
      return;
    }
    if (!dataset || dataset.length === 0) {
      alert("⚠️ No active dataset to update!");
      return;
    }

    const activeFileName = datasetFileName || (typeof selectedFile === 'string' ? selectedFile : selectedFile?.name) || 'Dataset';

    const payload = {
      userId: user?.email || user?.id || 'default_user',
      datasetName: activeFileName,
      rowCount: dataset.length,
      colCount: dataset.length > 0 ? Object.keys(dataset[0]).length : 0,
      completeness: '100%',
      chartConfig: aiChartConfig || { type: 'bar', xAxis: '', yAxis: '' },
      rawDataset: dataset,
      chatHistory: chatMessages || [],
      notes: 'Updated from dashboard session'
    };

    try {
      const res = await fetch(`https://insightstream-backend-hcpi.onrender.com/api/projects/update/${activeProjectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert('🔄 Session updated successfully!');
      } else {
        const errData = await res.json();
        alert(`⚠️ Update failed: ${errData.error || 'Server error'}`);
      }
    } catch (err) {
      console.error('Update session error:', err);
      alert('⚠️ Server connection error. Ensure backend is running.');
    }
  };

  // 3. Function to restore a selected session into active UI state
  const handleSelectProject = (selectedProject) => {
    // Store MongoDB document ID for updates
    const projectId = selectedProject._id || selectedProject.id;
    if (projectId) {
      setActiveProjectId(projectId);
    }

    if (selectedProject.rawDataset && selectedProject.rawDataset.length > 0) {
      setDataset(selectedProject.rawDataset);
    }
    if (selectedProject.chatHistory) {
      setChatMessages(selectedProject.chatHistory);
    }
    if (selectedProject.chartConfig) {
      setAiChartConfig(selectedProject.chartConfig);
    }
    if (selectedProject.datasetName) {
      setDatasetFileName(selectedProject.datasetName);
      setSelectedFile(selectedProject.datasetName);
    }

    alert(`✅ Loaded session: "${selectedProject.title}"`);
    setActiveTab('workspace'); // Navigates to main workspace tab
  };

  // Clear user authentication and reset workspace state on logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);

    // Reset workspace state on sign-out
    setActiveProjectId(null);
    setSelectedFile(null);
    setDatasetFileName('');
    setDataset([]);
    setAiChartConfig(null);
    setChatMessages([]);
    setIsProcessing(false);
  };

  return (
    <div className="flex h-screen bg-[#FAF5F9] text-slate-800 antialiased font-sans overflow-hidden">

      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        openAuth={openAuth} 
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Top Navbar */}
        <Navbar 
          selectedFile={selectedFile}
          activeDatasetName={datasetFileName || (typeof selectedFile === 'string' ? selectedFile : selectedFile?.name)}
          user={user} 
          openAuth={openAuth}
          onOpenAuth={openAuth}
          onLogout={handleLogout}
          activeTab={activeTab}
          onSaveSession={handleSaveSession}
          hasDataset={dataset.length > 0}
        />

        {/* Scrollable Screen Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 relative">

          {/* VIEW 1: WORKSPACE */}
          {activeTab === 'workspace' && (
            <div>
              {/* Workspace Header Actions */}
              {dataset.length > 0 && !isProcessing && (
                <div className="flex justify-end gap-3 mb-4">
                  {/* Show Update Session button only when an existing project ID is loaded */}
                  {activeProjectId && (
                    <button
                      onClick={handleUpdateSession}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-xs shadow hover:opacity-95 transition-all"
                    >
                      🔄 Update Current Session
                    </button>
                  )}

                  <button
                    onClick={handleSaveSession}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold text-xs shadow hover:opacity-95 transition-all"
                  >
                    {activeProjectId ? '💾 Save as New Session' : '💾 Save Session to Cloud'}
                  </button>
                </div>
              )}

              {/* CSV Upload Area */}
              <DashboardCanvas
                selectedFile={selectedFile} 
                setSelectedFile={(file) => {
                  const fileName = typeof file === 'string' ? file : file?.name;
                  setSelectedFile(fileName);
                  if (fileName) {
                    setDatasetFileName(fileName);
                    // Clear active project ID when fresh CSV is manually dropped
                    setActiveProjectId(null);
                  }
                }}
                isProcessing={isProcessing}
                setIsProcessing={setIsProcessing}
                setDataset={setDataset}
              />

              {/* TWO-COLUMN LAYOUT: Rendered when dataset is ready */}
              {dataset.length > 0 && !isProcessing && (
                <div className="flex flex-col xl:flex-row gap-6 mt-6 w-full animate-fade-in">

                  {/* LEFT COLUMN: Dynamic Data Charts */}
                  <div className="flex-1 min-w-0">
                    <DataVisualizer 
                      data={dataset} 
                      aiChartConfig={aiChartConfig} 
                      onChartConfigChange={setAiChartConfig}
                    />
                  </div>

                  {/* RIGHT COLUMN: AI Chat Assistant */}
                  <div className="w-full xl:w-[400px] flex-shrink-0">
                    <ChatAssistant 
                      dataset={dataset} 
                      onUpdateChart={setAiChartConfig}
                      chatMessages={chatMessages}
                      setChatMessages={setChatMessages}
                    />
                  </div>

                </div>
              )}
            </div>
          )}

          {/* VIEW 2: PROJECT HISTORY */}
          {activeTab === 'history' && (
            <ProjectHistory 
              onSelectProject={handleSelectProject}
              user={user}
            />
          )}

        </div>
      </main>

      {/* AUTHENTICATION OVERLAY MODAL */}
      {isAuthOpen && (
        <AuthModal 
          onClose={closeAuth} 
          setUser={setUser} 
        />
      )}

    </div>
  );
}

export default App;