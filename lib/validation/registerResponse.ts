import { z } from "zod";

export const registerSuccessResponseSchema = z.object({
  message: z.string(),
  user: z.object({
    id: z.number(),
    username: z.string(),
    createdAt: z.string().or(z.date()),
  }),
});

export const registerErrorResponseSchema = z.object({
  error: z.string(),
  details: z
    .array(
      z.object({
        field: z.string(),
        message: z.string(),
      })
    )
    .optional(),
});

export type RegisterSuccessResponse = z.infer<
  typeof registerSuccessResponseSchema
>;
export type RegisterErrorResponse = z.infer<typeof registerErrorResponseSchema>;
