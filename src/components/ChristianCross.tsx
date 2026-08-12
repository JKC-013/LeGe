import React from 'react';

export const ChristianCross = ({ className = "w-6 h-6", color = "currentColor" }: { className?: string, color?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={color} className={className}>
    <path d="M10.5 2v6h-5v4h5v10h3V12h5V8h-5V2h-3z" />
  </svg>
);
