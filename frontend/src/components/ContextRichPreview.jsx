/**
 * Context-Rich Previews — affichage type réseau : 280 chars X, miniature YT, post LinkedIn...
 * Conforme au brainstorm : "280 chars X, thumbnails YT, images de profils"
 */

import NetworkIcon from './NetworkIcons';

export function TwitterPreview({ text, avatarUrl }) {
  return (
    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-600/50 max-w-md">
      <div className="flex gap-3">
        <img
          src={avatarUrl}
          alt=""
          className="w-10 h-10 rounded-full shrink-0 object-cover"
        />
        <div className="flex-1 min-w-0">
          <p className="text-slate-200 text-sm leading-relaxed line-clamp-4">
            {text || 'Aucun post récent'}
          </p>
          <span className="text-slate-500 text-xs mt-1">{text?.length || 0}/280</span>
        </div>
      </div>
    </div>
  );
}

export function YouTubePreview({ thumbnailUrl, avatarUrl, title }) {
  return (
    <div className="rounded-xl overflow-hidden bg-slate-900/60 border border-slate-600/50 max-w-[200px]">
      <div className="aspect-video bg-slate-700 relative">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-slate-500 text-2xl">▶</span>
          </div>
        )}
      </div>
      <div className="p-2 flex gap-2">
        {avatarUrl && (
          <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full shrink-0 object-cover" />
        )}
        <p className="text-slate-300 text-xs line-clamp-2 flex-1 min-w-0">{title || 'Video'}</p>
      </div>
    </div>
  );
}

export function LinkedInPreview({ text }) {
  return (
    <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-600/50 max-w-md">
      <div className="flex items-start gap-2">
        <div className="w-8 h-8 rounded bg-[#0A66C2]/30 shrink-0 flex items-center justify-center">
          <span className="text-[#0A66C2] text-xs font-bold">in</span>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed line-clamp-3">
          {text || 'Aucun post récent'}
        </p>
      </div>
    </div>
  );
}

export default function ContextRichPreview({ kol }) {
  const p = kol?.previews || {};
  const hasAny = p.twitter || p.youtube || p.linkedin;

  if (!hasAny) return null;

  return (
    <div className="flex flex-wrap gap-3 mt-2">
      {p.twitter && (
        <div className="flex items-center gap-2">
          <NetworkIcon network="twitter" size="sm" />
          <TwitterPreview text={p.twitter.text} avatarUrl={p.twitter.avatarUrl || kol.avatarUrl} />
        </div>
      )}
      {p.youtube && (
        <div className="flex items-center gap-2">
          <NetworkIcon network="youtube" size="sm" />
          <YouTubePreview
            thumbnailUrl={p.youtube.thumbnailUrl}
            avatarUrl={p.youtube.avatarUrl || kol.avatarUrl}
            title={`${kol.displayName} • ${kol.niche}`}
          />
        </div>
      )}
      {p.linkedin && (
        <div className="flex items-center gap-2">
          <NetworkIcon network="linkedin" size="sm" />
          <LinkedInPreview text={p.linkedin.text} />
        </div>
      )}
    </div>
  );
}
