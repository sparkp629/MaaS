import { Brain } from 'lucide-react';

/**
 * MindshareGauge - Composant visuel du Mindshare Index
 * Affiche un score 0-100 avec jauge circulaire et niveau
 */
export default function MindshareGauge({ score = 0, level = '', size = 'md' }) {
  const radius = size === 'lg' ? 70 : size === 'md' ? 54 : 40;
  const stroke = size === 'lg' ? 8 : 6;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const svgSize = (radius + stroke) * 2;

  const color = score >= 80 ? '#10b981' : score >= 60 ? '#6366f1' : score >= 40 ? '#f59e0b' : score >= 20 ? '#f97316' : '#ef4444';
  const bgColor = score >= 80 ? 'bg-emerald-500/10' : score >= 60 ? 'bg-indigo-500/10' : score >= 40 ? 'bg-amber-500/10' : score >= 20 ? 'bg-orange-500/10' : 'bg-red-500/10';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg width={svgSize} height={svgSize} className="-rotate-90">
          {/* Track */}
          <circle
            cx={radius + stroke}
            cy={radius + stroke}
            r={radius}
            fill="none"
            stroke="#1e293b"
            strokeWidth={stroke}
          />
          {/* Progress */}
          <circle
            cx={radius + stroke}
            cy={radius + stroke}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Brain className="w-4 h-4 mb-1" style={{ color }} />
          <span className="text-2xl font-bold" style={{ color }}>{Math.round(score)}</span>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Index</span>
        </div>
      </div>
      {level && (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${bgColor}`} style={{ color }}>
          {level}
        </span>
      )}
    </div>
  );
}
