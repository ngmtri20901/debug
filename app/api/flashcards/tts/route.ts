import { NextRequest, NextResponse } from 'next/server'

/**
 * API route for Google Text-to-Speech
 * Handles TTS requests for custom flashcards server-side
 * 
 * POST /api/flashcards/tts
 * Body: { text: string }
 * 
 * Returns: { audioContent: string } (base64 encoded MP3)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text } = body

    // Validate input
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Text is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    // Get API key from server-side environment variable
    const apiKey = process.env.GOOGLE_TTS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_TTS_API_KEY
    
    if (!apiKey) {
      console.error('Google TTS API key is not configured')
      return NextResponse.json(
        { error: 'TTS service is not configured' },
        { status: 500 }
      )
    }

    // Prepare request to Google TTS API
    const requestBody = {
      input: { text: text.trim() },
      voice: {
        languageCode: "vi-VN",
        name: "vi-VN-Standard-D",
        ssmlGender: "MALE"
      },
      audioConfig: { 
        audioEncoding: "MP3" 
      },
    }

    // Call Google TTS API
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Google TTS API error:', errorData)
      return NextResponse.json(
        { error: `Failed to synthesize audio: ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()

    if (!data.audioContent) {
      console.error('No audioContent in Google TTS response:', data)
      return NextResponse.json(
        { error: 'No audio content in API response' },
        { status: 500 }
      )
    }

    // Return base64 audio content
    return NextResponse.json({
      audioContent: data.audioContent
    })

  } catch (error) {
    console.error('Error in TTS API route:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  )
}

