# Vietnamese Conversation Tool - Quick Reference

## Overview
The Vietnamese Conversation tool enables interactive role-play scenarios where learners practice conversing with Vietnamese personas in realistic situations.

## How to Use

### From Chat Interface
Simply ask the AI assistant to start a Vietnamese conversation:

**Example prompts:**
- "Start a Vietnamese conversation practice with me"
- "I want to practice ordering food in Vietnamese"
- "Begin a conversation with a Vietnamese persona at intermediate level"
- "Help me practice Vietnamese conversation about shopping"

### Tool Actions

#### 1. Start a New Conversation
```typescript
{
  action: "start",
  difficulty: "beginner" | "intermediate" | "advanced", // Optional, defaults to beginner
  scenarioType: "restaurant" | "shopping" | "asking_directions" | etc. // Optional
}
```

**What happens:**
- LLM generates a Vietnamese persona (name, role, personality)
- Creates a conversation scenario with context and learning objectives
- Provides initial prompt for learner to respond
- All data streamed to UI for rendering

#### 2. Continue Conversation
```typescript
{
  action: "continue",
  conversationId: "uuid-string" // From initial start
}
```

**What happens:**
- Retrieves conversation context
- Generates next dialogue turn
- Maintains conversation flow

#### 3. Evaluate Response
```typescript
{
  action: "evaluate",
  conversationId: "uuid-string",
  userResponse: "Learner's Vietnamese text"
}
```

**What happens:**
- Analyzes Vietnamese response for correctness
- Provides score (1-10)
- Lists corrections with explanations
- Offers suggestions for improvement
- Streams feedback to UI

## Data Streamed to UI

### 1. Conversation Persona
```typescript
type ConversationPersona = {
  name: string;        // e.g., "Lan"
  role: string;        // e.g., "café owner"
  personality: string; // e.g., "friendly and patient"
}
```

### 2. Scene Introduction
```typescript
type ConversationSceneIntro = {
  situation: string;             // Where the conversation takes place
  context: string;               // What's happening
  learningObjectives: string[];  // What the learner will practice
}
```

### 3. User Input Prompt
```typescript
type ConversationUserInputPrompt = {
  prompt: string;          // What to say/do
  expectedLength: string;  // e.g., "1-2 sentences"
  hints: string[];         // Helpful tips
}
```

### 4. Evaluation Feedback
```typescript
type ConversationEvalFeedback = {
  score: number;  // 1-10
  feedback: string;
  corrections: Array<{
    original: string;      // What learner wrote
    corrected: string;     // Correct version
    explanation: string;   // Why it's better
  }>;
  suggestions: string[];   // Tips for improvement
}
```

## Metadata Fields

Each assistant message in a conversation includes:

```typescript
{
  speaker: {
    id: string;
    name: string;
    personaTag?: string;
  };
  difficulty: "beginner" | "intermediate" | "advanced";
  lessonId?: string;
  scenarioId?: string;
  turnIndex: number;
  is_finished: boolean;
}
```

## Example Conversation Flow

### 1. User initiates
**User:** "Start a beginner Vietnamese conversation at a café"

### 2. LLM invokes tool
```typescript
vietnameseConversation({
  action: "start",
  difficulty: "beginner",
  scenarioType: "café"
})
```

### 3. Tool returns
- **Persona**: Lan (café owner, friendly and patient)
- **Scene**: You are at Lan's café in Hanoi, you want to order coffee
- **Prompt**: "How would you greet Lan and order a coffee in Vietnamese?"
- **Hints**: Use "Xin chào", be polite, use "anh/chị"

### 4. User responds
**User:** "Xin chao, toi muon mot cafe sua"

### 5. LLM invokes evaluation
```typescript
vietnameseConversation({
  action: "evaluate",
  conversationId: "conv-123",
  userResponse: "Xin chao, toi muon mot cafe sua"
})
```

### 6. Tool provides feedback
- **Score**: 7/10
- **Corrections**:
  - "Xin chao" → "Xin chào" (add tone marks)
  - "toi" → "tôi" (add tone marks)
  - "mot cafe sua" → "một cà phê sữa" (tone marks and spacing)
- **Suggestions**: 
  - Use tone marks correctly
  - Add "anh/chị" for politeness
  - Practice pronunciation of tones

## Current Limitations (MVP)

- Helper functions use placeholder data (personas, scenarios, evaluations)
- In production, these should use LLM to generate dynamic content
- UI components not yet implemented (Phase 2)
- Continue action needs full implementation with context retrieval

## Next Steps

Phase 2 will add UI components to render:
- Persona displays with avatar/info
- Scene introductions with visual context
- Interactive input prompts
- Rich evaluation feedback with corrections

## Testing

To test the tool:
1. Start the development server
2. Open chat interface
3. Ask AI to start a Vietnamese conversation
4. Check browser console for tool invocation
5. Verify data is streamed correctly (check network tab)

Note: UI rendering won't work until Phase 2 components are implemented, but data streaming can be verified.
