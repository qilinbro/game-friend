'use client';

import { useState, useEffect } from 'react';

interface UserInfo {
  user_id?: string;
  nickname?: string;
  avatar?: string;
  avatar_url?: string;
}

interface Shade {
  id: string;
  name: string;
  category?: string;
}

export default function UserProfile() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [shades, setShades] = useState<Shade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      // 获取用户信息
      const infoRes = await fetch('/api/user/info');
      const infoData = await infoRes.json();

      if (infoData.code === 0 && infoData.data) {
        setUserInfo(infoData.data);
      }

      // 获取兴趣标签
      const shadesRes = await fetch('/api/user/shades');
      const shadesData = await shadesRes.json();

      if (shadesData.code === 0 && shadesData.data?.shades) {
        setShades(shadesData.data.shades);
      }
    } catch (err) {
      setError('加载用户信息失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-pink-300 border-t-pink-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500 text-center">
        {error}
      </div>
    );
  }

  const avatarUrl = userInfo?.avatar_url || userInfo?.avatar || '/default-avatar.png';
  const nickname = userInfo?.nickname || '游戏搭子用户';

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-pink-200 to-orange-200 flex items-center justify-center">
          {avatarUrl ? (
            <img src={avatarUrl} alt={nickname} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl">🎮</span>
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{nickname}</h3>
          <p className="text-sm text-gray-500">游戏搭子</p>
        </div>
      </div>

      {shades.length > 0 && (
        <div className="mt-4">
          <p className="text-sm text-gray-500 mb-2">兴趣标签</p>
          <div className="flex flex-wrap gap-2">
            {shades.map((shade) => (
              <span
                key={shade.id}
                className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm"
              >
                {shade.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}