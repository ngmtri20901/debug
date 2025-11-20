/**
 * Statistics Dashboard Screen
 * Visual overview of user's flashcard performance
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { LineChart } from 'react-native-chart-kit'
import { useNavigation } from '@react-navigation/native'
import type { StatisticsNavigationProp } from '../navigation/types'
import { Header } from '@/shared/components/Header'
import { Card } from '@/shared/components/Card'
import {
  getUserQuickStats,
  getUserDetailedStats,
  type UserStatistics,
  type DetailedStatistics,
} from '../services/statisticsService'
import { colors, spacing, borderRadius, typography, shadows } from '@/shared/theme/colors'

const { width } = Dimensions.get('window')
const CHART_WIDTH = width - spacing.md * 2

type TimeRange = 'week' | 'month'

export const StatisticsScreen: React.FC = () => {
  const navigation = useNavigation<StatisticsNavigationProp>()

  const [quickStats, setQuickStats] = useState<UserStatistics | null>(null)
  const [detailedStats, setDetailedStats] = useState<DetailedStatistics[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [timeRange, setTimeRange] = useState<TimeRange>('week')

  // Fetch data
  const fetchData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true)

      const daysBack = timeRange === 'week' ? 7 : 30

      const [quick, detailed] = await Promise.all([
        getUserQuickStats(),
        getUserDetailedStats(daysBack),
      ])

      setQuickStats(quick)
      setDetailedStats(detailed || [])
    } catch (error) {
      console.error('Failed to fetch statistics:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [timeRange])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchData(false)
  }, [fetchData])

  const handleTimeRangeChange = useCallback((range: TimeRange) => {
    setTimeRange(range)
  }, [])

  // Prepare chart data
  const chartData = useMemo(() => {
    if (detailedStats.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{ data: [0] }],
      }
    }

    // Get last 7 or 30 data points
    const dataPoints = detailedStats.slice(-Math.min(detailedStats.length, timeRange === 'week' ? 7 : 30))

    const labels = dataPoints.map((stat) => {
      const date = new Date(stat.date)
      return `${date.getMonth() + 1}/${date.getDate()}`
    })

    const reviewData = dataPoints.map((stat) => stat.flashcards_reviewed)
    const accuracyData = dataPoints.map((stat) => stat.accuracy_rate)

    return {
      labels,
      datasets: [
        {
          data: reviewData,
          color: (opacity = 1) => colors.primary[500],
          strokeWidth: 2,
        },
      ],
      legend: ['Cards Reviewed'],
    }
  }, [detailedStats, timeRange])

  // Calculate insights
  const insights = useMemo(() => {
    if (!quickStats || detailedStats.length === 0) return null

    const recentStats = detailedStats.slice(-7)
    const avgAccuracy =
      recentStats.reduce((sum, stat) => sum + stat.accuracy_rate, 0) / recentStats.length

    const totalReviewed = recentStats.reduce(
      (sum, stat) => sum + stat.flashcards_reviewed,
      0
    )

    let message = ''
    if (avgAccuracy >= 80) {
      message = `Amazing progress! You've reviewed ${totalReviewed} flashcards this ${timeRange}!`
    } else if (avgAccuracy >= 60) {
      message = `Good work! Keep practicing to improve your ${Math.round(avgAccuracy)}% accuracy rate.`
    } else {
      message = `You're making progress! ${totalReviewed} cards reviewed this ${timeRange}.`
    }

    return {
      message,
      avgAccuracy: Math.round(avgAccuracy),
      totalReviewed,
    }
  }, [quickStats, detailedStats, timeRange])

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <Header
          title="Statistics"
          leftIcon="‹"
          onLeftPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={styles.loadingText}>Loading statistics...</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Header
        title="Statistics"
        subtitle="Track your progress"
        leftIcon="‹"
        onLeftPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Insight Card */}
        {insights && (
          <View style={styles.insightCard}>
            <Text style={styles.insightEmoji}>🎉</Text>
            <Text style={styles.insightMessage}>{insights.message}</Text>
          </View>
        )}

        {/* Key Metrics */}
        <View style={styles.metricsRow}>
          {/* Total Cards Reviewed */}
          <Card style={styles.metricCard} variant="elevated">
            <View style={styles.metricIconContainer}>
              <Text style={styles.metricIcon}>📚</Text>
            </View>
            <Text style={styles.metricValue}>
              {quickStats?.totalCardsReviewed || 0}
            </Text>
            <Text style={styles.metricLabel}>Cards Reviewed</Text>
            <Text style={styles.metricSubtext}>Lifetime total</Text>
          </Card>

          {/* Accuracy Rate */}
          <Card style={styles.metricCard} variant="elevated">
            <View style={styles.metricIconContainer}>
              <Text style={styles.metricIcon}>🎯</Text>
            </View>
            <Text style={styles.metricValue}>
              {quickStats?.accuracyRate ? `${Math.round(quickStats.accuracyRate)}%` : '0%'}
            </Text>
            <Text style={styles.metricLabel}>Accuracy</Text>
            <Text style={styles.metricSubtext}>Overall rate</Text>
          </Card>
        </View>

        {/* Secondary Metrics */}
        <View style={styles.secondaryMetricsRow}>
          {/* Current Streak */}
          <Card style={styles.secondaryMetricCard}>
            <Text style={styles.secondaryMetricValue}>
              {quickStats?.currentStreak || 0} 🔥
            </Text>
            <Text style={styles.secondaryMetricLabel}>Day Streak</Text>
          </Card>

          {/* Study Time */}
          <Card style={styles.secondaryMetricCard}>
            <Text style={styles.secondaryMetricValue}>
              {quickStats?.totalTimeMinutes || 0}m
            </Text>
            <Text style={styles.secondaryMetricLabel}>Total Time</Text>
          </Card>

          {/* Study Days */}
          <Card style={styles.secondaryMetricCard}>
            <Text style={styles.secondaryMetricValue}>
              {quickStats?.studyDaysThisMonth || 0}d
            </Text>
            <Text style={styles.secondaryMetricLabel}>This Month</Text>
          </Card>
        </View>

        {/* Time Range Selector */}
        <View style={styles.timeRangeContainer}>
          <TouchableOpacity
            style={[
              styles.timeRangeButton,
              timeRange === 'week' && styles.timeRangeButtonActive,
            ]}
            onPress={() => handleTimeRangeChange('week')}
          >
            <Text
              style={[
                styles.timeRangeButtonText,
                timeRange === 'week' && styles.timeRangeButtonTextActive,
              ]}
            >
              Week
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.timeRangeButton,
              timeRange === 'month' && styles.timeRangeButtonActive,
            ]}
            onPress={() => handleTimeRangeChange('month')}
          >
            <Text
              style={[
                styles.timeRangeButtonText,
                timeRange === 'month' && styles.timeRangeButtonTextActive,
              ]}
            >
              Month
            </Text>
          </TouchableOpacity>
        </View>

        {/* Progress Chart */}
        <Card style={styles.chartCard} variant="elevated">
          <Text style={styles.chartTitle}>Learning Progress</Text>
          <Text style={styles.chartSubtitle}>
            Cards reviewed over the past {timeRange}
          </Text>

          {detailedStats.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <LineChart
                data={chartData}
                width={Math.max(CHART_WIDTH, detailedStats.length * 50)}
                height={220}
                chartConfig={{
                  backgroundColor: colors.background.primary,
                  backgroundGradientFrom: colors.background.primary,
                  backgroundGradientTo: colors.background.primary,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
                  labelColor: (opacity = 1) => colors.text.secondary,
                  style: {
                    borderRadius: borderRadius.md,
                  },
                  propsForDots: {
                    r: '4',
                    strokeWidth: '2',
                    stroke: colors.primary[500],
                  },
                  propsForBackgroundLines: {
                    strokeDasharray: '',
                    stroke: colors.border.light,
                  },
                }}
                bezier
                style={styles.chart}
                withInnerLines
                withOuterLines
                withVerticalLines
                withHorizontalLines
                withShadow={false}
                withDots
              />
            </ScrollView>
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataEmoji}>📊</Text>
              <Text style={styles.noDataText}>No data yet</Text>
              <Text style={styles.noDataSubtext}>
                Start reviewing flashcards to see your progress here!
              </Text>
            </View>
          )}
        </Card>

        {/* Accuracy Chart */}
        {detailedStats.length > 0 && (
          <Card style={styles.chartCard} variant="elevated">
            <Text style={styles.chartTitle}>Accuracy Trend</Text>
            <Text style={styles.chartSubtitle}>
              Your accuracy rate over time
            </Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <LineChart
                data={{
                  labels: chartData.labels,
                  datasets: [
                    {
                      data: detailedStats
                        .slice(-Math.min(detailedStats.length, timeRange === 'week' ? 7 : 30))
                        .map((stat) => stat.accuracy_rate),
                      color: (opacity = 1) => colors.success.main,
                      strokeWidth: 2,
                    },
                  ],
                  legend: ['Accuracy (%)'],
                }}
                width={Math.max(CHART_WIDTH, detailedStats.length * 50)}
                height={220}
                yAxisSuffix="%"
                chartConfig={{
                  backgroundColor: colors.background.primary,
                  backgroundGradientFrom: colors.background.primary,
                  backgroundGradientTo: colors.background.primary,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
                  labelColor: (opacity = 1) => colors.text.secondary,
                  style: {
                    borderRadius: borderRadius.md,
                  },
                  propsForDots: {
                    r: '4',
                    strokeWidth: '2',
                    stroke: colors.success.main,
                  },
                  propsForBackgroundLines: {
                    strokeDasharray: '',
                    stroke: colors.border.light,
                  },
                }}
                bezier
                style={styles.chart}
                withInnerLines
                withOuterLines
                withVerticalLines
                withHorizontalLines
                withShadow={false}
                withDots
              />
            </ScrollView>
          </Card>
        )}

        {/* Bottom Padding */}
        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },

  // Insight Card
  insightCard: {
    backgroundColor: colors.info.light,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  insightEmoji: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  insightMessage: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.info.dark,
    textAlign: 'center',
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.base,
  },

  // Key Metrics
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  metricCard: {
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center',
  },
  metricIconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  metricIcon: {
    fontSize: 28,
  },
  metricValue: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: 'bold',
    color: colors.primary[600],
    marginBottom: spacing.xs,
  },
  metricLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  metricSubtext: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },

  // Secondary Metrics
  secondaryMetricsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  secondaryMetricCard: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
  },
  secondaryMetricValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  secondaryMetricLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    textAlign: 'center',
  },

  // Time Range
  timeRangeContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
  },
  timeRangeButtonActive: {
    backgroundColor: colors.primary[600],
  },
  timeRangeButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  timeRangeButtonTextActive: {
    color: colors.text.inverse,
  },

  // Chart
  chartCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  chartTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  chartSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  chart: {
    marginVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },

  // No Data
  noDataContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  noDataEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  noDataText: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  noDataSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
})
