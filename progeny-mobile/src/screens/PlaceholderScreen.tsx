import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../styles/theme';

import { useLanguage } from '../contexts/LanguageContext';

const PlaceholderScreen = ({ name }: { name: string }) => {
    const { t } = useLanguage();
    return (
        <View style={styles.container}>
            <Text style={TYPOGRAPHY.h1}>{name}</Text>
            <Text style={TYPOGRAPHY.bodySecondary}>{t('coming_soon')}</Text>
        </View>
    );
};

export default PlaceholderScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
});
