export const WORLD_ID_CONFIG = {
  // Estos son valores de ejemplo para staging
  // En producción, deberías usar tus propios valores
  APP_ID: "app_staging_d9427a5d4c01e89b3c8dfa1d1862f0c7",
  ACTION_NAME: "ai-turing-arena-verification",
  // Puedes añadir más configuraciones según sea necesario
}

// Función para verificar si un usuario ya está verificado
export const isWorldIdVerified = (): boolean => {
  if (typeof window === "undefined") return false
  return localStorage.getItem("worldIdVerified") === "true"
}

// Función para marcar a un usuario como verificado
export const setWorldIdVerified = (): void => {
  if (typeof window === "undefined") return
  localStorage.setItem("worldIdVerified", "true")
}

// Función para limpiar la verificación
export const clearWorldIdVerification = (): void => {
  if (typeof window === "undefined") return
  localStorage.removeItem("worldIdVerified")
}

