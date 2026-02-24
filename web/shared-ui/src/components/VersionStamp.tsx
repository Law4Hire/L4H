import React from 'react';

/**
 * A standard version stamp component that displays the current application version
 * in the bottom-left corner of the layout.
 */
export const VersionStamp: React.FC = () => {
  // Use the dynamic version from Vite/build
  // @ts-expect-error - __APP_VERSION__ is defined in vite.config.ts
  const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.1.DEV';
  const buildDate = new Date().toLocaleString();

  return (
    <div className="fixed bottom-2 left-2 z-[100] flex flex-col gap-0.5 pointer-events-none">
      <div className="bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-md backdrop-blur-sm border border-white/10 font-mono shadow-lg">
        VER: {version}
      </div>
      <div className="bg-blue-600/60 text-white text-[9px] px-2 py-0.5 rounded-md backdrop-blur-sm border border-blue-400/20 font-mono shadow-lg">
        ARRIVED: {buildDate}
      </div>
    </div>
  );
};

export default VersionStamp;
