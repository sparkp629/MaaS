/**
 * MindshareGauge — Jauge visuelle 0–100 + niveau
 */

function levelColor(level) {
  const map = {
    Invisible: 'text-slate-500',
    Émergent: 'text-amber-400',
    Croissant: 'text-cyan-400',
    Fort: 'text-emerald-400',
    Dominant: 'text-indigo-400',
  };
  return map[level] ?? 'text-slate-400';
}

export default function MindshareGauge({ value = 0, level = 'Invisible', size = 'md' }) {
  const pct = Math.min(100, Math.max(0, Number(value) || 0));
  const sizes = { sm: 'w-20 h-20', md: 'w-28 h-28', lg: 'w-36 h-36' };
  const strokeWidth = size === 'sm' ? 4 : size === 'lg' ? 6 : 5;
  const r = 42;
  const circumference = 2 * Math.PI * r;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`relative ${sizes[size]}`}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-700/50"
          />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`transition-all duration-700 ${levelColor(level)}`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-white">{Math.round(pct)}</span>
        </div>
      </div>
      <span className={`text-sm font-medium ${levelColor(level)}`}>{level}</span>
    </div>
  );
}
