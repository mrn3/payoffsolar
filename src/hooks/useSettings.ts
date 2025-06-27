'use client';

import { useState, useEffect } from 'react';
import { SiteSetting } from '@/lib/models';

export function useSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings?public=true');
        if (response.ok) {
          const data = await response.json();
          const settingsMap: Record<string, string> = {};
          data.settings.forEach((setting: SiteSetting) => {
            settingsMap[setting.setting_key] = setting.setting_value || '';
          });
          setSettings(settingsMap);
        } else {
          setError('Failed to fetch settings');
        }
      } catch (err) {
        setError('Error fetching settings');
        console.error('Error fetching settings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return { settings, loading, error };
}

export function useSetting(key: string) {
  const { settings, loading, error } = useSettings();
  return { 
    value: settings[key] || '', 
    loading, 
    error 
  };
}
