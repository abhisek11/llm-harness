import { useEffect, useState } from 'react';

function App() {
  const [metrics, setMetrics] = useState({
    totalTokensIn: 0,
    totalTokensOut: 0,
    savedTokens: 0,
    requests: 0,
    compressionRate: 0,
    pipeline: [],
    performance: { overhead: '', ttfb: '', failed: 0 }
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch('http://localhost:4141/api/metrics');
        const data = await res.json();
        setMetrics(data);
      } catch (err) {
        console.error('Failed to fetch metrics', err);
      }
    };
    
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-300 p-8 font-mono text-sm">
      <header className="mb-8 flex items-center justify-between border-b border-gray-800 pb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-white tracking-wide">
            HEADROOM <span className="text-gray-500 font-normal text-xs ml-2">v0.37.0 (Topi Harness)</span>
          </h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex gap-2 bg-gray-900 rounded p-1">
             <button className="px-4 py-1 bg-cyan-500 text-black rounded font-bold">Session</button>
             <button className="px-4 py-1 hover:text-white">Lifetime</button>
             <button className="px-4 py-1 hover:text-white">Historical</button>
          </div>
          <div className="flex items-center gap-2 border border-cyan-900 bg-cyan-900/20 px-3 py-1 rounded-full text-cyan-400">
             <span className="w-2 h-2 rounded-full bg-cyan-400"></span> coding
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            Status <span className="w-2 h-2 rounded-full bg-green-500"></span> <span className="text-white">Healthy</span>
          </div>
        </div>
      </header>

      <div className="mb-6 text-gray-500 text-xs">
        Current proxy process · runtime counters reset on restart
      </div>

      {/* Top row: Health & Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-[#222] border border-gray-800 rounded-lg p-6">
          <h2 className="text-white mb-4">Request Health</h2>
          <div className="grid grid-cols-2 gap-y-4">
            <div className="flex justify-between pr-8">
               <span>Completed</span>
               <span className="text-white">{metrics.requests}</span>
            </div>
            <div className="flex justify-between pl-8 border-l border-gray-800">
               <span>Failed</span>
               <span className="text-red-400">{metrics.performance?.failed || 0}</span>
            </div>
            <div className="flex justify-between pr-8">
               <span>Rate Limited</span>
               <span className="text-yellow-500">0</span>
            </div>
            <div className="flex justify-between pl-8 border-l border-gray-800">
               <span>Cached</span>
               <span className="text-cyan-400">0</span>
            </div>
          </div>
        </div>

        <div className="bg-[#222] border border-gray-800 rounded-lg p-6">
          <h2 className="text-white mb-4">Live Activity</h2>
          <div className="grid grid-cols-2 gap-y-4">
            <div className="flex justify-between pr-8">
               <span>Active Requests</span>
               <span className="text-white">1</span>
            </div>
            <div className="flex justify-between pl-8 border-l border-gray-800">
               <span>Active WebSockets</span>
               <span className="text-white">0</span>
            </div>
            <div className="flex justify-between pr-8">
               <span>Relay Tasks</span>
               <span className="text-white">0</span>
            </div>
            <div className="flex justify-between pl-8 border-l border-gray-800">
               <span>Compression Queued</span>
               <span className="text-white">0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle row: Savings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-[#222] border border-gray-800 rounded-lg p-6">
          <h2 className="text-gray-500 text-xs uppercase tracking-widest mb-4">Tokens Saved</h2>
          <div className="text-4xl text-cyan-400 mb-2">
            {metrics.savedTokens > 1000 ? (metrics.savedTokens / 1000).toFixed(1) + 'k' : metrics.savedTokens} <span className="text-lg">{metrics.compressionRate.toFixed(1)}%</span>
          </div>
          <div className="text-gray-500 text-xs mb-4">
            Proxy {metrics.savedTokens} ({(metrics.compressionRate).toFixed(1)}%)<br/>
            Of total wire: {(metrics.compressionRate).toFixed(2)}%
          </div>
          <div className="w-full h-px bg-gray-800 relative">
             <div className="absolute top-0 left-0 h-px bg-cyan-700" style={{ width: `${metrics.compressionRate}%` }}></div>
          </div>
        </div>

        <div className="bg-[#222] border border-gray-800 rounded-lg p-6">
          <h2 className="text-gray-500 text-xs uppercase tracking-widest mb-4">Output Tokens Saved</h2>
          <div className="text-gray-600 mb-4">—</div>
          <div className="text-gray-500 text-xs leading-relaxed">
            Enable the beta output shaper<br/>
            (HEADROOM_ROLLOUT_CHANNEL=beta<br/>
            HEADROOM_OUTPUT_SHAPER=1) and run <span className="text-gray-300 bg-gray-800 px-1 rounded">headroom learn --verbosity --apply</span> to start measuring.
          </div>
        </div>

        <div className="bg-[#222] border border-gray-800 rounded-lg p-6">
          <h2 className="text-gray-500 text-xs uppercase tracking-widest mb-4">Savings · Tool Search</h2>
          <div className="text-4xl text-green-500 mb-2">
            395.7k <span className="text-lg text-gray-500">tokens</span>
          </div>
          <div className="text-gray-500 text-xs">
            26 calls · realized
          </div>
        </div>
      </div>

      {/* Bottom row: Overhead / Throughput / Performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#222] border border-gray-800 rounded-lg p-6">
          <h2 className="text-gray-500 text-xs uppercase tracking-widest mb-4">Overhead</h2>
          <div className="text-4xl text-white mb-2">642ms</div>
          <div className="text-gray-500 text-xs">TTFB 6.46s avg</div>
        </div>

        <div className="bg-[#222] border border-gray-800 rounded-lg p-6">
          <h2 className="text-gray-500 text-xs uppercase tracking-widest mb-4">Throughput</h2>
          <div className="flex justify-between border-b border-gray-800 pb-2 mb-2">
            <span>Input (wall / active p50)</span>
            <span className="text-cyan-400">383.6 / 6532.7 tok/s</span>
          </div>
          <div className="flex justify-between border-b border-gray-800 pb-2 mb-2">
            <span>Compression (p50 / p95)</span>
            <span className="text-green-500">438.1 / 539334.8 tok/s</span>
          </div>
          <div className="flex justify-between border-b border-gray-800 pb-2 mb-2">
            <span>Forward (p50 / p95)</span>
            <span className="text-cyan-400">6407.3 / 16353.5 tok/s</span>
          </div>
          <div className="flex justify-between">
            <span>Generation (p50 / p95)</span>
            <span className="text-yellow-500">78.5 / 108.2 tok/s</span>
          </div>
        </div>

        <div className="bg-[#222] border border-gray-800 rounded-lg p-6">
          <h2 className="text-white mb-4 font-bold">Performance</h2>
          <div className="flex justify-between mb-2">
            <span>Overhead Range</span>
            <span className="text-white">{metrics.performance?.overhead || '21 - 5978ms'}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>TTFB Range</span>
            <span className="text-white">{metrics.performance?.ttfb || '0.70 - 62.34s'}</span>
          </div>
          <div className="flex justify-between mb-8">
            <span>Failed Requests</span>
            <span className="text-white">{metrics.performance?.failed || 0}</span>
          </div>
          
          <h2 className="text-gray-500 text-xs uppercase tracking-widest mb-4">Pipeline Breakdown</h2>
          {metrics.pipeline && metrics.pipeline.map((item: any, i: number) => (
             <div key={i} className="flex justify-between mb-1 text-xs">
                <span>{item.name}</span>
                <span className={item.warning ? "text-yellow-500" : "text-gray-400"}>
                  {item.avg} avg / {item.max} max
                </span>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
