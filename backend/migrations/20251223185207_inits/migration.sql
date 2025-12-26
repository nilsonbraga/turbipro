-- AlterTable
ALTER TABLE "CustomItinerary" ALTER COLUMN "publicToken" SET DEFAULT encode(gen_random_bytes(16), 'hex');

-- AlterTable
ALTER TABLE "ExpeditionGroup" ALTER COLUMN "publicToken" SET DEFAULT encode(gen_random_bytes(16), 'hex');

-- AlterTable
ALTER TABLE "PublicProposalLink" ALTER COLUMN "token" SET DEFAULT encode(gen_random_bytes(32), 'hex');

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "agencyId" UUID,
    "newLead" BOOLEAN NOT NULL DEFAULT true,
    "proposalClosed" BOOLEAN NOT NULL DEFAULT true,
    "followUpReminder" BOOLEAN NOT NULL DEFAULT true,
    "weeklyReport" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsappConversation" (
    "id" UUID NOT NULL,
    "agencyId" UUID NOT NULL,
    "waContactId" TEXT NOT NULL,
    "contactName" TEXT,
    "contactPhone" TEXT NOT NULL,
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "lastMessageAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "WhatsappConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsappMessage" (
    "id" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "agencyId" UUID NOT NULL,
    "direction" TEXT NOT NULL,
    "messageType" TEXT NOT NULL DEFAULT 'text',
    "content" TEXT,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "sentAt" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsappMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE INDEX "NotificationPreference_agencyId_idx" ON "NotificationPreference"("agencyId");

-- CreateIndex
CREATE INDEX "WhatsappConversation_agencyId_idx" ON "WhatsappConversation"("agencyId");

-- CreateIndex
CREATE INDEX "WhatsappConversation_waContactId_idx" ON "WhatsappConversation"("waContactId");

-- CreateIndex
CREATE INDEX "WhatsappMessage_conversationId_idx" ON "WhatsappMessage"("conversationId");

-- CreateIndex
CREATE INDEX "WhatsappMessage_agencyId_idx" ON "WhatsappMessage"("agencyId");

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappConversation" ADD CONSTRAINT "WhatsappConversation_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappMessage" ADD CONSTRAINT "WhatsappMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "WhatsappConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappMessage" ADD CONSTRAINT "WhatsappMessage_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
