const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function checkPlayers() {
  const players = await prisma.player.findMany();
  console.log('总玩家数:', players.length);
  console.log('在线玩家数:', players.filter(p => p.online).length);
  console.log('离线玩家数:', players.filter(p => !p.online).length);
  console.log('\n玩家列表:');
  players.forEach(p => {
    console.log(`- ${p.name} (online: ${p.online})`);
  });
  await prisma.disconnect();
}

checkPlayers().catch(console.error);
