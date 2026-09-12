import { supabase } from '@/lib/supabase';
import { CONTACT_INFO } from '@/constants/contactInfo';

export interface PaymentSettings {
    walletNumber: string;
    instapayHandle: string;
    instapayLink?: string;
    updatedAt?: string;
}

const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
    walletNumber: CONTACT_INFO.walletNumber,
    instapayHandle: CONTACT_INFO.instapayHandle,
    instapayLink: '',
};

const CACHE_KEY = 'd95_payment_settings_cache';

export async function fetchPaymentSettings(): Promise<PaymentSettings> {
    // 1. Try local cache first for instant rendering
    let cached: PaymentSettings | null = null;
    try {
        const item = localStorage.getItem(CACHE_KEY);
        if (item) {
            cached = JSON.parse(item);
        }
    } catch {
        // Ignore storage errors
    }

    try {
        const { data, error } = await supabase
            .from('app_settings')
            .select('value, updated_at')
            .eq('key', 'payment_settings')
            .maybeSingle();

        if (!error && data?.value) {
            const settings: PaymentSettings = {
                walletNumber: data.value.walletNumber || DEFAULT_PAYMENT_SETTINGS.walletNumber,
                instapayHandle: data.value.instapayHandle || DEFAULT_PAYMENT_SETTINGS.instapayHandle,
                instapayLink: data.value.instapayLink || '',
                updatedAt: data.updated_at,
            };
            try {
                localStorage.setItem(CACHE_KEY, JSON.stringify(settings));
            } catch {
                // Ignore
            }
            return settings;
        }
    } catch (err) {
        console.error('Error fetching payment settings from Supabase:', err);
    }

    return cached || DEFAULT_PAYMENT_SETTINGS;
}

export async function updatePaymentSettings(settings: PaymentSettings): Promise<PaymentSettings> {
    const payload = {
        walletNumber: settings.walletNumber.trim(),
        instapayHandle: settings.instapayHandle.trim(),
        instapayLink: (settings.instapayLink || '').trim(),
    };

    const { data, error } = await supabase
        .from('app_settings')
        .upsert({
            key: 'payment_settings',
            value: payload,
            updated_at: new Date().toISOString(),
        })
        .select('value, updated_at')
        .single();

    if (error) {
        console.error('Error updating payment settings:', error);
        throw error;
    }

    const updated: PaymentSettings = {
        walletNumber: data?.value?.walletNumber || payload.walletNumber,
        instapayHandle: data?.value?.instapayHandle || payload.instapayHandle,
        instapayLink: data?.value?.instapayLink || payload.instapayLink,
        updatedAt: data?.updated_at,
    };

    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
    } catch {
        // Ignore
    }

    return updated;
}
