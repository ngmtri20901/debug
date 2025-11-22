/**
 * ProfileAvatar component - Displays user avatar with optional edit button
 */

import React from 'react'
import { View, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { Text } from 'react-native'

export interface ProfileAvatarProps {
  avatarUrl: string | null
  displayName: string | null
  size?: number
  editable?: boolean
  onEdit?: () => void
  isUploading?: boolean
}

export function ProfileAvatar({
  avatarUrl,
  displayName,
  size = 100,
  editable = false,
  onEdit,
  isUploading = false,
}: ProfileAvatarProps) {
  const initials = displayName
    ? displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

  const renderAvatar = () => {
    if (avatarUrl) {
      return (
        <Image source={{ uri: avatarUrl }} style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]} />
      )
    }

    return (
      <View style={[styles.avatarPlaceholder, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={[styles.initialsText, { fontSize: size * 0.4 }]}>{initials}</Text>
      </View>
    )
  }

  if (!editable) {
    return <View style={styles.container}>{renderAvatar()}</View>
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onEdit}
      disabled={isUploading}
      activeOpacity={0.7}
    >
      {renderAvatar()}
      {isUploading && (
        <View style={[styles.uploadingOverlay, { width: size, height: size, borderRadius: size / 2 }]}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      )}
      <View style={styles.editBadge}>
        <Text style={styles.editIcon}>✏️</Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  avatar: {
    backgroundColor: '#E5E7EB',
  },
  avatarPlaceholder: {
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editIcon: {
    fontSize: 16,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
})
