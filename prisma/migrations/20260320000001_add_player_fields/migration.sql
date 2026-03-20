-- AlterTable
ALTER TABLE "chat_messages" ADD COLUMN "player_name" TEXT,
ALTER TABLE "chat_messages" ADD COLUMN "player_avatar" TEXT,
ALTER TABLE "chat_messages" ALTER COLUMN "user_id" DROP NOT NULL;
