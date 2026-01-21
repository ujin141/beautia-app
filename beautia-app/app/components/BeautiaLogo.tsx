import React from 'react';

export function BeautiaLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 46.39 72" 
      className={className}
    >
      <defs>
        <linearGradient id="beautia_gradient" x1="9.08" y1="23.43" x2="41.21" y2="81.27" gradientUnits="userSpaceOnUse">
          <stop offset="0.06" stopColor="#f9b4c9"/>
          <stop offset="0.18" stopColor="#dfb5da"/>
          <stop offset="0.33" stopColor="#b9b7f5"/>
          <stop offset="0.63" stopColor="#b6e6d8"/>
        </linearGradient>
      </defs>
      <path 
        fill="url(#beautia_gradient)" 
        d="M44.26,42.3l-14.93-29.44L23.21,0,2.07,42.36c-6.74,13.51,3.76,29.13,20.29,29.62.28,0,.57.01.85.01h0c.29,0,.57,0,.85-.01,16.56-.5,27.04-16.19,20.2-29.69ZM40.94,59.46c-2.28,3.54-6.21,5.33-8.78,4-2.57-1.33-2.8-5.27-.52-8.81,2.28-3.54,6.21-5.33,8.78-4,2.57,1.33,2.8,5.27.52,8.81Z"
      />
    </svg>
  );
}
