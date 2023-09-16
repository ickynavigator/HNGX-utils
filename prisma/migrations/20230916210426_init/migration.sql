-- CreateTable
CREATE TABLE "SavingGrace3" (
    "username" TEXT NOT NULL,
    "friends" TEXT[],

    CONSTRAINT "SavingGrace3_pkey" PRIMARY KEY ("username")
);

-- CreateIndex
CREATE UNIQUE INDEX "SavingGrace3_username_key" ON "SavingGrace3"("username");
