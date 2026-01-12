/**
 * Progeny Mobile UI Component Library
 * Reusable components styled for the agricultural theme
 */

import React from 'react';
import {
    TouchableOpacity,
    Text,
    View,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacityProps,
    ViewStyle,
} from 'react-native';
import { SPACING, TYPOGRAPHY, SHADOWS } from '../../styles/theme';
import { useTheme } from '../../contexts/ThemeContext';

// ============ BUTTON COMPONENT ============
interface ButtonProps extends TouchableOpacityProps {
    title: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'premium';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    icon?: React.ReactNode;
}

export function Button({
    title,
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    style,
    disabled,
    ...props
}: ButtonProps) {
    const { colors, isHighContrast } = useTheme();

    const getVariantStyles = () => {
        switch (variant) {
            case 'primary':
                return { backgroundColor: colors.primary, textColor: isHighContrast ? '#000' : '#fff' };
            case 'secondary':
                return { backgroundColor: colors.secondary, textColor: isHighContrast ? '#000' : '#1F2937' };
            case 'outline':
                return {
                    backgroundColor: 'transparent',
                    textColor: colors.primary,
                    borderWidth: 2,
                    borderColor: colors.primary
                };
            case 'ghost':
                return { backgroundColor: 'transparent', textColor: colors.primary };
            case 'premium':
                return { backgroundColor: isHighContrast ? colors.primary : '#8B5CF6', textColor: isHighContrast ? '#000' : '#fff' };
            default:
                return { backgroundColor: colors.primary, textColor: '#fff' };
        }
    };

    const { backgroundColor, textColor, borderWidth, borderColor } = getVariantStyles();

    return (
        <TouchableOpacity
            style={[
                styles.button,
                styles[`button_${size}`],
                { backgroundColor, borderWidth, borderColor },
                isHighContrast && { borderWidth: 2, borderColor: borderColor || colors.border },
                disabled && styles.buttonDisabled,
                style,
            ]}
            disabled={disabled || loading}
            activeOpacity={0.7}
            {...props}
        >
            {loading ? (
                <ActivityIndicator
                    size="small"
                    color={textColor}
                />
            ) : (
                <View style={styles.buttonContent}>
                    {icon && <View style={styles.buttonIcon}>{icon}</View>}
                    <Text style={[
                        styles.buttonText,
                        styles[`buttonText_${size}`],
                        { color: textColor }
                    ]}>{title}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

// ============ CARD COMPONENT ============
interface CardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    variant?: 'default' | 'elevated' | 'outlined';
}

export function Card({ children, style, variant = 'default' }: CardProps) {
    const { colors, isHighContrast } = useTheme();

    return (
        <View style={[
            styles.card,
            {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderWidth: (variant === 'outlined' || isHighContrast) ? (isHighContrast ? 2 : 1) : 0
            },
            variant === 'elevated' && !isHighContrast && SHADOWS.medium,
            style
        ]}>
            {children}
        </View>
    );
}

// ============ BADGE COMPONENT ============
interface BadgeProps {
    label: string;
    variant?: 'default' | 'success' | 'warning' | 'error' | 'premium';
    size?: 'sm' | 'md';
}

export function Badge({ label, variant = 'default', size = 'md' }: BadgeProps) {
    const { colors, isHighContrast, isDark } = useTheme();

    const getBadgeStyles = () => {
        if (isHighContrast) {
            return { bg: '#000', text: colors.textPrimary, border: 1 };
        }

        switch (variant) {
            case 'success':
                return { bg: isDark ? '#064e3b' : '#DCFCE7', text: isDark ? '#4ADE80' : '#15803D' };
            case 'warning':
                return { bg: isDark ? '#451a03' : '#FEF3C7', text: isDark ? '#FBBF24' : '#92400E' };
            case 'error':
                return { bg: isDark ? '#450a0a' : '#FEE2E2', text: isDark ? '#F87171' : '#DC2626' };
            case 'premium':
                return { bg: isDark ? '#4c1d95' : '#F3E8FF', text: isDark ? '#A78BFA' : '#8B5CF6' };
            default:
                return { bg: colors.border, text: colors.textSecondary };
        }
    };

    const { bg, text, border } = getBadgeStyles();

    return (
        <View style={[
            styles.badge,
            styles[`badge_${size}`],
            { backgroundColor: bg, borderWidth: border || 0, borderColor: text }
        ]}>
            <Text style={[
                styles.badgeText,
                styles[`badgeText_${size}`],
                { color: text }
            ]}>
                {label}
            </Text>
        </View>
    );
}

// ============ PROGRESS COMPONENT ============
interface ProgressProps {
    value: number; // 0-100
    height?: number;
    color?: string;
    backgroundColor?: string;
}

export function Progress({
    value,
    height = 8,
    color,
    backgroundColor,
}: ProgressProps) {
    const { colors } = useTheme();
    const clampedValue = Math.min(Math.max(value, 0), 100);

    const finalColor = color || colors.primary;
    const finalBg = backgroundColor || colors.border;

    return (
        <View style={[styles.progressContainer, { height, backgroundColor: finalBg }]}>
            <View
                style={[
                    styles.progressFill,
                    {
                        width: `${clampedValue}%`,
                        height,
                        backgroundColor: finalColor,
                    },
                ]}
            />
        </View>
    );
}

// ============ AVATAR COMPONENT ============
interface AvatarProps {
    name: string;
    size?: 'sm' | 'md' | 'lg';
    color?: string;
}

export function Avatar({ name, size = 'md', color }: AvatarProps) {
    const { colors } = useTheme();
    const initials = name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const bgColor = color || colors.primary;

    return (
        <View style={[styles.avatar, styles[`avatar_${size}`], { backgroundColor: bgColor }]}>
            <Text style={[styles.avatarText, styles[`avatarText_${size}`]]}>{initials}</Text>
        </View>
    );
}

// ============ STYLES ============
const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
    },
    button_sm: {
        paddingVertical: SPACING.xs,
        paddingHorizontal: SPACING.md,
    },
    button_md: {
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.lg,
    },
    button_lg: {
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.xl,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    buttonIcon: {
        marginRight: SPACING.xs,
    },
    buttonText: {
        fontWeight: '600',
    },
    buttonText_sm: {
        fontSize: 12,
    },
    buttonText_md: {
        fontSize: 14,
    },
    buttonText_lg: {
        fontSize: 16,
    },

    // Card styles
    card: {
        borderRadius: 16,
        padding: SPACING.lg,
    },

    // Badge styles
    badge: {
        borderRadius: 100,
        alignSelf: 'flex-start',
    },
    badge_sm: {
        paddingVertical: 2,
        paddingHorizontal: SPACING.xs,
    },
    badge_md: {
        paddingVertical: SPACING.xs,
        paddingHorizontal: SPACING.sm,
    },
    badgeText: {
        fontWeight: '600',
    },
    badgeText_sm: {
        fontSize: 10,
    },
    badgeText_md: {
        fontSize: 12,
    },

    // Progress styles
    progressContainer: {
        borderRadius: 100,
        overflow: 'hidden',
    },
    progressFill: {
        borderRadius: 100,
    },

    // Avatar styles
    avatar: {
        borderRadius: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatar_sm: {
        width: 32,
        height: 32,
    },
    avatar_md: {
        width: 40,
        height: 40,
    },
    avatar_lg: {
        width: 56,
        height: 56,
    },
    avatarText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    avatarText_sm: {
        fontSize: 12,
    },
    avatarText_md: {
        fontSize: 14,
    },
    avatarText_lg: {
        fontSize: 18,
    },
});
