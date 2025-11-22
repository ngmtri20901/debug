/**
 * Profile Home Screen - Main profile view with stats
 */

import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { ProfileAvatar } from '../components/ProfileAvatar'
import { StatsCard } from '../components/StatsCard'
import { useUserProfile, useUserStats, useStreakInfo } from '../hooks/useProfile'

export function ProfileHomeScreen() {
  const navigation = useNavigation()

  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useUserProfile()
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useUserStats()
  const { data: streakInfo, refetch: refetchStreak } = useStreakInfo()

  const [refreshing, setRefreshing] = React.useState(false)

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true)
    await Promise.all([refetchProfile(), refetchStats(), refetchStreak()])
    setRefreshing(false)
  }, [refetchProfile, refetchStats, refetchStreak])

  const handleEditProfile = () => {
    navigation.navigate('EditProfile' as never)
  }

  if (profileLoading || statsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    )
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Profile not found</Text>
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Profile Header */}
      <View style={styles.header}>
        <ProfileAvatar
          avatarUrl={profile.avatar_url}
          displayName={profile.display_name || profile.username || 'User'}
          size={120}
          editable={false}
        />
        <Text style={styles.displayName}>
          {profile.display_name || profile.username || 'User'}
        </Text>
        {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}
        <View style={styles.profileInfo}>
          <Text style={styles.infoText}>
            Native Language: {profile.native_language || 'Not set'}
          </Text>
          <Text style={styles.infoText}>
            Level: {profile.learning_level || 'beginner'}
          </Text>
        </View>
        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Section */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Your Stats</Text>
        <View style={styles.statsGrid}>
          <StatsCard
            icon="📚"
            label="Lessons Completed"
            value={stats?.total_lessons_completed || 0}
            color="#10B981"
          />
          <StatsCard
            icon="🔥"
            label="Day Streak"
            value={streakInfo?.current_streak || 0}
            color="#EF4444"
          />
          <StatsCard
            icon="🪙"
            label="Coins"
            value={stats?.total_coins || 0}
            color="#F59E0B"
          />
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentContainer: {
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  displayName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
  },
  bio: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  profileInfo: {
    marginTop: 16,
    gap: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  editButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: '#6366F1',
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  statsGrid: {
    gap: 12,
  },
})
