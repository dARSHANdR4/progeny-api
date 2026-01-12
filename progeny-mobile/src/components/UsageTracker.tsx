import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Leaf, AlertCircle } from 'lucide-react-native';
import { SPACING, TYPOGRAPHY, SHADOWS } from '../styles/theme';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useTheme } from '../contexts/ThemeContext';

interface UsageTrackerProps {
    compact?: boolean;
}

export default function UsageTracker({ compact = false }: UsageTrackerProps) {
    const { scansUsed, dailyLimit, scansRemaining, canScan, isAdmin, isPremium } = useSubscription();
    const { colors, isHighContrast } = useTheme();

    // Admins and premium users don't need to see usage tracker
    if (isAdmin) {
        return (
            <View style={[styles.container, compact && styles.containerCompact, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: isHighContrast ? 2 : 0 }]}>
                <Text style={[styles.adminText, { color: colors.success }]}>⚡ Unlimited Scans (Admin)</Text>
            </View>
        );
    }

    if (isPremium) {
        return (
            <View style={[styles.container, compact && styles.containerCompact, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: isHighContrast ? 2 : 0 }]}>
                <Text style={[styles.premiumText, { color: isHighContrast ? colors.primary : '#8B5CF6' }]}>👑 Premium: {scansRemaining} scans left</Text>
            </View>
        );
    }

    const usagePercentage = Math.min((scansUsed / dailyLimit) * 100, 100);
    const isNearLimit = usagePercentage >= 80;

    return (
        <View style={[styles.container, compact && styles.containerCompact, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: isHighContrast ? 2 : 0 }]}>
            <View style={styles.header}>
                {/* @ts-ignore */}
                <Leaf size={compact ? 16 : 20} color={colors.primary} />
                <Text style={[styles.title, compact && styles.titleCompact, { color: colors.textPrimary }]}>Daily Usage</Text>
            </View>

            <View style={styles.infoRow}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Scans used today</Text>
                <Text style={[styles.value, { color: colors.textPrimary }]}>{scansUsed} of {dailyLimit}</Text>
            </View>

            <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                    <View
                        style={[
                            styles.progressFill,
                            {
                                width: `${usagePercentage}%`,
                                backgroundColor: isNearLimit ? colors.warning : colors.primary
                            }
                        ]}
                    />
                </View>
            </View>

            {!compact && (
                <View style={styles.statsRow}>
                    <View style={[styles.stat, { backgroundColor: colors.background, borderWidth: isHighContrast ? 1 : 0, borderColor: colors.border }]}>
                        <Text style={[styles.statValue, { color: colors.primary }]}>{scansRemaining}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Remaining</Text>
                    </View>
                    <View style={[styles.stat, { backgroundColor: colors.background, borderWidth: isHighContrast ? 1 : 0, borderColor: colors.border }]}>
                        <Text style={[styles.statValue, { color: colors.textPrimary }]}>{scansUsed}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Used</Text>
                    </View>
                </View>
            )}

            {!canScan && (
                <View style={[styles.limitWarning, { backgroundColor: isHighContrast ? '#000' : colors.warning + '20', borderColor: colors.warning, borderWidth: isHighContrast ? 1 : 0 }]}>
                    {/* @ts-ignore */}
                    <AlertCircle size={16} color={colors.warning} />
                    <Text style={[styles.limitText, { color: colors.warning }]}>
                        Daily limit reached! Upgrade to Premium for unlimited scans.
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        padding: SPACING.lg,
        ...SHADOWS.medium,
    },
    containerCompact: {
        padding: SPACING.md,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
        gap: SPACING.sm,
    },
    title: {
        ...TYPOGRAPHY.h3,
    },
    titleCompact: {
        fontSize: 14,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.sm,
    },
    label: {
        ...TYPOGRAPHY.body,
    },
    value: {
        ...TYPOGRAPHY.body,
        fontWeight: '600',
    },
    progressContainer: {
        marginBottom: SPACING.md,
    },
    progressBar: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    statsRow: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    stat: {
        flex: 1,
        padding: SPACING.sm,
        borderRadius: 8,
        alignItems: 'center',
    },
    statValue: {
        ...TYPOGRAPHY.h3,
    },
    statLabel: {
        ...TYPOGRAPHY.caption,
    },
    limitWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: SPACING.md,
        padding: SPACING.sm,
        borderRadius: 8,
        gap: SPACING.sm,
    },
    limitText: {
        ...TYPOGRAPHY.bodySmall,
        flex: 1,
    },
    adminText: {
        ...TYPOGRAPHY.body,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    premiumText: {
        ...TYPOGRAPHY.body,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});
