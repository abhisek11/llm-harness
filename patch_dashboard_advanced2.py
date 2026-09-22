import re

with open('dashboard/src/App.tsx', 'r') as f:
    content = f.read()

# Add final sections before the final closing div
final_sections = """
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
"""

content = content.replace("    </div>\n  );\n}\n\nexport default App;", final_sections + "\n    </div>\n  );\n}\n\nexport default App;")

with open('dashboard/src/App.tsx', 'w') as f:
    f.write(content)
