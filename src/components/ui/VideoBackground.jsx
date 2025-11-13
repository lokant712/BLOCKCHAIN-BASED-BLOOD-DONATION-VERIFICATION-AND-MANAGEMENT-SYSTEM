import React from 'react';

const VideoBackground = ({ videoSrc = '/assets/BACKGROUND.mp4', blur = 'md', overlay = 'dark' }) => {
  const overlayClasses = {
    dark: 'bg-black/50',
    light: 'bg-white/30',
    none: ''
  };

  const blurClasses = {
    sm: 'blur-sm',
    md: 'blur-md',
    lg: 'blur-lg',
    xl: 'blur-xl',
    none: ''
  };

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className={`absolute inset-0 w-full h-full object-cover ${blurClasses[blur] || 'blur-md'}`}
      >
        <source src={videoSrc} type="video/mp4" />
        {/* Fallback gradient if video fails to load */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-900 via-slate-900 to-blue-900"></div>
      </video>
      
      {/* Dark overlay for better text readability */}
      {overlay !== 'none' && (
        <div className={`absolute inset-0 ${overlayClasses[overlay] || overlayClasses.dark}`}></div>
      )}
    </div>
  );
};

export default VideoBackground;
