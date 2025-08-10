export type AppError = {
  type: string
  status: number
  message: string
}

// Make custom error to throw
export function makeError(
  type: string,
  status: number,
  message: string
): AppError {
  return { type, status, message }
}

// Check if the error is of custom type
export function isAppError(err: unknown): err is AppError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'status' in err &&
    'message' in err &&
    typeof (err as any).status === 'number' &&
    typeof (err as any).message === 'string'
  )
}

// Format app error so it returns pure TS object
export function formatAppError(error: AppError) {
  return {
    type: error.type,
    status: error.status,
    message: error.message,
  }
}
