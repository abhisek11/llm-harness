import { useEffect, useState } from 'react';

interface ProviderBreakdown {
  requests: number;
  tokensIn: number;
  tokensOut: number;
  savedUsd: number;
}

interface Bucket {
  requests: number;
  failedRequests: number;
  blockedByMembra: number;
  tokensIn: number;
  tokensOut: number;
  baselineCostUsd: number;
  actualCostUsd: number;
  savedUsd: number;
  byProvider: Record<string, ProviderBreakdown>;
  startedAt: string;
  lastActivityAt: string | null;
  savingsPercent: number;
}

interface SavingsEvent {
  v: 1;
  ts: string;
  provider: string;
  model: string;
  client: string;
  tokensIn: number;
  tokensOut: number;
  baselineCostUsd: number;
  actualCostUsd: number;
  savedUsd: number;
  ttfbMs: number | null;
  blockedByMembra: boolean;
  membraScore?: number;
  membraSignals?: string[];
}

interface Metrics {
  lifetime: Bucket;
  session: Bucket;
  recentEvents: SavingsEvent[];
}

const EMPTY_BUCKET: Bucket = {
  requests: 0, failedRequests: 0, blockedByMembra: 0, tokensIn: 0, tokensOut: 0,
  baselineCostUsd: 0, actualCostUsd: 0, savedUsd: 0, byProvider: {},
  startedAt: '', lastActivityAt: null, savingsPercent: 0,
};

const EMPTY_METRICS: Metrics = { lifetime: EMPTY_BUCKET, session: EMPTY_BUCKET, recentEvents: [] };

const TABS = ['Session', 'Lifetime', 'Historical', 'Security'] as const;
type Tab = typeof TABS[number];

function fmtTok(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k';
  return String(Math.round(n));
}

function fmtUsd(n: number): string {
  return '$' + n.toFixed(n < 1 ? 4 : 2);
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <div className="text-gray-500 text-xs uppercase tracking-widest mb-2">{label}</div>
      <div className={`text-3xl font-mono ${accent ?? 'text-white'}`}>{value}</div>
    </div>
  );
}

