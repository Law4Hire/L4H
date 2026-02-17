// Debug console logger - paste this in browser console to capture errors
(function() {
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalLog = console.log;
  
  let errorLog = [];
  let warnLog = [];
  let infoLog = [];
  
  console.error = function(...args) {
    errorLog.push({
      timestamp: new Date().toISOString(),
      type: 'ERROR',
      message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')
    });
    originalError.apply(console, args);
  };
  
  console.warn = function(...args) {
    warnLog.push({
      timestamp: new Date().toISOString(),
      type: 'WARN',
      message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')
    });
    originalWarn.apply(console, args);
  };
  
  console.log = function(...args) {
    // Only capture logs that look like errors or important info
    const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
    if (message.includes('error') || message.includes('failed') || message.includes('⚠️') || message.includes('🚨')) {
      infoLog.push({
        timestamp: new Date().toISOString(),
        type: 'INFO',
        message: message
      });
    }
    originalLog.apply(console, args);
  };
  
  // Add global functions to extract logs
  window.getErrorLogs = () => errorLog;
  window.getWarnLogs = () => warnLog;
  window.getInfoLogs = () => infoLog;
  window.getAllLogs = () => [...errorLog, ...warnLog, ...infoLog].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  window.clearDebugLogs = () => {
    errorLog = [];
    warnLog = [];
    infoLog = [];
  };
  
  console.log('Debug logger installed. Use getErrorLogs(), getWarnLogs(), getInfoLogs(), or getAllLogs() to retrieve captured logs.');
})();
