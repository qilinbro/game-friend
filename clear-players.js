const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function clearPlayers() {
  const result = await prisma.player.deleteMany({});
  console.log('已清除', result.count, '个测试玩家数据');
  await prisma.disconnect();
}

clearPlayers().catch(console.error);
