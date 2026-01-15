import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

  const resolveTenant = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get current domain (for multi-tenant resolution)
      const currentDomain = window.location.hostname;
      
      // Try to find cafe by domain
      let { data, error: fetchError } = await supabase
        .from('cafes')
        .select('*')
        .eq('domain', currentDomain)
        .maybeSingle();

      // If no match by exact domain, try preview/localhost fallback
      if (!data) {
        // For development/preview, get the first cafe or create default
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('cafes')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (fallbackError) throw fallbackError;
        data = fallbackData;
      }

      if (data) {
        // Parse theme JSON safely
        let theme: CafeTheme = defaultTheme;
        if (data.theme) {
          if (typeof data.theme === 'string') {
            try {
              theme = JSON.parse(data.theme);
            } catch {
              theme = defaultTheme;
            }
          } else if (typeof data.theme === 'object' && !Array.isArray(data.theme)) {
            const themeObj = data.theme as Record<string, unknown>;
            theme = {
              default_mode: (themeObj.default_mode as 'light' | 'dark') || defaultTheme.default_mode,
              primary_color: (themeObj.primary_color as string) || defaultTheme.primary_color,
              accent_color: (themeObj.accent_color as string) || defaultTheme.accent_color,
            };
          }
        }

        const cafeData: Cafe = {
          id: data.id,
          name: data.name,
          domain: data.domain,
          logo_url: data.logo_url,
          description: data.description,
          tagline: data.tagline,
          theme,
          address: data.address,
          phone: data.phone,
          whatsapp_number: data.whatsapp_number,
          facebook_url: data.facebook_url,
          instagram_url: data.instagram_url,
          opening_hours: data.opening_hours,
          google_maps_url: data.google_maps_url,
        };

        setCafe(cafeData);

        // Apply theme based on cafe default (if no user preference)
        const userPreference = localStorage.getItem('theme');
        if (!userPreference) {
          setTheme(theme.default_mode);
        }

        // Apply custom CSS variables for theme colors
        applyThemeColors(theme);
      } else {
        setError('No café configuration found. Please set up your café.');
      }
    } catch (err: any) {
      console.error('Error resolving tenant:', err);
      setError(err.message || 'Failed to load café configuration');
    } finally {
      setLoading(false);
    }
  };

  const applyThemeColors = (theme: CafeTheme) => {
    const root = document.documentElement;
    
    // Convert hex to HSL for Tailwind compatibility
    const hexToHSL = (hex: string): string => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (!result) return '';
      
      let r = parseInt(result[1], 16) / 255;
      let g = parseInt(result[2], 16) / 255;
      let b = parseInt(result[3], 16) / 255;
      
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h = 0, s = 0, l = (max + min) / 2;
      
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
  }, []);

  return (
    <CafeContext.Provider value={{ cafe, loading, error, refetch: resolveTenant }}>
      {children}
    </CafeContext.Provider>
  );
};

export default CafeContext;
