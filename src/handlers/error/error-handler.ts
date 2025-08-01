import { AxiosError } from "axios";
import { BorsaItalianaHttpErrorResponse } from "../../interfaces/borsa-italiana-response.interface";
import { logger } from "../../logger/logger";

export const errorHandler = (error: unknown): string => {
  const defaultErrorMessage = "An error occurred. Please try again later.";

  if (error instanceof AxiosError) {
    const message = (error as AxiosError<BorsaItalianaHttpErrorResponse>).response?.data.message || error.message;
    const status = error.response?.status || "Unknown";
    const errorMessage = `Status ${status} - Message: ${message}`;
    logger.error(`Axios Error: ${errorMessage}`);
  } else {
    const unknownErrorMessage = (error as Error).message;
    logger.error(`Unknown Error: ${unknownErrorMessage}`);
  }

  return defaultErrorMessage;
};
