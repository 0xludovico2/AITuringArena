import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Simular una verificación exitosa sin hacer llamadas a API
    return NextResponse.json({
      success: true,
      message: "Verification successful",
    })
  } catch (error) {
    console.error("Error verifying World ID proof:", error)
    return NextResponse.json({ error: "Failed to verify World ID proof" }, { status: 500 })
  }
}

