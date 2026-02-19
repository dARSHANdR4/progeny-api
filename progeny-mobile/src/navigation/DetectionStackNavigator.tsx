import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import DetectionScreen from '../screens/detection/DetectionScreen';
import RealtimeDetectionScreen from '../screens/detection/RealtimeDetectionScreen';
import { useTheme } from '../contexts/ThemeContext';

const Stack = createStackNavigator();

const DetectionStackNavigator = () => {
    const { colors } = useTheme();

    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                cardStyle: { backgroundColor: colors.background },
            }}
        >
            <Stack.Screen name="DetectionMain" component={DetectionScreen} />
            <Stack.Screen name="RealtimeDetection" component={RealtimeDetectionScreen} />
        </Stack.Navigator>
    );
};

export default DetectionStackNavigator;
