import React from 'react';

/**
 * A standard version stamp component that displays the current application version
 * in the bottom-left corner of the layout.
 */
export const VersionStamp: React.FC = () => {
  // Use the fixed version requested
  const version = '0.1.202602181200';

  return (
    <div className="fixed bottom-2 left-2 z-[100] bg-black/50 text-white text-[10px] px-2 py-1 rounded-md pointer-events-none backdrop-blur-sm border border-white/10 font-mono">
      {version}
    </div>
  );
};

export default VersionStamp;
