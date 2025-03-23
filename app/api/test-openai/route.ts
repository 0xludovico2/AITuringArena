import { NextResponse } from "next/server"
import OpenAI from "openai"

export async function GET() {
  try {
    // Log the API key (solo las primeras 5 caracteres por seguridad)
    const apiKey = process.env.OPENAI_API_KEY || ""
    console.log("API Key prefix:", apiKey.substring(0, 5) + "...")

    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    const openai = new OpenAI({
      apiKey: apiKey,
    })

    // Intenta una llamada simple a la API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Usar un modelo más básico para pruebas
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Hello, how are you?" },
      ],
      max_tokens: 50,
    })

    return NextResponse.json({
      success: true,
      message: completion.choices[0]?.message?.content || "No response",
      model: completion.model,
    })
  } catch (error: any) {
    console.error("Error testing OpenAI:", error)

    // Devolver información detallada sobre el error
    return NextResponse.json(
      {
        error: "OpenAI API error",
        message: error.message,
        status: error.status,
        type: error.type,
        code: error.code,
      },
      { status: 500 },
    )
  }
}

