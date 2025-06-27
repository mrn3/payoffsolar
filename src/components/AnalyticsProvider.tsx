'use client';

import { useEffect, useState } from 'react';
import GoogleAnalytics from './GoogleAnalytics';

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

  if (loading) {
    return null;
  }

  return <GoogleAnalytics trackingId={trackingId} />;
}
