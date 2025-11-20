/**
 * Error Boundary for Learn Module
 * Catches and handles errors gracefully with fallback UI
 */

import React, { Component, ReactNode } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { Button } from './Button'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error, resetError: () => void) => ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    this.setState({
      errorInfo,
    })

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error!, this.resetError)
      }

      // Default error UI
      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.errorContainer}>
              <Text style={styles.errorEmoji}>⚠️</Text>
              <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
              <Text style={styles.errorMessage}>
                We encountered an unexpected error. Don't worry, your progress is safe.
              </Text>

              {__DEV__ && this.state.error && (
                <View style={styles.debugContainer}>
                  <Text style={styles.debugTitle}>Error Details (Debug Mode):</Text>
                  <View style={styles.debugBox}>
                    <Text style={styles.debugText}>
                      {this.state.error.toString()}
                    </Text>
                    {this.state.errorInfo && (
                      <Text style={styles.debugText}>
                        {this.state.errorInfo.componentStack}
                      </Text>
                    )}
                  </View>
                </View>
              )}

              <View style={styles.actions}>
                <Button
                  title="Try Again"
                  onPress={this.resetError}
                  variant="primary"
                  size="large"
                  fullWidth
                />
              </View>
            </View>
          </ScrollView>
        </View>
      )
    }

    return this.props.children
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorEmoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  debugContainer: {
    width: '100%',
    marginTop: 24,
    marginBottom: 24,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 8,
  },
  debugBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  debugText: {
    fontSize: 12,
    color: '#991B1B',
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  actions: {
    width: '100%',
    maxWidth: 300,
  },
})

/**
 * Hook version of Error Boundary
 * For functional components that need error handling
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  return {
    setError,
    resetError,
  }
}

/**
 * Higher-order component to wrap components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}
