-- CreateTable
CREATE TABLE "Stage2Pending" (
    "username" TEXT NOT NULL,
    "hostedLink" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Stage2Pending_pkey" PRIMARY KEY ("email")
);

-- CreateTable
CREATE TABLE "Stage2User" (
    "username" TEXT NOT NULL,
    "hostedLink" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "grade" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "promoted" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "Stage2UserFailed" (
    "username" TEXT NOT NULL,
    "hostedLink" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "grade" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Stage2Pending_email_key" ON "Stage2Pending"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Stage2User_email_key" ON "Stage2User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Stage2UserFailed_email_key" ON "Stage2UserFailed"("email");
