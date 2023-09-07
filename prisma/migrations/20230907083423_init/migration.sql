-- CreateTable
CREATE TABLE "Stage1UserFailed" (
    "username" TEXT NOT NULL,
    "hostedLink" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "grade" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Stage1UserFailed_pkey" PRIMARY KEY ("username")
);

-- CreateIndex
CREATE UNIQUE INDEX "Stage1UserFailed_username_key" ON "Stage1UserFailed"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Stage1UserFailed_email_key" ON "Stage1UserFailed"("email");