function BucketView({ bucket, label }: { bucket: Bucket; label: string }) {
  const providers = Object.entries(bucket.byProvider).sort((a, b) => b[1].requests - a[1].requests);
  return (
    <div>
      <div className="mb-6 text-gray-500 text-xs">
        {label} {bucket.startedAt && <>· started {new Date(bucket.startedAt).toLocaleString()}</>}
        {bucket.lastActivityAt && <> · last activity {new Date(bucket.lastActivityAt).toLocaleTimeString()}</>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-[#222] border border-gray-800 rounded-lg p-6">
          <Stat label="Requests" value={String(bucket.requests)} />
        </div>
        <div className="bg-[#222] border border-gray-800 rounded-lg p-6">
          <Stat label="Failed" value={String(bucket.failedRequests)} accent="text-red-400" />
        </div>
        <div className="bg-[#222] border border-gray-800 rounded-lg p-6">
          <Stat label="Blocked (membra)" value={String(bucket.blockedByMembra)} accent="text-yellow-400" />
        </div>
        <div className="bg-[#222] border border-gray-800 rounded-lg p-6">
          <Stat label="Tokens (in / out)" value={`${fmtTok(bucket.tokensIn)} / ${fmtTok(bucket.tokensOut)}`} accent="text-cyan-400" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-[#222] border border-gray-800 rounded-lg p-6">
          <h2 className="text-gray-500 text-xs uppercase tracking-widest mb-4">Baseline cost (if routed to a paid frontier model)</h2>
          <div className="text-4xl text-gray-400 font-mono">{fmtUsd(bucket.baselineCostUsd)}</div>
        </div>
        <div className="bg-[#222] border border-gray-800 rounded-lg p-6">
          <h2 className="text-gray-500 text-xs uppercase tracking-widest mb-4">Actual cost (real provider bills)</h2>
          <div className="text-4xl text-white font-mono">{fmtUsd(bucket.actualCostUsd)}</div>
        </div>
        <div className="bg-[#162a2e] border border-cyan-900/30 rounded-lg p-6">
          <h2 className="text-cyan-400 text-xs uppercase tracking-widest mb-4">Saved</h2>
          <div className="text-4xl text-green-500 font-mono mb-1">
            {fmtUsd(bucket.savedUsd)} <span className="text-lg text-gray-500">{bucket.savingsPercent.toFixed(1)}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden mt-2">
            <div className="h-full bg-green-500" style={{ width: `${Math.min(100, bucket.savingsPercent)}%` }} />
          </div>
        </div>
      </div>

      <div className="bg-[#1c1c1c] border border-gray-800 rounded-lg p-6">
        <h2 className="text-white font-bold mb-4">Per-provider breakdown</h2>
        {providers.length === 0 ? (
          <div className="text-gray-500 text-sm italic">No requests recorded yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs uppercase tracking-widest border-b border-gray-800">
                <th className="text-left pb-2">Provider</th>
                <th className="text-right pb-2">Requests</th>
                <th className="text-right pb-2">Tokens in</th>
                <th className="text-right pb-2">Tokens out</th>
                <th className="text-right pb-2">Saved</th>
              </tr>
            </thead>
            <tbody>
              {providers.map(([name, p]) => (
                <tr key={name} className="border-b border-gray-800/50">
                  <td className="py-2 text-cyan-400 font-mono">{name}</td>
                  <td className="py-2 text-right text-white">{p.requests}</td>
                  <td className="py-2 text-right text-gray-400">{fmtTok(p.tokensIn)}</td>
                  <td className="py-2 text-right text-gray-400">{fmtTok(p.tokensOut)}</td>
                  <td className="py-2 text-right text-green-500">{fmtUsd(p.savedUsd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function HistoricalView({ events }: { events: SavingsEvent[] }) {
  return (
    <div className="bg-[#1c1c1c] border border-gray-800 rounded-lg p-6">
      <h2 className="text-white font-bold mb-4">Recent requests <span className="text-gray-500 font-normal text-xs">(most recent first, last 50)</span></h2>
      {events.length === 0 ? (
        <div className="text-gray-500 text-sm italic">No requests recorded yet.</div>
      ) : (
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="text-gray-500 uppercase tracking-widest border-b border-gray-800">
              <th className="text-left pb-2">Time</th>
              <th className="text-left pb-2">Provider</th>
              <th className="text-left pb-2">Client</th>
              <th className="text-right pb-2">In</th>
              <th className="text-right pb-2">Out</th>
              <th className="text-right pb-2">TTFB</th>
              <th className="text-right pb-2">Saved</th>
              <th className="text-right pb-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e, i) => (
              <tr key={i} className="border-b border-gray-800/50">
                <td className="py-2 text-gray-500">{new Date(e.ts).toLocaleTimeString()}</td>
                <td className="py-2 text-cyan-400">{e.provider}</td>
                <td className="py-2 text-gray-400">{e.client}</td>
                <td className="py-2 text-right text-gray-300">{fmtTok(e.tokensIn)}</td>
                <td className="py-2 text-right text-gray-300">{fmtTok(e.tokensOut)}</td>
                <td className="py-2 text-right text-gray-400">{e.ttfbMs != null ? `${e.ttfbMs}ms` : '—'}</td>
                <td className="py-2 text-right text-green-500">{fmtUsd(e.savedUsd)}</td>
                <td className="py-2 text-right">
                  {e.blockedByMembra ? (
                    <span className="text-red-400">blocked</span>
                  ) : (
                    <span className="text-green-500">ok</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function SecurityView({ events, lifetimeBlocked, sessionBlocked }: { events: SavingsEvent[]; lifetimeBlocked: number; sessionBlocked: number }) {
  const blocked = events.filter(e => e.blockedByMembra);
  const signalCounts: Record<string, number> = {};
  for (const e of blocked) {
    for (const s of e.membraSignals ?? []) signalCounts[s] = (signalCounts[s] ?? 0) + 1;
  }
  const topSignals = Object.entries(signalCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <div className="mb-6 text-gray-500 text-xs">
        Inbound prompt-injection / jailbreak screening · powered by membra · threshold configurable via MEMBRA_BLOCK_THRESHOLD
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-[#222] border border-gray-800 rounded-lg p-6">
          <Stat label="Blocked this session" value={String(sessionBlocked)} accent="text-yellow-400" />
        </div>
        <div className="bg-[#222] border border-gray-800 rounded-lg p-6">
          <Stat label="Blocked lifetime" value={String(lifetimeBlocked)} accent="text-yellow-400" />
        </div>
      </div>

      <div className="bg-[#1c1c1c] border border-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-white font-bold mb-4">Signal frequency <span className="text-gray-500 font-normal text-xs">(recent window)</span></h2>
        {topSignals.length === 0 ? (
          <div className="text-gray-500 text-sm italic">No blocked requests in the recent window.</div>
        ) : (
          <div className="space-y-2">
            {topSignals.map(([name, count]) => (
              <div key={name} className="flex justify-between items-center text-sm">
                <span className="text-gray-300 font-mono">{name}</span>
                <span className="text-yellow-400 font-mono">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-[#1c1c1c] border border-gray-800 rounded-lg p-6">
        <h2 className="text-white font-bold mb-4">Blocked requests <span className="text-gray-500 font-normal text-xs">(most recent first)</span></h2>
        {blocked.length === 0 ? (
          <div className="text-gray-500 text-sm italic">Nothing blocked yet — try a message containing "ignore all previous instructions".</div>
        ) : (
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="text-gray-500 uppercase tracking-widest border-b border-gray-800">
                <th className="text-left pb-2">Time</th>
                <th className="text-right pb-2">Score</th>
                <th className="text-left pb-2">Signals</th>
              </tr>
            </thead>
            <tbody>
              {blocked.map((e, i) => (
                <tr key={i} className="border-b border-gray-800/50">
                  <td className="py-2 text-gray-500">{new Date(e.ts).toLocaleTimeString()}</td>
                  <td className="py-2 text-right text-red-400">{e.membraScore?.toFixed(2)}</td>
                  <td className="py-2 text-yellow-400">{(e.membraSignals ?? []).join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function App() {
  const [metrics, setMetrics] = useState<Metrics>(EMPTY_METRICS);
  const [tab, setTab] = useState<Tab>('Session');
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch('http://localhost:4141/api/metrics');
        const data = await res.json();
        setMetrics(data);
        setConnected(true);
      } catch (err) {
        console.error('Failed to fetch metrics', err);
        setConnected(false);
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
            {TABS.map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1 rounded font-bold transition-colors ${tab === t ? 'bg-cyan-500 text-black' : 'text-gray-400 hover:text-white'}`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            Status <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></span>{' '}
            <span className="text-white">{connected ? 'Healthy' : 'Unreachable'}</span>
          </div>
        </div>
      </header>

      {tab === 'Session' && <BucketView bucket={metrics.session} label="Current proxy process · runtime counters reset on restart" />}
      {tab === 'Lifetime' && <BucketView bucket={metrics.lifetime} label="Cumulative across all sessions · persisted to ~/.topi/proxy_savings.json" />}
      {tab === 'Historical' && <HistoricalView events={metrics.recentEvents} />}
      {tab === 'Security' && (
        <SecurityView
          events={metrics.recentEvents}
          lifetimeBlocked={metrics.lifetime.blockedByMembra}
          sessionBlocked={metrics.session.blockedByMembra}
        />
      )}
    </div>
  );
}

export default App;
