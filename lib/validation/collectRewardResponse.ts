import { z } from "zod";

export const collectRewardSuccessResponseSchema = z.object({
  message: z.string(),
});

export const collectRewardErrorResponseSchema = z.object({
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

export type CollectRewardSuccessResponse = z.infer<
  typeof collectRewardSuccessResponseSchema
>;

export type CollectRewardErrorResponse = z.infer<
  typeof collectRewardErrorResponseSchema
>;
