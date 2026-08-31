// Carrier tracking link builder — shared by admin UI and email templates
const CARRIER_TRACKING_PREFIXES: Record<string, string> = {
  'australia post': 'https://auspost.com.au/mypost/track/details/',
  'auspost': 'https://auspost.com.au/mypost/track/details/',
  // StarTrack consignments resolve on AusPost's unified tracking page
  'startrack': 'https://auspost.com.au/mypost/track/details/',
  'sendle': 'https://track.sendle.com/tracking?ref=',
  'toll': 'https://www.mytoll.com/?externalSearchQuery=',
  'dhl': 'https://www.dhl.com/au-en/home/tracking/tracking-express.html?submit=1&tracking-id=',
  'couriersplease': 'https://www.couriersplease.com.au/tools-track?no=',
  'couriers please': 'https://www.couriersplease.com.au/tools-track?no=',
  // Fastway rebranded to Aramex
  'fastway': 'https://www.aramex.com.au/tools/track?l=',
  'aramex': 'https://www.aramex.com.au/tools/track?l=',
};

export function buildTrackingLink(carrier: string, trackingNumber: string): string {
  const tn = (trackingNumber || '').trim();
  if (!tn) return '';
  const key = (carrier || '').trim().toLowerCase();
  if (!key) return '';
  const prefix = CARRIER_TRACKING_PREFIXES[key]
    || Object.entries(CARRIER_TRACKING_PREFIXES).find(([name]) => key.includes(name))?.[1];
  return prefix ? prefix + encodeURIComponent(tn) : '';
}
