import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, User, Bot, Volume2, Mic, X } from 'lucide-react-native';
import { SPACING, TYPOGRAPHY, SHADOWS } from '../../styles/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { chatApi } from '../../services/api';
import { Audio } from 'expo-av';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
}

export default function ChatbotScreen() {
    const { colors, isHighContrast, scaledTypography } = useTheme();
    const { t } = useLanguage();

    const INITIAL_MESSAGES: Message[] = [
        {
            id: '1',
            text: t('bot_greeting'),
            sender: 'bot',
            timestamp: new Date(),
        },
    ];

    const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const flatListRef = useRef<FlatList>(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Pulse animation handle
    useEffect(() => {
        if (isRecording) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.2,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isRecording]);

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text: inputText,
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMsg]);
        const currentInput = inputText;
        setInputText('');
        setIsTyping(true);

        try {
            const data = await chatApi.sendMessage(currentInput);

            if (data.response) {
                const botMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    text: data.response,
                    sender: 'bot',
                    timestamp: new Date(),
                };
                setMessages((prev) => [...prev, botMsg]);
            } else {
                throw new Error(data.error || 'Failed to get response');
            }
        } catch (err) {
            console.error('Chat Error:', err);
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: t('chatbot_error'),
                sender: 'bot',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    const startRecording = async () => {
        try {
            const { status } = await Audio.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission denied', 'Microphone permission is required for voice chat.');
                return;
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );

            setRecording(recording);
            setIsRecording(true);
        } catch (err) {
            console.error('Failed to start recording', err);
            Alert.alert('Error', 'Failed to start recording.');
        }
    };

    const stopRecording = async () => {
        if (!recording) return;

        setIsRecording(false);
        setIsTyping(true);

        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            setRecording(null);

            if (uri) {
                const data = await chatApi.voiceChat(uri);

                // Add user's transcribed message
                const userMsg: Message = {
                    id: Date.now().toString(),
                    text: data.user_text,
                    sender: 'user',
                    timestamp: new Date(),
                };
                setMessages((prev) => [...prev, userMsg]);

                // Add bot's response
                const botMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    text: data.response,
                    sender: 'bot',
                    timestamp: new Date(),
                };
                setMessages((prev) => [...prev, botMsg]);
            }
        } catch (err: any) {
            console.error('Voice Chat Error:', err);
            Alert.alert('Voice Error', err.message || 'Failed to process voice command.');
        } finally {
            setIsTyping(false);
        }
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isBot = item.sender === 'bot';
        return (
            <View style={[styles.messageRow, isBot ? styles.botRow : styles.userRow]}>
                {isBot && (
                    <View style={[styles.botAvatar, { backgroundColor: colors.primary }]}>
                        {/* @ts-ignore */}
                        <Bot size={20} color={isHighContrast ? '#000' : '#fff'} />
                    </View>
                )}
                <View style={[
                    styles.messageBubble,
                    isBot
                        ? [styles.botBubble, { backgroundColor: colors.surface, borderWidth: isHighContrast ? 1 : 0, borderColor: colors.border }]
                        : [styles.userBubble, { backgroundColor: colors.primary, borderWidth: isHighContrast ? 1 : 0, borderColor: '#fff' }]
                ]}>
                    <Text style={[styles.messageText, isBot ? { color: colors.textPrimary } : { color: isHighContrast ? '#000' : '#fff' }, scaledTypography.body]}>
                        {item.text}
                    </Text>
                    <Text style={[styles.timestampText, { color: isBot ? colors.textSecondary : (isHighContrast ? '#000' : '#fff'), opacity: 0.8 }]}>
                        {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    {isBot && (
                        <TouchableOpacity style={[styles.listenBtn, { borderTopColor: colors.border }]}>
                            {/* @ts-ignore */}
                            <Volume2 size={14} color={colors.primary} />
                            <Text style={[styles.listenText, { color: colors.primary }]}>{t('listen')}</Text>
                        </TouchableOpacity>
                    )}
                </View>
                {!isBot && (
                    <View style={[styles.userAvatar, { backgroundColor: colors.secondary }]}>
                        {/* @ts-ignore */}
                        <User size={20} color={isHighContrast ? '#000' : '#fff'} />
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.container}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <View style={styles.headerInfo}>
                        <View style={[styles.botAvatarSmall, { backgroundColor: colors.primary }]}>
                            {/* @ts-ignore */}
                            <Bot size={16} color={isHighContrast ? '#000' : '#fff'} />
                        </View>
                        <View>
                            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Progeniture</Text>
                            <View style={styles.onlineIndicatorRow}>
                                <View style={styles.onlineDot} />
                                <Text style={styles.onlineText}>{t('online_status')}</Text>
                            </View>
                        </View>
                    </View>
                    <TouchableOpacity onPress={() => setMessages(INITIAL_MESSAGES)}>
                        <Text style={[styles.clearText, { color: colors.textSecondary }]}>{t('clear')}</Text>
                    </TouchableOpacity>
                </View>

                {/* Messages */}
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.messagesList}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                    onLayout={() => flatListRef.current?.scrollToEnd()}
                />

                {isTyping && (
                    <View style={styles.typingIndicator}>
                        <ActivityIndicator size="small" color={colors.primary} />
                        <Text style={[styles.typingText, { color: colors.textSecondary }]}>
                            {t('bot_is_typing')}
                        </Text>
                    </View>
                )}

                {/* Input area */}
                <View style={[styles.inputContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
                    <View style={styles.bottomRow}>
                        <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <TextInput
                                style={[styles.input, { color: colors.textPrimary }]}
                                placeholder={t('type_message')}
                                placeholderTextColor={colors.textSecondary}
                                value={inputText}
                                onChangeText={setInputText}
                                multiline
                                maxLength={500}
                                editable={!isRecording}
                            />
                            {inputText.trim() ? (
                                <TouchableOpacity
                                    style={[styles.sendBtn, { backgroundColor: colors.primary }]}
                                    onPress={handleSend}
                                >
                                    {/* @ts-ignore */}
                                    <Send size={20} color={isHighContrast ? '#000' : '#fff'} />
                                </TouchableOpacity>
                            ) : (
                                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                                    <TouchableOpacity
                                        style={[
                                            styles.micBtn,
                                            { backgroundColor: isRecording ? '#ef4444' : colors.primary }
                                        ]}
                                        onPress={isRecording ? stopRecording : startRecording}
                                    >
                                        {isRecording ? (
                                            /* @ts-ignore */
                                            <X size={20} color="#fff" />
                                        ) : (
                                            /* @ts-ignore */
                                            <Mic size={20} color={isHighContrast ? '#000' : '#fff'} />
                                        )}
                                    </TouchableOpacity>
                                </Animated.View>
                            )}
                        </View>
                    </View>
                    {isRecording && (
                        <Text style={[styles.recordingHint, { color: '#ef4444' }]}>
                            Recording... tap to stop
                        </Text>
                    )}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
    },
    headerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    botAvatarSmall: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.sm,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    onlineIndicatorRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    onlineDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4ade80',
        marginRight: 4,
    },
    onlineText: {
        fontSize: 10,
        color: '#4ade80',
    },
    clearText: {
        fontSize: 14,
    },
    messagesList: {
        padding: SPACING.lg,
        paddingBottom: SPACING.xl,
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: SPACING.lg,
        maxWidth: '85%',
    },
    botRow: {
        alignSelf: 'flex-start',
    },
    userRow: {
        alignSelf: 'flex-end',
        flexDirection: 'row-reverse',
    },
    botAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.sm,
        marginTop: 4,
    },
    userAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: SPACING.sm,
        marginTop: 4,
    },
    messageBubble: {
        padding: SPACING.md,
        borderRadius: 20,
        ...SHADOWS.sm,
    },
    botBubble: {
        borderTopLeftRadius: 4,
    },
    userBubble: {
        borderTopRightRadius: 4,
    },
    messageText: {
        lineHeight: 22,
    },
    timestampText: {
        fontSize: 10,
        alignSelf: 'flex-end',
        marginTop: 4,
    },
    listenBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: SPACING.sm,
        paddingTop: SPACING.sm,
        borderTopWidth: 1,
    },
    listenText: {
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 4,
    },
    typingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
        paddingBottom: SPACING.md,
    },
    typingText: {
        fontSize: 14,
        marginLeft: SPACING.sm,
        fontStyle: 'italic',
    },
    inputContainer: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        borderTopWidth: 1,
    },
    bottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 25,
        borderWidth: 1,
        paddingHorizontal: SPACING.md,
        paddingVertical: 4,
    },
    input: {
        flex: 1,
        paddingHorizontal: SPACING.sm,
        paddingVertical: Platform.OS === 'ios' ? 10 : 8,
        maxHeight: 100,
        fontSize: 16,
    },
    sendBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: SPACING.xs,
    },
    micBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: SPACING.xs,
    },
    recordingHint: {
        fontSize: 12,
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 4,
    }
});
