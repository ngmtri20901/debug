/**
 * Multiple Choice Question component
 * Supports 5 MCQ types: text-only, image-question, image-choices, grammar-structure, word-translation
 */

import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native'
import type { MultipleChoiceQuestion, Choice } from '../../types'
import { Button, Card } from '../shared'

export interface MultipleChoiceQuestionProps {
  question: MultipleChoiceQuestion
  onSubmit: (answer: string) => void
  disabled?: boolean
  showFeedback?: boolean
  isCorrect?: boolean
  feedbackMessage?: string
}

export function MultipleChoiceQuestionComponent({
  question,
  onSubmit,
  disabled = false,
  showFeedback = false,
  isCorrect,
  feedbackMessage,
}: MultipleChoiceQuestionProps) {
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null)

  const handleChoiceSelect = (choiceId: string) => {
    if (disabled) return
    setSelectedChoice(choiceId)
  }

  const handleSubmit = () => {
    if (selectedChoice) {
      onSubmit(selectedChoice)
    }
  }

  const renderTextOnly = () => (
    <View>
      {question.passage && (
        <Card style={styles.passageCard}>
          <Text style={styles.passage}>{question.passage}</Text>
        </Card>
      )}
      {question.questionText && (
        <Text style={styles.questionText}>{question.questionText}</Text>
      )}
    </View>
  )

  const renderImageQuestion = () => (
    <View>
      {question.questionImage && (
        <Image
          source={{ uri: question.questionImage }}
          style={styles.questionImage}
          resizeMode="contain"
        />
      )}
      {question.questionText && (
        <Text style={styles.questionText}>{question.questionText}</Text>
      )}
    </View>
  )

  const renderImageChoices = () => (
    <View>
      {question.targetWord && (
        <Text style={styles.questionText}>
          What is this in Vietnamese: <Text style={styles.targetWord}>{question.targetWord}</Text>
        </Text>
      )}
    </View>
  )

  const renderGrammarStructure = () => (
    <View>
      {question.questionText && (
        <Text style={styles.questionText}>{question.questionText}</Text>
      )}
      {question.hint && (
        <Card style={styles.hintCard}>
          <Text style={styles.hint}>💡 Hint: {question.hint}</Text>
        </Card>
      )}
    </View>
  )

  const renderWordTranslation = () => (
    <View>
      {question.targetWord && (
        <Card style={styles.targetWordCard}>
          <Text style={styles.targetWordLarge}>{question.targetWord}</Text>
        </Card>
      )}
      {question.questionText && (
        <Text style={styles.questionText}>{question.questionText}</Text>
      )}
    </View>
  )

  const renderQuestionContent = () => {
    switch (question.questionType) {
      case 'text-only':
        return renderTextOnly()
      case 'image-question':
        return renderImageQuestion()
      case 'image-choices':
        return renderImageChoices()
      case 'grammar-structure':
        return renderGrammarStructure()
      case 'word-translation':
        return renderWordTranslation()
      default:
        return null
    }
  }

  const renderChoice = (choice: Choice) => {
    const isSelected = selectedChoice === choice.id
    const isImageChoice = question.questionType === 'image-choices'

    if (isImageChoice && choice.imageUrl) {
      return (
        <TouchableOpacity
          key={choice.id}
          style={[
            styles.imageChoiceContainer,
            isSelected && styles.selectedImageChoice,
          ]}
          onPress={() => handleChoiceSelect(choice.id)}
          disabled={disabled}
        >
          <Image
            source={{ uri: choice.imageUrl }}
            style={styles.choiceImage}
            resizeMode="cover"
          />
          {choice.text && <Text style={styles.imageChoiceText}>{choice.text}</Text>}
        </TouchableOpacity>
      )
    }

    return (
      <TouchableOpacity
        key={choice.id}
        style={[
          styles.choiceContainer,
          isSelected && styles.selectedChoice,
        ]}
        onPress={() => handleChoiceSelect(choice.id)}
        disabled={disabled}
      >
        <View style={[
          styles.radio,
          isSelected && styles.radioSelected,
        ]}>
          {isSelected && <View style={styles.radioDot} />}
        </View>
        <Text style={[
          styles.choiceText,
          isSelected && styles.selectedChoiceText,
        ]}>
          {choice.text}
        </Text>
      </TouchableOpacity>
    )
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderQuestionContent()}

      <View style={styles.choicesContainer}>
        {question.choices.map(renderChoice)}
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
        disabled={!selectedChoice || disabled}
        style={styles.submitButton}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  passageCard: {
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
  },
  passage: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
    lineHeight: 26,
  },
  targetWord: {
    color: '#007AFF',
    fontWeight: '700',
  },
  targetWordCard: {
    marginBottom: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
  },
  targetWordLarge: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1E40AF',
  },
  hintCard: {
    marginBottom: 16,
    backgroundColor: '#FEF3C7',
  },
  hint: {
    fontSize: 14,
    color: '#92400E',
  },
  questionImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  choicesContainer: {
    marginBottom: 20,
  },
  choiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  selectedChoice: {
    borderColor: '#007AFF',
    backgroundColor: '#EFF6FF',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioSelected: {
    borderColor: '#007AFF',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
  choiceText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  selectedChoiceText: {
    color: '#1E40AF',
    fontWeight: '600',
  },
  imageChoiceContainer: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  selectedImageChoice: {
    borderColor: '#007AFF',
  },
  choiceImage: {
    width: '100%',
    height: 150,
  },
  imageChoiceText: {
    padding: 12,
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
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
