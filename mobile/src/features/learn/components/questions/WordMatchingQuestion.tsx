/**
 * Word Matching Question component
 * Allows users to match Vietnamese words with English translations
 */

import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native'
import type { WordMatchingQuestion, WordPair } from '../../types'
import { Button, Card } from '../shared'

export interface WordMatchingQuestionProps {
  question: WordMatchingQuestion
  onSubmit: (answer: number[]) => void // Array of matched pair IDs
  disabled?: boolean
  showFeedback?: boolean
  isCorrect?: boolean
  feedbackMessage?: string
}

export function WordMatchingQuestionComponent({
  question,
  onSubmit,
  disabled = false,
  showFeedback = false,
  isCorrect,
  feedbackMessage,
}: WordMatchingQuestionProps) {
  // Track matched pairs: Map of English index -> Vietnamese index
  const [matches, setMatches] = useState<Map<number, number>>(new Map())
  const [selectedEnglish, setSelectedEnglish] = useState<number | null>(null)

  // Shuffle Vietnamese words for display
  const [shuffledVietnamese] = useState(() => {
    const indices = question.pairs.map((_, i) => i)
    return indices.sort(() => Math.random() - 0.5)
  })

  const handleEnglishSelect = (index: number) => {
    if (disabled) return

    // If already selected, deselect
    if (selectedEnglish === index) {
      setSelectedEnglish(null)
    } else {
      setSelectedEnglish(index)
    }
  }

  const handleVietnameseSelect = (shuffledIndex: number) => {
    if (disabled || selectedEnglish === null) return

    const vietnameseIndex = shuffledVietnamese[shuffledIndex]

    // Check if this Vietnamese word is already matched
    const existingMatch = Array.from(matches.entries()).find(
      ([_, vIndex]) => vIndex === vietnameseIndex
    )

    if (existingMatch) {
      // Unmatch the existing pair
      const newMatches = new Map(matches)
      newMatches.delete(existingMatch[0])
      setMatches(newMatches)
    }

    // Create new match
    const newMatches = new Map(matches)
    newMatches.set(selectedEnglish, vietnameseIndex)
    setMatches(newMatches)
    setSelectedEnglish(null)
  }

  const handleUnmatch = (englishIndex: number) => {
    if (disabled) return

    const newMatches = new Map(matches)
    newMatches.delete(englishIndex)
    setMatches(newMatches)
  }

  const handleSubmit = () => {
    // Convert matches to array of matched pair IDs
    const matchedPairIds = Array.from(matches.entries())
      .filter(([englishIndex, vietnameseIndex]) => {
        // Check if the match is correct
        return question.pairs[englishIndex] &&
               question.pairs[englishIndex] === question.pairs[vietnameseIndex]
      })
      .map(([englishIndex]) => question.pairs[englishIndex].id)

    onSubmit(matchedPairIds)
  }

  const isMatched = (englishIndex: number) => matches.has(englishIndex)
  const getMatch = (englishIndex: number) => {
    const vietnameseIndex = matches.get(englishIndex)
    return vietnameseIndex !== undefined ? question.pairs[vietnameseIndex] : null
  }

  const isVietnameseMatched = (shuffledIndex: number) => {
    const vietnameseIndex = shuffledVietnamese[shuffledIndex]
    return Array.from(matches.values()).includes(vietnameseIndex)
  }

  const allMatched = matches.size === question.pairs.length

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.instructions}>
        Match each English word with its Vietnamese translation
      </Text>

      <View style={styles.matchingContainer}>
        {/* English words column */}
        <View style={styles.column}>
          <Text style={styles.columnTitle}>English</Text>
          {question.pairs.map((pair, index) => {
            const matched = isMatched(index)
            const matchedPair = getMatch(index)
            const isSelected = selectedEnglish === index

            return (
              <View key={pair.id}>
                <TouchableOpacity
                  style={[
                    styles.wordCard,
                    isSelected && styles.selectedCard,
                    matched && styles.matchedCard,
                  ]}
                  onPress={() => handleEnglishSelect(index)}
                  disabled={disabled}
                >
                  <Text style={[
                    styles.wordText,
                    (isSelected || matched) && styles.selectedText,
                  ]}>
                    {pair.english}
                  </Text>
                </TouchableOpacity>

                {matched && matchedPair && (
                  <View style={styles.matchLine}>
                    <View style={styles.matchLineDash} />
                    <TouchableOpacity
                      style={styles.unmatchButton}
                      onPress={() => handleUnmatch(index)}
                      disabled={disabled}
                    >
                      <Text style={styles.unmatchText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )
          })}
        </View>

        {/* Vietnamese words column */}
        <View style={styles.column}>
          <Text style={styles.columnTitle}>Vietnamese</Text>
          {shuffledVietnamese.map((vietnameseIndex, shuffledIndex) => {
            const pair = question.pairs[vietnameseIndex]
            const matched = isVietnameseMatched(shuffledIndex)

            return (
              <TouchableOpacity
                key={`${pair.id}-${shuffledIndex}`}
                style={[
                  styles.wordCard,
                  matched && styles.matchedCard,
                  selectedEnglish !== null && !matched && styles.selectableCard,
                ]}
                onPress={() => handleVietnameseSelect(shuffledIndex)}
                disabled={disabled || selectedEnglish === null}
              >
                <Text style={[
                  styles.wordText,
                  matched && styles.selectedText,
                ]}>
                  {pair.vietnamese}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      {showFeedback && feedbackMessage && (
        <Card
          style={[
            styles.feedbackCard,
            isCorrect ? styles.correctFeedback : styles.incorrectFeedback,
          ]}
        >
          <Text style={[
            styles.feedbackText,
            isCorrect ? styles.correctText : styles.incorrectText,
          ]}>
            {isCorrect ? '✓' : '✗'} {feedbackMessage}
          </Text>
        </Card>
      )}

      <Button
        title={`Submit (${matches.size}/${question.pairs.length} matched)`}
        onPress={handleSubmit}
        disabled={!allMatched || disabled}
        style={styles.submitButton}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  instructions: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  matchingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  column: {
    flex: 1,
  },
  columnTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  wordCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    alignItems: 'center',
  },
  selectedCard: {
    borderColor: '#007AFF',
    backgroundColor: '#EFF6FF',
  },
  matchedCard: {
    borderColor: '#10B981',
    backgroundColor: '#D1FAE5',
  },
  selectableCard: {
    borderColor: '#9CA3AF',
  },
  wordText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  selectedText: {
    color: '#1E40AF',
    fontWeight: '600',
  },
  matchLine: {
    position: 'relative',
    height: 20,
    marginBottom: 8,
  },
  matchLineDash: {
    position: 'absolute',
    left: '50%',
    right: -12,
    top: '50%',
    height: 2,
    backgroundColor: '#10B981',
    borderStyle: 'dashed',
  },
  unmatchButton: {
    position: 'absolute',
    right: -6,
    top: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unmatchText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  feedbackCard: {
    marginBottom: 20,
  },
  correctFeedback: {
    backgroundColor: '#D1FAE5',
  },
  incorrectFeedback: {
    backgroundColor: '#FEE2E2',
  },
  feedbackText: {
    fontSize: 14,
  },
  correctText: {
    color: '#059669',
  },
  incorrectText: {
    color: '#DC2626',
  },
  submitButton: {
    marginBottom: 20,
  },
})
