-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(150) NOT NULL,
    "password" VARCHAR(128) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_users" (
    "id" TEXT NOT NULL,
    "username" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guest_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movie_posters" (
    "id" SERIAL NOT NULL,
    "tmdb_id" VARCHAR(255) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "poster_url" VARCHAR(200) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "movie_posters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reward_images" (
    "id" SERIAL NOT NULL,
    "tmdb_id" VARCHAR(255) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "poster_url" TEXT NOT NULL,
    "movie_poster_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reward_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collected_rewards" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "movie_poster_id" INTEGER NOT NULL,
    "collected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collected_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "guest_users_username_key" ON "guest_users"("username");

-- CreateIndex
CREATE INDEX "guest_users_username_idx" ON "guest_users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "movie_posters_tmdb_id_key" ON "movie_posters"("tmdb_id");

-- CreateIndex
CREATE UNIQUE INDEX "reward_images_tmdb_id_key" ON "reward_images"("tmdb_id");

-- CreateIndex
CREATE INDEX "collected_rewards_user_id_idx" ON "collected_rewards"("user_id");

-- CreateIndex
CREATE INDEX "collected_rewards_movie_poster_id_idx" ON "collected_rewards"("movie_poster_id");

-- AddForeignKey
ALTER TABLE "collected_rewards" ADD CONSTRAINT "collected_rewards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collected_rewards" ADD CONSTRAINT "collected_rewards_movie_poster_id_fkey" FOREIGN KEY ("movie_poster_id") REFERENCES "movie_posters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
