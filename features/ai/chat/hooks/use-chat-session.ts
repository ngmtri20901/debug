import { useState, useEffect, useCallback } from 'react';
import { useChat } from '@ai-sdk/react';
import { useAuth } from '@/hooks/use-auth';
import { 
  createChatSession, 
  getChatSessions, 
  getChatMessages, 
  saveUserMessage,
  updateSessionTitle,
  deleteChatSession,
  type ChatSession,
  type ChatMessage 
} from '@/lib/supabase/chat';

export interface UseChatSessionOptions {
  mode: string;
  onSessionCreated?: (session: ChatSession) => void;
  onError?: (error: Error) => void;
}

export function useChatSession({ mode, onSessionCreated, onError }: UseChatSessionOptions) {
  const { user, loading: authLoading } = useAuth();
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // Initialize chat with AI SDK
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setMessages,
    append
  } = useChat({
    api: '/api/chat',
    body: {
      mode,
      sessionId: currentSession?.id
    },
    onError: (error) => {
      console.error('Chat error:', error);
      onError?.(error);
    }
  });

  // Load all chat sessions
  const loadSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    try {
      console.log('Loading chat sessions...');
      const fetchedSessions = await getChatSessions();
      console.log('Fetched sessions:', fetchedSessions);
      setSessions(fetchedSessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
      onError?.(error as Error);
    } finally {
      setIsLoadingSessions(false);
    }
  }, [onError]);

  // Create a new chat session
  const createNewSession = useCallback(async (title?: string) => {
    // Check if authentication is still loading
    if (authLoading) {
      console.log('Authentication still loading, waiting...');
      throw new Error('Authentication is still loading. Please wait.');
    }
    
    // Check if user is authenticated
    if (!user) {
      console.log('User not authenticated');
      throw new Error('User not authenticated. Please log in.');
    }
    
    setIsCreatingSession(true);
    try {
      console.log('Creating new session with mode:', mode, 'for user:', user.id);
      const session = await createChatSession(mode, title);
      console.log('Created session:', session);
      if (session) {
        setCurrentSession(session);
        setMessages([]);
        await loadSessions(); // Refresh the sessions list
        onSessionCreated?.(session);
        return session;
      }
    } catch (error) {
      console.error('Error creating session:', error);
      onError?.(error as Error);
    } finally {
      setIsCreatingSession(false);
    }
    return null;
  }, [mode, user, authLoading, setMessages, loadSessions, onSessionCreated, onError]);

  // Load a specific session and its messages
  const loadSession = useCallback(async (sessionId: string) => {
    try {
      // Find the session in our list
      const session = sessions.find(s => s.id === sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      setCurrentSession(session);
      
      // Load messages for this session
      const sessionMessages = await getChatMessages(sessionId);
      
      // Convert database messages to AI SDK format
      const aiMessages = sessionMessages.map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        createdAt: new Date(msg.created_at)
      }));
      
      setMessages(aiMessages);
    } catch (error) {
      console.error('Error loading session:', error);
      onError?.(error as Error);
    }
  }, [sessions, setMessages, onError]);

  // Save user message to database
  const sendMessage = useCallback(async (content: string) => {
    try {
      let sessionToUse = currentSession;
      
      // Create a new session if none exists
      if (!sessionToUse) {
        console.log('No current session, creating new one...');
        sessionToUse = await createNewSession();
        if (!sessionToUse) {
          throw new Error('Failed to create chat session');
        }
      }

      console.log('Sending message:', { content, sessionId: sessionToUse.id, mode });
      
      // Save user message to database first
      const savedMessage = await saveUserMessage(sessionToUse.id, content);
      console.log('User message saved:', savedMessage);
      
      // Send message through AI SDK (this will trigger the API call)
      append({
        role: 'user',
        content
      });
    } catch (error) {
      console.error('Error sending message:', error);
      onError?.(error as Error);
    }
  }, [currentSession, createNewSession, append, onError, mode]);

  // Update session title
  const updateTitle = useCallback(async (title: string) => {
    if (!currentSession) return false;
    
    try {
      const success = await updateSessionTitle(currentSession.id, title);
      if (success) {
        setCurrentSession(prev => prev ? { ...prev, title } : null);
        await loadSessions(); // Refresh sessions list
      }
      return success;
    } catch (error) {
      console.error('Error updating title:', error);
      onError?.(error as Error);
      return false;
    }
  }, [currentSession, loadSessions, onError]);

  // Delete a session
  const removeSession = useCallback(async (sessionId: string) => {
    try {
      const success = await deleteChatSession(sessionId);
      if (success) {
        // If we're deleting the current session, clear it
        if (currentSession?.id === sessionId) {
          setCurrentSession(null);
          setMessages([]);
        }
        await loadSessions(); // Refresh sessions list
      }
      return success;
    } catch (error) {
      console.error('Error deleting session:', error);
      onError?.(error as Error);
      return false;
    }
  }, [currentSession, setMessages, loadSessions, onError]);

  // Load sessions on mount, but only after authentication is ready
  useEffect(() => {
    if (!authLoading && user) {
      loadSessions();
    }
  }, [authLoading, user, loadSessions]);

  return {
    // Session management
    currentSession,
    sessions,
    isLoadingSessions,
    isCreatingSession,
    createNewSession,
    loadSession,
    updateTitle,
    removeSession,
    loadSessions,
    
    // Chat functionality
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    sendMessage,
    
    // Utilities
    setMessages
  };
}
