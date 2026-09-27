import React, { useState, useRef, useEffect, useMemo } from 'react';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Helper to parse **bold** and `code` Markdown syntax into React elements
const formatMarkdown = (text) => {
  if (!text) return null;

  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={index} className="px-1.5 py-0.5 rounded bg-slate-200/70 text-pink-700 font-mono text-[11px]">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
};

export default function ChatAssistant({ dataset = [], onUpdateChart }) {
  const colNames = useMemo(() => {
    return dataset && dataset.length > 0 ? Object.keys(dataset[0]).join(', ') : '';
  }, [dataset]);

  const [messages, setMessages] = useState(() => {
    if (dataset && dataset.length > 0) {
      return [
        {
          id: 'initial-dataset-msg',
          sender: 'ai',
          text: `✅ Dataset detected! I have access to **${dataset.length} records** and columns: \`${colNames}\`. Ask me to analyze or plot a chart!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ];
    }
    return [];
  });

  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const chatEndRef = useRef(null);
  const lastLoadedDatasetRef = useRef(dataset);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  useEffect(() => {
    if (dataset && dataset.length > 0 && lastLoadedDatasetRef.current !== dataset) {
      lastLoadedDatasetRef.current = dataset;
      const updatedCols = Object.keys(dataset[0]).join(', ');

      setMessages([
        {
          id: `dataset-updated-${Date.now()}`,
          sender: 'ai',
          text: `✅ Dataset updated! I have access to **${dataset.length} records** and columns: \`${updatedCols}\`. Ask me to analyze or plot a chart!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [dataset]);

  const quickPrompts = [
    "Plot a Bar Chart",
    "Show Line Trend",
    "Summarize key metrics",
    "Find data anomalies"
  ];

  const datasetStats = useMemo(() => {
    if (!dataset || dataset.length === 0) return null;
    const keys = Object.keys(dataset[0]);
    const numericSummary = {};

    keys.forEach((key) => {
      const nums = dataset.map((d) => Number(d[key])).filter((val) => !isNaN(val));
      if (nums.length > 0) {
        const sum = nums.reduce((a, b) => a + b, 0);
        numericSummary[key] = {
          min: Math.min(...nums),
          max: Math.max(...nums),
          avg: Number((sum / nums.length).toFixed(2))
        };
      }
    });

    return numericSummary;
  }, [dataset]);

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim() || isThinking) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsThinking(true);

    if (!dataset || dataset.length === 0) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'ai',
            text: "⚠️ No active dataset found. Please upload a CSV file into the Canvas above first!",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setIsThinking(false);
      }, 400);
      return;
    }

    try {
      // 1. Explicit pre-flight check for API key
      if (!GEMINI_API_KEY || GEMINI_API_KEY === 'undefined') {
        throw new Error('VITE_GEMINI_API_KEY is missing or undefined in your .env file.');
      }

      const columns = Object.keys(dataset[0]);
      const sampleRows = dataset.slice(0, 5);

      const systemPrompt = `
You are InsightStream AI, an expert data analytics assistant.
Analyzing dataset context:
- Total Rows: ${dataset.length}
- Column Names: ${JSON.stringify(columns)}
- Pre-calculated Numeric Field Metrics: ${JSON.stringify(datasetStats || {})}
- First 5 Sample Rows: ${JSON.stringify(sampleRows)}

Your Task:
1. Answer the user's analytical question concisely and accurately based on dataset context.
2. Determine if a chart visual ('bar', 'line', 'pie', or 'none') is requested or appropriate.
3. Choose the exact matching column names from the dataset for xAxis and yAxis if a chart is needed.

CRITICAL: Output STRICT JSON only with this structure:
{
  "answer": "Your concise response. Use **bold** or \`code\` markdown syntax where helpful.",
  "chart": {
    "type": "bar" | "line" | "pie" | "none",
    "xAxis": "exact_column_name_or_empty",
    "yAxis": "exact_column_name_or_empty"
  }
}
`;

      // 2. Call Gemini API using standard model endpoint
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: systemPrompt },
                  { text: `User Prompt: "${query}"` }
                ]
              }
            ],
            generationConfig: {
              responseMimeType: 'application/json'
            }
          })
        }
      );

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error?.message || `HTTP ${response.status}: API Request failed`);
      }

      const rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error('Received an empty response from Gemini API.');
      }

      const cleanedJsonText = rawText.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanedJsonText);

      const aiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: parsed.answer || 'Dataset analyzed successfully.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, aiMsg]);

      if (parsed.chart && parsed.chart.type !== 'none' && onUpdateChart) {
        onUpdateChart({
          type: parsed.chart.type,
          xAxis: parsed.chart.xAxis,
          yAxis: parsed.chart.yAxis
        });
      }
    } catch (err) {
      console.error('Gemini API Error Details:', err);
      // Directly render the exact error string in the UI bubble
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: `⚠️ **Error:** ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="bg-white border border-pink-100/80 rounded-3xl p-6 shadow-sm flex flex-col h-[520px]">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
            ✨
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">InsightStream AI Assistant</h3>
            <p className="text-[11px] text-slate-400">Natural language data exploration</p>
          </div>
        </div>

        <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold border ${
          dataset && dataset.length > 0 
            ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
            : 'bg-amber-50 text-amber-600 border-amber-200'
        }`}>
          {dataset && dataset.length > 0 ? `${dataset.length} Rows Connected` : 'Waiting for CSV'}
        </span>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed whitespace-pre-line ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-br-none shadow-sm'
                  : 'bg-slate-50 text-slate-700 border border-slate-100 rounded-bl-none'
              }`}
            >
              {formatMarkdown(msg.text)}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
          </div>
        ))}

        {isThinking && (
          <div className="flex items-center gap-2 text-slate-400 text-xs py-2">
            <div className="w-2 h-2 rounded-full bg-pink-500 animate-bounce"></div>
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce [animation-delay:0.2s]"></div>
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]"></div>
            <span className="text-[11px] font-medium ml-1">Analyzing dataset...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Quick Action Chips */}
      <div className="flex items-center gap-2 overflow-x-auto py-3 border-t border-slate-100 no-scrollbar">
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            disabled={isThinking}
            className="whitespace-nowrap px-3 py-1.5 rounded-full bg-pink-50/60 hover:bg-pink-100/80 text-pink-700 text-[11px] font-medium transition-colors border border-pink-200/50 flex-shrink-0"
          >
            ⚡ {prompt}
          </button>
        ))}
      </div>

      {/* Input Field Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 pt-1"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={dataset && dataset.length > 0 ? "Ask to draw a chart or analyze data..." : "Upload CSV first..."}
          className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-pink-500 transition-colors"
        />
        <button
          type="submit"
          disabled={!input.trim() || isThinking}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 hover:opacity-95 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
        >
          Send
        </button>
      </form>

    </div>
  );
}