import React from 'react';

/**
 * A standard version stamp component that displays the current application version
 * in the bottom-left corner of the layout.
 */
export const VersionStamp: React.FC = () => {
  // Use the dynamic version from Vite/build
  // @ts-expect-error - __APP_VERSION__ is defined in vite.config.ts
  const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.1.DEV';

  return (
    <div className="fixed bottom-2 left-2 z-[100] bg-black/50 text-white text-[10px] px-2 py-1 rounded-md pointer-events-none backdrop-blur-sm border border-white/10 font-mono">
      {version}
    </div>
  );
};

export default VersionStamp;
