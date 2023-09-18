-- CreateTable
CREATE TABLE "General" (
    "username" TEXT NOT NULL,

    CONSTRAINT "General_pkey" PRIMARY KEY ("username")
);

-- CreateTable
CREATE TABLE "SavingGrace3Counted" (
    "username" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SavingGrace3Counted_pkey" PRIMARY KEY ("username")
);

-- CreateIndex
CREATE UNIQUE INDEX "General_username_key" ON "General"("username");

-- CreateIndex
CREATE UNIQUE INDEX "SavingGrace3Counted_username_key" ON "SavingGrace3Counted"("username");
