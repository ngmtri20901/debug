/**
 * Learn Dashboard Screen
 * Displays zones overview with user progress, streak, and coins
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
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { LearnStackParamList } from '../navigation/types'
import { useAllZones, useAllZonesProgress } from '../hooks/useLearnData'
import { Card, Button, ProgressBar, Badge } from '../components'
import { ZONES } from '../constants/zones'

type NavigationProp = NativeStackNavigationProp<LearnStackParamList, 'Dashboard'>

export function LearnDashboardScreen() {
  const navigation = useNavigation<NavigationProp>()

  // Fetch zones and progress
  const { data: zones = [], isLoading: zonesLoading, refetch: refetchZones } = useAllZones()
  const { data: zonesProgress = [], isLoading: progressLoading, refetch: refetchProgress } = useAllZonesProgress()

  const isLoading = zonesLoading || progressLoading
  const [refreshing, setRefreshing] = React.useState(false)

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true)
    await Promise.all([refetchZones(), refetchProgress()])
    setRefreshing(false)
  }, [refetchZones, refetchProgress])

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    if (zonesProgress.length === 0) return 0
    const totalCompleted = zonesProgress.reduce((sum, zp) => sum + zp.completedTopics, 0)
    const totalTopics = zonesProgress.reduce((sum, zp) => sum + zp.totalTopics, 0)
    return totalTopics > 0 ? Math.round((totalCompleted / totalTopics) * 100) : 0
  }, [zonesProgress])

  // Find the current zone (first incomplete zone or last zone)
  const currentZone = useMemo(() => {
    const incomplete = zones.find((zone) => {
      const progress = zonesProgress.find((zp) => zp.zoneId === zone.id)
      return progress && progress.completedTopics < progress.totalTopics
    })
    return incomplete || zones[zones.length - 1]
  }, [zones, zonesProgress])

  const renderHeader = () => {
    return (
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Learn Vietnamese</Text>
          <Text style={styles.headerSubtitle}>Choose your learning path</Text>
        </View>
        <View style={styles.headerStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{overallProgress}%</Text>
            <Text style={styles.statLabel}>Complete</Text>
          </View>
        </View>
      </View>
    )
  }

  const renderContinueLearning = () => {
    if (!currentZone) return null

    const progress = zonesProgress.find((zp) => zp.zoneId === currentZone.id)
    const zoneConfig = ZONES[currentZone.zone_id]

    return (
      <Card style={styles.continueCard}>
        <View style={styles.continueHeader}>
          <Text style={styles.continueTitle}>Continue Learning</Text>
          {progress && (
            <Badge
              label={`${progress.completedTopics}/${progress.totalTopics} topics`}
              variant="info"
              size="small"
            />
          )}
        </View>
        <View style={styles.continueContent}>
          <View style={styles.zoneIconLarge}>
            <Text style={styles.zoneIconLargeText}>{zoneConfig?.icon || '📚'}</Text>
          </View>
          <View style={styles.continueDetails}>
            <Text style={styles.continueZoneName}>{currentZone.name}</Text>
            <Text style={styles.continueZoneDescription} numberOfLines={2}>
              {currentZone.description}
            </Text>
            {progress && (
              <ProgressBar
                progress={progress.totalTopics > 0 ? (progress.completedTopics / progress.totalTopics) * 100 : 0}
                height={6}
                color={zoneConfig?.color || '#10B981'}
                showPercentage={false}
              />
            )}
          </View>
        </View>
        <Button
          title="Continue"
          onPress={() => navigation.navigate('TopicsList', { zoneId: currentZone.id })}
          variant="primary"
          size="medium"
        />
      </Card>
    )
  }

  const renderZoneCard = (zone: typeof zones[0]) => {
    const progress = zonesProgress.find((zp) => zp.zoneId === zone.id)
    const zoneConfig = ZONES[zone.zone_id]
    const completionPercent = progress && progress.totalTopics > 0
      ? Math.round((progress.completedTopics / progress.totalTopics) * 100)
      : 0

    const isCompleted = progress && progress.completedTopics === progress.totalTopics && progress.totalTopics > 0

    return (
      <TouchableOpacity
        key={zone.id}
        onPress={() => navigation.navigate('TopicsList', { zoneId: zone.id })}
        activeOpacity={0.7}
      >
        <Card style={styles.zoneCard}>
          <View style={styles.zoneCardHeader}>
            <View
              style={[
                styles.zoneIcon,
                { backgroundColor: zoneConfig?.color ? `${zoneConfig.color}20` : '#F3F4F6' },
              ]}
            >
              <Text style={styles.zoneIconText}>{zoneConfig?.icon || '📚'}</Text>
            </View>
            <View style={styles.zoneInfo}>
              <View style={styles.zoneTitleRow}>
                <Text style={styles.zoneTitle}>{zone.name}</Text>
                {isCompleted && (
                  <Badge label="Complete" variant="success" size="small" />
                )}
              </View>
              <Text style={styles.zoneDescription} numberOfLines={2}>
                {zone.description}
              </Text>
              {progress && (
                <View style={styles.zoneStats}>
                  <Text style={styles.zoneStatsText}>
                    {progress.completedTopics}/{progress.totalTopics} topics
                  </Text>
                  <Text style={styles.zoneStatsText}>•</Text>
                  <Text style={styles.zoneStatsText}>
                    Level {zone.level}
                  </Text>
                </View>
              )}
            </View>
          </View>
          {progress && progress.totalTopics > 0 && (
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

  const renderZonesList = () => {
    return (
      <View style={styles.zonesSection}>
        <Text style={styles.sectionTitle}>All Zones</Text>
        <View style={styles.zonesList}>
          {zones.map(renderZoneCard)}
        </View>
      </View>
    )
  }

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading zones...</Text>
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
      {renderHeader()}
      {renderContinueLearning()}
      {renderZonesList()}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  headerStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  continueCard: {
    margin: 16,
    marginBottom: 8,
  },
  continueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  continueTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  continueContent: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 16,
  },
  zoneIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoneIconLargeText: {
    fontSize: 40,
  },
  continueDetails: {
    flex: 1,
    gap: 8,
  },
  continueZoneName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  continueZoneDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  zonesSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  zonesList: {
    gap: 12,
    paddingHorizontal: 16,
  },
  zoneCard: {
    marginBottom: 0,
  },
  zoneCardHeader: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  zoneIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoneIconText: {
    fontSize: 28,
  },
  zoneInfo: {
    flex: 1,
    gap: 6,
  },
  zoneTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  zoneTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  zoneDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  zoneStats: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  zoneStatsText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
})
