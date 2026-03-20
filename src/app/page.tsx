'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// 游戏数据类型定义
interface Game {
  id: string;
  name: string;
  poster: string;
  description: string;
  playerCount: number;
  rooms: Room[];
}

// 常驻房间数据
const PERMANENT_ROOMS: Room[] = [
  {
    id: 'perm-ysyx-1',
    gameId: 'game-ysyx',
    name: '原神·冒险者聊天室',
    maxPlayers: 10,
    online: true,
    players: [],
    gameName: '原神',
    gamePoster: '/pictures/原神.jpg'
  },
  {
    id: 'perm-ysyx-2',
    gameId: 'game-ysyx',
    name: '原神·深渊挑战组',
    maxPlayers: 4,
    online: true,
    players: [],
    gameName: '原神',
    gamePoster: '/pictures/原神.jpg'
  },
  {
    id: 'perm-wzqy-1',
    gameId: 'game-wzqy',
    name: '无畏契约·竞技场',
    maxPlayers: 5,
    online: true,
    players: [],
    gameName: '无畏契约',
    gamePoster: '/pictures/无畏契约.jpg'
  },
  {
    id: 'perm-wzqy-2',
    gameId: 'game-wzqy',
    name: '无畏契约·新手房',
    maxPlayers: 5,
    online: true,
    players: [],
    gameName: '无畏契约',
    gamePoster: '/pictures/无畏契约.jpg'
  },
  {
    id: 'perm-wzyy-1',
    gameId: 'game-wzyy',
    name: '王者荣耀·排位组队',
    maxPlayers: 5,
    online: true,
    players: [],
    gameName: '王者荣耀',
    gamePoster: '/pictures/王者荣耀.jpg'
  },
  {
    id: 'perm-wzyy-2',
    gameId: 'game-wzyy',
    name: '王者荣耀·娱乐休闲',
    maxPlayers: 5,
    online: true,
    players: [],
    gameName: '王者荣耀',
    gamePoster: '/pictures/王者荣耀.jpg'
  },
  {
    id: 'perm-dxhy-1',
    gameId: 'game-dxhy',
    name: '三角洲行动·战队训练',
    maxPlayers: 8,
    online: true,
    players: [],
    gameName: '三角洲行动',
    gamePoster: '/pictures/三角洲行动.jpg'
  },
  {
    id: 'perm-jyry-1',
    gameId: 'game-jyry',
    name: '火影忍者·组队副本',
    maxPlayers: 6,
    online: true,
    players: [],
    gameName: '火影忍者',
    gamePoster: '/pictures/火影忍者.jpg'
  }
];

interface Room {
  id: string;
  gameId: string;
  name: string;
  maxPlayers: number;
  online: boolean;
  players?: Player[];
  _count?: { players: number };
  gameName?: string;
  gamePoster?: string;
}

interface Player {
  id: string;
  roomId?: string;
  name: string;
  avatar: string | null;
  online: boolean;
  role: string | null;
}

