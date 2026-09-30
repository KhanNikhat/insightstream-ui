import React, { useState, useMemo, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

const PIE_COLORS = ['#ec4899', '#8b5cf6', '#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function DataVisualizer({ data, aiChartConfig, onChartConfigChange }) {
  const [chartType, setChartType] = useState('bar'); // 'bar' | 'line' | 'pie'

  // Extract column keys and identify numeric vs categorical
  const columns = useMemo(() => {
    if (!data || data.length === 0) return { all: [], numeric: [], categorical: [] };
    const keys = Object.keys(data[0]);
    const numeric = keys.filter((k) => !isNaN(Number(data[0][k])) && data[0][k] !== '');
    const categorical = keys.filter((k) => isNaN(Number(data[0][k])) || data[0][k] === '');
    return { all: keys, numeric, categorical };
  }, [data]);

  const [xAxis, setXAxis] = useState('');
  const [yAxis, setYAxis] = useState('');

  // Set initial default axes once dataset loads
  useEffect(() => {
    if (columns.all.length > 0) {
      setXAxis(columns.categorical[0] || columns.all[0] || '');
      setYAxis(columns.numeric[0] || columns.all[1] || columns.all[0] || '');
    }
  }, [columns]);

  // Handle AI chart configuration sync
  useEffect(() => {
    if (aiChartConfig) {
      if (aiChartConfig.type && ['bar', 'line', 'pie'].includes(aiChartConfig.type.toLowerCase())) {
        setChartType(aiChartConfig.type.toLowerCase());
      }
      if (aiChartConfig.xAxis && columns.all.includes(aiChartConfig.xAxis)) {
        setXAxis(aiChartConfig.xAxis);
      }
      if (aiChartConfig.yAxis && columns.all.includes(aiChartConfig.yAxis)) {
        setYAxis(aiChartConfig.yAxis);
      }
    }
  }, [aiChartConfig, columns]);

  // Sync active chart state back to parent so Save Session captures manual changes
  useEffect(() => {
    if (onChartConfigChange && xAxis && yAxis) {
      onChartConfigChange({
        type: chartType,
        xAxis: xAxis,
        yAxis: yAxis
      });
    }
  }, [chartType, xAxis, yAxis, onChartConfigChange]);

  // Calculate high-level KPI summary stats
  const kpis = useMemo(() => {
    if (!data || data.length === 0) return null;

    const totalCols = columns.all ? columns.all.length : Object.keys(data[0]).length;
    const totalCells = data.length * totalCols;
    
    let filledCells = 0;
    data.forEach((row) => {
      (columns.all || Object.keys(row)).forEach((col) => {
        if (row[col] !== null && row[col] !== undefined && String(row[col]).trim() !== '') {
          filledCells++;
        }
      });
    });

    const completenessPercent = Math.round((filledCells / (totalCells || 1)) * 100);

    return {
      totalRows: data.length,
      totalCols: totalCols,
      completeness: `${completenessPercent}%`
    };
  }, [data, columns]);

  // Aggregated data calculation (Groups duplicate X-Axis categories together)
  const chartData = useMemo(() => {
    if (!data || !xAxis || !yAxis) return [];

    // 1. Group & Aggregate rows by X-Axis category
    const aggregated = data.reduce((acc, item) => {
      const rawCategory = item[xAxis];
      const category = rawCategory !== null && rawCategory !== undefined && String(rawCategory).trim() !== ''
        ? String(rawCategory).trim()
        : 'Uncategorized';

      const rawVal = Number(item[yAxis]);
      const value = !isNaN(rawVal) ? rawVal : 1; // Default to 1 count if value isn't numeric

      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += value;
      return acc;
    }, {});

    // 2. Format aggregated object back into array format
    const aggregatedArray = Object.keys(aggregated).map((catKey) => ({
      [xAxis]: catKey,
      [yAxis]: Number(aggregated[catKey].toFixed(2))
    }));

    // 3. Sort descending by numerical value and take top 12 categories
    return aggregatedArray
      .sort((a, b) => b[yAxis] - a[yAxis])
      .slice(0, 12);
  }, [data, xAxis, yAxis]);

  if (!data || data.length === 0) return null;

  return (
    <div className="space-y-6">
      {/* SECTION 1: TOP KPI SUMMARY CARDS */}
      {kpis && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Card 1: Total Rows */}
          <div className="bg-white border border-pink-100/80 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Rows</span>
              <span className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center text-sm font-bold">📈</span>
            </div>
            <div className="text-2xl font-black text-slate-800">{kpis.totalRows}</div>
            <span className="text-[11px] text-pink-600 font-medium">Dataset Records</span>
          </div>

          {/* Card 2: Total Columns */}
          <div className="bg-white border border-pink-100/80 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Columns</span>
              <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-sm font-bold">📊</span>
            </div>
            <div className="text-2xl font-black text-slate-800">{kpis.totalCols}</div>
            <span className="text-[11px] text-purple-600 font-medium">Dataset Attributes</span>
          </div>

          {/* Card 3: Data Completeness */}
          <div className="bg-white border border-pink-100/80 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completeness</span>
              <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm font-bold">✨</span>
            </div>
            <div className="text-2xl font-black text-slate-800">{kpis.completeness}</div>
            <span className="text-[11px] text-emerald-600 font-medium">Non-Empty Cells</span>
          </div>

        </div>
      )}

      {/* SECTION 2: DYNAMIC CHART BOARD */}
      <div className="bg-white border border-pink-100/80 rounded-3xl p-6 shadow-sm space-y-6">
        
        {/* Chart Header & Axis Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              Visual Analytics Studio
              {aiChartConfig && (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-pink-50 text-pink-600 font-bold border border-pink-200">
                  AI Preserved Blueprint
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Customizable charts auto-generated from your dataset.</p>
          </div>

          {/* Controls: Chart Type & Axis Selectors */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Chart Type Buttons */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {['bar', 'line', 'pie'].map((type) => (
                <button
                  key={type}
                  onClick={() => setChartType(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                    chartType === type
                      ? 'bg-white text-pink-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* X-Axis Select */}
            <select
              value={xAxis}
              onChange={(e) => setXAxis(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:border-pink-500"
            >
              <option value="">X-Axis (Category)</option>
              {columns.all.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Y-Axis Select */}
            <select
              value={yAxis}
              onChange={(e) => setYAxis(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:border-pink-500"
            >
              <option value="">Y-Axis (Numeric)</option>
              {columns.all.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* SECTION 3: RECHARTS CANVAS RENDERER */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' && (
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
                <XAxis dataKey={xAxis} tick={{ fontSize: 11, fill: '#94a3b8' }} interval={0} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  itemStyle={{ color: '#f472b6' }}
                />
                <Bar dataKey={yAxis} fill="#ec4899" radius={[8, 8, 0, 0]} />
              </BarChart>
            )}

            {chartType === 'line' && (
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
                <XAxis dataKey={xAxis} tick={{ fontSize: 11, fill: '#94a3b8' }} interval={0} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  itemStyle={{ color: '#a855f7' }}
                />
                <Line type="monotone" dataKey={yAxis} stroke="#8b5cf6" strokeWidth={3} dot={{ r: 5, fill: '#ec4899' }} />
              </LineChart>
            )}

            {chartType === 'pie' && (
              <PieChart>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Pie
                  data={chartData}
                  dataKey={yAxis}
                  nameKey={xAxis}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={45}
                  paddingAngle={4}
                  label={({ name }) => name}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Footer Metrics */}
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium pt-1 border-t border-slate-100">
          <span>Showing top {chartData.length} unique series categories</span>
          <span>Axis: <strong className="text-slate-700">{xAxis || 'X'}</strong> vs <strong className="text-slate-700">{yAxis || 'Y'}</strong></span>
        </div>

      </div>
    </div>
  );
}