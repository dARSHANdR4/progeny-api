import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { Alert } from 'react-native';
import { supabase, UserProfile, UsageData, Subscription, IS_DEMO_MODE } from '../lib/supabase';

// Demo user data for testing without Supabase
const DEMO_PROFILE: UserProfile = {
    id: 'demo-user-123',
    full_name: 'Demo Farmer',
    is_admin: false,
    created_at: new Date().toISOString(),
};

const DEMO_USAGE: UsageData = {
    daily_scans_used: 2,
    daily_limit: 5,
    can_scan: true,
    total_scans_available: 3,
};

interface AuthContextType {
    user: User | null;
    session: Session | null;
    profile: UserProfile | null;
    usage: UsageData | null;
    subscription: Subscription | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    isPremium: boolean;
    isAdmin: boolean;
    canScan: boolean;
    isDemoMode: boolean;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
    refreshUserData: (isBackground?: boolean) => Promise<void>;
    resetPasswordForEmail: (email: string) => Promise<{ error: Error | null }>;
    updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
    isRecoveringPassword: boolean;
    setIsRecoveringPassword: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(IS_DEMO_MODE ? DEMO_PROFILE : null);
    const [usage, setUsage] = useState<UsageData | null>(IS_DEMO_MODE ? DEMO_USAGE : null);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [isLoading, setIsLoading] = useState(!IS_DEMO_MODE);
    const [isRecoveringPassword, setIsRecoveringPassword] = useState(false);

