/**
 * Topics List Screen
 * Displays topics within a selected zone
 */

import React, { useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RouteProp } from '@react-navigation/native'
import type { LearnStackParamList } from '../navigation/types'
import { useZone, useTopicsByZone, useZoneProgress } from '../hooks/useLearnData'
import { Card, ProgressBar, Badge, LockIcon } from '../components'
import { ZONES } from '../constants/zones'

type NavigationProp = NativeStackNavigationProp<LearnStackParamList, 'TopicsList'>
type RouteProps = RouteProp<LearnStackParamList, 'TopicsList'>

export function TopicsListScreen() {
  const navigation = useNavigation<NavigationProp>()
  const route = useRoute<RouteProps>()
  const { zoneId } = route.params

  // Fetch zone and topics
  const { data: zone, isLoading: zoneLoading, refetch: refetchZone } = useZone(zoneId)
  const { data: topics = [], isLoading: topicsLoading, refetch: refetchTopics } = useTopicsByZone(parseInt(zoneId))
  const { data: zoneProgress, isLoading: progressLoading, refetch: refetchProgress } = useZoneProgress(parseInt(zoneId))

  const isLoading = zoneLoading || topicsLoading || progressLoading
  const [refreshing, setRefreshing] = React.useState(false)

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true)
    await Promise.all([refetchZone(), refetchTopics(), refetchProgress()])
    setRefreshing(false)
  }, [refetchZone, refetchTopics, refetchProgress])

  const zoneConfig = zone ? ZONES[zone.zone_id] : null

  // Calculate zone completion
  const zoneCompletion = useMemo(() => {
    if (!zoneProgress) return 0
    return zoneProgress.totalTopics > 0
      ? Math.round((zoneProgress.completedTopics / zoneProgress.totalTopics) * 100)
      : 0
  }, [zoneProgress])

  const renderZoneHeader = () => {
    if (!zone || !zoneConfig) return null

    return (
      <View style={[styles.zoneHeader, { backgroundColor: `${zoneConfig.color}10` }]}>
        <View style={styles.zoneHeaderContent}>
          <View style={[styles.zoneHeaderIcon, { backgroundColor: `${zoneConfig.color}30` }]}>
            <Text style={styles.zoneHeaderIconText}>{zoneConfig.icon}</Text>
          </View>
          <View style={styles.zoneHeaderInfo}>
            <Text style={styles.zoneHeaderTitle}>{zone.name}</Text>
            <Text style={styles.zoneHeaderDescription} numberOfLines={2}>
              {zone.description}
            </Text>
            {zoneProgress && (
              <View style={styles.zoneHeaderStats}>
                <Text style={styles.zoneHeaderStatsText}>
                  {zoneProgress.completedTopics}/{zoneProgress.totalTopics} topics completed
                </Text>
                <Badge
                  label={`Level ${zone.level}`}
                  variant="info"
                  size="small"
                />
              </View>
            )}
          </View>
        </View>
        {zoneProgress && zoneProgress.totalTopics > 0 && (
          <ProgressBar
            progress={zoneCompletion}
            height={8}
            color={zoneConfig.color}
            showPercentage={true}
          />
        )}
      </View>
    )
  }

  const renderTopicCard = (topic: typeof topics[0], index: number) => {
    // Simple unlock logic: topics are unlocked sequentially
    const isLocked = index > 0 && topics[index - 1] // Could check if previous topic is completed
    const progress = zoneProgress?.topicsProgress?.find((tp: any) => tp.topicId === topic.id)

    const completedLessons = progress?.completedLessons || 0
    const totalLessons = progress?.totalLessons || 0
    const completionPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
    const isCompleted = completedLessons === totalLessons && totalLessons > 0

    return (
      <TouchableOpacity
        key={topic.id}
        onPress={() => {
          if (!isLocked) {
            navigation.navigate('LessonsList', { topicSlug: topic.slug })
          }
        }}
        activeOpacity={isLocked ? 1 : 0.7}
        disabled={isLocked}
      >
        <Card style={[styles.topicCard, isLocked && styles.topicCardLocked]}>
          <View style={styles.topicCardHeader}>
            <View style={styles.topicCardLeft}>
              <View style={styles.topicNumber}>
                <Text style={styles.topicNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.topicInfo}>
                <View style={styles.topicTitleRow}>
                  <Text style={[styles.topicTitle, isLocked && styles.topicTitleLocked]}>
                    {topic.name}
                  </Text>
                  {isCompleted && (
                    <Badge label="✓" variant="success" size="small" />
                  )}
                  {isLocked && (
                    <LockIcon size={16} locked={true} color="#9CA3AF" />
                  )}
                </View>
                {topic.description && (
                  <Text style={[styles.topicDescription, isLocked && styles.topicDescriptionLocked]} numberOfLines={2}>
                    {topic.description}
                  </Text>
                )}
                {!isLocked && totalLessons > 0 && (
                  <View style={styles.topicStats}>
                    <Text style={styles.topicStatsText}>
                      {completedLessons}/{totalLessons} lessons
                    </Text>
                    <Text style={styles.topicStatsText}>•</Text>
                    <Text style={styles.topicStatsText}>
                      {completionPercent}% complete
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
          {!isLocked && totalLessons > 0 && (
            <ProgressBar
              progress={completionPercent}
              height={6}
              color={zoneConfig?.color || '#10B981'}
              showPercentage={false}
            />
          )}
        </Card>
      </TouchableOpacity>
    )
  }

  const renderTopicsList = () => {
    if (topics.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No topics available in this zone</Text>
        </View>
      )
    }

    return (
      <View style={styles.topicsSection}>
        <Text style={styles.sectionTitle}>Topics</Text>
        <View style={styles.topicsList}>
          {topics.map((topic, index) => renderTopicCard(topic, index))}
        </View>
      </View>
    )
  }

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading topics...</Text>
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {renderZoneHeader()}
      {renderTopicsList()}
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
  zoneHeader: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  zoneHeaderContent: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 16,
  },
  zoneHeaderIcon: {
    width: 72,
    height: 72,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoneHeaderIconText: {
    fontSize: 36,
  },
  zoneHeaderInfo: {
    flex: 1,
    gap: 6,
  },
  zoneHeaderTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  zoneHeaderDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  zoneHeaderStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  zoneHeaderStatsText: {
    fontSize: 13,
    color: '#6B7280',
  },
  topicsSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  topicsList: {
    gap: 12,
    paddingHorizontal: 16,
  },
  topicCard: {
    marginBottom: 0,
  },
  topicCardLocked: {
    opacity: 0.6,
  },
  topicCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  topicCardLeft: {
    flexDirection: 'row',
    flex: 1,
    gap: 12,
  },
  topicNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topicNumberText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4F46E5',
  },
  topicInfo: {
    flex: 1,
    gap: 6,
  },
  topicTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topicTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  topicTitleLocked: {
    color: '#9CA3AF',
  },
  topicDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  topicDescriptionLocked: {
    color: '#9CA3AF',
  },
  topicStats: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  topicStatsText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
})
