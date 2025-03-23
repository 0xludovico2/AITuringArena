// Este archivo ya no se usará directamente desde el cliente
// Todas las llamadas a OpenAI deben pasar por la API route

import OpenAI from "openai"

// Define the ChatMessage type
export interface ChatMessage {
  role: "system" | "user" | "assistant"
  content: string
  sender?: string
}

// Define the AIConfig type
interface AIConfig {
  prompt: string
  temperature: number
  maxTokens: number
  presencePenalty: number
  frequencyPenalty: number
}

class AIService {
  private openai: OpenAI
  private defaultConfig: AIConfig = {
    prompt: "You are a helpful assistant.",
    temperature: 0.7,
    maxTokens: 200,
    presencePenalty: 0,
    frequencyPenalty: 0,
  }
  private maxRetries = 3
  private fallbackResponses = ["I'm not sure what to say.", "That's an interesting point.", "Tell me more about that."]

  constructor() {
    // Inicializar OpenAI con la API key del entorno
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  /**
   * Crea un agente de IA con una configuración específica
   */
  createAgent(prompt: string, config: Partial<AIConfig> = {}): AIAgent {
    return new AIAgent(this.openai, prompt, config)
  }

  /**
   * Devuelve una respuesta de fallback aleatoria
   */
  getRandomFallbackResponse(): string {
    return getRandomFallbackResponse()
  }
}

class AIAgent {
  private messages: ChatMessage[] = []
  private config: AIConfig
  private openai: OpenAI

  constructor(openai: OpenAI, prompt: string, config: Partial<AIConfig> = {}) {
    this.openai = openai
    this.config = {
      prompt: prompt,
      temperature: 0.7,
      maxTokens: 200,
      presencePenalty: 0,
      frequencyPenalty: 0,
      ...config,
    }
  }

  /**
   * Añade un mensaje al historial
   */
  addMessage(message: ChatMessage): void {
    this.messages.push(message)
  }

  /**
   * Genera una respuesta de la IA basada en el historial de mensajes y la configuración
   */
  async respond(): Promise<string> {
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not set. Please add it to your environment variables.")
      return "I'm having trouble connecting right now. Please try again later."
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo", // Usar un modelo más básico para reducir costos
        messages: [
          {
            role: "system",
            content: this.config.prompt,
          },
          ...this.messages,
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        presence_penalty: this.config.presencePenalty,
        frequency_penalty: this.config.frequencyPenalty,
      })
      return response.choices[0]?.message?.content || "I'm not sure what to say."
    } catch (error: any) {
      console.error("Error generating AI response:", error)
      return aiService.getRandomFallbackResponse()
    }
  }
}

export const aiService = new AIService()

// Funciones de utilidad que no usan OpenAI directamente
export const getRandomFallbackResponse = (): string => {
  const fallbackResponses = [
    "I'm not sure what to say.",
    "That's an interesting point.",
    "Tell me more about that.",
    "I need a moment to think about that.",
    "Let's hear what others have to say.",
  ]

  const randomIndex = Math.floor(Math.random() * fallbackResponses.length)
  return fallbackResponses[randomIndex]
}

