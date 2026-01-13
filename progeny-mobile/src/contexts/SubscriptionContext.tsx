import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuth } from './AuthContext';
import { IS_DEMO_MODE } from '../lib/supabase';

interface SubscriptionContextType {
    userRole: 'admin' | 'premium' | 'basic';
    dailyLimit: number;
    scansUsed: number;
    scansRemaining: number;
    canScan: boolean;
    isPremium: boolean;
    isAdmin: boolean;
    isLoading: boolean;
    refreshUsage: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// Demo data for testing without backend
const DEMO_SUBSCRIPTION: SubscriptionContextType = {
    userRole: 'basic',
    dailyLimit: 5,
    scansUsed: 2,
    scansRemaining: 3,
    canScan: true,
    isPremium: false,
    isAdmin: false,
    isLoading: false,
    refreshUsage: async () => { },
};

interface SubscriptionProviderProps {
    children: ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
    const { profile, usage, subscription, isAuthenticated, isAdmin, isPremium, refreshUserData, canScan } = useAuth();
    const appState = useRef(AppState.currentState);

    // Auto-refresh subscription when app returns to foreground (e.g., after browser payment)
    useEffect(() => {
        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            if (
                appState.current.match(/inactive|background/) &&
                nextAppState === 'active' &&
                isAuthenticated
            ) {
                console.log('[SubscriptionContext] App returned to foreground, refreshing subscription...');
                refreshUserData();
            }
            appState.current = nextAppState;
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription.remove();
    }, [isAuthenticated, refreshUserData]);

    const userRole = isAdmin ? 'admin' : (isPremium ? 'premium' : 'basic');
    const dailyLimit = usage?.daily_limit || 5;
    const scansUsed = usage?.daily_scans_used || 0;
    const scansRemaining = typeof usage?.total_scans_available === 'number' ? usage.total_scans_available : 0;

    const refreshUsage = async () => {
        await refreshUserData();
    };

    return (
        <SubscriptionContext.Provider
            value={{
                userRole,
                dailyLimit,
                scansUsed,
                scansRemaining,
                canScan,
                isPremium,
                isAdmin,
                isLoading: false, // Loading is handled by AuthContext
                refreshUsage,
            }}
        >
            {children}
        </SubscriptionContext.Provider>
    );
}

export function useSubscription() {
    const context = useContext(SubscriptionContext);
    if (context === undefined) {
        throw new Error('useSubscription must be used within a SubscriptionProvider');
    }
    return context;
}
