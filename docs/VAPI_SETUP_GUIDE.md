# 🎙️ Vapi.ai Setup Guide - Vietnamese Learning App

## 📋 Overview

This guide will help you configure Vapi.ai workflow to work with the Vietnamese learning voice chat feature.

---

## 🔄 Workflow Flow

```
User clicks "Start Call"
        ↓
Vapi.ai Workflow starts
        ↓
Gather user information:
  - Topic (Vietnamese topic title)
  - Level (beginner/intermediate/advanced)
  - Amount (number of questions, e.g., 5-10)
        ↓
Make API request to:
  POST https://your-domain.com/api/vapi/generate
        ↓
API generates questions using Google Gemini
        ↓
Saves conversation to Supabase
        ↓
Returns success + conversation ID
        ↓
Voice chat begins with AI tutor
```

---

## 🔧 Required Variables in Vapi.ai Workflow

### Step 1: Create Workflow in Vapi.ai Dashboard

1. Go to Vapi.ai Dashboard → Workflows
2. Create new workflow
3. Set up the following steps:

### Step 2: Gather User Information

**Variable 1: `topic`** (String)
- **Description:** Vietnamese learning topic (in Vietnamese)
- **Type:** String
- **Example values:**
  - "Giới thiệu bản thân" (Self Introduction)
  - "Chào hỏi hàng ngày" (Daily Greetings)
  - "Gia đình" (Family)
  - "Đi chợ mua sắm" (Shopping at Market)
- **Prompt to user:** "What topic would you like to practice? For example: Giới thiệu bản thân, Gia đình, or Đi chợ."

**Variable 2: `level`** (String - Enum)
- **Description:** Student's Vietnamese proficiency level
- **Type:** Enum/Select
- **Allowed values:**
  - `beginner`
  - `intermediate`
  - `advanced`
- **Prompt to user:** "What is your Vietnamese level? Beginner, Intermediate, or Advanced?"

**Variable 3: `amount`** (Number)
- **Description:** Number of conversation prompts/questions to generate
- **Type:** Number
- **Range:** 3-15
- **Default:** 5
- **Prompt to user:** "How many questions would you like to practice with? (Recommended: 5-8)"

**Variable 4: `userid`** (String - Auto)
- **Description:** User's Supabase UUID
- **Type:** String (UUID)
- **Source:** Get from authentication context or pass from client
- **Note:** This should be automatically populated from your app when starting the call

**Variable 5: `conversationType`** (String - Optional)
- **Description:** Type of conversation practice
- **Type:** Enum/Select (Optional)
- **Allowed values:**
  - `free_talk` (default)
  - `scenario_based`
  - `vocabulary_practice`
  - `pronunciation_drill`
- **Default:** `free_talk`
- **Prompt to user:** "What type of practice? Free talk, Scenario-based, Vocabulary, or Pronunciation?"

---

## 📡 API Request Configuration

### Step 3: Make API Request Step in Workflow

**Endpoint URL:**
```
POST https://your-domain.vercel.app/api/vapi/generate
```

**Request Method:** `POST`

**Request Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body (JSON):**
```json
{
  "topic": "{{topic}}",
  "level": "{{level}}",
  "amount": {{amount}},
  "userid": "{{userid}}",
  "conversationType": "{{conversationType}}"
}
```

**Example Request:**
```json
{
  "topic": "Giới thiệu bản thân",
  "level": "beginner",
  "amount": 5,
  "userid": "550e8400-e29b-41d4-a716-446655440000",
  "conversationType": "free_talk"
}
```

---

## ✅ Expected API Response

### Success Response (200):
```json
{
  "success": true,
  "data": {
    "conversationId": "uuid-here",
    "prompts": [
      "Bạn tên là gì?",
      "Bạn đến từ đâu?",
      "Bạn bao nhiêu tuổi?",
      "Bạn làm nghề gì?",
      "Bạn học tiếng Việt bao lâu rồi?"
    ],
    "topic": "Giới thiệu bản thân",
    "level": "beginner",
    "message": "Vietnamese conversation prompts generated successfully!"
  }
}
```

### Error Response (400/500):
```json
{
  "success": false,
  "error": "Error message here",
  "details": "Stack trace (only in development)"
}
```

---

## 🎤 After API Success - Start Voice Conversation

### Step 4: Configure AI Assistant for Conversation

After successful API call, start voice conversation with these settings:

**System Prompt:**
```
You are a friendly Vietnamese language tutor helping foreign students practice Vietnamese.

**Your role:**
- Speak clearly in Vietnamese at a moderate pace
- Use the conversation prompts provided
- Gently correct pronunciation and grammar mistakes
- Encourage the student to speak more
- Be patient and supportive

**Conversation Topic:** {{topic}}
**Student Level:** {{level}}
**Prompts to use:** {{prompts}}

**Instructions:**
1. Start by greeting the student warmly in Vietnamese
2. Ask questions from the prompts list
3. Listen to their responses
4. Provide gentle corrections if needed
5. Encourage them to speak more
6. Keep the conversation natural and friendly

Begin the conversation now!
```

