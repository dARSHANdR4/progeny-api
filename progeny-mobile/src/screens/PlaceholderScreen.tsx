import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../styles/theme';

const PlaceholderScreen = ({ name }: { name: string }) => (
    <View style={styles.container}>
        <Text style={TYPOGRAPHY.h1}>{name}</Text>
        <Text style={TYPOGRAPHY.bodySecondary}>Coming Soon</Text>
    </View>
);

export default PlaceholderScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
});
