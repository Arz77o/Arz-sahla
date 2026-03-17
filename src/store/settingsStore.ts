import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface SettingsState {
  usd_to_dzd_rate: number;
  commission_rate: number;
  shipping_cost_dzd: number;
  isLoading: boolean;
  fetchSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  usd_to_dzd_rate: 250, // Default fallback
  commission_rate: 1.2, // Default fallback
  shipping_cost_dzd: 0,
  isLoading: true,
  fetchSettings: async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .single();

      if (!error && data) {
        const settings = data as any;
        set({
          usd_to_dzd_rate: Number(settings.usd_to_dzd_rate),
          commission_rate: Number(settings.commission_rate),
          shipping_cost_dzd: Number(settings.shipping_cost_dzd),
          isLoading: false,
        });
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      set({ isLoading: false });
    }
  },
}));