**Voice Settings:**
- **Provider:** OpenAI / Deepgram / ElevenLabs
- **Language:** Vietnamese (vi)
- **Voice ID:** Choose a clear, friendly voice
- **Speed:** 0.9-1.0 (slightly slower for beginners)

**Transcription Settings:**
- **Provider:** Deepgram (recommended for Vietnamese)
- **Language:** Vietnamese (`vi`)
- **Model:** Nova 2

---

## 🔐 Environment Variables Needed

Add these to your `.env.local`:

```env
# Google Generative AI (for question generation)
GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key_here

# Vapi.ai
NEXT_PUBLIC_VAPI_WEB_TOKEN=your_vapi_web_token
NEXT_PUBLIC_VAPI_WORKFLOW_ID=your_workflow_id_here

# Supabase (should already have)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 🧪 Testing the API

### Test with cURL:

```bash
curl -X POST https://your-domain.com/api/vapi/generate \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Giới thiệu bản thân",
    "level": "beginner",
    "amount": 5,
    "userid": "test-user-uuid",
    "conversationType": "free_talk"
  }'
```

### Test GET endpoint:

```bash
curl https://your-domain.com/api/vapi/generate
```

Should return API info and example usage.

---

## 📊 Sample Conversation Flow

1. **User:** "I want to practice Vietnamese"
2. **Vapi:** "Great! What topic would you like to practice?"
3. **User:** "Family" (or "Gia đình")
4. **Vapi:** "Perfect! What's your level? Beginner, Intermediate, or Advanced?"
5. **User:** "Beginner"
6. **Vapi:** "How many questions would you like to practice with?"
7. **User:** "5"
8. **Vapi:** *(Makes API call to generate 5 beginner-level family questions)*
9. **API:** *(Generates questions, saves to database, returns prompts)*
10. **Vapi:** "Great! Let's start practicing. Xin chào! Bạn tên là gì?"
11. **User:** *(Responds in Vietnamese)*
12. **AI Tutor:** *(Continues conversation using generated prompts)*

---

## 🎯 Topic Suggestions (for Vapi prompts)

You can suggest these topics to users:

### Beginner Level:
- Giới thiệu bản thân (Self Introduction)
- Chào hỏi hàng ngày (Daily Greetings)
- Gia đình (Family)
- Đi chợ mua sắm (Shopping)

### Intermediate Level:
- Hỏi đường dẫn (Asking for Directions)
- Gọi món ăn (Ordering Food)
- Thời tiết (Weather)
- Sở thích và hobbies (Hobbies)

### Advanced Level:
- Cuộc sống công sở (Office Life)
- Du lịch Việt Nam (Traveling Vietnam)
- Thảo luận xã hội (Social Issues)
- Kể chuyện (Storytelling)

---

## ⚠️ Important Notes

1. **User ID Required:** Make sure to pass the correct Supabase user ID, not Firebase ID
2. **Topic in Vietnamese:** Topic should be in Vietnamese (as stored in database)
3. **Level Validation:** Only use: `beginner`, `intermediate`, or `advanced`
4. **Amount Range:** Keep between 3-15 questions for best experience
5. **API Endpoint:** Must be publicly accessible for Vapi to call it
6. **Timeout:** API may take 3-10 seconds to generate questions, set appropriate timeout

---

## 🐛 Troubleshooting

### Issue: "Missing required fields" error
**Solution:** Ensure all required variables (topic, level, amount, userid) are being sent

### Issue: "Invalid level" error
**Solution:** Level must be exactly: `beginner`, `intermediate`, or `advanced` (lowercase)

### Issue: "Failed to parse prompts"
**Solution:** Gemini might have returned invalid JSON. Check API logs. May need to retry.

### Issue: "Failed to save conversation"
**Solution:** Check Supabase connection and RLS policies. User must be authenticated.

### Issue: API timeout
**Solution:** Increase Vapi timeout to 15 seconds. Gemini can take time to generate.

---

## 📞 Next Steps

1. ✅ Set up workflow in Vapi.ai Dashboard
2. ✅ Configure variables as specified above
3. ✅ Add API request step with correct endpoint
4. ✅ Test workflow with sample data
5. ✅ Configure AI assistant with Vietnamese voice
6. ✅ Test end-to-end: Start call → Generate questions → Voice chat

---

## 📚 Related Documentation

- Vapi.ai Workflows: https://docs.vapi.ai/workflows
- Google Generative AI: https://ai.google.dev/
- Supabase RLS: https://supabase.com/docs/guides/auth/row-level-security

---

**Last Updated:** Phase 4 - Voice Chat Migration
**API Version:** 2.0
**Status:** ✅ Ready for Production
