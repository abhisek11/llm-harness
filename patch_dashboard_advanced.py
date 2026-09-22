import re

with open('dashboard/src/App.tsx', 'r') as f:
    content = f.read()

# Add new sections before the final closing div
new_sections = """
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
"""

content = content.replace("    </div>\n  );\n}\n\nexport default App;", new_sections + "\n    </div>\n  );\n}\n\nexport default App;")

with open('dashboard/src/App.tsx', 'w') as f:
    f.write(content)
