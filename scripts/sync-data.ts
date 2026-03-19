import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 演示数据
const GAMES = [
  {
    name: '原神',
    poster: '/pictures/原神.jpg',
    description: '开放世界冒险游戏',
    playerCount: 1280,
    rooms: [
      { name: '萌新交流群', maxPlayers: 4, online: true },
      { name: '每日委托车队', maxPlayers: 4, online: true },
    ]
  },
  {
    name: '王者荣耀',
    poster: '/pictures/王者荣耀.jpg',
    description: '5v5 公平竞技',
    playerCount: 3450,
    rooms: [
      { name: '王者车队上分', maxPlayers: 5, online: true },
      { name: '娱乐模式开黑', maxPlayers: 5, online: false },
    ]
  },
  {
    name: '无畏契约',
    poster: '/pictures/无畏契约.jpg',
    description: 'tactical shooter',
    playerCount: 890,
    rooms: [
      { name: '排位上分车队', maxPlayers: 5, online: true },
    ]
  },
  {
    name: '战地风云6',
    poster: '/pictures/战地风云6.jpg',
    description: '64v64 大战场',
    playerCount: 560,
    rooms: [
      { name: '征服模式开团', maxPlayers: 10, online: true },
    ]
  },
  {
    name: '三角洲行动',
    poster: '/pictures/三角洲行动.jpg',
    description: '撤离射击竞技',
    playerCount: 2100,
    rooms: [
      { name: '刷金车队', maxPlayers: 4, online: true },
      { name: '新手组队', maxPlayers: 4, online: true },
    ]
  },
  {
    name: 'CS2',
    poster: '/pictures/CSgo2.jpg',
    description: '战术射击竞技',
    playerCount: 1800,
    rooms: [
      { name: '竞技模式上分', maxPlayers: 5, online: true },
      { name: '休闲模式开黑', maxPlayers: 5, online: true },
    ]
  },
  {
    name: '第五人格',
    poster: '/pictures/第五人格.jpg',
    description: '非对称对抗竞技',
    playerCount: 950,
    rooms: [
      { name: '四排开黑', maxPlayers: 4, online: true },
      { name: '萌新求带', maxPlayers: 4, online: false },
    ]
  }
];

const MOCK_PLAYERS: Record<string, any[]> = {
  '原神': [
    { name: '玩家1', avatar: '', online: true, role: '萌新' },
    { name: '玩家2', avatar: '', online: true, role: '老玩家' },
    { name: '玩家3', avatar: '', online: false, role: '养老玩家' },
  ],
  '王者荣耀': [
    { name: '玩家4', avatar: '', online: true, role: '王者' },
    { name: '玩家5', avatar: '', online: true, role: '钻石' },
    { name: '玩家6', avatar: '', online: true, role: '星耀' },
  ],
  '无畏契约': [
    { name: '玩家7', avatar: '', online: true, role: '钻石' },
    { name: '玩家8', avatar: '', online: true, role: '黄金' },
  ],
  '战地风云6': [
    { name: '玩家9', avatar: '', online: true, role: '大兵' },
    { name: '玩家10', avatar: '', online: false, role: '驾驶员' },
  ],
  'CS2': [
    { name: '玩家11', avatar: '', online: true, role: '大地球' },
    { name: '玩家12', avatar: '', online: true, role: '小地球' },
    { name: '玩家13', avatar: '', online: false, role: '白银' },
  ],
  '第五人格': [
    { name: '玩家14', avatar: '', online: true, role: '五阶' },
    { name: '玩家15', avatar: '', online: true, role: '六阶' },
    { name: '玩家16', avatar: '', online: true, role: '四阶' },
  ],
};

async function main() {
  console.log('开始同步演示数据到数据库...');

  // 清空现有数据
  await prisma.player.deleteMany();
  await prisma.room.deleteMany();
  await prisma.game.deleteMany();
  console.log('已清空现有数据');

  // 同步游戏数据
  for (const gameData of GAMES) {
    const game = await prisma.game.create({
      data: {
        name: gameData.name,
        poster: gameData.poster,
        description: gameData.description,
        playerCount: gameData.playerCount,
      }
    });
    console.log(`创建游戏: ${game.name} (ID: ${game.id})`);

    // 创建房间
    for (const roomData of gameData.rooms) {
      const room = await prisma.room.create({
        data: {
          gameId: game.id,
          name: roomData.name,
          maxPlayers: roomData.maxPlayers,
          online: roomData.online,
        }
      });
      console.log(`  创建房间: ${room.name} (ID: ${room.id})`);

      // 创建玩家（将第一个房间的玩家关联到第一个房间）
      const players = MOCK_PLAYERS[game.name] || [];
      for (const playerData of players) {
        const player = await prisma.player.create({
          data: {
            roomId: room.id,
            name: playerData.name,
            avatar: playerData.avatar || '/pictures/avatar.png',
            online: playerData.online,
            role: playerData.role,
          }
        });
        console.log(`    创建玩家: ${player.name}`);
      }
    }
  }

  console.log('数据同步完成！');
}

main()
  .catch((e) => {
    console.error('同步失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
