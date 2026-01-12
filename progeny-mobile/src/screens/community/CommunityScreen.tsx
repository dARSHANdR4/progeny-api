import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, RefreshControl, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform, Share, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Users, MessageCircle, Heart, Share2, PlusCircle, X, Send } from 'lucide-react-native';
import { SPACING, TYPOGRAPHY, SHADOWS } from '../../styles/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { communityApi } from '../../services/api';

export default function CommunityScreen() {
    const { colors, isHighContrast } = useTheme();
    const { t } = useLanguage();
    const insets = useSafeAreaInsets();

    // State
    const [posts, setPosts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [newPostContent, setNewPostContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Comment Modal State
    const [isCommentModalVisible, setIsCommentModalVisible] = useState(false);
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [isCommentsLoading, setIsCommentsLoading] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [isPostingComment, setIsPostingComment] = useState(false);

    const fetchPosts = async () => {
        try {
            const data = await communityApi.getPosts();
            setPosts(data?.posts || []);
        } catch (error) {
            console.error('Error fetching posts:', error);
            setPosts([]);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const onRefresh = () => {
        setIsRefreshing(true);
        fetchPosts();
    };

    const handleCreatePost = async () => {
        if (!newPostContent.trim()) return;
        setIsSubmitting(true);
        try {
            await communityApi.createPost(newPostContent);
            setNewPostContent('');
            setIsModalVisible(false);
            fetchPosts();
        } catch (error) {
            console.error('Error creating post:', error);
            alert('Failed to post. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleLike = async (postId: string) => {
        try {
            // Optimistic update
            setPosts(prev => prev.map(p => {
                if (p.id === postId) {
                    const isLiked = p.user_liked; // We'd need to fetch this or track it
                    return {
                        ...p,
                        likes_count: (p.likes_count || 0) + (isLiked ? -1 : 1),
                        user_liked: !isLiked
                    };
                }
                return p;
            }));

            await communityApi.toggleLike(postId);
        } catch (error) {
            console.error('Error toggling like:', error);
            // Revert on error? (Skipping for simplicity vs performance)
        }
    };

    const handleShare = async (post: any) => {
        try {
            await Share.share({
                message: `Progeniture Farmer Community: ${post.user_name} shared: "${post.content}"`,
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const openComments = async (post: any) => {
        setSelectedPostId(post.id);
        setIsCommentModalVisible(true);
        setIsCommentsLoading(true);
        try {
            const data = await communityApi.getComments(post.id);
            setComments(data.comments || []);
        } catch (error) {
            console.error('Error loading comments:', error);
        } finally {
            setIsCommentsLoading(false);
        }
    };

    const handlePostComment = async () => {
        if (!selectedPostId || !commentText.trim()) return;
        setIsPostingComment(true);
        try {
            const result = await communityApi.createComment(selectedPostId, commentText);
            if (result.success) {
                setComments(prev => [...prev, result.comment]);
                setCommentText('');
                // Update specific post comment count locally
                setPosts(prev => prev.map(p => p.id === selectedPostId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p));
            }
        } catch (error) {
            console.error('Error posting comment:', error);
            alert('Failed to comment');
        } finally {
            setIsPostingComment(false);
        }
    };

    const renderHeader = () => (
        <View style={[styles.topSection, { backgroundColor: colors.surface, borderBottomWidth: isHighContrast ? 2 : 0, borderBottomColor: colors.border }]}>
            <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                    <Text style={[styles.statNumber, { color: colors.primary }]}>1.2k</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('active_farmers')}</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={[styles.statNumber, { color: colors.primary }]}>450</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('experts')}</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={[styles.statNumber, { color: colors.primary }]}>8.5k</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('success_stories')}</Text>
                </View>
            </View>

            <TouchableOpacity
                style={[styles.createPostBtn, { backgroundColor: colors.primary, borderWidth: isHighContrast ? 2 : 0, borderColor: '#000' }]}
                onPress={() => setIsModalVisible(true)}
            >
                {/* @ts-ignore */}
                <PlusCircle size={20} color={isHighContrast ? '#000' : '#fff'} />
                <Text style={[styles.createPostText, { color: isHighContrast ? '#000' : '#fff' }]}>{t('share_progress')}</Text>
            </TouchableOpacity>
        </View>
    );

    const renderPost = ({ item }: { item: any }) => {
        const userName = item.user_name || 'Unknown Farmer';
        const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Just now';

        return (
            <View style={[styles.postCard, { backgroundColor: colors.surface, borderWidth: isHighContrast ? 2 : 0, borderColor: colors.border }]}>
                <View style={styles.postHeader}>
                    <View style={[styles.userAvatar, { backgroundColor: colors.primary + '40' }]}>
                        <Text style={[styles.avatarText, { color: colors.primary }]}>
                            {userName ? userName[0].toUpperCase() : '?'}
                        </Text>
                    </View>
                    <View>
                        <Text style={[styles.userName, { color: colors.textPrimary }]}>{userName}</Text>
                        <Text style={[styles.userLocation, { color: colors.textSecondary }]}>{item.location} • {dateStr}</Text>
                    </View>
                </View>

                <Text style={[styles.postContent, { color: colors.textPrimary }]}>{item.content}</Text>

                {item.image_url && <Image source={{ uri: item.image_url }} style={styles.postImage} />}

                <View style={[styles.postFooter, { borderTopColor: colors.border }]}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleToggleLike(item.id)}>
                        {/* @ts-ignore */}
                        <Heart size={18} color={item.user_liked ? "#FF4B4B" : colors.textSecondary} fill={item.user_liked ? "#FF4B4B" : "transparent"} />
                        <Text style={[styles.actionText, { color: item.user_liked ? "#FF4B4B" : colors.textSecondary }]}>{item.likes_count || 0}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => openComments(item)}>
                        {/* @ts-ignore */}
                        <MessageCircle size={18} color={colors.textSecondary} />
                        <Text style={[styles.actionText, { color: colors.textSecondary }]}>{item.comments_count || 0}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleShare(item)}>
                        {/* @ts-ignore */}
                        <Share2 size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: isHighContrast ? 3 : 1 }]}>
                {/* @ts-ignore */}
                <Users size={24} color={colors.primary} />
                <Text style={[styles.title, { color: colors.textPrimary }]}>{t('farmer_community')}</Text>
            </View>

            <FlatList
                data={Array.isArray(posts) ? posts : []}
                keyExtractor={(item) => item.id}
                renderItem={renderPost}
                ListHeaderComponent={renderHeader}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={onRefresh}
                        colors={[colors.primary]}
                        tintColor={colors.primary}
                    />
                }
                ListEmptyComponent={
                    !isLoading ? (
                        <View style={styles.emptyContainer}>
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                No posts yet. Be the first to share your progress!
                            </Text>
                        </View>
                    ) : (
                        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
                    )
                }
            />

            {/* Create Post Modal */}
            <Modal
                visible={isModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={[styles.modalContent, { backgroundColor: colors.surface, paddingTop: insets.top }]}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                                {/* @ts-ignore */}
                                <X size={24} color={colors.textPrimary} />
                            </TouchableOpacity>
                            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Share Progress</Text>
                            <TouchableOpacity
                                onPress={handleCreatePost}
                                disabled={isSubmitting || !newPostContent.trim()}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator size="small" color={colors.primary} />
                                ) : (
                                    <Text style={[styles.postBtnText, { color: colors.primary, opacity: newPostContent.trim() ? 1 : 0.5 }]}>Post</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            style={[styles.input, { color: colors.textPrimary }]}
                            placeholder="What's happening on your farm?"
                            placeholderTextColor={colors.textSecondary}
                            multiline
                            value={newPostContent}
                            onChangeText={setNewPostContent}
                            autoFocus
                        />
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Comments Modal */}
            <Modal
                visible={isCommentModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsCommentModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => setIsCommentModalVisible(false)}>
                                {/* @ts-ignore */}
                                <X size={24} color={colors.textPrimary} />
                            </TouchableOpacity>
                            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Comments</Text>
                            <View style={{ width: 24 }} />
                        </View>

                        {isCommentsLoading ? (
                            <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 40 }} />
                        ) : (
                            <ScrollView style={{ flex: 1 }}>
                                {comments.length === 0 ? (
                                    <Text style={[styles.emptyComments, { color: colors.textSecondary }]}>No comments yet. Start the conversation!</Text>
                                ) : (
                                    comments.map(c => (
                                        <View key={c.id} style={styles.commentItem}>
                                            <Text style={[styles.commentUser, { color: colors.textPrimary }]}>{c.user_name}</Text>
                                            <Text style={[styles.commentTextContent, { color: colors.textPrimary }]}>{c.content}</Text>
                                            <Text style={[styles.commentDate, { color: colors.textSecondary }]}>{new Date(c.created_at).toLocaleString()}</Text>
                                        </View>
                                    ))
                                )}
                            </ScrollView>
                        )}

                        <View style={[styles.commentInputContainer, { borderTopColor: colors.border }]}>
                            <TextInput
                                style={[styles.commentInput, { color: colors.textPrimary, backgroundColor: colors.background }]}
                                placeholder="Add a comment..."
                                placeholderTextColor={colors.textSecondary}
                                value={commentText}
                                onChangeText={setCommentText}
                                multiline
                            />
                            <TouchableOpacity
                                style={[styles.sendBtn, { backgroundColor: colors.primary }]}
                                onPress={handlePostComment}
                                disabled={isPostingComment || !commentText.trim()}
                            >
                                {isPostingComment ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    /* @ts-ignore */
                                    <Send size={18} color="#fff" />
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.lg,
        borderBottomWidth: 1,
        gap: SPACING.sm,
        ...SHADOWS.small,
    },
    title: { ...TYPOGRAPHY.h2 },
    listContent: { paddingBottom: SPACING.xl },
    topSection: { padding: SPACING.lg, marginBottom: SPACING.md },
    statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.lg },
    statBox: { alignItems: 'center', flex: 1 },
    statNumber: { ...TYPOGRAPHY.h2 },
    statLabel: { ...TYPOGRAPHY.caption, fontSize: 9 },
    createPostBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.md,
        borderRadius: 12,
        gap: SPACING.sm,
        ...SHADOWS.small,
    },
    createPostText: { color: '#fff', fontWeight: 'bold' },
    postCard: {
        marginHorizontal: SPACING.md,
        marginBottom: SPACING.md,
        borderRadius: 16,
        padding: SPACING.md,
        ...SHADOWS.small,
    },
    postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md, gap: SPACING.sm },
    userAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontWeight: 'bold' },
    userName: { ...TYPOGRAPHY.body, fontWeight: 'bold' },
    userLocation: { ...TYPOGRAPHY.caption },
    postContent: { ...TYPOGRAPHY.body, lineHeight: 20, marginBottom: SPACING.md },
    postImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: SPACING.md },
    postFooter: { flexDirection: 'row', borderTopWidth: 1, paddingTop: SPACING.sm, gap: SPACING.lg },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    actionText: { ...TYPOGRAPHY.caption, fontWeight: '600' },
    emptyContainer: { padding: SPACING.xl, alignItems: 'center', marginTop: 40 },
    emptyText: { ...TYPOGRAPHY.body, textAlign: 'center' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.lg, height: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl },
    modalTitle: { ...TYPOGRAPHY.h3 },
    postBtnText: { fontWeight: '700', fontSize: 16 },
    input: { ...TYPOGRAPHY.body, flex: 1, textAlignVertical: 'top', fontSize: 18, lineHeight: 24 },

    // Comment Styles
    emptyComments: { textAlign: 'center', marginTop: 40, ...TYPOGRAPHY.body },
    commentItem: { paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: '#eee' },
    commentUser: { fontWeight: '700', fontSize: 14, marginBottom: 2 },
    commentTextContent: { ...TYPOGRAPHY.body, fontSize: 14 },
    commentDate: { fontSize: 10, marginTop: 4 },
    commentInputContainer: { flexDirection: 'row', paddingVertical: SPACING.md, gap: SPACING.sm, alignItems: 'center' },
    commentInput: { flex: 1, borderRadius: 20, paddingHorizontal: SPACING.md, paddingVertical: 8, maxHeight: 100, fontSize: 14 },
    sendBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
});
