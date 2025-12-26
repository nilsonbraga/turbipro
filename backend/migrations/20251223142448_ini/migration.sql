CREATE TYPE "AppRole" AS ENUM ('super_admin', 'admin', 'agent');

-- Ensure required extension for random bytes/uuid
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "CollaboratorLevel" AS ENUM ('junior', 'pleno', 'senior');

-- CreateEnum
CREATE TYPE "CommissionBase" AS ENUM ('sale_value', 'profit');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('clt', 'pj', 'freela');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agency" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "cnpj" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "logoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Agency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" UUID NOT NULL,
    "agencyId" UUID,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "AppRole" NOT NULL DEFAULT 'agent',

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" UUID NOT NULL,
    "agencyId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "cpf" TEXT,
    "passport" TEXT,
    "birthDate" DATE,
    "address" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PipelineStage" (
    "id" UUID NOT NULL,
    "agencyId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "order" INTEGER NOT NULL DEFAULT 0,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "isLost" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PipelineStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proposal" (
    "id" UUID NOT NULL,
    "agencyId" UUID NOT NULL,
    "clientId" UUID,
    "userId" UUID,
    "assignedCollaboratorId" UUID,
    "stageId" UUID,
    "number" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "totalValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "commissionType" TEXT NOT NULL DEFAULT 'percentage',
    "commissionValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposalService" (
    "id" UUID NOT NULL,
    "proposalId" UUID NOT NULL,
    "partnerId" UUID,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "origin" TEXT,
    "destination" TEXT,
    "startDate" TIMESTAMPTZ(6),
    "endDate" TIMESTAMPTZ(6),
    "value" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "cost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "commissionType" TEXT NOT NULL DEFAULT 'percentage',
    "commissionValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "details" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProposalService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partner" (
    "id" UUID NOT NULL,
    "agencyId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "commissionRate" DECIMAL(12,2),
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" UUID NOT NULL,
    "agencyId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposalTag" (
    "proposalId" UUID NOT NULL,
    "tagId" UUID NOT NULL,

    CONSTRAINT "ProposalTag_pkey" PRIMARY KEY ("proposalId","tagId")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" UUID NOT NULL,
    "agencyId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collaborator" (
    "id" UUID NOT NULL,
    "agencyId" UUID NOT NULL,
    "userId" UUID,
    "teamId" UUID,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "cpf" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "employmentType" "EmploymentType" NOT NULL DEFAULT 'clt',
    "position" TEXT,
    "level" "CollaboratorLevel",
    "commissionPercentage" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "commissionBase" "CommissionBase" NOT NULL DEFAULT 'sale_value',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Collaborator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollaboratorGoal" (
    "id" UUID NOT NULL,
    "agencyId" UUID NOT NULL,
    "collaboratorId" UUID NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "targetSalesValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "targetProfit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "targetDealsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "CollaboratorGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollaboratorCommission" (
    "id" UUID NOT NULL,
    "agencyId" UUID NOT NULL,
    "collaboratorId" UUID NOT NULL,
    "proposalId" UUID NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "saleValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "profitValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "commissionPercentage" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "commissionBase" "CommissionBase" NOT NULL DEFAULT 'sale_value',
    "commissionAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollaboratorCommission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftType" (
    "id" UUID NOT NULL,
    "agencyId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT DEFAULT '#3B82F6',
    "startTime" TIME(0) NOT NULL,
    "endTime" TIME(0) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ShiftType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollaboratorSchedule" (
    "id" UUID NOT NULL,
    "agencyId" UUID NOT NULL,
    "collaboratorId" UUID NOT NULL,
    "shiftTypeId" UUID,
    "scheduleDate" DATE NOT NULL,
    "startTime" TIME(0),
    "endTime" TIME(0),
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "CollaboratorSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollaboratorTimeOff" (
    "id" UUID NOT NULL,
    "agencyId" UUID NOT NULL,
    "collaboratorId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'approved',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "CollaboratorTimeOff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskColumn" (
    "id" UUID NOT NULL,
    "agencyId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "order" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "TaskColumn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" UUID NOT NULL,
    "agencyId" UUID NOT NULL,
    "columnId" UUID NOT NULL,
    "proposalId" UUID,
    "clientId" UUID,
    "createdById" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpeditionGroup" (
    "id" UUID NOT NULL,
    "agencyId" UUID NOT NULL,
    "destination" TEXT NOT NULL,
    "description" TEXT,
    "startDate" DATE NOT NULL,
    "durationDays" INTEGER NOT NULL DEFAULT 1,
    "maxParticipants" INTEGER NOT NULL DEFAULT 10,
    "priceCash" DECIMAL(12,2),
    "priceInstallment" DECIMAL(12,2),
    "installmentsCount" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "coverImageUrl" TEXT,
    "carouselImages" TEXT[],
    "landingText" TEXT,
    "includedItems" TEXT[],
    "excludedItems" TEXT[],
    "testimonials" JSONB NOT NULL DEFAULT '[]',
    "faqs" JSONB NOT NULL DEFAULT '[]',
    "googleReviewsUrl" TEXT,
    "youtubeVideoUrl" TEXT,
    "showDatePreference" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "publicToken" TEXT NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ExpeditionGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpeditionRegistration" (
    "id" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "datePreference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "isWaitlist" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpeditionRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomItinerary" (
    "id" UUID NOT NULL,
    "agencyId" UUID NOT NULL,
    "clientId" UUID,
    "createdById" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "destination" TEXT,
    "coverImageUrl" TEXT,
    "startDate" DATE,
    "endDate" DATE,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "requiresToken" BOOLEAN NOT NULL DEFAULT false,
    "accessToken" TEXT,
    "publicToken" TEXT NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
    "approvedAt" TIMESTAMPTZ(6),
    "approvedBy" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "CustomItinerary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItineraryDay" (
    "id" UUID NOT NULL,
    "itineraryId" UUID NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "date" DATE,
    "title" TEXT,
    "description" TEXT,
    "location" TEXT,
    "coverImageUrl" TEXT,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ItineraryDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItineraryItem" (
    "id" UUID NOT NULL,
    "dayId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "address" TEXT,
    "startTime" TIME(0),
    "endTime" TIME(0),
    "price" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "confirmationNumber" TEXT,
    "bookingReference" TEXT,
    "images" TEXT[],
    "details" JSONB NOT NULL DEFAULT '{}',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ItineraryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItineraryDayFeedback" (
    "id" UUID NOT NULL,
    "dayId" UUID NOT NULL,
    "isApproved" BOOLEAN,
    "observation" TEXT,
    "clientName" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ItineraryDayFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItineraryItemFeedback" (
    "id" UUID NOT NULL,
    "itemId" UUID NOT NULL,
    "isApproved" BOOLEAN,
    "observation" TEXT,
    "clientName" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ItineraryItemFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialTransaction" (
    "id" UUID NOT NULL,
    "agencyId" UUID NOT NULL,
    "proposalId" UUID,
    "clientId" UUID,
    "supplierId" UUID,
    "createdById" UUID,
    "type" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT NOT NULL,
    "totalValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "profitValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "installments" INTEGER NOT NULL DEFAULT 1,
    "currentInstallment" INTEGER NOT NULL DEFAULT 1,
    "launchDate" DATE NOT NULL DEFAULT CURRENT_DATE,
    "dueDate" DATE,
    "paymentDate" DATE,
    "paymentMethod" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "documentName" TEXT,
    "documentNumber" TEXT,
    "details" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "FinancialTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" UUID NOT NULL,
    "agencyId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "cnpj" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceMonthly" DECIMAL(12,2),
    "priceYearly" DECIMAL(12,2),
    "maxUsers" INTEGER,
    "maxClients" INTEGER,
    "maxProposals" INTEGER,
    "modules" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "stripePriceIdMonthly" TEXT,
    "stripePriceIdYearly" TEXT,
    "trialDays" INTEGER NOT NULL DEFAULT 7,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgencySubscription" (
    "id" UUID NOT NULL,
    "agencyId" UUID NOT NULL,
    "planId" UUID,
    "couponId" UUID,
    "billingCycle" TEXT NOT NULL DEFAULT 'monthly',
    "status" TEXT NOT NULL DEFAULT 'active',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "currentPeriodStart" TIMESTAMPTZ(6),
    "currentPeriodEnd" TIMESTAMPTZ(6),
    "gracePeriodDays" INTEGER NOT NULL DEFAULT 7,
    "discountApplied" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "AgencySubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscountCoupon" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "discountType" TEXT NOT NULL DEFAULT 'percentage',
    "discountValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "maxUses" INTEGER,
    "currentUses" INTEGER NOT NULL DEFAULT 0,
    "validFrom" TIMESTAMPTZ(6),
    "validUntil" TIMESTAMPTZ(6),
    "applicablePlans" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "DiscountCoupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformSetting" (
    "id" UUID NOT NULL,
    "settingKey" TEXT NOT NULL,
    "settingValue" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PlatformSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudioTemplate" (
    "id" UUID NOT NULL,
    "agencyId" UUID NOT NULL,
    "createdById" UUID,
    "templateId" INTEGER NOT NULL,
    "formatId" TEXT NOT NULL,
    "artTypeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "colors" JSONB NOT NULL DEFAULT '{}',
    "icons" JSONB,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "logoUrl" TEXT,
    "blurLevel" INTEGER NOT NULL DEFAULT 24,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "StudioTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicProposalLink" (
    "id" UUID NOT NULL,
    "proposalId" UUID NOT NULL,
    "token" TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicProposalLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposalHistory" (
    "id" UUID NOT NULL,
    "proposalId" UUID NOT NULL,
    "userId" UUID,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProposalHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposalImage" (
    "id" UUID NOT NULL,
    "proposalId" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProposalImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgencyResendConfig" (
    "id" UUID NOT NULL,
    "agencyId" UUID NOT NULL,
    "apiKeyEncrypted" TEXT,
    "fromEmail" TEXT,
    "fromName" TEXT,
    "isConfigured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "AgencyResendConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgencySmtpConfig" (
    "id" UUID NOT NULL,
    "agencyId" UUID NOT NULL,
    "smtpHost" TEXT,
    "smtpPort" INTEGER NOT NULL DEFAULT 587,
    "smtpUser" TEXT,
    "smtpPassEncrypted" TEXT,
    "smtpFromEmail" TEXT,
    "smtpFromName" TEXT,
    "isConfigured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "AgencySmtpConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgencyWhatsappConfig" (
    "id" UUID NOT NULL,
    "agencyId" UUID NOT NULL,
    "phoneNumberId" TEXT,
    "accessToken" TEXT,
    "businessAccountId" TEXT,
    "webhookVerifyToken" TEXT,
    "isConfigured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "AgencyWhatsappConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgencyEmailOauth" (
    "id" UUID NOT NULL,
    "agencyId" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMPTZ(6),
    "emailAddress" TEXT,
    "isConfigured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgencyEmailOauth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgencyEmail" (
    "id" UUID NOT NULL,
    "agencyId" UUID NOT NULL,
    "userId" UUID,
    "provider" TEXT NOT NULL DEFAULT 'smtp',
    "messageId" TEXT,
    "threadId" TEXT,
    "fromEmail" TEXT NOT NULL,
    "fromName" TEXT,
    "toEmails" TEXT[],
    "ccEmails" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bccEmails" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "subject" TEXT NOT NULL,
    "bodyText" TEXT,
    "bodyHtml" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isStarred" BOOLEAN NOT NULL DEFAULT false,
    "isSent" BOOLEAN NOT NULL DEFAULT false,
    "folder" TEXT NOT NULL DEFAULT 'inbox',
    "sentAt" TIMESTAMPTZ(6),
    "receivedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "AgencyEmail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Agency_isActive_idx" ON "Agency"("isActive");

-- CreateIndex
CREATE INDEX "Profile_agencyId_idx" ON "Profile"("agencyId");

-- CreateIndex
CREATE INDEX "Profile_email_idx" ON "Profile"("email");

-- CreateIndex
CREATE INDEX "UserRole_role_idx" ON "UserRole"("role");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_role_key" ON "UserRole"("userId", "role");

-- CreateIndex
CREATE INDEX "Client_agencyId_idx" ON "Client"("agencyId");

-- CreateIndex
CREATE INDEX "Client_cpf_idx" ON "Client"("cpf");

-- CreateIndex
CREATE INDEX "Client_email_idx" ON "Client"("email");

-- CreateIndex
CREATE INDEX "PipelineStage_agencyId_idx" ON "PipelineStage"("agencyId");

-- CreateIndex
CREATE UNIQUE INDEX "PipelineStage_agencyId_order_key" ON "PipelineStage"("agencyId", "order");

-- CreateIndex
CREATE INDEX "Proposal_agencyId_idx" ON "Proposal"("agencyId");

-- CreateIndex
CREATE INDEX "Proposal_clientId_idx" ON "Proposal"("clientId");

-- CreateIndex
CREATE INDEX "Proposal_stageId_idx" ON "Proposal"("stageId");

-- CreateIndex
CREATE INDEX "Proposal_userId_idx" ON "Proposal"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Proposal_agencyId_number_key" ON "Proposal"("agencyId", "number");

-- CreateIndex
CREATE INDEX "ProposalService_proposalId_idx" ON "ProposalService"("proposalId");

-- CreateIndex
CREATE INDEX "ProposalService_partnerId_idx" ON "ProposalService"("partnerId");

-- CreateIndex
CREATE INDEX "Partner_agencyId_idx" ON "Partner"("agencyId");

-- CreateIndex
CREATE INDEX "Partner_name_idx" ON "Partner"("name");

-- CreateIndex
CREATE INDEX "Tag_agencyId_idx" ON "Tag"("agencyId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_agencyId_name_key" ON "Tag"("agencyId", "name");

-- CreateIndex
CREATE INDEX "ProposalTag_tagId_idx" ON "ProposalTag"("tagId");

-- CreateIndex
CREATE INDEX "Team_agencyId_idx" ON "Team"("agencyId");

-- CreateIndex
CREATE UNIQUE INDEX "Team_agencyId_name_key" ON "Team"("agencyId", "name");

-- CreateIndex
CREATE INDEX "Collaborator_agencyId_idx" ON "Collaborator"("agencyId");

-- CreateIndex
CREATE INDEX "Collaborator_teamId_idx" ON "Collaborator"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "Collaborator_agencyId_userId_key" ON "Collaborator"("agencyId", "userId");

-- CreateIndex
CREATE INDEX "CollaboratorGoal_agencyId_idx" ON "CollaboratorGoal"("agencyId");

-- CreateIndex
CREATE UNIQUE INDEX "CollaboratorGoal_collaboratorId_month_year_key" ON "CollaboratorGoal"("collaboratorId", "month", "year");

-- CreateIndex
CREATE INDEX "CollaboratorCommission_agencyId_idx" ON "CollaboratorCommission"("agencyId");

-- CreateIndex
CREATE UNIQUE INDEX "CollaboratorCommission_collaboratorId_proposalId_periodMont_key" ON "CollaboratorCommission"("collaboratorId", "proposalId", "periodMonth", "periodYear");

-- CreateIndex
CREATE INDEX "ShiftType_agencyId_idx" ON "ShiftType"("agencyId");

-- CreateIndex
CREATE INDEX "CollaboratorSchedule_agencyId_idx" ON "CollaboratorSchedule"("agencyId");

-- CreateIndex
CREATE INDEX "CollaboratorSchedule_collaboratorId_idx" ON "CollaboratorSchedule"("collaboratorId");

-- CreateIndex
CREATE UNIQUE INDEX "CollaboratorSchedule_collaboratorId_scheduleDate_key" ON "CollaboratorSchedule"("collaboratorId", "scheduleDate");

-- CreateIndex
CREATE INDEX "CollaboratorTimeOff_agencyId_idx" ON "CollaboratorTimeOff"("agencyId");

-- CreateIndex
CREATE INDEX "CollaboratorTimeOff_collaboratorId_idx" ON "CollaboratorTimeOff"("collaboratorId");

-- CreateIndex
CREATE INDEX "TaskColumn_agencyId_idx" ON "TaskColumn"("agencyId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskColumn_agencyId_order_key" ON "TaskColumn"("agencyId", "order");

-- CreateIndex
CREATE INDEX "Task_agencyId_idx" ON "Task"("agencyId");

-- CreateIndex
CREATE INDEX "Task_columnId_idx" ON "Task"("columnId");

-- CreateIndex
CREATE INDEX "Task_proposalId_idx" ON "Task"("proposalId");

-- CreateIndex
CREATE INDEX "Task_clientId_idx" ON "Task"("clientId");

-- CreateIndex
CREATE INDEX "Task_createdById_idx" ON "Task"("createdById");

-- CreateIndex
CREATE INDEX "ExpeditionGroup_agencyId_idx" ON "ExpeditionGroup"("agencyId");

-- CreateIndex
CREATE INDEX "ExpeditionGroup_isActive_idx" ON "ExpeditionGroup"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ExpeditionGroup_publicToken_key" ON "ExpeditionGroup"("publicToken");

-- CreateIndex
CREATE INDEX "ExpeditionRegistration_groupId_idx" ON "ExpeditionRegistration"("groupId");

-- CreateIndex
CREATE INDEX "ExpeditionRegistration_email_idx" ON "ExpeditionRegistration"("email");

-- CreateIndex
CREATE INDEX "CustomItinerary_agencyId_idx" ON "CustomItinerary"("agencyId");

-- CreateIndex
CREATE INDEX "CustomItinerary_clientId_idx" ON "CustomItinerary"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomItinerary_publicToken_key" ON "CustomItinerary"("publicToken");

-- CreateIndex
CREATE INDEX "ItineraryDay_itineraryId_idx" ON "ItineraryDay"("itineraryId");

-- CreateIndex
CREATE UNIQUE INDEX "ItineraryDay_itineraryId_dayNumber_key" ON "ItineraryDay"("itineraryId", "dayNumber");

-- CreateIndex
CREATE INDEX "ItineraryItem_dayId_idx" ON "ItineraryItem"("dayId");

-- CreateIndex
CREATE INDEX "ItineraryDayFeedback_dayId_idx" ON "ItineraryDayFeedback"("dayId");

-- CreateIndex
CREATE INDEX "ItineraryItemFeedback_itemId_idx" ON "ItineraryItemFeedback"("itemId");

-- CreateIndex
CREATE INDEX "FinancialTransaction_agencyId_idx" ON "FinancialTransaction"("agencyId");

-- CreateIndex
CREATE INDEX "FinancialTransaction_proposalId_idx" ON "FinancialTransaction"("proposalId");

-- CreateIndex
CREATE INDEX "FinancialTransaction_clientId_idx" ON "FinancialTransaction"("clientId");

-- CreateIndex
CREATE INDEX "FinancialTransaction_supplierId_idx" ON "FinancialTransaction"("supplierId");

-- CreateIndex
CREATE INDEX "FinancialTransaction_status_idx" ON "FinancialTransaction"("status");

-- CreateIndex
CREATE INDEX "Supplier_agencyId_idx" ON "Supplier"("agencyId");

-- CreateIndex
CREATE INDEX "Supplier_isActive_idx" ON "Supplier"("isActive");

-- CreateIndex
CREATE INDEX "SubscriptionPlan_isActive_idx" ON "SubscriptionPlan"("isActive");

-- CreateIndex
CREATE INDEX "AgencySubscription_status_idx" ON "AgencySubscription"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AgencySubscription_agencyId_key" ON "AgencySubscription"("agencyId");

-- CreateIndex
CREATE UNIQUE INDEX "DiscountCoupon_code_key" ON "DiscountCoupon"("code");

-- CreateIndex
CREATE INDEX "DiscountCoupon_isActive_idx" ON "DiscountCoupon"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformSetting_settingKey_key" ON "PlatformSetting"("settingKey");

-- CreateIndex
CREATE INDEX "StudioTemplate_agencyId_idx" ON "StudioTemplate"("agencyId");

-- CreateIndex
CREATE INDEX "StudioTemplate_createdById_idx" ON "StudioTemplate"("createdById");

-- CreateIndex
CREATE INDEX "PublicProposalLink_proposalId_idx" ON "PublicProposalLink"("proposalId");

-- CreateIndex
CREATE UNIQUE INDEX "PublicProposalLink_token_key" ON "PublicProposalLink"("token");

-- CreateIndex
CREATE INDEX "ProposalHistory_proposalId_idx" ON "ProposalHistory"("proposalId");

-- CreateIndex
CREATE INDEX "ProposalHistory_userId_idx" ON "ProposalHistory"("userId");

-- CreateIndex
CREATE INDEX "ProposalImage_proposalId_idx" ON "ProposalImage"("proposalId");

-- CreateIndex
CREATE UNIQUE INDEX "AgencyResendConfig_agencyId_key" ON "AgencyResendConfig"("agencyId");

-- CreateIndex
CREATE UNIQUE INDEX "AgencySmtpConfig_agencyId_key" ON "AgencySmtpConfig"("agencyId");

-- CreateIndex
CREATE UNIQUE INDEX "AgencyWhatsappConfig_agencyId_key" ON "AgencyWhatsappConfig"("agencyId");

-- CreateIndex
CREATE INDEX "AgencyEmailOauth_agencyId_idx" ON "AgencyEmailOauth"("agencyId");

-- CreateIndex
CREATE INDEX "AgencyEmailOauth_provider_idx" ON "AgencyEmailOauth"("provider");

-- CreateIndex
CREATE INDEX "AgencyEmail_agencyId_idx" ON "AgencyEmail"("agencyId");

-- CreateIndex
CREATE INDEX "AgencyEmail_userId_idx" ON "AgencyEmail"("userId");

-- CreateIndex
CREATE INDEX "AgencyEmail_folder_idx" ON "AgencyEmail"("folder");

-- CreateIndex
CREATE INDEX "AgencyEmail_isRead_idx" ON "AgencyEmail"("isRead");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_id_fkey" FOREIGN KEY ("id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineStage" ADD CONSTRAINT "PipelineStage_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_assignedCollaboratorId_fkey" FOREIGN KEY ("assignedCollaboratorId") REFERENCES "Collaborator"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "PipelineStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalService" ADD CONSTRAINT "ProposalService_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalService" ADD CONSTRAINT "ProposalService_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partner" ADD CONSTRAINT "Partner_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalTag" ADD CONSTRAINT "ProposalTag_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalTag" ADD CONSTRAINT "ProposalTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collaborator" ADD CONSTRAINT "Collaborator_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collaborator" ADD CONSTRAINT "Collaborator_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollaboratorGoal" ADD CONSTRAINT "CollaboratorGoal_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollaboratorGoal" ADD CONSTRAINT "CollaboratorGoal_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "Collaborator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollaboratorCommission" ADD CONSTRAINT "CollaboratorCommission_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollaboratorCommission" ADD CONSTRAINT "CollaboratorCommission_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "Collaborator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollaboratorCommission" ADD CONSTRAINT "CollaboratorCommission_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftType" ADD CONSTRAINT "ShiftType_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollaboratorSchedule" ADD CONSTRAINT "CollaboratorSchedule_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollaboratorSchedule" ADD CONSTRAINT "CollaboratorSchedule_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "Collaborator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollaboratorSchedule" ADD CONSTRAINT "CollaboratorSchedule_shiftTypeId_fkey" FOREIGN KEY ("shiftTypeId") REFERENCES "ShiftType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollaboratorTimeOff" ADD CONSTRAINT "CollaboratorTimeOff_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollaboratorTimeOff" ADD CONSTRAINT "CollaboratorTimeOff_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "Collaborator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskColumn" ADD CONSTRAINT "TaskColumn_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "TaskColumn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpeditionGroup" ADD CONSTRAINT "ExpeditionGroup_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpeditionRegistration" ADD CONSTRAINT "ExpeditionRegistration_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ExpeditionGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomItinerary" ADD CONSTRAINT "CustomItinerary_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomItinerary" ADD CONSTRAINT "CustomItinerary_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomItinerary" ADD CONSTRAINT "CustomItinerary_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItineraryDay" ADD CONSTRAINT "ItineraryDay_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "CustomItinerary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItineraryItem" ADD CONSTRAINT "ItineraryItem_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "ItineraryDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItineraryDayFeedback" ADD CONSTRAINT "ItineraryDayFeedback_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "ItineraryDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItineraryItemFeedback" ADD CONSTRAINT "ItineraryItemFeedback_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ItineraryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencySubscription" ADD CONSTRAINT "AgencySubscription_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencySubscription" ADD CONSTRAINT "AgencySubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencySubscription" ADD CONSTRAINT "AgencySubscription_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "DiscountCoupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioTemplate" ADD CONSTRAINT "StudioTemplate_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioTemplate" ADD CONSTRAINT "StudioTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicProposalLink" ADD CONSTRAINT "PublicProposalLink_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalHistory" ADD CONSTRAINT "ProposalHistory_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalHistory" ADD CONSTRAINT "ProposalHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalImage" ADD CONSTRAINT "ProposalImage_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyResendConfig" ADD CONSTRAINT "AgencyResendConfig_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencySmtpConfig" ADD CONSTRAINT "AgencySmtpConfig_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyWhatsappConfig" ADD CONSTRAINT "AgencyWhatsappConfig_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyEmailOauth" ADD CONSTRAINT "AgencyEmailOauth_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyEmail" ADD CONSTRAINT "AgencyEmail_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyEmail" ADD CONSTRAINT "AgencyEmail_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
