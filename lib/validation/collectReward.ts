import { z } from "zod";

export const collectRewardSchema = z.object({
  movie_poster_id: z.number().int().positive({
    message: "movie_poster_idは正の整数である必要があります",
  }),
});

export type CollectRewardInput = z.infer<typeof collectRewardSchema>;