function HomeContent() {
  const searchParams = useSearchParams();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'games' | 'rooms' | 'chat'>('games');
  const [userInfo, setUserInfo] = useState<any>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  // 获取游戏列表
  useEffect(() => {
    fetchGames();
  }, []);

  useEffect(() => {
    checkSession();
  }, []);

  // 处理 URL 参数
  useEffect(() => {
    const gameId = searchParams.get('game');
    if (gameId && isLoggedIn && games.length > 0) {
      const game = games.find(g => g.id === gameId);
      if (game) {
        setSelectedGame(game);
      }
    }
  }, [searchParams, isLoggedIn, games]);

  const fetchGames = async () => {
    try {
      const response = await fetch('/api/games');
      if (response.ok) {
        const data = await response.json();
        if (data.code === 0) {
          const gamesData = data.data.map((g: any) => {
            // 根据游戏名称匹配常驻房间
            const gameIdMap: {[key: string]: string} = {
              '原神': 'game-ysyx',
              '无畏契约': 'game-wzqy',
              '王者荣耀': 'game-wzyy',
              '三角洲行动': 'game-dxhy',
              '火影忍者': 'game-jyry',
              '第五人格': 'game-dwrg',
              '和平精英': 'game-hpjy',
              '战地风云6': 'game-zdfyy6',
              'CS2': 'game-cs2'
            };
            const matchedGameId = gameIdMap[g.name] || g.id;
            const permanentRooms = PERMANENT_ROOMS.filter(r => r.gameId === matchedGameId);
            
            return {
              ...g,
              rooms: permanentRooms.length > 0 ? permanentRooms : g.rooms.map((r: any) => ({
                ...r,
                players: r._count?.players || 0,
              })),
            };
          });
          setGames(gamesData);
        }
      }
    } catch (error) {
      console.error('获取游戏列表失败:', error);
    }
  };

  const checkSession = async () => {
    try {
      const response = await fetch('/api/user/info');
      if (response.ok) {
        const data = await response.json();
        if (data.code === 0) {
          setIsLoggedIn(true);
          setUserInfo(data.data);
        }
      }
    } catch (error) {
      console.error('检查会话失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setIsLoggedIn(false);
      setUserInfo(null);
      setSelectedGame(null);
      setSelectedRoom(null);
      setActiveTab('games');
    } catch (error) {
      console.error('登出失败:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-blue">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-blue-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen bg-gradient-blue">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-blue-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/pictures/游戏搭子logo.png" alt="游戏搭子" className="w-10 h-10" />
            <div>
              <h1 className="text-xl font-bold text-blue-600">游戏搭子</h1>
              <p className="text-xs text-slate-400">Game Buddy</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <nav className="flex gap-2">
              {[
                { id: 'games', label: '游戏大厅', icon: '🎯' },
                { id: 'rooms', label: '房间列表', icon: '🚪' },
                { id: 'chat', label: 'AI 助手', icon: '💬' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    if (tab.id === 'games') setSelectedGame(null);
                    if (tab.id === 'rooms') setSelectedRoom(null);
                  }}
                  className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'text-slate-600 hover:bg-blue-50'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <img
                  src={userInfo?.avatar_url || userInfo?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userInfo?.name || 'user'}`}
                  alt={userInfo?.name || '用户'}
                  className="w-9 h-9 rounded-full border-2 border-blue-200"
                />
                <span className="text-sm font-medium text-slate-700">{userInfo?.name || '玩家'}</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-sm text-slate-400 hover:text-blue-500 transition-colors"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'games' && (
          selectedGame ? (
            <GameDetail game={selectedGame} onBack={() => setSelectedGame(null)} onSelectRoom={setSelectedRoom} setActiveTab={setActiveTab} setSelectedGame={setSelectedGame} />
          ) : (
            <GameHall games={games} onSelectGame={setSelectedGame} />
          )
        )}
        {activeTab === 'rooms' && (
          selectedRoom ? (
            <RoomChat room={selectedRoom} onBack={() => setSelectedRoom(null)} />
          ) : (
            <RoomList onSelectRoom={setSelectedRoom} games={games} />
          )
        )}
        {activeTab === 'chat' && <AIChat />}
      </main>
    </div>
  );
}

// Landing Page
function LandingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      image: '/pictures/原神.jpg',
      title: '原神',
      description: '开放世界冒险游戏',
    },
    {
      image: '/pictures/王者荣耀.jpg',
      title: '王者荣耀',
      description: '5v5 公平竞技',
    },
    {
      image: '/pictures/无畏契约.jpg',
      title: '无畏契约',
      description: '战术射击竞技',
    },
    {
      image: '/pictures/战地风云6.jpg',
      title: '战地风云6',
      description: '64v64 大战场',
    },
    {
      image: '/pictures/CSgo2.jpg',
      title: 'CS2',
      description: '战术射击竞技',
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden">
      {/* Carousel Background */}
      <div className="absolute inset-0 overflow-hidden">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80"></div>
          </div>
        ))}
      </div>

      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-center mb-12">
          <div className="inline-block mb-6 relative">
            <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-2xl animate-pulse"></div>
            <img src="/pictures/游戏搭子logo.png" alt="游戏搭子" className="w-32 h-32 animate-float relative" />
          </div>

          <h1 className="text-5xl md:text-6xl font-black mb-4">
            <span className="text-white">游戏</span>
            <span className="text-blue-400">搭子</span>
          </h1>

          <p className="text-xl text-white/80 mb-2">
            找到志同道合的游戏伙伴
          </p>
          <p className="text-white/60">
            基于 AI 智能匹配 · 实时组队开黑
          </p>
        </div>

        {/* Carousel Info */}
        <div className="mb-12 max-w-md">
          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-white/60 text-sm">热门推荐</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">{slides[currentSlide].title}</h2>
            <p className="text-white/70 mb-3">{slides[currentSlide].description}</p>
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentSlide
                        ? 'bg-blue-400 w-6'
                        : 'bg-white/30 hover:bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mb-12">
          {[
            { icon: '🎯', title: '游戏大厅', desc: '浏览热门游戏' },
            { icon: '🚪', title: '快速组局', desc: '一键加入房间' },
            { icon: '🤖', title: 'AI 助手', desc: '智能推荐队友' }
          ].map((feature, i) => (
            <div
              key={i}
              className={`stagger-item bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 hover:bg-white/20 hover:border-white/20 transition-all text-center`}
            >
              <span className="text-4xl mb-3 block">{feature.icon}</span>
              <h3 className="text-lg font-bold text-white mb-1">{feature.title}</h3>
              <p className="text-sm text-white/60">{feature.desc}</p>
            </div>
          ))}
        </div>

        <button
          onClick={() => window.location.href = '/api/auth/login'}
          className="btn-blue text-lg px-10 py-4 shadow-2xl hover:shadow-blue-500/50"
        >
          <span className="mr-2">🚀</span>
          立即开始
        </button>
      </div>
    </div>
  );
}

// Game Hall - Shows game chat rooms
interface GameHallProps {
  games: Game[];
  onSelectGame: (game: Game) => void;
}

// 游戏大厅游戏列表（不依赖数据库）
const GAME_HALL_GAMES: Game[] = [
  {
    id: 'game-ysyx',
    name: '原神',
    poster: '/pictures/原神.jpg',
    description: '开放世界冒险游戏',
    playerCount: 0,
    rooms: PERMANENT_ROOMS.filter(r => r.gameId === 'game-ysyx')
  },
  {
    id: 'game-wzyy',
    name: '王者荣耀',
    poster: '/pictures/王者荣耀.jpg',
    description: '5v5 公平竞技',
    playerCount: 0,
    rooms: PERMANENT_ROOMS.filter(r => r.gameId === 'game-wzyy')
  },
  {
    id: 'game-wzqy',
    name: '无畏契约',
    poster: '/pictures/无畏契约.jpg',
    description: '战术射击竞技',
    playerCount: 0,
    rooms: PERMANENT_ROOMS.filter(r => r.gameId === 'game-wzqy')
  },
  {
    id: 'game-zdfyy6',
    name: '战地风云6',
    poster: '/pictures/战地风云6.jpg',
    description: '64v64 大战场',
    playerCount: 0,
    rooms: PERMANENT_ROOMS.filter(r => r.gameId === 'game-zdfyy6')
  },
  {
    id: 'game-cs2',
    name: 'CS2',
    poster: '/pictures/CSgo2.jpg',
    description: '战术射击竞技',
    playerCount: 0,
    rooms: PERMANENT_ROOMS.filter(r => r.gameId === 'game-cs2')
  }
];

function GameHall({ games, onSelectGame }: GameHallProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const hallGames = GAME_HALL_GAMES;

  useEffect(() => {
    if (hallGames.length > 0) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % hallGames.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [hallGames.length]);

  const featuredGame = hallGames[currentSlide];

  return (
    <div>
      {/* Featured Game Carousel */}
      {featuredGame && (
        <div className="mb-8 relative rounded-2xl overflow-hidden h-72">
          <img
            src={featuredGame.poster}
            alt={featuredGame.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="flex items-center justify-between">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <span className="tag-game bg-blue-500/20 text-blue-300 border-blue-400/30">
                    热门推荐
                  </span>
                  <span className="online-dot"></span>
                </div>
                <h2 className="text-4xl font-bold text-white mb-3">{featuredGame.name}</h2>
                <p className="text-white/80 mb-4">{featuredGame.description}</p>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🎮</span>
                    <span className="text-white/90">{(featuredGame.rooms || []).length} 个房间</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">👥</span>
                    <span className="text-white/90">{featuredGame.playerCount} 玩家在线</span>
                  </div>
                </div>
                <button
                  onClick={() => onSelectGame(featuredGame)}
                  className="btn-blue mt-4"
                >
                  立即加入
                </button>
              </div>
              <div className="flex gap-1.5">
                {hallGames.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentSlide
                        ? 'bg-blue-400 w-6'
                        : 'bg-white/30 hover:bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">全部游戏</h2>
        <p className="text-slate-500">选择你喜欢的游戏，开始聊天</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hallGames.map((game) => (
          <div
            key={game.id}
            className="stagger-item bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-all cursor-pointer"
            onClick={() => onSelectGame(game)}
          >
            {/* 游戏封面 */}
            <div className="relative h-48">
              <img src={game.poster} alt={game.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-xl font-bold text-white">{game.name}</h3>
                <p className="text-sm text-white/80">{game.description}</p>
              </div>
            </div>

            {/* 房间列表 */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="online-dot"></span>
                  <span className="text-sm text-blue-500">{(game.rooms || []).length} 个房间</span>
                </div>
              </div>

              {/* 房间列表预览 */}
              <div className="space-y-2">
                {(game.rooms || []).slice(0, 3).map((room) => (
                  <div key={room.id} className="bg-slate-50 rounded-lg p-2 text-xs">
                    <p className="text-slate-700 font-medium truncate">{room.name}</p>
                    <p className="text-slate-400">{(room.players?.length || 0)}/{room.maxPlayers} 人</p>
                  </div>
                ))}
                {(game.rooms || []).length > 3 && (
                  <p className="text-xs text-slate-400 text-center py-1">
                    + 更多房间
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Game Detail - Shows rooms for selected game
function GameDetail({ game, onBack, onSelectRoom, setActiveTab, setSelectedGame }: {
  game: Game;
  onBack: () => void;
  onSelectRoom: (room: Room) => void;
  setActiveTab: (tab: 'games' | 'rooms' | 'chat') => void;
  setSelectedGame: (game: Game | null) => void;
}) {
  const [fullGame, setFullGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomMaxPlayers, setNewRoomMaxPlayers] = useState(4);
  const [creating, setCreating] = useState(false);

  // Fetch game details with players
  useEffect(() => {
    fetchGameDetails();
  }, [game.id]);

  const fetchGameDetails = async () => {
    try {
      const response = await fetch(`/api/games/${game.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.code === 0) {
          setFullGame(data.data);
        }
      }
    } catch (error) {
      console.error('获取游戏详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">加载中...</div>;
  }

  if (!fullGame) {
    return <div className="text-center py-8">加载失败</div>;
  }

  // 获取所有在线玩家
  const allPlayers = fullGame?.rooms.flatMap(room => room.players || []) || [];

  // 上报房间加入事件
  const reportRoomJoin = async (roomName: string) => {
    try {
      await fetch('/api/agent-memory/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: {
            kind: 'room',
            id: game.id,
          },
          action: 'room_joined',
          actionLabel: '加入了游戏房间',
          displayText: `用户加入了 ${game.name} 的「${roomName}」房间`,
          refs: [
            {
              objectType: 'game_room',
              objectId: `${game.id}_${roomName}`,
              contentPreview: `${game.name} - ${roomName}`,
            },
          ],
          importance: 0.7,
          payload: {
            gameName: game.name,
            roomName,
          },
        }),
      });
    } catch (error) {
      console.error('上报房间加入事件失败:', error);
    }
  };

  // 上报邀请玩家事件
  const reportPlayerInvite = async (playerName: string) => {
    try {
      await fetch('/api/agent-memory/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: {
            kind: 'game',
            id: game.id,
          },
          action: 'player_invited',
          actionLabel: '邀请了玩家',
          displayText: `用户在 ${game.name} 中邀请了 ${playerName}`,
          refs: [
            {
              objectType: 'player_invite',
              objectId: playerName,
              contentPreview: `邀请 ${playerName}`,
            },
          ],
          importance: 0.5,
          payload: {
            gameName: game.name,
            playerName,
          },
        }),
      });
    } catch (error) {
      console.error('上报邀请事件失败:', error);
    }
  };

  // 创建房间
  const handleCreateRoom = async () => {
    if (!newRoomName.trim() || creating) return;

    setCreating(true);
    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: game.id,
          name: newRoomName,
          maxPlayers: newRoomMaxPlayers
        })
      });

      const data = await response.json();
      if (data.code === 0) {
        // 刷新游戏详情
        fetchGameDetails();
        // 关闭弹窗并重置表单
        setShowCreateRoom(false);
        setNewRoomName('');
        setNewRoomMaxPlayers(4);
      } else {
        alert(data.message || '创建房间失败');
      }
    } catch (error) {
      console.error('创建房间失败:', error);
      alert('创建房间失败，请重试');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      {/* Game Header */}
      <div className="relative rounded-2xl overflow-hidden mb-8 h-48">
        <img src={game.poster} alt={game.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <button onClick={onBack} className="text-white/80 hover:text-white mb-3 flex items-center gap-1">
            ← 返回大厅
          </button>
          <h2 className="text-3xl font-bold text-white">{game.name}</h2>
          <p className="text-white/80">{game.description}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Room List */}
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800">房间列表</h3>
            <button
              onClick={() => setShowCreateRoom(true)}
              className="btn-blue text-sm py-2 px-4"
            >
              + 新建房间
            </button>
          </div>
          <div className="space-y-4">
            {(game.rooms || []).map((room) => (
              <div key={room.id} className="room-card p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-2xl">
                    🎮
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">{room.name}</h4>
                    <p className="text-sm text-slate-400">{(room.players?.length || 0)}/{room.maxPlayers} 人</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const fullRoom = { ...room, gameName: game.name };
                    onSelectRoom(fullRoom);
                    setActiveTab('rooms');
                    setSelectedGame(null);
                    reportRoomJoin(room.name);
                  }}
                  className="btn-blue py-2 px-4 text-sm"
                >
                  加入
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Online Players */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-4">在线玩家</h3>
          <div className="space-y-3">
            {allPlayers.map((player: Player) => (
              <div key={player.id} className="bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3">
                <div className="relative">
                  <img src={player.avatar || '/pictures/avatar.png'} alt={player.name} className="w-10 h-10 rounded-full" />
                  {player.online && <span className="absolute bottom-0 right-0 online-dot"></span>}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-700 text-sm">{player.name}</p>
                  <p className="text-xs text-slate-400">{player.role}</p>
                </div>
                <button
                  onClick={() => reportPlayerInvite(player.name)}
                  className="text-blue-500 hover:text-blue-600 text-sm"
                >
                  邀请
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Room Modal */}
      {showCreateRoom && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-slate-800 mb-4">新建房间</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">房间名称</label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="请输入房间名称"
                  className="input-clean w-full"
                  maxLength={50}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">最大人数</label>
                <select
                  value={newRoomMaxPlayers}
                  onChange={(e) => setNewRoomMaxPlayers(parseInt(e.target.value))}
                  className="input-clean w-full"
                >
                  {[2, 3, 4, 5, 6, 8, 10].map(num => (
                    <option key={num} value={num}>{num} 人</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateRoom(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateRoom}
                disabled={!newRoomName.trim() || creating}
                className="flex-1 btn-blue disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? '创建中...' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Room List - All rooms from all games
function RoomList({ onSelectRoom, games }: { onSelectRoom: (room: Room) => void; games: Game[] }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const allRooms = PERMANENT_ROOMS;

  useEffect(() => {
    if (games.length > 0) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % games.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [games.length]);

  const currentGame = games[currentSlide];

  return (
    <div>
      {/* Game Carousel */}
      {currentGame && (
        <div className="mb-8 relative rounded-2xl overflow-hidden h-64">
          <img
            src={currentGame.poster}
            alt={currentGame.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">{currentGame.name}</h2>
                <p className="text-white/80 mb-2">{currentGame.description}</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🎮</span>
                    <span className="text-white/90">{(currentGame.rooms || []).length} 个房间</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">👥</span>
                    <span className="text-white/90">{currentGame.playerCount} 玩家</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-1.5">
                {games.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentSlide
                        ? 'bg-blue-400 w-6'
                        : 'bg-white/30 hover:bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">房间列表</h2>
        <p className="text-slate-500">加入房间，立即开始游戏</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allRooms.map((room) => (
          <div
            key={room.id}
            className="stagger-item room-card cursor-pointer"
            onClick={() => onSelectRoom(room)}
          >
            <img src={room.gamePoster} alt={room.gameName} className="room-card-image w-full" />
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="tag-game">{room.gameName}</span>
                {room.online && <span className="online-dot"></span>}
              </div>
              <h3 className="font-bold text-slate-800 mb-1">{room.name}</h3>
              <p className="text-sm text-slate-400">{(room as any)._count?.players || 0}/{room.maxPlayers} 人</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Room Chat
function RoomChat({ room, onBack }: { room: Room; onBack: () => void }) {
  const [messages, setMessages] = useState<{ role: string; content: string; id?: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [invitingAgent, setInvitingAgent] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages from localStorage on mount
  useEffect(() => {
    const storageKey = `chat_${room.id || room.name}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        setMessages([{ role: 'system', content: '欢迎来到大世界！开始聊天吧~' }]);
      }
    } else {
      setMessages([{ role: 'system', content: '欢迎来到大世界！开始聊天吧~' }]);
    }
  }, [room.id, room.name]);

  // Save messages to localStorage when they change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (messages.length > 0) {
      const storageKey = `chat_${room.id || room.name}`;
      localStorage.setItem(storageKey, JSON.stringify(messages));
    }
  }, [messages, room.id, room.name]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage, id: Date.now().toString() }]);
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });

      const data = await response.json();
      if (data.code === 0) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.data?.content || '收到！' }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: '消息发送失败，请重试。' }]);
      }
    } catch (error) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `收到！房间 "${room.name}" 已有 ${((room as any).players?.length || 0)} 位玩家。让我们一起开始游戏吧！`
        }]);
      }, 500);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteAgent = async () => {
    if (invitingAgent) return;
    setInvitingAgent(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `请帮我邀请更多的玩家加入「${room.name}」房间，这是一个${(room as any).gameName}房间，目前有${((room as any).players?.length || 0)}/${room.maxPlayers}人。请推荐一些合适的玩家。`,
          systemPrompt: '你是游戏搭子 AI 助手，帮助用户邀请合适的玩家加入游戏房间。',
        }),
      });

      if (response.ok) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (reader) {
          let assistantContent = '';
          const assistantMessageId = `agent-${Date.now()}`;
          setMessages(prev => [...prev, { role: 'assistant', content: '', id: assistantMessageId }]);

          let currentEvent = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('event: ')) {
                currentEvent = line.slice(7).trim();
                continue;
              }

              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();

                if (data === '[DONE]') {
                  break;
                }

                try {
                  const parsed = JSON.parse(data);

                  if (parsed.choices && parsed.choices[0]?.delta?.content) {
                    assistantContent += parsed.choices[0].delta.content;
                    setMessages(prev =>
                      prev.map((msg: any) =>
                        msg.id === assistantMessageId
                          ? { ...msg, content: assistantContent }
                          : msg
                      )
                    );
                  }
                } catch (e) {}
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('邀请 Agent 失败:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: '邀请失败，请稍后重试。' }]);
    } finally {
      setInvitingAgent(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Room Header */}
      <div className="bg-white rounded-t-2xl border border-b-0 border-slate-200 p-4 flex items-center gap-4">
        <button onClick={onBack} className="text-slate-400 hover:text-slate-600">
          ←
        </button>
        <div className="flex-1">
          <h3 className="font-bold text-slate-800">{room.name}</h3>
          <p className="text-sm text-slate-400">{room.gameName} · {(room as any).players || 0}/{room.maxPlayers} 人</p>
        </div>
        <button
          onClick={handleInviteAgent}
          disabled={invitingAgent}
          className="btn-blue py-2 px-4 text-sm flex items-center gap-2 disabled:opacity-50"
        >
          <span>🤖</span>
          <span>{invitingAgent ? '邀请中...' : '邀请 AI'}</span>
        </button>
      </div>

      {/* Chat Area */}
      <div className="bg-white border border-slate-200 rounded-b-2xl overflow-hidden">
        <div className="h-[400px] overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`chat-bubble ${msg.role === 'user' ? 'chat-bubble-user' : msg.role === 'system' ? 'bg-slate-100 text-slate-500 text-center w-full max-w-full' : 'chat-bubble-assistant'}`}>
                {msg.role === 'assistant' && (
                  <div className="text-xs text-blue-500 mb-1">🤖 AI 助手</div>
                )}
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 px-4 py-2 rounded-2xl">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="发送消息..."
              className="input-clean flex-1"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="btn-blue px-6 disabled:opacity-50"
            >
              发送
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// AI Chat
function AIChat() {
  const [messages, setMessages] = useState<{ role: string; content: string; id?: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('ai_chat_messages');
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        setMessages([{ role: 'assistant', content: '你好！我是游戏搭子 AI 助手 ~~\n\n我可以帮你：\n• 推荐合适的游戏队友\n• 找到匹配的房间\n• 分析你的游戏风格\n\n有什么需要帮助的吗？' }]);
      }
    } else {
      setMessages([{ role: 'assistant', content: '你好！我是游戏搭子 AI 助手 ~~\n\n我可以帮你：\n• 推荐合适的游戏队友\n• 找到匹配的房间\n• 分析你的游戏风格\n\n有什么需要帮助的吗？' }]);
    }
  }, []);

  // Save messages to localStorage when they change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (messages.length > 0) {
      localStorage.setItem('ai_chat_messages', JSON.stringify(messages));
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    const userMessageId = Date.now().toString();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage, id: userMessageId }]);
    setLoading(true);

    // 上报事件到 Agent Memory
    try {
      await fetch('/api/agent-memory/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: {
            kind: 'ai_chat',
            id: conversationId || 'new',
          },
          action: 'message_sent',
          actionLabel: '发送了 AI 聊天消息',
          displayText: `用户向 AI 助手发送了消息: ${userMessage.substring(0, 50)}${userMessage.length > 50 ? '...' : ''}`,
          refs: [
            {
              objectType: 'ai_chat_message',
              objectId: userMessageId,
              contentPreview: userMessage.substring(0, 100),
              snapshot: {
                text: userMessage,
                capturedAt: Date.now(),
              },
            },
          ],
          importance: 0.5,
          idempotencyKey: `ai_msg_${userMessageId}`,
        }),
      });
    } catch (error) {
      console.error('上报事件失败:', error);
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          sessionId: conversationId || undefined,
          systemPrompt: '你是游戏搭子 AI 助手，专门帮助用户找到合适的游戏队友和房间，分析游戏风格。请用友好、专业的语气回复。',
        }),
      });

      if (!response.ok) {
        throw new Error('聊天请求失败');
      }

      const contentType = response.headers.get('content-type');
      if (contentType?.includes('text/event-stream')) {
        // 流式响应
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (reader) {
          let assistantContent = '';
          let newConversationId = conversationId;
          const assistantMessageId = `assistant-${Date.now()}`;

          setMessages(prev => [...prev, { role: 'assistant', content: '', id: assistantMessageId }]);

          let currentEvent = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('event: ')) {
                currentEvent = line.slice(7).trim();
                continue;
              }

              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();

                if (data === '[DONE]') {
                  break;
                }

                try {
                  const parsed = JSON.parse(data);

                  if (currentEvent === 'session' && parsed.sessionId) {
                    newConversationId = parsed.sessionId;
                    setConversationId(newConversationId);
                  }

                  if (parsed.choices && parsed.choices[0]?.delta?.content) {
                    assistantContent += parsed.choices[0].delta.content;
                    setMessages(prev =>
                      prev.map((msg: any) =>
                        msg.id === assistantMessageId
                          ? { ...msg, content: assistantContent }
                          : msg
                      )
                    );
                  }
                } catch (e) {}

                currentEvent = '';
              }
            }
          }
        }
      } else {
        // 非流式响应
        const data = await response.json();
        if (data.code === 0) {
          setMessages(prev => [...prev, { role: 'assistant', content: data.data?.content || '收到消息！' }]);
        } else {
          setMessages(prev => [...prev, { role: 'assistant', content: '抱歉，服务暂时不可用。' }]);
        }
      }
    } catch (error) {
      console.error('聊天错误:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: '抱歉，聊天出错了，请重试。' }]);
    } finally {
      setLoading(false);
    }
  };

  // 分析游戏风格
  const analyzeGameStyle = async () => {
    if (loading) return;
    setLoading(true);

    try {
      // 获取软记忆数据
      const response = await fetch('/api/user/softmemory?pageNo=1&pageSize=50');
      const data = await response.json();

      if (data.code === 0 && data.data?.list && data.data.list.length > 0) {
        const memories = data.data.list;

        // 构建分析提示
        const memoryText = memories
          .map((m: any) => `${m.factObject}: ${m.factContent}`)
          .join('\n');

        const analysisPrompt = `根据我的个人记忆信息，分析我的游戏风格和偏好：

${memoryText}

请从以下几个方面进行分析：
1. 游戏类型偏好（如：FPS、MOBA、开放世界等）
2. 游戏风格（如：竞技、休闲、社交、探索等）
3. 团队角色偏好（如：指挥、输出、辅助、肉盾等）
4. 活跃时间段
5. 适合的队友类型

请给出详细的个性化分析。`;

        setMessages(prev => [...prev, { role: 'user', content: '分析一下我的游戏风格' }]);

        const chatResponse = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: analysisPrompt,
            systemPrompt: '你是一个专业的游戏风格分析师，根据用户的个人记忆信息进行深度分析。',
          }),
        });

        if (chatResponse.ok) {
          const reader = chatResponse.body?.getReader();
          const decoder = new TextDecoder();

          if (reader) {
            let assistantContent = '';
            const assistantMessageId = `assistant-${Date.now()}`;
            setMessages(prev => [...prev, { role: 'assistant', content: '', id: assistantMessageId }]);

            let currentEvent = '';

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\n');

              for (const line of lines) {
                if (line.startsWith('event: ')) {
                  currentEvent = line.slice(7).trim();
                  continue;
                }

                if (line.startsWith('data: ')) {
                  const dataLine = line.slice(6).trim();

                  if (dataLine === '[DONE]') {
                    break;
                  }

                  try {
                    const parsed = JSON.parse(dataLine);

                    if (parsed.choices && parsed.choices[0]?.delta?.content) {
                      assistantContent += parsed.choices[0].delta.content;
                      setMessages(prev =>
                        prev.map((msg: any) =>
                          msg.id === assistantMessageId
                            ? { ...msg, content: assistantContent }
                            : msg
                        )
                      );
                    }
                  } catch (e) {}

                  currentEvent = '';
                }
              }
            }
          }
        }
      } else {
        // 没有记忆数据时的提示
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '暂时还没有足够的记忆数据来分析你的游戏风格。多跟我聊聊，让我更好地了解你吧！'
        }]);
      }
    } catch (error) {
      console.error('分析错误:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '分析失败，请稍后重试'
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-md">
        {/* Header */}
        <div className="bg-blue-500 px-6 py-4">
          <div className="flex items-center gap-3">
            <img src="/pictures/游戏搭子logo.png" alt="游戏搭子" className="w-8 h-8 rounded-full bg-white/20 p-1" />
            <div>
              <h3 className="font-bold text-white">AI 组队助手</h3>
              <p className="text-xs text-blue-100">智能推荐</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="h-[400px] overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div
              key={msg.id || i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`chat-bubble ${msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'}`}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 px-4 py-2 rounded-2xl">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="描述你想要什么样的游戏搭子..."
              className="input-clean flex-1"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="btn-blue px-6 disabled:opacity-50"
            >
              发送
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        {[
          { icon: '🎮', label: '推荐队友', action: () => setInput('帮我推荐一些游戏队友') },
          { icon: '🚪', label: '找房间', action: () => setInput('帮我找一个合适的房间') },
          { icon: '📊', label: '分析风格', action: analyzeGameStyle }
        ].map((action, i) => (
          <button
            key={i}
            onClick={action.action}
            disabled={loading}
            className="bg-white py-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-2xl mb-2 block">{action.icon}</span>
            <span className="text-sm text-slate-600">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
 return (
   <Suspense fallback={
     <div className="min-h-screen flex items-center justify-center bg-gradient-blue">
       <div className="text-center">
         <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
         <p className="text-blue-600">加载中...</p>
       </div>
     </div>
   }>
     <HomeContent />
   </Suspense>
 );
}
