import React from 'react';
import { Globe, Sparkles, TrendingUp, Users, Brain, BarChart3, ArrowUpRight, CheckCircle2 } from 'lucide-react';

/* ─── mini bar chart (7 bars) ─── */
const MiniBarChart: React.FC<{ color: string; heights: number[] }> = ({ color, heights }) => (
  <div className="flex items-end gap-[5px] h-16 mt-3">
    {heights.map((h, i) => (
      <div
        key={i}
        className="rounded-sm w-5 transition-all duration-500"
        style={{ height: `${h}%`, backgroundColor: color, opacity: 0.65 + (h / 300) }}
      />
    ))}
  </div>
);

/* ─── platform engagement card ─── */
interface PlatformCardProps {
  initial: string;
  initialBg: string;
  name: string;
  rate: number;
  color: string;
  bars: number[];
  metrics: { label: string; value: string }[];
}

const PlatformCard: React.FC<PlatformCardProps> = ({ initial, initialBg, name, rate, color, bars, metrics }) => (
  <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-gray-200 p-5 transition-all duration-300">
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md"
          style={{ backgroundColor: initialBg }}
        >
          {initial}
        </div>
        <div>
          <p className="font-semibold text-gray-800 text-[15px]">{name}</p>
          <p className="text-xs text-gray-400">Engagement Rate</p>
        </div>
      </div>
      <span className="text-2xl font-black" style={{ color }}>{rate}%</span>
    </div>

    <MiniBarChart color={color} heights={bars} />

    <div className="flex items-center gap-3 mt-3 flex-wrap">
      {metrics.map((m, i) => (
        <span key={i} className="text-[11px] text-gray-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
          {m.label}: {m.value}
        </span>
      ))}
      <span className="text-[11px] text-gray-400 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
        color: {color}
      </span>
    </div>
  </div>
);

/* ─── stat card ─── */
const StatCard: React.FC<{ value: string; label: string; gradient?: boolean }> = ({ value, label, gradient }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-6 px-4 hover:shadow-md transition-all duration-300">
    <span
      className={`text-3xl font-black ${gradient
        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent'
        : 'text-indigo-600'
      }`}
    >
      {value}
    </span>
    <span className="text-sm text-gray-400 mt-1">{label}</span>
  </div>
);

/* ─── main component ─── */
export const LandingDashboardPreview: React.FC = () => {
  const platforms: PlatformCardProps[] = [
    {
      initial: 'X',
      initialBg: '#000000',
      name: 'X (Twitter)',
      rate: 92,
      color: '#000000',
      bars: [40, 50, 45, 60, 75, 90, 70],
      metrics: [
        { label: 'likes', value: '1247' },
        { label: 'reposts', value: '342' },
        { label: 'replies', value: '89' },
      ],
    },
    {
      initial: 'L',
      initialBg: '#0077B5',
      name: 'LinkedIn',
      rate: 78,
      color: '#0077B5',
      bars: [55, 60, 50, 70, 65, 80, 90],
      metrics: [
        { label: 'likes', value: '856' },
        { label: 'comments', value: '124' },
        { label: 'shares', value: '67' },
      ],
    },
    {
      initial: 'I',
      initialBg: '#E4405F',
      name: 'Instagram',
      rate: 95,
      color: '#E4405F',
      bars: [60, 55, 50, 65, 70, 80, 100],
      metrics: [
        { label: 'likes', value: '2341' },
        { label: 'comments', value: '156' },
        { label: 'saves', value: '423' },
      ],
    },
    {
      initial: 'F',
      initialBg: '#1877F2',
      name: 'Facebook',
      rate: 65,
      color: '#1877F2',
      bars: [35, 45, 50, 55, 60, 70, 90],
      metrics: [
        { label: 'likes', value: '567' },
        { label: 'shares', value: '89' },
        { label: 'comments', value: '45' },
      ],
    },
  ];

  return (
    <section className="relative py-24 bg-gradient-to-b from-slate-50 via-white to-slate-50 overflow-hidden">
      {/* subtle background blurs */}
      <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-blue-100/25 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-100/20 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* ── Fake browser chrome ── */}
        <div className="rounded-3xl border border-gray-200 bg-white/70 backdrop-blur-xl shadow-2xl shadow-gray-200/60 overflow-hidden">
          {/* title bar */}
          <div className="flex items-center justify-between px-6 py-3 bg-gray-50/80 border-b border-gray-100">
            <div className="flex items-center gap-4">
              {/* traffic lights */}
              <div className="flex gap-2">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              <span className="text-sm font-semibold text-gray-600 tracking-wide">EngageHub Dashboard</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-emerald-600 font-medium">Live</span>
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">12:29:18 PM</span>
              <span className="ml-1 px-2 py-0.5 rounded-full border border-gray-200 bg-white text-gray-500 font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> AI Powered
              </span>
            </div>
          </div>

          {/* ── dashboard body ── */}
          <div className="p-6 md:p-8">
            {/* top row: Platform Analytics heading + AI Insights heading */}
            <div className="grid lg:grid-cols-3 gap-8">
              {/* LEFT: Platform Analytics */}
              <div className="lg:col-span-2 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800">
                    <Globe className="w-5 h-5 text-indigo-500" />
                    Platform Analytics
                  </h3>
                  <span className="text-xs text-gray-400 font-medium">Last 7 days</span>
                </div>

                {/* 2×2 platform cards */}
                <div className="grid sm:grid-cols-2 gap-4">
                  {platforms.map((p) => (
                    <PlatformCard key={p.name} {...p} />
                  ))}
                </div>
              </div>

              {/* RIGHT: AI Insights */}
              <div className="space-y-5">
                <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  AI Insights
                </h3>

                {/* AI Summary card */}
                <div className="bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/60 border border-indigo-100/60 rounded-2xl p-5 shadow-sm space-y-4">
                  {/* header */}
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                      <Brain className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">AI Summary</span>
                    <span className="ml-auto text-[10px] text-gray-400">Just now</span>
                  </div>

                  {/* insight bullets */}
                  <ul className="space-y-3 text-[13px] text-gray-600 leading-relaxed">
                    <li className="flex gap-2">
                      <ArrowUpRight className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span><strong className="text-gray-800">Instagram</strong> is your top performer at <strong className="text-emerald-600">95%</strong> engagement — keep prioritizing Reels and carousel posts.</span>
                    </li>
                    <li className="flex gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                      <span><strong className="text-gray-800">X (Twitter)</strong> saw a <strong className="text-blue-600">+18%</strong> spike in replies — your audience is highly responsive this week.</span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                      <span><strong className="text-gray-800">Facebook</strong> engagement is at <strong className="text-amber-600">65%</strong> — consider boosting top posts and testing short-form video.</span>
                    </li>
                  </ul>

                  {/* recommendation tag */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-white/80 rounded-xl border border-indigo-100">
                    <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                    <span className="text-xs text-gray-500"><strong className="text-gray-700">Recommendation:</strong> Increase LinkedIn posting frequency by 2× to capture untapped B2B engagement.</span>
                  </div>
                </div>

                {/* Generate Summary button */}
                <button className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white font-bold text-sm shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Generate Summary
                </button>
              </div>
            </div>

            {/* ── bottom stats row ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <StatCard value="5,011" label="Total Interactions" />
              <StatCard value="4" label="Platforms" />
              <StatCard value="12" label="AI Insights" />
              <StatCard value="+23%" label="Growth" gradient />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
