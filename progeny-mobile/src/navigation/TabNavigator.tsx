import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Camera, History, Users, MessageSquare, Accessibility } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

// Screens
import DetectionScreen from '../screens/detection/DetectionScreen';
import HistoryScreen from '../screens/history/HistoryScreen';
import CommunityScreen from '../screens/community/CommunityScreen';
import ChatbotScreen from '../screens/chatbot/ChatbotScreen';
import AccessibilityScreen from '../screens/accessibility/AccessibilityScreen';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
    const { colors, isDark, isHighContrast } = useTheme();
    const { t } = useLanguage();

    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textSecondary,
                tabBarStyle: {
                    backgroundColor: colors.surface,
                    borderTopWidth: isHighContrast ? 2 : 1,
                    borderTopColor: colors.border,
                    height: 65,
                    paddingBottom: 10,
                    paddingTop: 8,
                },
                headerStyle: {
                    backgroundColor: colors.primary,
                },
                headerTintColor: isHighContrast ? '#000' : '#fff',
                headerTitleStyle: {
                    fontWeight: 'bold' as const,
                },
                headerShown: false,
            }}
        >
            <Tab.Screen
                name="Detection"
                component={DetectionScreen}
                options={{
                    tabBarLabel: t('detection'),
                    tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                        // @ts-ignore
                        <Camera color={color} size={size} />
                    ),
                }}
            />
            <Tab.Screen
                name="History"
                component={HistoryScreen}
                options={{
                    tabBarLabel: t('history'),
                    tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                        // @ts-ignore
                        <History color={color} size={size} />
                    ),
                }}
            />
            <Tab.Screen
                name="Community"
                component={CommunityScreen}
                options={{
                    tabBarLabel: t('community'),
                    tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                        // @ts-ignore
                        <Users color={color} size={size} />
                    ),
                }}
            />
            <Tab.Screen
                name="Progeniture"
                component={ChatbotScreen}
                options={{
                    tabBarLabel: t('progeniture'),
                    tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                        // @ts-ignore
                        <MessageSquare color={color} size={size} />
                    ),
                }}
            />
            <Tab.Screen
                name="Accessibility"
                component={AccessibilityScreen}
                options={{
                    tabBarLabel: t('accessibility'),
                    tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                        // @ts-ignore
                        <Accessibility color={color} size={size} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

export default TabNavigator;
