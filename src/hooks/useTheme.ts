import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface ThemeState {
    themeMode: 'light' | 'dark' | 'system';
    primaryColor: string;
    sidebarColor: string;
    isLoading: boolean;

    setThemeMode: (mode: 'light' | 'dark' | 'system') => Promise<void>;
    setPrimaryColor: (color: string) => Promise<void>;
    setSidebarColor: (color: string) => Promise<void>;
    fetchTheme: () => Promise<void>;
}

export const useTheme = create<ThemeState>((set, get) => ({
    themeMode: 'light',
    primaryColor: '#2563EB',
    sidebarColor: '#ffffff',
    isLoading: true,

    setThemeMode: async (mode) => {
        set({ themeMode: mode });
        // Apply immediately to DOM
        const root = window.document.documentElement;
        if (mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('profiles').update({ theme_mode: mode }).eq('id', user.id);
        }
    },

    setPrimaryColor: async (color) => {
        set({ primaryColor: color });
        // Apply CSS vars immediately
        const root = window.document.documentElement;
        root.style.setProperty('--brand-color', color);

        // Helper to generate rgba
        const hexToRgba = (hex: string, alpha: number) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };

        root.style.setProperty('--brand-color-50', hexToRgba(color, 0.05));
        root.style.setProperty('--brand-color-100', hexToRgba(color, 0.1));
        root.style.setProperty('--brand-color-700', color);

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('profiles').update({ primary_color: color }).eq('id', user.id);
        }
    },

    setSidebarColor: async (color) => {
        set({ sidebarColor: color });
        const root = window.document.documentElement;
        root.style.setProperty('--sidebar-bg', color);

        // brightness calc logic
        const getBrightness = (hex: string) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return (r * 299 + g * 587 + b * 114) / 1000;
        };
        const isDark = getBrightness(color) < 128;
        const primaryColor = get().primaryColor;

        root.style.setProperty('--sidebar-text', isDark ? '#94a3b8' : '#64748b');
        root.style.setProperty('--sidebar-active-text', isDark ? '#ffffff' : primaryColor);

        const hexToRgba = (hex: string, alpha: number) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };

        root.style.setProperty('--sidebar-active-bg', isDark ? 'rgba(255, 255, 255, 0.1)' : hexToRgba(primaryColor, 0.1));

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('profiles').update({ sidebar_color: color }).eq('id', user.id);
        }
    },

    fetchTheme: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('profiles')
            .select('theme_mode, primary_color, sidebar_color')
            .eq('id', user.id)
            .single();

        if (data) {
            // Use the set methods to trigger side effects
            get().setThemeMode(data.theme_mode as any || 'light');
            get().setPrimaryColor(data.primary_color || '#2563EB');
            get().setSidebarColor(data.sidebar_color || '#ffffff');
            set({ isLoading: false });
        }
    }
}));
