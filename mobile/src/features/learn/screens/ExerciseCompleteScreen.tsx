/**
 * Exercise Complete Screen
 * Displays results after completing an exercise
 */

import React, { useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RouteProp } from '@react-navigation/native'
import type { LearnStackParamList } from '../navigation/types'
import { Card, Button, Badge } from '../components'

type NavigationProp = NativeStackNavigationProp<LearnStackParamList, 'ExerciseComplete'>
type RouteProps = RouteProp<LearnStackParamList, 'ExerciseComplete'>

export function ExerciseCompleteScreen() {
  const navigation = useNavigation<NavigationProp>()
  const route = useRoute<RouteProps>()
  const {
    score,
    correctAnswers,
    totalQuestions,
    coinsEarned = 0,
    xpEarned = 0,
  } = route.params

  const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0
  const isPassed = score >= 70
  const incorrectAnswers = totalQuestions - correctAnswers

  // Determine result message
  const getResultMessage = () => {
    if (score >= 90) return { text: 'Excellent!', emoji: '🎉' }
    if (score >= 80) return { text: 'Great job!', emoji: '🌟' }
    if (score >= 70) return { text: 'Well done!', emoji: '👍' }
    if (score >= 50) return { text: 'Keep practicing!', emoji: '💪' }
    return { text: 'Try again!', emoji: '📚' }
  }

  const resultMessage = getResultMessage()

  const handleContinue = () => {
    // Navigate back to dashboard
    navigation.navigate('Dashboard')
  }

  const handleRetry = () => {
    // Go back to lesson detail
    navigation.goBack()
  }

  const renderResultHeader = () => {
    return (
      <View style={[styles.resultHeader, isPassed ? styles.resultHeaderPassed : styles.resultHeaderFailed]}>
        <Text style={styles.resultEmoji}>{resultMessage.emoji}</Text>
        <Text style={styles.resultTitle}>{resultMessage.text}</Text>
        <Text style={styles.resultSubtitle}>
          {isPassed ? 'You passed the exercise!' : 'Keep practicing to improve!'}
        </Text>
      </View>
    )
  }

  const renderScoreCard = () => {
    return (
      <Card style={styles.scoreCard}>
        <View style={styles.scoreCircle}>
          <Text style={[styles.scorePercent, isPassed ? styles.scorePercentPassed : styles.scorePercentFailed]}>
            {score}%
          </Text>
          <Text style={styles.scoreLabel}>Score</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{correctAnswers}</Text>
            <Text style={styles.statLabel}>Correct</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{incorrectAnswers}</Text>
            <Text style={styles.statLabel}>Incorrect</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalQuestions}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>
      </Card>
    )
  }

  const renderRewardsCard = () => {
    if (coinsEarned === 0 && xpEarned === 0) return null

    return (
      <Card style={styles.rewardsCard}>
        <Text style={styles.rewardsTitle}>Rewards Earned</Text>
        <View style={styles.rewardsContent}>
          {coinsEarned > 0 && (
            <View style={styles.rewardItem}>
              <View style={styles.rewardIcon}>
                <Text style={styles.rewardIconText}>🪙</Text>
              </View>
              <View style={styles.rewardInfo}>
                <Text style={styles.rewardValue}>+{coinsEarned}</Text>
                <Text style={styles.rewardLabel}>Coins</Text>
              </View>
            </View>
          )}
          {xpEarned > 0 && (
            <View style={styles.rewardItem}>
              <View style={styles.rewardIcon}>
                <Text style={styles.rewardIconText}>⭐</Text>
              </View>
              <View style={styles.rewardInfo}>
                <Text style={styles.rewardValue}>+{xpEarned}</Text>
                <Text style={styles.rewardLabel}>XP</Text>
              </View>
            </View>
          )}
        </View>
      </Card>
    )
  }

  const renderActions = () => {
    return (
      <View style={styles.actionsContainer}>
        <Button
          title="Continue Learning"
          onPress={handleContinue}
          variant="primary"
          size="large"
          fullWidth
        />
        {!isPassed && (
          <Button
            title="Try Again"
            onPress={handleRetry}
            variant="outline"
            size="large"
            fullWidth
          />
        )}
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {renderResultHeader()}
      {renderScoreCard()}
      {renderRewardsCard()}
      {renderActions()}
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
  resultHeader: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  resultHeaderPassed: {
    backgroundColor: '#ECFDF5',
  },
  resultHeaderFailed: {
    backgroundColor: '#FEF2F2',
  },
  resultEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  resultSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  scoreCard: {
    margin: 16,
    alignItems: 'center',
  },
  scoreCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  scorePercent: {
    fontSize: 48,
    fontWeight: '700',
    marginBottom: 4,
  },
  scorePercentPassed: {
    color: '#10B981',
  },
  scorePercentFailed: {
    color: '#EF4444',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  statDivider: {
    width: 1,
    height: 48,
    backgroundColor: '#E5E7EB',
  },
  rewardsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  rewardsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  rewardsContent: {
    gap: 12,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    gap: 12,
  },
  rewardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardIconText: {
    fontSize: 24,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  rewardLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  actionsContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
})
