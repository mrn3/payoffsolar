'use client';

import { useEffect, useState } from 'react';
import GoogleAnalytics, { trackEvent, trackGenerateLead } from './GoogleAnalytics';

export default function AnalyticsProvider() {
  const [trackingId, setTrackingId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrackingId = async () => {
      try {
        const response = await fetch('/api/settings?public=true');
        if (response.ok) {
          const data = await response.json();
          const gaSetting = data.settings.find((setting: any) => setting.setting_key === 'google_analytics_id');
          if (gaSetting && gaSetting.setting_value) {
            setTrackingId(gaSetting.setting_value);
          }
        }
      } catch (error) {
        console.error('Error fetching Google Analytics ID:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrackingId();
  }, []);

  // One delegated listener tracks every tel:, sms: and mailto: link site-wide
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.('a[href]');
      const href = link?.getAttribute('href') || '';
      if (href.startsWith('tel:')) {
        trackEvent('click_to_call', 'contact', href.slice(4));
        trackGenerateLead('phone_call');
      } else if (href.startsWith('sms:')) {
        trackEvent('click_to_text', 'contact', href.slice(4));
        trackGenerateLead('text_message');
      } else if (href.startsWith('mailto:')) {
        trackEvent('click_to_email', 'contact', href.slice(7));
        trackGenerateLead('email');
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  if (loading) {
    return null;
  }

  return <GoogleAnalytics trackingId={trackingId} />;
}
