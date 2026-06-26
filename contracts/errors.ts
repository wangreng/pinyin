export const ERROR_MESSAGES = {
  UNAUTHORIZED: "Unauthorized",
  FORBIDDEN: "Forbidden",
  NOT_FOUND: "Not found",
  INTERNAL_ERROR: "Internal server error",
} as const;

export type ErrorMessage =
  (typeof ERROR_MESSAGES)[keyof typeof ERROR_MESSAGES];
