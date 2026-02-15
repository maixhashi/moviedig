import { z } from "zod";

export const currentUserSuccessResponseSchema = z.object({
  id: z.number(),
  username: z.string(),
  created_at: z.string().or(z.date()),
});

export const currentUserErrorResponseSchema = z.object({
  error: z.string(),
});

export type CurrentUserSuccessResponse = z.infer<
  typeof currentUserSuccessResponseSchema
>;
export type CurrentUserErrorResponse = z.infer<
  typeof currentUserErrorResponseSchema
>;
