import { useEffect, useState } from 'react';

function App() {
  const [metrics, setMetrics] = useState({
    totalTokensIn: 0,
    totalTokensOut: 0,
    savedTokens: 0,
    requests: 0,
    compressionRate: 0,
    overheadMs: 0,
    ttfbMs: 0,
    failedRequests: 0,
    throughput: {
      input: 0,
      compression: 0,
      forward: 0,
      generation: 0
    },
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
            TOPI HARNESS <span className="text-gray-500 font-normal text-xs ml-2">v1.0.0</span>
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
            (TOPI HARNESS_ROLLOUT_CHANNEL=beta<br/>
            TOPI_OUTPUT_SHAPER=1) and run <span className="text-gray-300 bg-gray-800 px-1 rounded">topi learn --verbosity --apply</span> to start measuring.
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
          <div className="text-4xl text-white mb-2">{metrics.overheadMs || 0}ms</div>
          <div className="text-gray-500 text-xs">TTFB {metrics.ttfbMs ? (metrics.ttfbMs / 1000).toFixed(2) : 0}s avg</div>
        </div>

        <div className="bg-[#222] border border-gray-800 rounded-lg p-6">
          <h2 className="text-gray-500 text-xs uppercase tracking-widest mb-4">Throughput</h2>
          <div className="flex justify-between border-b border-gray-800 pb-2 mb-2">
            <span>Input (wall / active p50)</span>
            <span className="text-cyan-400">{metrics.throughput?.input?.toFixed(1) || 0} tok/s</span>
          </div>
          <div className="flex justify-between border-b border-gray-800 pb-2 mb-2">
            <span>Compression (p50 / p95)</span>
            <span className="text-green-500">{metrics.throughput?.compression?.toFixed(1) || 0} tok/s</span>
          </div>
          <div className="flex justify-between border-b border-gray-800 pb-2 mb-2">
            <span>Forward (p50 / p95)</span>
            <span className="text-cyan-400">{metrics.throughput?.forward?.toFixed(1) || 0} tok/s</span>
          </div>
          <div className="flex justify-between">
            <span>Generation (p50 / p95)</span>
            <span className="text-yellow-500">{metrics.throughput?.generation?.toFixed(1) || 0} tok/s</span>
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

      {/* Token Usage & Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-[#1c1c1c] border border-gray-800 rounded-lg p-6 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
          <h2 className="text-white mb-6 font-bold">Token Usage</h2>
          <div className="flex justify-between border-b border-gray-800 pb-4 mb-4 text-sm">
            <span className="text-gray-400">Before Compression</span>
            <span className="text-white font-mono">1.5M</span>
          </div>
          <div className="flex justify-between border-b border-gray-800 pb-4 mb-4 text-sm">
            <span className="text-gray-400">Proxy Removed</span>
            <span className="text-cyan-400 font-mono">{metrics.savedTokens.toLocaleString()}</span>
          </div>
          <div className="flex justify-between border-b border-gray-800 pb-4 mb-4 text-sm">
            <span className="text-gray-400">After Compression (sent)</span>
            <span className="text-white font-mono">1.1M</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Output Tokens</span>
            <span className="text-white font-mono">7.4k</span>
          </div>
        </div>

        <div className="bg-[#1c1c1c] border border-gray-800 rounded-lg p-6 flex flex-col justify-center items-center text-center">
          <h2 className="text-white mb-2 font-bold w-full text-left">What Topi Removed</h2>
          <div className="flex-1 flex items-center justify-center text-gray-500 text-sm italic">
            No waste signals detected yet. Data appears after requests are processed.
          </div>
        </div>

        <div className="bg-[#1c1c1c] border border-gray-800 rounded-lg p-6 relative overflow-hidden">
          <div className="flex justify-between mb-4">
             <h2 className="text-white font-bold">Savings Over Time</h2>
             <span className="text-gray-500 text-xs font-mono">{metrics.savedTokens.toLocaleString()} tokens total</span>
          </div>
          {/* Mock Chart Area */}
          <div className="absolute bottom-0 left-0 w-full h-32 flex items-end">
             <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full stroke-cyan-400 fill-transparent" strokeWidth="2">
                <path d="M0,35 L10,34 L20,32 L30,32 L40,28 L50,25 L60,18 L70,12 L80,5 L100,5" />
             </svg>
          </div>
        </div>
      </div>

      {/* Prefix Cache Impact */}
      <div className="bg-[#1c1c1c] border border-gray-800 rounded-lg p-6 mb-6 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div className="flex justify-between mb-8">
           <h2 className="text-white font-bold">Prefix Cache Impact</h2>
           <span className="text-green-500 text-sm font-mono">Net savings: $1.74</span>
        </div>
        
        <div className="grid grid-cols-4 gap-4 mb-8">
           <div>
              <div className="text-gray-500 text-xs uppercase tracking-widest mb-2">Cache Writes</div>
              <div className="text-4xl text-yellow-500 font-mono mb-1">85.7k</div>
              <div className="text-yellow-600 text-xs">$0.043 write premium</div>
           </div>
           <div>
              <div className="text-gray-500 text-xs uppercase tracking-widest mb-2">Hit Rate</div>
              <div className="text-4xl text-green-500 font-mono mb-1">92%</div>
              <div className="text-gray-500 text-xs">23 / 26 requests</div>
           </div>
           <div>
              <div className="text-gray-500 text-xs uppercase tracking-widest mb-2">Cache Busts</div>
              <div className="text-4xl text-yellow-500 font-mono mb-1">3</div>
              <div className="text-gray-500 text-xs">35.7k tokens re-written</div>
           </div>
           <div>
              <div className="text-gray-500 text-xs uppercase tracking-widest mb-2">Providers</div>
              <div className="text-4xl text-white font-mono mb-1">1</div>
              <div className="text-gray-500 text-xs">with cache data</div>
           </div>
        </div>

        <div className="mb-2">
           <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>Cache Efficiency</span>
              <span>92% of input served from cache</span>
           </div>
           <div className="w-full h-3 rounded-full flex overflow-hidden">
              <div className="bg-green-500 h-full" style={{width: '92%'}}></div>
              <div className="bg-yellow-500 h-full" style={{width: '6%'}}></div>
              <div className="bg-gray-700 h-full" style={{width: '2%'}}></div>
           </div>
        </div>
        <div className="flex gap-4 text-xs text-gray-500 mt-2">
           <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Reads (discounted)</span>
           <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> Writes</span>
           <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-700"></span> Uncached</span>
        </div>
      </div>

      {/* Observed TTL Buckets & Compression VS Cache */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-[#1c1c1c] border border-gray-800 rounded-lg p-6">
           <div className="flex justify-between mb-4">
              <h2 className="text-gray-500 text-xs uppercase tracking-widest">Observed TTL Buckets</h2>
              <span className="text-gray-500 text-xs">5m / 1h</span>
           </div>
           <h3 className="text-white mb-6">Provider-reported cache write mix</h3>
           
           <div className="bg-[#162a2e] border border-cyan-900/30 rounded-lg p-4 mb-4">
              <div className="flex justify-between mb-2 text-cyan-400 text-xs font-bold uppercase tracking-widest">
                 <span>Bucket Mix</span>
                 <span className="bg-[#112225] px-2 py-1 rounded">1H LEANING</span>
              </div>
              <div className="text-3xl text-white font-mono mb-4">
                 83.3k <span className="text-cyan-500 text-sm">1h</span> <span className="text-gray-600">/</span> 2.4k <span className="text-cyan-500 text-sm">5m</span>
              </div>
              <div className="w-full h-2 rounded-full flex overflow-hidden mb-2">
                 <div className="bg-cyan-400 h-full" style={{width: '97%'}}></div>
                 <div className="bg-purple-500 h-full" style={{width: '3%'}}></div>
              </div>
              <div className="flex gap-4 text-xs text-gray-400">
                 <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400"></span> 1h 97.2%</span>
                 <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span> 5m 2.8%</span>
              </div>
           </div>
        </div>

        <div className="flex flex-col gap-4">
           <div className="bg-[#1c1c1c] border border-gray-800 rounded-lg p-6 flex-1">
              <div className="text-cyan-400 text-xs font-bold uppercase tracking-widest mb-2">1H Cache Writes</div>
              <div className="text-3xl text-white font-mono mb-1">83.3k</div>
              <div className="text-gray-500 text-xs">23 requests observed</div>
           </div>
           <div className="bg-[#1c1c1c] border border-gray-800 rounded-lg p-6 flex-1">
              <div className="text-purple-400 text-xs font-bold uppercase tracking-widest mb-2">5M Cache Writes</div>
              <div className="text-3xl text-white font-mono mb-1">2.4k</div>
              <div className="text-gray-500 text-xs">2 requests observed</div>
           </div>
        </div>
      </div>


      {/* Cache Miss Attribution */}
      <div className="bg-[#1c1c1c] border border-gray-800 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
           <div>
              <h2 className="text-gray-500 text-xs uppercase tracking-widest mb-1">Cache Miss Attribution</h2>
              <p className="text-gray-600 text-xs">Why turns that expected a prompt-cache hit missed — TTL lapse (consider a longer TTL) vs the cacheable prefix changing</p>
           </div>
           <div className="border border-yellow-700/50 text-yellow-600 px-3 py-1 rounded text-xs tracking-widest uppercase font-bold">
              Mostly Prefix Change
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
           <div className="border border-gray-700 rounded-lg p-4 bg-[#1a1a1a]">
              <div className="text-gray-400 text-xs tracking-widest uppercase mb-2">TTL Expiry</div>
              <div className="text-3xl text-white font-mono mb-2">0</div>
              <div className="text-gray-500 text-xs">0.0% of attributed — idle past cache TTL</div>
           </div>
           <div className="border border-yellow-700/50 rounded-lg p-4 bg-[#252015]">
              <div className="text-yellow-600 text-xs tracking-widest uppercase mb-2">Prefix Change</div>
              <div className="text-3xl text-white font-mono mb-2">1</div>
              <div className="text-gray-500 text-xs">100.0% of attributed — cached prefix shifted</div>
           </div>
           <div className="border border-gray-700 rounded-lg p-4 bg-[#1a1a1a]">
              <div className="text-gray-400 text-xs tracking-widest uppercase mb-2">Total Misses</div>
              <div className="text-3xl text-white font-mono mb-2">1</div>
              <div className="text-gray-500 text-xs">expected a cache hit, got none</div>
           </div>
        </div>

        <div className="border-t border-gray-800 pt-4 flex justify-between items-center text-xs font-mono">
           <div className="flex items-center gap-4">
              <span className="text-gray-500 tracking-widest">PER-PROVIDER BREAKDOWN</span>
              <span className="bg-gray-800 text-gray-300 px-2 py-1 rounded">anthropic</span>
              <span className="text-gray-500">Explicit breakpoints, 5-min TTL</span>
           </div>
           <div className="flex gap-4">
              <span className="text-green-500">993.1k reads (90% off)</span>
              <span className="text-yellow-500">85.7k writes (+25%)</span>
              <span className="text-cyan-500">TTL 1h 97.2% / 5m 2.8%</span>
              <span className="text-red-500">3 busts</span>
              <span className="text-green-500">$1.74</span>
           </div>
        </div>
      </div>

      {/* Agent Usage */}
      <div className="bg-[#1c1c1c] border border-gray-800 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
           <div>
              <h2 className="text-white font-bold text-lg">Agent Usage</h2>
              <p className="text-gray-500 text-xs">Before and after token usage by detected client</p>
           </div>
           <div className="flex items-center gap-4">
              <span className="text-gray-500 text-xs">Coverage: {metrics.requests} logged requests</span>
              <span className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs font-mono">{metrics.requests} requests</span>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
           <div className="border border-gray-800 rounded p-4 bg-[#1a1a1a]">
              <div className="text-gray-500 text-xs uppercase tracking-widest mb-2">Before</div>
              <div className="text-3xl text-gray-400 font-mono">1.1M</div>
           </div>
           <div className="border border-gray-800 rounded p-4 bg-[#1a1a1a]">
              <div className="text-gray-500 text-xs uppercase tracking-widest mb-2">After</div>
              <div className="text-3xl text-white font-mono">1.1M</div>
           </div>
           <div className="border border-gray-800 rounded p-4 bg-[#111c1d]">
              <div className="flex justify-between">
                 <div className="text-gray-500 text-xs uppercase tracking-widest mb-2">Saved</div>
                 <div className="text-gray-500 text-xs uppercase tracking-widest mb-2">Savings</div>
              </div>
              <div className="flex justify-between items-end">
                 <div className="text-3xl text-cyan-500 font-mono">{metrics.savedTokens.toLocaleString()}</div>
                 <div className="text-2xl text-green-500 font-mono">{metrics.compressionRate.toFixed(1)}%</div>
              </div>
           </div>
        </div>
      </div>

    </div>
  );
}

export default App;
