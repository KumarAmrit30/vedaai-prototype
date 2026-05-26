import axios from "axios";

const DEFAULT_MESSAGE = "Something went wrong. Please try again.";

export function getApiErrorMessage(
  error: unknown,
  fallback = DEFAULT_MESSAGE,
): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return "Unable to reach the server. Check your connection and try again.";
    }

    const responseMessage = error.response.data as { message?: string } | undefined;
    if (responseMessage?.message) {
      return responseMessage.message;
    }

    if (error.response.status >= 500) {
      return "The server encountered an error. Please try again shortly.";
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}
