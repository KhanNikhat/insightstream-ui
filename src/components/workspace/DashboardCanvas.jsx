import React, { useState, useRef } from 'react';

export default function DashboardCanvas({ 
  selectedFile, 
  setSelectedFile, 
  isProcessing, 
  setIsProcessing, 
  setDataset 
}) {
  const [dragActive, setDragActive] = useState(false);
  const [previewData, setPreviewData] = useState({ headers: [], rows: [] });
  const [fileStats, setFileStats] = useState(null);
  const fileInputRef = useRef(null);

  // Parse CSV helper
  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return { headers: [], rows: [], parsedData: [] };

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows = lines.slice(1, 6).map(line => 
      line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''))
    );

    // Full dataset array of objects for visualization
    const parsedData = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const obj = {};
      headers.forEach((header, i) => {
        const val = values[i];
        obj[header] = !isNaN(val) && val !== '' ? Number(val) : val;
      });
      return obj;
    });

    return { headers, rows, totalRows: lines.length - 1, parsedData };
  };

  const handleFileProcess = (file) => {
    if (!file || !file.name.endsWith('.csv')) {
      alert('Please upload a valid .csv file.');
      return;
    }

    setSelectedFile(file.name);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      setTimeout(() => { // Simulate parsing pipeline delay
        const { headers, rows, totalRows, parsedData } = parseCSV(e.target.result);
        
        setPreviewData({ headers, rows });
        setFileStats({
          size: (file.size / 1024).toFixed(1) + ' KB',
          rows: totalRows,
          columns: headers.length
        });
        
        setDataset(parsedData);
        setIsProcessing(false);
      }, 800);
    };
    reader.readAsText(file);
  };

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setDataset([]);
    setPreviewData({ headers: [], rows: [] });
    setFileStats(null);
  };

  return (
    <div className="w-full space-y-6">
      
      {/* SECTION 1: UPLOAD & DROPZONE CANVAS */}
      {!selectedFile ? (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all duration-200 ${
            dragActive
              ? 'border-pink-500 bg-pink-50/80 scale-[1.01] shadow-lg shadow-pink-500/10'
              : 'border-pink-200/80 bg-white/80 hover:bg-white hover:border-pink-300 shadow-sm'
          }`}
        >
          <input 
            ref={fileInputRef}
            type="file" 
            accept=".csv" 
            onChange={(e) => e.target.files?.[0] && handleFileProcess(e.target.files[0])}
            className="hidden" 
          />

          <div className="max-w-md mx-auto flex flex-col items-center">
            {/* Gradient Icon Badge */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-600 text-white flex items-center justify-center text-2xl shadow-md shadow-pink-500/20 mb-4">
              📊
            </div>

            <h3 className="text-lg font-bold text-slate-800">
              Drag & Drop your CSV dataset here
            </h3>
            <p className="text-xs text-slate-400 mt-1 mb-6">
              Upload raw comma-separated data to automatically generate charts and AI insights.
            </p>

            <button 
              type="button"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 hover:opacity-95 text-white text-xs font-semibold shadow-sm transition-all"
            >
              Browse Local Files
            </button>
            <span className="text-[11px] text-slate-400 mt-3">Supports .CSV up to 25MB</span>
          </div>
        </div>
      ) : (
        
        /* SECTION 2: ACTIVE FILE SUMMARY & PREVIEW CANVAS */
        <div className="bg-white border border-pink-100/80 rounded-3xl p-6 shadow-sm space-y-6">
          
          {/* Top Bar: File Details */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center font-bold text-lg border border-pink-200/60">
                📄
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">{selectedFile}</h4>
                {fileStats && (
                  <p className="text-xs text-slate-400">
                    {fileStats.size} • {fileStats.rows} rows • {fileStats.columns} columns
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 text-xs font-semibold transition-colors"
              >
                Change Dataset
              </button>
            </div>
          </div>

          {/* Processing Spinner Overlay */}
          {isProcessing ? (
            <div className="py-12 text-center flex flex-col items-center justify-center">
              <div className="w-10 h-10 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mb-3"></div>
              <p className="text-xs font-semibold text-slate-600">Structuring CSV Data & Preparing Analytics...</p>
            </div>
          ) : (
            
            /* RAW DATA PREVIEW TABLE */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Data Preview (First 5 Rows)
                </span>
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-pink-50 text-pink-600 font-semibold border border-pink-200/60">
                  Ready for AI Analysis
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-inner">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-700 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      {previewData.headers.map((header, idx) => (
                        <th key={idx} className="px-4 py-3">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {previewData.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-pink-50/30 transition-colors">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="px-4 py-2.5 whitespace-nowrap font-medium text-slate-700">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}