-- AlterTable
ALTER TABLE "Stage1User" ADD COLUMN     "grade" INTEGER NOT NULL DEFAULT 0,
ADD CONSTRAINT "Stage1User_pkey" PRIMARY KEY ("username");
