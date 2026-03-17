export const isAppleDevice = () => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  const platform = window.navigator.platform?.toLowerCase() || '';
  
  // Check for iOS devices
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  
  // Check for macOS
  const isMac = /mac/.test(platform) && !('ontouchend' in document);
  
  // Check for Safari on any Apple device
  const isSafari = /safari/.test(userAgent) && !/chrome|chromium|crios|fxios/.test(userAgent);
  
  return isIOS || isMac || isSafari;
};

export const getDeviceType = () => {
  if (typeof window === 'undefined') return 'unknown';
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  
  if (/iphone/.test(userAgent)) return 'iPhone';
  if (/ipad/.test(userAgent)) return 'iPad';
  if (/ipod/.test(userAgent)) return 'iPod';
  if (/mac/.test(window.navigator.platform?.toLowerCase() || '')) return 'Mac';
  if (/android/.test(userAgent)) return 'Android';
  if (/windows/.test(userAgent)) return 'Windows';
  
  return 'Other';
};
