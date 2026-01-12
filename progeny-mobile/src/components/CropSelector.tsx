import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Apple, Wheat, Bean, Leaf } from 'lucide-react-native';
import { SPACING, TYPOGRAPHY, SHADOWS } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

export interface CropType {
    value: string;
    label: string;
    color: string;
    bgColor: string;
    darkBgColor: string;
}

export const CROP_TYPES: CropType[] = [
    { value: 'apple', label: 'Apple', color: '#DC2626', bgColor: '#FEE2E2', darkBgColor: '#450a0a' },
    { value: 'corn', label: 'Corn', color: '#CA8A04', bgColor: '#FEF3C7', darkBgColor: '#422006' },
    { value: 'potato', label: 'Potato', color: '#D97706', bgColor: '#FEF3C7', darkBgColor: '#451a03' },
    { value: 'tomato', label: 'Tomato', color: '#16A34A', bgColor: '#DCFCE7', darkBgColor: '#052e16' },
];

interface CropSelectorProps {
    selectedCrop: string | null;
    onCropSelect: (cropValue: string) => void;
    disabled?: boolean;
}

const CropIcon = ({ crop, size, color }: { crop: string; size: number; color: string }) => {
    switch (crop) {
        case 'apple':
            // @ts-ignore
            return <Apple size={size} color={color} />;
        case 'corn':
            // @ts-ignore
            return <Wheat size={size} color={color} />;
        case 'potato':
            // @ts-ignore
            return <Bean size={size} color={color} />;
        case 'tomato':
            // @ts-ignore
            return <Leaf size={size} color={color} />;
        default:
            // @ts-ignore
            return <Leaf size={size} color={color} />;
    }
};

export default function CropSelector({ selectedCrop, onCropSelect, disabled }: CropSelectorProps) {
    const { colors, isDark, isHighContrast } = useTheme();
    const { t } = useLanguage();

    const localizedCropTypes = CROP_TYPES.map(crop => ({
        ...crop,
        label: t(crop.value as any) || crop.label
    }));

    return (
        <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: isHighContrast ? 2 : 0 }]}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{t('select_crop')}</Text>
            <View style={styles.grid}>
                {localizedCropTypes.map((crop) => {
                    const isSelected = selectedCrop === crop.value;
                    const buttonBg = isHighContrast
                        ? (isSelected ? colors.primary : colors.background)
                        : (isDark ? crop.darkBgColor : crop.bgColor);
                    const textColor = isHighContrast
                        ? (isSelected ? '#000' : colors.textPrimary)
                        : crop.color;

                    return (
                        <TouchableOpacity
                            key={crop.value}
                            style={[
                                styles.cropButton,
                                {
                                    backgroundColor: buttonBg,
                                    borderColor: isSelected ? colors.primary : (isHighContrast ? colors.border : 'transparent')
                                },
                                isSelected && styles.cropButtonSelected,
                                disabled && styles.cropButtonDisabled,
                            ]}
                            onPress={() => onCropSelect(crop.value)}
                            disabled={disabled}
                            activeOpacity={0.7}
                        >
                            <CropIcon
                                crop={crop.value}
                                size={32}
                                color={textColor}
                            />
                            <Text style={[styles.cropLabel, { color: textColor }]}>
                                {crop.label}
                            </Text>
                            {isSelected && (
                                <View style={[styles.selectedIndicator, { backgroundColor: isHighContrast ? '#000' : colors.primary }]}>
                                    <Text style={[styles.checkmark, { color: isHighContrast ? colors.primary : '#fff' }]}>✓</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
            {selectedCrop && (
                <View style={[
                    styles.selectedInfo,
                    {
                        backgroundColor: isHighContrast ? colors.background : colors.primary + '20',
                        borderColor: colors.primary,
                        flexDirection: 'row',
                        alignItems: 'center',
                    }
                ]}>
                    <View style={[styles.cropIconSelected, { backgroundColor: isHighContrast ? '#000' : colors.primary + '20' }]}>
                        <CropIcon crop={selectedCrop} size={20} color={isHighContrast ? colors.primary : colors.primary} />
                    </View>
                    <Text style={[styles.selectedText, { color: colors.textPrimary }]}>
                        {t('selected')}: <Text style={{ fontWeight: 'bold' }}>{t(selectedCrop as any)}</Text>
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
    title: {
        ...TYPOGRAPHY.h3,
        marginBottom: SPACING.md,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
    },
    cropButton: {
        flex: 1,
        minWidth: '45%',
        padding: SPACING.md,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
    },
    cropButtonSelected: {
        ...SHADOWS.small,
    },
    cropButtonDisabled: {
        opacity: 0.5,
    },
    cropLabel: {
        marginTop: SPACING.xs,
        fontWeight: '600',
        fontSize: 14,
    },
    selectedIndicator: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkmark: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    selectedInfo: {
        marginTop: SPACING.md,
        padding: SPACING.sm,
        borderRadius: 8,
        borderWidth: 1,
    },
    selectedText: {
        ...TYPOGRAPHY.body,
    },
    selectedCropName: {
        fontWeight: 'bold',
        textTransform: 'capitalize',
    },
    cropIconSelected: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.sm,
    },
});
