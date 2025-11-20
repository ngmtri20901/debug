/**
 * Dialogue Question component
 * Handles both DialogueCompletion and RolePlay question types
 */

import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native'
import type { DialogueCompletionQuestion, RolePlayQuestion } from '../../types'
import { Button, Card } from '../shared'

export interface DialogueQuestionProps {
  question: DialogueCompletionQuestion | RolePlayQuestion
  onSubmit: (answer: string | number[]) => void // string for DialogueCompletion, number[] for RolePlay
  disabled?: boolean
  showFeedback?: boolean
  isCorrect?: boolean
  feedbackMessage?: string
}

export function DialogueQuestionComponent({
  question,
  onSubmit,
  disabled = false,
  showFeedback = false,
  isCorrect,
  feedbackMessage,
}: DialogueQuestionProps) {
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null)
  const [rolePlayAnswers, setRolePlayAnswers] = useState<number[]>([])
  const [currentStep, setCurrentStep] = useState<number>(0)

  const isRolePlay = question.type === 'role-play'
  const isDialogueCompletion = question.type === 'dialogue-completion'

  const handleDialogueChoiceSelect = (choiceId: string) => {
    if (disabled) return
    setSelectedChoice(choiceId)
  }

  const handleRolePlayChoiceSelect = (choiceIndex: number) => {
    if (disabled) return

    const newAnswers = [...rolePlayAnswers]
    newAnswers[currentStep] = choiceIndex
    setRolePlayAnswers(newAnswers)

    // Auto-advance to next step
    if (currentStep < (question as RolePlayQuestion).steps.length - 1) {
      setTimeout(() => {
        setCurrentStep(currentStep + 1)
      }, 500)
    }
  }

  const handleSubmit = () => {
    if (isDialogueCompletion && selectedChoice) {
      onSubmit(selectedChoice)
    } else if (isRolePlay) {
      onSubmit(rolePlayAnswers)
    }
  }

  const renderDialogueCompletion = () => {
    const q = question as DialogueCompletionQuestion

    return (
      <>
        <Card style={styles.contextCard}>
          {q.context.map((line, index) => (
            <View key={index} style={styles.dialogueLine}>
              <Text style={styles.speaker}>{line.who}:</Text>
              <Text style={styles.dialogue}>{line.text}</Text>
            </View>
          ))}
        </Card>

        <Text style={styles.questionText}>Choose the best response:</Text>

        <View style={styles.choicesContainer}>
          {q.choices.map((choice) => {
            const isSelected = selectedChoice === choice.id

            return (
              <TouchableOpacity
                key={choice.id}
                style={[
                  styles.choiceContainer,
                  isSelected && styles.selectedChoice,
                ]}
                onPress={() => handleDialogueChoiceSelect(choice.id)}
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
          })}
        </View>

        {q.explanation && showFeedback && (
          <Card style={styles.explanationCard}>
            <Text style={styles.explanation}>{q.explanation}</Text>
          </Card>
        )}
      </>
    )
  }

  const renderRolePlay = () => {
    const q = question as RolePlayQuestion
    const step = q.steps[currentStep]

    if (!step) return null

    return (
      <>
        <Text style={styles.rolePlayTitle}>{q.title}</Text>

        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          {q.steps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index === currentStep && styles.progressDotActive,
                index < currentStep && styles.progressDotCompleted,
              ]}
            />
          ))}
        </View>

        <Card style={styles.botMessageCard}>
          <Text style={styles.speaker}>Bot:</Text>
          <Text style={styles.botMessage}>{step.bot}</Text>
        </Card>

        {step.tips && (
          <Card style={styles.tipsCard}>
            <Text style={styles.tips}>💡 {step.tips}</Text>
          </Card>
        )}

        <Text style={styles.questionText}>Your response:</Text>

        <View style={styles.choicesContainer}>
          {step.choices.map((choice, index) => {
            const isSelected = rolePlayAnswers[currentStep] === index

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.choiceContainer,
                  isSelected && styles.selectedChoice,
                ]}
                onPress={() => handleRolePlayChoiceSelect(index)}
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
          })}
        </View>
      </>
    )
  }

  const canSubmit = isDialogueCompletion
    ? !!selectedChoice
    : rolePlayAnswers.length === (question as RolePlayQuestion).steps.length

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {isDialogueCompletion && renderDialogueCompletion()}
      {isRolePlay && renderRolePlay()}

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
        title={isRolePlay && currentStep < (question as RolePlayQuestion).steps.length - 1 ? "Continue" : "Submit Answer"}
        onPress={handleSubmit}
        disabled={!canSubmit || disabled}
        style={styles.submitButton}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contextCard: {
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
  },
  dialogueLine: {
    marginBottom: 12,
  },
  speaker: {
    fontSize: 14,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 4,
  },
  dialogue: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 22,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
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
  explanationCard: {
    marginBottom: 16,
    backgroundColor: '#EFF6FF',
  },
  explanation: {
    fontSize: 14,
    color: '#1E40AF',
  },
  rolePlayTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E5E7EB',
  },
  progressDotActive: {
    backgroundColor: '#007AFF',
    width: 24,
    borderRadius: 5,
  },
  progressDotCompleted: {
    backgroundColor: '#10B981',
  },
  botMessageCard: {
    marginBottom: 16,
    backgroundColor: '#F3F4F6',
  },
  botMessage: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 22,
  },
  tipsCard: {
    marginBottom: 16,
    backgroundColor: '#FEF3C7',
  },
  tips: {
    fontSize: 14,
    color: '#92400E',
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
