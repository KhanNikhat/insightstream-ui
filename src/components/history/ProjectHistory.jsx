import React, { useState, useEffect, useMemo } from 'react';

const API_BASE_URL = 'http://localhost:5000/api/projects';

export default function ProjectHistory({ onSelectProject, user }) {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Determine active user ID (email or ID if logged in, fallback to 'default_user')
  const activeUserId = user?.email || user?.id || 'default_user';

  // 1. Fetch saved sessions from MongoDB Atlas when activeUserId changes
  useEffect(() => {
    fetchProjects();
  }, [activeUserId]);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/${activeUserId}`);
      const data = await response.json();
      if (response.ok) {
        setProjects(data);
      } else {
        console.error('Failed to fetch projects from server:', data.error);
      }
    } catch (err) {
      console.error('Network error fetching projects from MongoDB:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Delete project session from MongoDB Atlas
  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this saved exploration from MongoDB?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setProjects((prev) => prev.filter((p) => p._id !== id && p.id !== id));
        } else {
          alert('Failed to delete project session from database.');
        }
      } catch (err) {
        console.error('Error deleting project session:', err);
        alert('Error connecting to backend server.');
      }
    }
  };

  // Filter projects by search query and chart type
  const filteredProjects = useMemo(() => {
    return projects.filter((item) => {
      const matchesSearch =
        (item.title && item.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.datasetName && item.datasetName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      const activeChartType = item.chartConfig?.type || item.chartType || 'bar';
      const matchesType = filterType === 'all' || activeChartType === filterType;

      return matchesSearch && matchesType;
    });
  }, [projects, searchQuery, filterType]);

  const getChartIcon = (type) => {
    switch (type) {
      case 'bar':
        return '📊';
      case 'line':
        return '📈';
      case 'pie':
        return '🍕';
      default:
        return '📑';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Search Control */}
      <div className="bg-white border border-pink-100/80 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Saved Project History</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Reload saved datasets, AI conversation threads, and visual blueprints from MongoDB Atlas.
          </p>
        </div>

        {/* Stats Pill */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-pink-50/70 border border-pink-200/50 rounded-2xl text-xs font-semibold text-pink-700">
            Cloud Sessions: <span className="font-extrabold">{projects.length}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Search Field */}
        <div className="relative flex-1 w-full">
          <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects, datasets, or notes..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-pink-500 transition-colors shadow-sm"
          />
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-600 focus:outline-none focus:border-pink-500 shadow-sm"
          >
            <option value="all">All Chart Types</option>
            <option value="bar">Bar Charts</option>
            <option value="line">Line Trends</option>
            <option value="pie">Pie Distributions</option>
          </select>
        </div>
      </div>

      {/* Loading & Empty State */}
      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center">
          <span className="text-sm font-semibold text-slate-500">⚡ Fetching saved sessions from MongoDB Atlas...</span>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-12 text-center">
          <span className="text-3xl block mb-2">☁️</span>
          <h3 className="text-sm font-bold text-slate-700">No saved sessions found in database</h3>
          <p className="text-xs text-slate-400 mt-1">
            {searchQuery ? 'No sessions matched your search query.' : 'Save your active exploration session from the dashboard to sync it here!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((proj) => {
            const projectId = proj._id || proj.id;
            const chartType = proj.chartConfig?.type || proj.chartType || 'bar';
            const xAxis = proj.chartConfig?.xAxis || proj.xAxis || 'N/A';
            const yAxis = proj.chartConfig?.yAxis || proj.yAxis || 'N/A';

            return (
              <div
                key={projectId}
                className="bg-white border border-pink-100/80 hover:border-pink-300/80 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Header Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200/60 uppercase tracking-wider">
                      <span>{getChartIcon(chartType)}</span>
                      {chartType} Chart
                    </span>

                    <span className="text-[11px] font-medium text-slate-400">
                      {new Date(proj.updatedAt || Date.now()).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>

                  {/* Title and Dataset Name */}
                  <h3 className="text-sm font-bold text-slate-800 group-hover:text-pink-600 transition-colors line-clamp-1">
                    {proj.title || 'Untitled Dataset Exploration'}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                    📄 {proj.datasetName || 'dataset.csv'}
                  </p>

                  {/* Dataset Metadata Badges */}
                  <div className="grid grid-cols-3 gap-2 my-4 py-2.5 px-3 bg-slate-50/80 rounded-2xl border border-slate-100 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Rows</span>
                      <span className="text-xs font-black text-slate-700">{proj.rowCount || 0}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Cols</span>
                      <span className="text-xs font-black text-slate-700">{proj.colCount || 0}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Quality</span>
                      <span className="text-xs font-black text-emerald-600">{proj.completeness || '100%'}</span>
                    </div>
                  </div>

                  {/* Axis Configuration */}
                  <div className="text-[11px] text-slate-500 space-y-1 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">X-Axis Mapping:</span>
                      <span className="font-semibold text-slate-700">{xAxis}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Y-Axis Mapping:</span>
                      <span className="font-semibold text-slate-700">{yAxis}</span>
                    </div>
                  </div>

                  {/* Notes */}
                  {proj.notes && (
                    <p className="text-[11px] text-slate-500 italic bg-pink-50/40 p-2.5 rounded-xl border border-pink-100/50 mb-4 line-clamp-2">
                      "{proj.notes}"
                    </p>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100 mt-2">
                  <button
                    onClick={() => onSelectProject && onSelectProject(proj)}
                    className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 hover:opacity-95 text-white text-xs font-bold transition-all shadow-sm"
                  >
                    Load Session
                  </button>
                  <button
                    onClick={(e) => handleDelete(projectId, e)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-400 text-xs transition-colors"
                    title="Delete Session"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}