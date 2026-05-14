-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ArticleCategory" AS ENUM ('Agents', 'LLMs', 'Infra', 'UX', 'Other');

-- CreateEnum
CREATE TYPE "ImpactLevel" AS ENUM ('High', 'Medium', 'Low');

-- CreateEnum
CREATE TYPE "TargetPersona" AS ENUM ('Dev', 'PM', 'Founder');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('rss', 'arxiv', 'github', 'huggingface', 'reddit', 'hn', 'producthunt', 'twitter');

-- CreateEnum
CREATE TYPE "SourceLayer" AS ENUM ('research', 'labs', 'builder', 'community', 'startup', 'distribution');

-- CreateTable
CREATE TABLE "articles" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "what_happened" TEXT NOT NULL,
    "why_it_matters" TEXT NOT NULL,
    "use_case" TEXT NOT NULL,
    "actionable_takeaway" TEXT NOT NULL DEFAULT '',
    "impact_level" "ImpactLevel" NOT NULL DEFAULT 'Medium',
    "target_persona" "TargetPersona" NOT NULL DEFAULT 'Dev',
    "category" "ArticleCategory" NOT NULL,
    "llm_score" INTEGER NOT NULL,
    "final_score" DOUBLE PRECISION NOT NULL,
    "embedding" DOUBLE PRECISION[],
    "cluster_id" TEXT,
    "duplicate_of_id" TEXT,
    "source" TEXT NOT NULL,
    "source_type" "SourceType" NOT NULL DEFAULT 'rss',
    "layer" "SourceLayer" NOT NULL DEFAULT 'distribution',
    "engagement_stars" INTEGER,
    "engagement_upvotes" INTEGER,
    "engagement_comments" INTEGER,
    "url" TEXT NOT NULL,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trend_clusters" (
    "cluster_id" TEXT NOT NULL,
    "category" "ArticleCategory" NOT NULL,
    "centroid" DOUBLE PRECISION[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trend_clusters_pkey" PRIMARY KEY ("cluster_id")
);

-- CreateTable
CREATE TABLE "trends" (
    "id" TEXT NOT NULL,
    "cluster_id" TEXT NOT NULL,
    "category" "ArticleCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "velocity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "article_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trends_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trend_stats" (
    "id" TEXT NOT NULL,
    "trend_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "article_count" INTEGER NOT NULL,

    CONSTRAINT "trend_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "liked_categories" "ArticleCategory"[] DEFAULT ARRAY[]::"ArticleCategory"[],
    "ignored_categories" "ArticleCategory"[] DEFAULT ARRAY[]::"ArticleCategory"[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "newsletter_subscribers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "beehiiv_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "newsletter_subscribers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_health" (
    "id" TEXT NOT NULL,
    "source_name" TEXT NOT NULL,
    "last_run_at" TIMESTAMP(3),
    "last_success_at" TIMESTAMP(3),
    "error_count" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "source_health_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "articles_url_key" ON "articles"("url");

-- CreateIndex
CREATE INDEX "articles_created_at_idx" ON "articles"("created_at");

-- CreateIndex
CREATE INDEX "articles_published_at_idx" ON "articles"("published_at");

-- CreateIndex
CREATE INDEX "articles_category_final_score_idx" ON "articles"("category", "final_score");

-- CreateIndex
CREATE INDEX "articles_cluster_id_idx" ON "articles"("cluster_id");

-- CreateIndex
CREATE INDEX "trend_clusters_category_idx" ON "trend_clusters"("category");

-- CreateIndex
CREATE UNIQUE INDEX "trends_cluster_id_key" ON "trends"("cluster_id");

-- CreateIndex
CREATE INDEX "trends_category_idx" ON "trends"("category");

-- CreateIndex
CREATE INDEX "trends_velocity_idx" ON "trends"("velocity");

-- CreateIndex
CREATE INDEX "trend_stats_date_idx" ON "trend_stats"("date");

-- CreateIndex
CREATE UNIQUE INDEX "trend_stats_trend_id_date_key" ON "trend_stats"("trend_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscribers_email_key" ON "newsletter_subscribers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "source_health_source_name_key" ON "source_health"("source_name");

-- AddForeignKey
ALTER TABLE "trend_stats" ADD CONSTRAINT "trend_stats_trend_id_fkey" FOREIGN KEY ("trend_id") REFERENCES "trends"("id") ON DELETE CASCADE ON UPDATE CASCADE;

