/**
 * Choose Words Question component
 * Supports 3 subtypes: fill_in_blanks, translation, sentence-scramble
 */

import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native'
import type { ChooseWordsQuestion } from '../../types'
import { Button, Card } from '../shared'

export interface ChooseWordsQuestionProps {
  question: ChooseWordsQuestion
  onSubmit: (answer: string[]) => void // Array of selected words in order
  disabled?: boolean
  showFeedback?: boolean
  isCorrect?: boolean
  feedbackMessage?: string
}

export function ChooseWordsQuestionComponent({
  question,
  onSubmit,
  disabled = false,
  showFeedback = false,
  isCorrect,
  feedbackMessage,
}: ChooseWordsQuestionProps) {
  const [selectedWords, setSelectedWords] = useState<string[]>([])

  const questionData = question.question_data
  const subtype = questionData.subtype
  const data = questionData.data
  const uiData = questionData.ui

  const getAvailableWords = (): string[] => {
    if (subtype === 'fill_in_blanks') {
      return data?.blanks?.options || []
    } else if (subtype === 'translation' || subtype === 'sentence-scramble') {
      return data?.tokens || []
    }
    return []
  }

  const availableWords = getAvailableWords()

  const handleWordSelect = (word: string) => {
    if (disabled) return
    setSelectedWords([...selectedWords, word])
  }

  const handleWordRemove = (index: number) => {
    if (disabled) return
    const newWords = [...selectedWords]
    newWords.splice(index, 1)
    setSelectedWords(newWords)
  }

  const handleSubmit = () => {
    onSubmit(selectedWords)
  }

  const handleClear = () => {
    setSelectedWords([])
  }

  const renderFillInBlanks = () => {
    const sentence = data?.blanks?.sentence || ''
    const parts = sentence.split('___')

    return (
      <View style={styles.sentenceContainer}>
        {parts.map((part, index) => (
          <View key={index} style={styles.sentencePart}>
            <Text style={styles.sentenceText}>{part}</Text>
            {index < parts.length - 1 && (
              <View style={styles.blankContainer}>
                {selectedWords[index] ? (
                  <TouchableOpacity
                    style={styles.filledBlank}
                    onPress={() => handleWordRemove(index)}
                    disabled={disabled}
                  >
                    <Text style={styles.filledBlankText}>{selectedWords[index]}</Text>
                    {!disabled && <Text style={styles.removeIcon}>✕</Text>}
                  </TouchableOpacity>
                ) : (
                  <View style={styles.emptyBlank}>
                    <Text style={styles.emptyBlankText}>___</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        ))}
      </View>
    )
  }

  const renderTranslation = () => {
    const prompt = uiData?.prompt || data?.prompt || 'Translate the following:'
    const englishSentence = data?.english_sentence || ''

    return (
      <View>
        <Text style={styles.prompt}>{prompt}</Text>
        <Card style={styles.englishCard}>
          <Text style={styles.englishText}>{englishSentence}</Text>
        </Card>
      </View>
    )
  }

  const renderSentenceScramble = () => {
    const prompt = uiData?.prompt || data?.prompt || 'Arrange the words to form a correct sentence:'

    return (
      <View>
        <Text style={styles.prompt}>{prompt}</Text>
      </View>
    )
  }

  const renderQuestionContent = () => {
    switch (subtype) {
      case 'fill_in_blanks':
        return renderFillInBlanks()
      case 'translation':
        return renderTranslation()
      case 'sentence-scramble':
        return renderSentenceScramble()
      default:
        return null
    }
  }

  const renderSelectedWordsArea = () => {
    if (subtype === 'fill_in_blanks') return null

    return (
      <Card style={styles.selectedWordsCard}>
        <Text style={styles.selectedWordsLabel}>Your answer:</Text>
        <View style={styles.selectedWordsContainer}>
          {selectedWords.length === 0 ? (
            <Text style={styles.emptyAnswerText}>Select words below...</Text>
          ) : (
            selectedWords.map((word, index) => (
              <TouchableOpacity
                key={index}
                style={styles.selectedWord}
                onPress={() => handleWordRemove(index)}
                disabled={disabled}
              >
                <Text style={styles.selectedWordText}>{word}</Text>
                {!disabled && <Text style={styles.removeIcon}>✕</Text>}
              </TouchableOpacity>
            ))
          )}
        </View>
      </Card>
    )
  }

  const getUsedCount = (word: string): number => {
    return selectedWords.filter(w => w === word).length
  }

  const getAvailableCount = (word: string): number => {
    return availableWords.filter(w => w === word).length
  }

  const isWordAvailable = (word: string): boolean => {
    return getUsedCount(word) < getAvailableCount(word)
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderQuestionContent()}
      {renderSelectedWordsArea()}

      <View style={styles.wordBankContainer}>
        <View style={styles.wordBankHeader}>
          <Text style={styles.wordBankLabel}>Word Bank</Text>
          {selectedWords.length > 0 && (
            <TouchableOpacity onPress={handleClear} disabled={disabled}>
              <Text style={styles.clearText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.wordBank}>
          {availableWords.map((word, index) => {
            const available = isWordAvailable(word)
            return (
              <TouchableOpacity
                key={`${word}-${index}`}
                style={[
                  styles.wordChip,
                  !available && styles.wordChipDisabled,
                ]}
                onPress={() => handleWordSelect(word)}
                disabled={!available || disabled}
              >
                <Text style={[
                  styles.wordChipText,
                  !available && styles.wordChipTextDisabled,
                ]}>
                  {word}
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
        title="Submit Answer"
        onPress={handleSubmit}
        disabled={selectedWords.length === 0 || disabled}
        style={styles.submitButton}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  prompt: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  englishCard: {
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
  },
  englishText: {
    fontSize: 18,
    color: '#111827',
    fontWeight: '500',
  },
  sentenceContainer: {
    marginBottom: 20,
  },
  sentencePart: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  sentenceText: {
    fontSize: 18,
    color: '#111827',
    lineHeight: 32,
  },
  blankContainer: {
    marginHorizontal: 4,
  },
  emptyBlank: {
    borderBottomWidth: 2,
    borderBottomColor: '#9CA3AF',
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  emptyBlankText: {
    fontSize: 18,
    color: '#9CA3AF',
  },
  filledBlank: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  filledBlankText: {
    fontSize: 16,
    color: '#1E40AF',
    fontWeight: '600',
    marginRight: 4,
  },
  selectedWordsCard: {
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
  },
  selectedWordsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  selectedWordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    minHeight: 40,
  },
  emptyAnswerText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  selectedWord: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  selectedWordText: {
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '600',
    marginRight: 4,
  },
  removeIcon: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: 'bold',
  },
  wordBankContainer: {
    marginBottom: 20,
  },
  wordBankHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  wordBankLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  clearText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  wordBank: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  wordChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  wordChipDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
  },
  wordChipText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  wordChipTextDisabled: {
    color: '#9CA3AF',
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
