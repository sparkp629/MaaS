import React from 'react';
import NetworkIcon, { NETWORKS } from './NetworkIcons';

const ORDER = ['twitter','youtube','linkedin','newsletter','tiktok','instagram','twitch','reddit','telegram','discord'];

export default function SocialIcons({ className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {ORDER.map((k) => (
        <div key={k} className="w-9 h-9 flex items-center justify-center">
          <NetworkIcon network={k} size="lg" />
        </div>
      ))}
    </div>
  );
}