    useEffect(() => {
        // Skip Supabase in demo mode
        if (IS_DEMO_MODE) {
            console.log('🎮 Running in DEMO MODE - No Supabase connection');
            setIsLoading(false);
            return;
        }

        if (!supabase) {
            setIsLoading(false);
            return;
        }

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                loadUserData();
            } else {
                setIsLoading(false);
            }
        });

        // Listen for auth changes
        const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                const currentUser = session?.user ?? null;
                setSession(session);
                setUser(currentUser);

                if (event === 'SIGNED_IN' && currentUser) {
                    await loadUserData(currentUser);
                } else if (event === 'PASSWORD_RECOVERY') {
                    // Password recovery event triggered from a deep link
                    // The session is already set by Supabase, we just need to make sure 
                    // the user is redirected to the ResetPassword screen.
                    console.log('🔄 PASSWORD_RECOVERY event detected');
                    setIsRecoveringPassword(true);
                } else if (event === 'SIGNED_OUT') {
                    setProfile(null);
                    setUsage(null);
                    setSubscription(null);
                    setIsLoading(false);
                }
            }
        );

        return () => {
            authSubscription.unsubscribe();
        };
    }, []);

    // Handle incoming deep links (e.g. from password reset email)
    useEffect(() => {
        if (IS_DEMO_MODE || !supabase) return;

        const handleUrl = async (url: string) => {
            console.log('🔗 Handling URL:', url);
            // Alert.alert('Debug: Deep Link Received', url); // Removed to avoid potential UI block

            try {
                // Supabase puts tokens in the fragment (#...) instead of query params (?...)
                // Example: progeny://reset-password#access_token=xxx&refresh_token=yyy&type=recovery
                const parts = url.split('#');
                if (parts.length < 2) return;

                const fragment = parts[1];
                const params = new URLSearchParams(fragment);
                const accessToken = params.get('access_token');
                const refreshToken = params.get('refresh_token');
                const type = params.get('type');
                const errorCode = params.get('error_code');

                if (errorCode) {
                    console.error('❌ Link Error:', params.get('error_description'));
                    Alert.alert('Link Error', params.get('error_description') || 'Invalid recovery link');
                    return;
                }

                if (type === 'recovery') {
                    console.log('🔄 Recovery type detected, prioritizing ResetPassword screen');
                    setIsRecoveringPassword(true);
                }

                if (accessToken && supabase) {
                    console.log('🔑 Found access token in URL, type:', type);
                    const { error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken || '',
                    });

                    if (error) {
                        console.error('❌ Error setting session:', error.message);
                        Alert.alert('Session Error', error.message);
                        return;
                    }

                    if (type === 'recovery') {
                        setIsRecoveringPassword(true);
                    }
                }
            } catch (err) {
                console.error('❌ Unexpected error handling deep link:', err);
            } finally {
                // Always ensure loading is finished if we were in a loading state
                setIsLoading(false);
            }
        };

        // Listen for incoming URLs while app is running
        const subscription = Linking.addEventListener('url', (event) => {
            handleUrl(event.url);
        });

        // Check for initial URL if app was opened from a link
        Linking.getInitialURL().then((url) => {
            if (url) handleUrl(url);
        });

        return () => {
            subscription.remove();
        };
    }, []);

    const loadUserData = async (forceUser?: User, isBackground: boolean = false) => {
        const targetUser = forceUser || user;
        if (IS_DEMO_MODE || !supabase || !targetUser) {
            setIsLoading(false);
            return;
        }

        if (!isBackground) {
            setIsLoading(true);
        }
        try {
            // 1. Fetch user profile from 'profiles' table (Aligned with Web)
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('is_admin, full_name')
                .eq('id', targetUser.id)
                .single();

            if (profileData && !profileError) {
                setProfile(profileData as UserProfile);
            }

            // 2. Fetch active subscription (Aligned with Web)
            const { data: subData, error: subError } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', targetUser.id)
                .eq('status', 'active')
                .gte('expires_at', new Date().toISOString())
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (subData && !subError) {
                setSubscription(subData as Subscription);
            } else {
                setSubscription(null);
            }

            // 3. Fetch today's usage from 'daily_usage' table (Aligned with Web column 'date')
            const today = new Date().toISOString().split('T')[0];
            const { data: usageData, error: usageError } = await supabase
                .from('daily_usage')
                .select('scans_used')
                .eq('user_id', targetUser.id)
                .eq('date', today)
                .single();

            // Calculate usage metrics (Same logic as web: Admin=Inf, Premium=Sub, Basic=5)
            const dailyLimit = profileData?.is_admin ? Infinity : 5;
            const scansUsed = usageError ? 0 : (usageData?.scans_used || 0);

            setUsage({
                daily_scans_used: scansUsed,
                daily_limit: dailyLimit,
                can_scan: profileData?.is_admin || (subData && (subData.scans_remaining > 0)) || (scansUsed < dailyLimit),
                total_scans_available: profileData?.is_admin
                    ? 'unlimited'
                    : (subData && subData.scans_remaining > 0 ? subData.scans_remaining : Math.max(0, dailyLimit - scansUsed)),
            });

        } catch (error) {
            console.error('Error loading user data:', error);
        } finally {
            if (!isBackground) {
                setIsLoading(false);
            }
        }
    };

    const signIn = async (email: string, password: string) => {
        if (IS_DEMO_MODE) {
            // In demo mode, just pretend sign in worked
            return { error: null };
        }
        if (!supabase) return { error: new Error('Supabase not configured') };

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            return { error: error ? new Error(error.message) : null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    const signUp = async (email: string, password: string, fullName: string) => {
        if (IS_DEMO_MODE) {
            return { error: null };
        }
        if (!supabase) return { error: new Error('Supabase not configured') };

        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: 'https://progeny-api.vercel.app/auth/confirm',
                    data: {
                        full_name: fullName,
                    },
                },
            });
            return { error: error ? new Error(error.message) : null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    const signOut = async () => {
        if (IS_DEMO_MODE) return;
        if (supabase) {
            await supabase.auth.signOut();
        }
    };

    const refreshUserData = async (isBackground: boolean = false) => {
        if (user) {
            await loadUserData(undefined, isBackground);
        }
    };

    const resetPasswordForEmail = async (email: string) => {
        if (IS_DEMO_MODE) return { error: null };
        if (!supabase) return { error: new Error('Supabase not configured') };

        try {
            // Use web-based password reset with custom form
            // Flow: Email link → Password reset form → Success page
            // The form page handles the actual password update via Supabase API
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: 'https://progeny-password-reset.pages.dev/',
            });
            return { error: error ? new Error(error.message) : null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    const updatePassword = async (newPassword: string) => {
        if (IS_DEMO_MODE) return { error: null };
        if (!supabase) return { error: new Error('Supabase not configured') };

        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword,
            });
            return { error: error ? new Error(error.message) : null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    // Authenticated state logic
    const isAuthenticated = IS_DEMO_MODE || !!session;
    const isPremium = !!subscription && subscription.status === 'active' && subscription.scans_remaining > 0;
    const isAdmin = profile?.is_admin ?? false;
    const canScan = isAdmin || isPremium || (usage?.can_scan ?? false);

    return (
        <AuthContext.Provider
            value={{
                user,
                session,
                profile,
                usage,
                subscription,
                isLoading,
                isAuthenticated,
                isPremium,
                isAdmin,
                canScan,
                isDemoMode: IS_DEMO_MODE,
                signIn,
                signUp,
                signOut,
                refreshUserData,
                resetPasswordForEmail,
                updatePassword,
                isRecoveringPassword,
                setIsRecoveringPassword,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
