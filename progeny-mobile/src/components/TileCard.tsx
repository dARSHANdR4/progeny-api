import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SPACING, TYPOGRAPHY, SHADOWS } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';

interface CardProps {
    title: string;
    value?: string | number;
    icon?: React.ReactNode;
    subtitle?: string;
    onPress?: () => void;
    variant?: 'large' | 'small' | 'wide';
    status?: 'success' | 'warning' | 'error' | 'info' | 'none';
}

const TileCard: React.FC<CardProps> = ({
    title,
    value,
    icon,
    onPress,
    subtitle,
    variant = 'small',
    status = 'none',
}) => {
    const { colors, isHighContrast } = useTheme();
    const statusColor = status !== 'none' ? (colors[status as keyof typeof colors] as string) : null;

    return (
        <TouchableOpacity
            style={[
                styles.container,
                {
                    backgroundColor: colors.surface,
                    borderWidth: isHighContrast ? 2 : 0,
                    borderColor: colors.border
                },
                variant === 'large' && styles.large,
                variant === 'wide' && styles.wide,
                statusColor ? { borderLeftWidth: 4, borderLeftColor: statusColor } : null,
            ]}
            onPress={onPress}
            disabled={!onPress}
        >
            <View style={styles.header}>
                {icon && <View style={styles.iconContainer}>{icon}</View>}
                <Text style={[TYPOGRAPHY.bodySecondary, { color: colors.textSecondary }]} numberOfLines={1}>
                    {title}
                </Text>
            </View>
            <View style={styles.content}>
                {value !== undefined && (
                    <Text style={[TYPOGRAPHY.h2, { color: colors.textPrimary }]} numberOfLines={1}>
                        {value}
                    </Text>
                )}
                {subtitle && (
                    <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]} numberOfLines={2}>
                        {subtitle}
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: SPACING.md,
        borderRadius: 12,
        ...SHADOWS.small,
        flex: 1,
        margin: SPACING.xs,
        minHeight: 100,
    },
    large: {
        minHeight: 180,
    },
    wide: {
        flexBasis: '100%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    iconContainer: {
        marginRight: SPACING.xs,
    },
    content: {
        justifyContent: 'flex-end',
        flex: 1,
    },
});

export default TileCard;
