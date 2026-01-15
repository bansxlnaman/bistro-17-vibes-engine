import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from 'next-themes';

export interface CafeTheme {
  default_mode: 'light' | 'dark';
  primary_color: string;
  accent_color: string;
}

export interface Cafe {
  id: string;
  name: string;
  domain: string;
  logo_url: string | null;
  description: string | null;
  tagline: string | null;
  theme: CafeTheme;
  address: string | null;
  phone: string | null;
  whatsapp_number: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  opening_hours: string | null;
  google_maps_url: string | null;
}

interface CafeContextType {
  cafe: Cafe | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const defaultTheme: CafeTheme = {
  default_mode: 'light',
  primary_color: '#4f7c5a',
  accent_color: '#e0b15a',
};

const CafeContext = createContext<CafeContextType | undefined>(undefined);

export const useCafe = () => {
  const context = useContext(CafeContext);
  if (!context) {
    throw new Error('useCafe must be used within a CafeProvider');
  }
  return context;
};

interface CafeProviderProps {
  children: ReactNode;
}

export const CafeProvider = ({ children }: CafeProviderProps) => {
  const [cafe, setCafe] = useState<Cafe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setTheme } = useTheme();

  const resolveTenant = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Define hostname and isDevelopment
      const hostname = window.location.hostname;
      const isDevelopment =
        hostname === "localhost" || hostname.endsWith(".vercel.app");

      console.log("Hostname:", hostname);
      console.log("isDevelopment:", isDevelopment);

      let cafeData = null;

      // Try to find cafe by domain
      const query = isDevelopment
        ? supabase
            .from('cafes')
            .select('*')
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle()
        : supabase
            .from('cafes')
            .select('*')
            .eq('domain', hostname)
            .maybeSingle();

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      cafeData = data;

      if (cafeData) {
        // Parse theme JSON safely
        let theme: CafeTheme = defaultTheme;
        if (cafeData.theme) {
          if (typeof cafeData.theme === 'string') {
            try {
              theme = JSON.parse(cafeData.theme);
            } catch {
              theme = defaultTheme;
            }
          } else if (typeof cafeData.theme === 'object' && !Array.isArray(cafeData.theme)) {
            const themeObj = cafeData.theme as Record<string, unknown>;
            theme = {
              default_mode: (themeObj.default_mode as 'light' | 'dark') || defaultTheme.default_mode,
              primary_color: (themeObj.primary_color as string) || defaultTheme.primary_color,
              accent_color: (themeObj.accent_color as string) || defaultTheme.accent_color,
            };
          }
        }

        const formattedCafeData: Cafe = {
          id: cafeData.id,
          name: cafeData.name,
          domain: cafeData.domain,
          logo_url: cafeData.logo_url,
          description: cafeData.description,
          tagline: cafeData.tagline,
          theme,
          address: cafeData.address,
          phone: cafeData.phone,
          whatsapp_number: cafeData.whatsapp_number,
          facebook_url: cafeData.facebook_url,
          instagram_url: cafeData.instagram_url,
          opening_hours: cafeData.opening_hours,
          google_maps_url: cafeData.google_maps_url,
        };

        setCafe(formattedCafeData);

        // Apply theme based on priority:
        // 1. User preference (localStorage)
        // 2. Cafe default theme
        // 3. System preference (handled by next-themes)
        const userPreference = localStorage.getItem('theme');
        if (userPreference && (userPreference === 'light' || userPreference === 'dark')) {
          setTheme(userPreference);
        } else {
          setTheme(theme.default_mode);
        }

        // Apply custom CSS variables for theme colors
        applyThemeColors(theme);
      } else {
        setError('No café configuration found. Please set up your café.');
      }
    } catch (err: unknown) {
      console.error('Error resolving tenant:', err);
      setError(err instanceof Error ? err.message : 'Failed to load café configuration');
    } finally {
      setLoading(false);
    }
  }, [setTheme]);

  const applyThemeColors = (theme: CafeTheme) => {
    const root = document.documentElement;
    
    // Convert hex to HSL for Tailwind compatibility
    const hexToHSL = (hex: string): string => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (!result) return '';
      
      const r = parseInt(result[1], 16) / 255;
      const g = parseInt(result[2], 16) / 255;
      const b = parseInt(result[3], 16) / 255;
      
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h = 0, s = 0;
      const l = (max + min) / 2;
      
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
          case g: h = ((b - r) / d + 2) / 6; break;
          case b: h = ((r - g) / d + 4) / 6; break;
        }
      }
      
      return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    };

    if (theme.primary_color) {
      const primaryHSL = hexToHSL(theme.primary_color);
      if (primaryHSL) {
        root.style.setProperty('--primary', primaryHSL);
      }
    }

    if (theme.accent_color) {
      const accentHSL = hexToHSL(theme.accent_color);
      if (accentHSL) {
        root.style.setProperty('--accent', accentHSL);
      }
    }
  };

  useEffect(() => {
    resolveTenant();
  }, [resolveTenant]);

  return (
    <CafeContext.Provider value={{ cafe, loading, error, refetch: resolveTenant }}>
      {children}
    </CafeContext.Provider>
  );
};

export default CafeContext;
