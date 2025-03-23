import { type NextRequest, NextResponse } from "next/server"

// Interfaz para el historial de mensajes
interface ChatMessage {
  role: "system" | "user" | "assistant"
  content: string
  sender?: string // Nombre del remitente (para mensajes de usuario)
}

// Función para generar respuestas de fallback usando IA
const generateFallbackResponse = async (apiKey: string): Promise<string> => {
  try {
    const fallbackPrompts = [
      "Generate a very short (5-7 words) casual response that could fit in any conversation.",
      "Create a brief, natural-sounding reply that could work in most conversations.",
      "Write a short, generic response that sounds human and conversational.",
      "Generate a brief, thoughtful comment that could fit in most discussions.",
    ]

    // Seleccionar un prompt aleatorio
    const randomPrompt = fallbackPrompts[Math.floor(Math.random() * fallbackPrompts.length)]

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "system", content: randomPrompt }],
        temperature: 0.7,
        max_tokens: 20,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to get fallback response")
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || "Interesting point."
  } catch (error) {
    console.error("Error generating fallback response:", error)
    return "Interesting point."
  }
}

// Modificar la función POST para optimizar la generación de respuestas cortas
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Check if API key is configured
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.error("OPENAI_API_KEY environment variable is not set")
      return NextResponse.json({ error: "OpenAI API key is not configured" }, { status: 500 })
    }

    // Parse request body
    let requestData
    try {
      requestData = await request.json()
    } catch (parseError) {
      console.error("Error parsing request JSON:", parseError)
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 })
    }

    const { messages, prompt } = requestData

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Si no hay mensajes, crear un array vacío
    const chatMessages = messages || []

    // Validar que los mensajes tengan el formato correcto si existen
    if (chatMessages.length > 0) {
      const invalidMessages = chatMessages.filter(
        (msg: any) => !msg.role || !msg.content || !["system", "user", "assistant"].includes(msg.role),
      )

      if (invalidMessages.length > 0) {
        console.error("Invalid message format in request:", invalidMessages)
        return NextResponse.json({ error: "One or more messages have invalid format" }, { status: 400 })
      }
    }

    // Preparar los mensajes para la API de OpenAI
    const systemMessage = {
      role: "system" as const,
      content: prompt,
    }

    // Usar más mensajes del historial para mantener mejor el contexto
    const recentMessages = chatMessages.slice(-10)

    const formattedMessages = [
      systemMessage,
      ...recentMessages.map((msg: ChatMessage) => ({
        role: msg.role,
        content: msg.sender ? `${msg.sender}: ${msg.content}` : msg.content,
      })),
    ]

    // Añadir un mensaje adicional para enfatizar la coherencia
    formattedMessages.push({
      role: "system" as const,
      content: "Remember to stay on topic and maintain conversation coherence with previous messages.",
    })

    // Llamar a la API de OpenAI directamente usando fetch en lugar de la biblioteca
    try {
      // En la llamada a OpenAI, ajustar los parámetros:
      const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: formattedMessages,
          temperature: 0.7, // Reducido para respuestas más coherentes
          max_tokens: 60, // Aumentado para permitir respuestas más completas
          presence_penalty: 0.3, // Reducido para menos penalización por repetición
          frequency_penalty: 0.5, // Mantenido para evitar repeticiones
        }),
      })

      if (!openaiResponse.ok) {
        const errorData = await openaiResponse.json().catch(() => ({}))
        console.error("OpenAI API error:", openaiResponse.status, errorData)

        // Intentar generar una respuesta de fallback
        const fallbackResponse = await generateFallbackResponse(apiKey)

        return NextResponse.json({
          response: fallbackResponse,
          metadata: {
            processingTimeMs: Date.now() - startTime,
            messageCount: chatMessages.length,
            model: "gpt-3.5-turbo",
            fallback: true,
          },
        })
      }

      const completion = await openaiResponse.json()
      const responseContent = completion.choices[0]?.message?.content || "I'm not sure what to say."

      const duration = Date.now() - startTime
      console.log(`AI response generated in ${duration}ms`)

      return NextResponse.json({
        response: responseContent,
        metadata: {
          processingTimeMs: duration,
          messageCount: chatMessages.length,
          model: completion.model,
        },
      })
    } catch (apiError: any) {
      console.error("Error específico de la API de OpenAI:", apiError)

      // Verificar si es un error de conexión
      if (apiError.code === "ECONNREFUSED" || apiError.code === "ENOTFOUND" || apiError.message.includes("connect")) {
        console.error("Problema de conexión detectado. Posible problema de red local.")

        // Intentar generar una respuesta de fallback
        const fallbackResponse = await generateFallbackResponse(apiKey)

        return NextResponse.json({
          response: fallbackResponse,
          metadata: {
            processingTimeMs: Date.now() - startTime,
            fallback: true,
          },
        })
      }

      throw apiError // Re-lanzar para el manejador general
    }
  } catch (error: any) {
    const duration = Date.now() - startTime
    console.error(`Error in AI response endpoint (${duration}ms):`, error)

    // Ensure we always return a JSON response with detailed error info
    return NextResponse.json(
      {
        error: "Failed to generate AI response",
        message: error.message || "Unknown error",
        type: error.type || "unknown",
        code: error.code || "unknown",
      },
      { status: 500 },
    )
  }
}

