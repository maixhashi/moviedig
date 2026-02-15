import { z } from "zod";

export const moviePosterSchema = z.object({
  id: z.number(),
  tmdbId: z.string(),
  title: z.string(),
  posterUrl: z.string(),
});

export const rewardImageSchema = z.object({
  id: z.number(),
  tmdbId: z.string(),
  title: z.string(),
  posterUrl: z.string(),
  moviePosterId: z.number(),
});

export const collectedRewardItemSchema = z.object({
  id: z.number(),
  collectedAt: z.string(),
  moviePoster: moviePosterSchema,
  rewardImage: rewardImageSchema.nullable(),
});

export const collectedRewardsSuccessResponseSchema = z.array(
  collectedRewardItemSchema
);

export const collectedRewardsErrorResponseSchema = z.object({
  error: z.string(),
});

export type MoviePoster = z.infer<typeof moviePosterSchema>;
export type RewardImage = z.infer<typeof rewardImageSchema>;
export type CollectedRewardItem = z.infer<typeof collectedRewardItemSchema>;
export type CollectedRewardsSuccessResponse = z.infer<
  typeof collectedRewardsSuccessResponseSchema
>;
export type CollectedRewardsErrorResponse = z.infer<
  typeof collectedRewardsErrorResponseSchema
>;
