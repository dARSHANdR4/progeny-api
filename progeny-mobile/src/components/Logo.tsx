import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { LOGO_SVG } from '../assets/logoSvg';

import { useTheme } from '../contexts/ThemeContext';

interface LogoProps {
    size?: number;
    style?: ViewStyle;
    color?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 80, style, color }) => {
    const { colors, isHighContrast, isDark } = useTheme();

    // Determine the color for the SVG paths
    const finalColor = color || (isHighContrast ? colors.primary : (isDark ? colors.primary : undefined));

    let xml = LOGO_SVG;
    if (finalColor) {
        // Replace all fill colors in the SVG with the final color
        xml = LOGO_SVG.replace(/fill="#[0-9A-Fa-f]{6}"/g, `fill="${finalColor}"`);
    }

    return (
        <View style={[styles.container, { width: size, height: size }, style]}>
            <SvgXml
                xml={xml}
                width={size}
                height={size}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
});
