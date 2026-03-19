'use client';

export default function LoginButton() {
  const handleLogin = () => {
    // 直接跳转到登录 API，会自动重定向到 OAuth 授权页面
    window.location.href = '/api/auth/login';
  };

  return (
    <button
      onClick={handleLogin}
      className="px-6 py-3 bg-pink-500 text-white rounded-full font-medium hover:bg-pink-600 transition-colors disabled:opacity-50"
    >
      登录
    </button>
  );
}