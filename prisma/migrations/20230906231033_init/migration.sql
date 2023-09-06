/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "Stage1User" (
    "username" TEXT NOT NULL,
    "hostedLink" TEXT NOT NULL,
    "email" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Stage1User_username_key" ON "Stage1User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Stage1User_email_key" ON "Stage1User"("email");
