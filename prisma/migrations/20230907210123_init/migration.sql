-- CreateTable
CREATE TABLE "Stage1Pending" (
    "username" TEXT NOT NULL,
    "hostedLink" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "Stage1Pending_pkey" PRIMARY KEY ("email")
);

-- CreateIndex
CREATE UNIQUE INDEX "Stage1Pending_email_key" ON "Stage1Pending"("email");
