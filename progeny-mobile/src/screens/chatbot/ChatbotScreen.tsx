import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, Mic, User, Bot, Volume2, Plus } from 'lucide-react-native';
import { SPACING, TYPOGRAPHY, SHADOWS } from '../../styles/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { chatApi } from '../../services/api';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
}

// Initial messages moved inside component to support localization

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
    const flatListRef = useRef<FlatList>(null);

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
                text: "I'm sorry, I'm having trouble connecting to my brain right now. Please try again soon!",
                sender: 'bot',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    const toggleRecording = () => {
        setIsRecording(!isRecording);
        if (!isRecording) {
            setTimeout(() => {
                setIsRecording(false);
                setInputText("How do I treat potato blight?");
            }, 3000);
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
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: isHighContrast ? 3 : 1 }]}>
                <View style={styles.headerTitleRow}>
                    {/* @ts-ignore */}
                    <Bot size={24} color={colors.primary} strokeWidth={2.5} />
                    <View>
                        <Text style={[styles.title, { color: colors.textPrimary }, scaledTypography.h2]}>{t('progeniture')}</Text>
                        <View style={styles.statusRow}>
                            <View style={styles.statusDot} />
                            <Text style={styles.statusText}>{t('online_status')}</Text>
                        </View>
                    </View>
                </View>
                <TouchableOpacity style={styles.clearBtn} onPress={() => setMessages(INITIAL_MESSAGES)}>
                    <Text style={[styles.clearText, { color: colors.textSecondary }]}>Clear</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={renderMessage}
                contentContainerStyle={styles.listContent}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            />

            {isTyping && (
                <View style={styles.typingContainer}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.typingText, { color: colors.textSecondary }]}>{t('typing')}</Text>
                </View>
            )}

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={100}>
                <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: isHighContrast ? 3 : 1 }]}>
                    <TouchableOpacity style={styles.attachBtn}>
                        {/* @ts-ignore */}
                        <Plus size={24} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <View style={[styles.inputWrapper, { backgroundColor: colors.background }]}>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border, borderWidth: isHighContrast ? 2 : 1 }]}
                            placeholder={t('type_message')}
                            placeholderTextColor={colors.textSecondary}
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                            maxLength={500}
                        />
                    </View>

                    {inputText.trim() ? (
                        <TouchableOpacity style={[styles.sendBtn, { backgroundColor: colors.primary }]} onPress={handleSend}>
                            {/* @ts-ignore */}
                            <Send size={24} color={isHighContrast ? '#000' : '#fff'} />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.micBtn, isRecording && styles.micBtnActive, { backgroundColor: isHighContrast ? colors.secondary : '#F59E0B' }]}
                            onPress={toggleRecording}
                        >
                            {/* @ts-ignore */}
                            <Mic size={24} color={isHighContrast ? '#000' : '#fff'} />
                        </TouchableOpacity>
                    )}
                </View>
            </KeyboardAvoidingView>

            {isRecording && (
                <View style={styles.recordingOverlay}>
                    <Text style={styles.recordingText}>Listening...</Text>
                    <View style={[styles.voiceWave, { backgroundColor: colors.warning }]} />
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SPACING.lg,
        borderBottomWidth: 1,
        ...SHADOWS.small,
    },
    headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
    title: { ...TYPOGRAPHY.h2, fontSize: 20 },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
    statusText: { ...TYPOGRAPHY.caption, color: '#10B981', fontWeight: 'bold' },
    clearBtn: { padding: SPACING.xs },
    clearText: { ...TYPOGRAPHY.caption },
    listContent: { padding: SPACING.md, paddingBottom: SPACING.xl },
    messageRow: { flexDirection: 'row', marginBottom: SPACING.lg, alignItems: 'flex-end', gap: SPACING.sm },
    botRow: { justifyContent: 'flex-start' },
    userRow: { justifyContent: 'flex-end' },
    botAvatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    userAvatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    messageBubble: { maxWidth: '75%', padding: SPACING.md, borderRadius: 20, ...SHADOWS.small },
    botBubble: { borderBottomLeftRadius: 4 },
    userBubble: { borderBottomRightRadius: 4 },
    messageText: { ...TYPOGRAPHY.body, fontSize: 15, lineHeight: 22 },
    timestampText: { ...TYPOGRAPHY.caption, fontSize: 10, marginTop: 4, textAlign: 'right', opacity: 0.7 },
    listenBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, paddingTop: 8, borderTopWidth: 1 },
    listenText: { ...TYPOGRAPHY.caption, fontWeight: 'bold' },
    typingContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.xl, gap: SPACING.sm, marginBottom: SPACING.sm },
    typingText: { ...TYPOGRAPHY.caption, fontStyle: 'italic' },
    inputContainer: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderTopWidth: 1, gap: SPACING.sm },
    attachBtn: { padding: 4 },
    inputWrapper: { flex: 1, borderRadius: 24, paddingHorizontal: SPACING.md, maxHeight: 100 },
    input: { ...TYPOGRAPHY.body, paddingVertical: SPACING.sm, fontSize: 15 },
    sendBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', ...SHADOWS.small },
    micBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F59E0B', justifyContent: 'center', alignItems: 'center', ...SHADOWS.small },
    micBtnActive: { backgroundColor: '#EF4444' },
    recordingOverlay: {
        position: 'absolute',
        bottom: 80,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderRadius: 16,
        padding: SPACING.lg,
        alignItems: 'center',
        zIndex: 100,
    },
    recordingText: { color: '#fff', fontWeight: 'bold', marginBottom: SPACING.md },
    voiceWave: { width: '100%', height: 4, borderRadius: 2 },
});
