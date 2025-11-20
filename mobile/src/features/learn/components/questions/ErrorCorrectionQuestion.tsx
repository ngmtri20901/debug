/**
 * Error Correction Question component
 * Users identify and correct errors in Vietnamese sentences
 */

import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
} from 'react-native'
import type { ErrorCorrectionQuestion } from '../../types'
import { Button, Card } from '../shared'

export interface ErrorCorrectionQuestionProps {
  question: ErrorCorrectionQuestion
  onSubmit: (answer: string) => void
  disabled?: boolean
  showFeedback?: boolean
  isCorrect?: boolean
  feedbackMessage?: string
}

export function ErrorCorrectionQuestionComponent({
  question,
  onSubmit,
  disabled = false,
  showFeedback = false,
  isCorrect,
  feedbackMessage,
}: ErrorCorrectionQuestionProps) {
  const [correctedSentence, setCorrectedSentence] = useState<string>(question.faultySentence)

  const handleSubmit = () => {
    onSubmit(correctedSentence.trim())
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.instruction}>
        {question.question || 'Find and correct the error in this sentence:'}
      </Text>

      <Card style={styles.faultySentenceCard}>
        <Text style={styles.label}>Sentence with error:</Text>
        <Text style={styles.faultySentence}>{question.faultySentence}</Text>
      </Card>

      {question.hint && (
        <Card style={styles.hintCard}>
          <Text style={styles.hint}>💡 Hint: {question.hint}</Text>
        </Card>
      )}

      <Text style={styles.label}>Your correction:</Text>
      <TextInput
        style={[styles.input, disabled && styles.inputDisabled]}
        value={correctedSentence}
        onChangeText={setCorrectedSentence}
        multiline
        placeholder="Type the corrected sentence here..."
        editable={!disabled}
        autoCapitalize="none"
        autoCorrect={false}
      />

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
        disabled={!correctedSentence.trim() || disabled}
        style={styles.submitButton}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  instruction: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  faultySentenceCard: {
    marginBottom: 16,
    backgroundColor: '#FEF3C7',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  faultySentence: {
    fontSize: 18,
    color: '#92400E',
    fontWeight: '500',
  },
  hintCard: {
    marginBottom: 16,
    backgroundColor: '#EFF6FF',
  },
  hint: {
    fontSize: 14,
    color: '#1E40AF',
  },
  input: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  inputDisabled: {
    backgroundColor: '#F3F4F6',
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
