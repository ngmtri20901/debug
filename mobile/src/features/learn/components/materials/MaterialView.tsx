/**
 * Material View component
 * Displays lesson materials (dialogue, vocabulary, grammar)
 */

import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native'
import type { Material, DialogueLine, VocabularyItem, GrammarRule } from '../../types'
import { Card } from '../shared'

export interface MaterialViewProps {
  material: Material
}

export function MaterialView({ material }: MaterialViewProps) {
  const renderDialogue = () => {
    const lines = (material.data?.lines || []) as DialogueLine[]

    return (
      <Card style={styles.materialCard}>
        {material.title && <Text style={styles.title}>{material.title}</Text>}
        {material.explanation && (
          <Text style={styles.explanation}>{material.explanation}</Text>
        )}
        <View style={styles.dialogueContainer}>
          {lines.map((line, index) => (
            <View key={index} style={styles.dialogueLine}>
              <Text style={styles.speaker}>{line.who}:</Text>
              <Text style={styles.dialogue}>{line.text}</Text>
            </View>
          ))}
        </View>
      </Card>
    )
  }

  const renderVocabulary = () => {
    const items = (material.data?.items || []) as VocabularyItem[]

    return (
      <Card style={styles.materialCard}>
        {material.title && <Text style={styles.title}>{material.title}</Text>}
        {material.explanation && (
          <Text style={styles.explanation}>{material.explanation}</Text>
        )}
        <View style={styles.vocabularyContainer}>
          {items.map((item) => (
            <Card key={item.id} style={styles.vocabularyItem}>
              <View style={styles.vocabularyHeader}>
                <Text style={styles.vietnamese}>{item.vietnamese}</Text>
                <Text style={styles.english}>{item.english}</Text>
              </View>
              {item.pronunciation && (
                <Text style={styles.pronunciation}>[{item.pronunciation}]</Text>
              )}
              {item.example && (
                <Text style={styles.example}>Example: {item.example}</Text>
              )}
            </Card>
          ))}
        </View>
      </Card>
    )
  }

  const renderGrammar = () => {
    const rules = (material.data?.rules || []) as GrammarRule[]

    return (
      <Card style={styles.materialCard}>
        {material.title && <Text style={styles.title}>{material.title}</Text>}
        {material.explanation && (
          <Text style={styles.explanation}>{material.explanation}</Text>
        )}
        <View style={styles.grammarContainer}>
          {rules.map((rule) => (
            <Card key={rule.id} style={styles.grammarRule}>
              <Text style={styles.ruleTitle}>{rule.title}</Text>
              <Text style={styles.ruleExplanation}>{rule.explanation}</Text>
              {rule.examples.length > 0 && (
                <View style={styles.examplesContainer}>
                  <Text style={styles.examplesLabel}>Examples:</Text>
                  {rule.examples.map((example, index) => (
                    <Text key={index} style={styles.example}>
                      • {example}
                    </Text>
                  ))}
                </View>
              )}
              {rule.notes && (
                <View style={styles.notesContainer}>
                  <Text style={styles.notes}>💡 {rule.notes}</Text>
                </View>
              )}
            </Card>
          ))}
        </View>
      </Card>
    )
  }

  const renderImage = () => {
    const imageUrl = material.media_url || material.data?.url

    return (
      <Card style={styles.materialCard}>
        {material.title && <Text style={styles.title}>{material.title}</Text>}
        {imageUrl && (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="contain"
          />
        )}
        {material.explanation && (
          <Text style={styles.explanation}>{material.explanation}</Text>
        )}
      </Card>
    )
  }

  const renderText = () => {
    return (
      <Card style={styles.materialCard}>
        {material.title && <Text style={styles.title}>{material.title}</Text>}
        {typeof material.explanation === 'string' ? (
          <Text style={styles.explanation}>{material.explanation}</Text>
        ) : (
          <Text style={styles.explanation}>{JSON.stringify(material.explanation)}</Text>
        )}
      </Card>
    )
  }

  switch (material.type) {
    case 'dialogue':
      return renderDialogue()
    case 'vocabulary':
      return renderVocabulary()
    case 'grammar':
      return renderGrammar()
    case 'image':
      return renderImage()
    default:
      return renderText()
  }
}

const styles = StyleSheet.create({
  materialCard: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  explanation: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 16,
  },
  dialogueContainer: {
    gap: 12,
  },
  dialogueLine: {
    marginBottom: 8,
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
  vocabularyContainer: {
    gap: 12,
  },
  vocabularyItem: {
    backgroundColor: '#F9FAFB',
  },
  vocabularyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  vietnamese: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  english: {
    fontSize: 16,
    color: '#6B7280',
  },
  pronunciation: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  example: {
    fontSize: 14,
    color: '#374151',
    fontStyle: 'italic',
  },
  grammarContainer: {
    gap: 16,
  },
  grammarRule: {
    backgroundColor: '#EFF6FF',
  },
  ruleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 8,
  },
  ruleExplanation: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 12,
  },
  examplesContainer: {
    marginTop: 8,
  },
  examplesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  notesContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  },
  notes: {
    fontSize: 14,
    color: '#92400E',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
})
