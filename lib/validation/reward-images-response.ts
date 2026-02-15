import { z } from "zod";

export const rewardImageSchema = z.object({
  id: z.number(),
  title: z.string(),
  posterUrl: z.string(),
  moviePosterId: z.number().nullable(),
});

export const rewardImagesSuccessResponseSchema = z.array(rewardImageSchema);

export const rewardImagesErrorResponseSchema = z.object({
  error: z.string(),
});

export type RewardImage = z.infer<typeof rewardImageSchema>;
export type RewardImagesSuccessResponse = z.infer<
  typeof rewardImagesSuccessResponseSchema
>;
export type RewardImagesErrorResponse = z.infer<
  typeof rewardImagesErrorResponseSchema
>;
