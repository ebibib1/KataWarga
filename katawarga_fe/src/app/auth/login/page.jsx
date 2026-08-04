'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Otomatis bersihkan cookie NextAuth yang menumpuk saat halaman login dibuka.
  // Mencegah HTTP 431 "Request Header Fields Too Large" yang disebabkan
  // oleh penumpukan cookie sesi dari development/penggunaan berulang.
  useEffect(() => {
    fetch('/api/auth/clear-cookies').catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        alert(res.error);
        setIsLoading(false);
        return;
      }

      // Fetch the updated session to get the user role
      const sessionRes = await fetch('/api/auth/session');
      const sessionData = await sessionRes.json();
      const role = sessionData?.user?.role;
      
      if (!role) {
        // Fallback if role is not found
        router.push('/homepageUser');
        return;
      }

      // Redirect berdasarkan role
      if (role === 'super_admin') {
        router.push('/dashboardSuper_Admin');
      } else if (role === 'admin') {
        router.push('/dashboardAdmin');
      } else {
        router.push('/homepageUser');
      }
    } catch (err) {
      console.error('Login error:', err);
      alert(`Terjadi kesalahan saat login: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: '#FFFBF5' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md rounded-3xl p-8 shadow-2xl"
        style={{ backgroundColor: '#60A5FA' }}
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="flex items-center justify-center mb-8"
        >
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FFFBF5' }}>
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
          </div>
          <span className="ml-3 font-display text-xl font-bold text-white">KataWarga</span>
        </motion.div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-display font-bold text-white mb-3">Masuk</h1>
          <p className="text-white text-opacity-80 text-sm">
            Akses dashboard dan pantau laporan pengaduanmu
          </p>
        </motion.div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <label className="block text-white text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              required
              className="w-full px-4 py-3 rounded-xl border-0 outline-none text-white placeholder-gray-400 transition-all focus:ring-2 focus:ring-white focus:ring-opacity-40"
              style={{
                backgroundColor: 'rgba(10, 10, 10, 0.8)',
              }}
            />
          </motion.div>

          {/* Password Field */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <label className="block text-white text-sm font-medium mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                required
                className="w-full px-4 py-3 rounded-xl border-0 outline-none text-white placeholder-gray-400 transition-all focus:ring-2 focus:ring-white focus:ring-opacity-40"
                style={{
                  backgroundColor: 'rgba(10, 10, 10, 0.8)',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-opacity-60 hover:text-opacity-100 transition-all"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </motion.div>

          {/* Remember & Forgot */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="flex items-center justify-between text-sm"
          >
            <label className="flex items-center gap-2 text-white text-opacity-80 cursor-pointer hover:text-opacity-100 transition-all">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded cursor-pointer"
              />
              <span>Ingat saya</span>
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-white text-opacity-80 hover:text-opacity-100 transition-all"
            >
              Lupa password?
            </Link>
          </motion.div>

          {/* Submit Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl font-semibold text-white transition-all duration-300 mt-8"
            style={{
              backgroundColor: isLoading ? '#868A99' : '#A8ADBF',
            }}
            onMouseEnter={(e) => {
              if (!isLoading) e.currentTarget.style.backgroundColor = '#868A99';
            }}
            onMouseLeave={(e) => {
              if (!isLoading) e.currentTarget.style.backgroundColor = '#A8ADBF';
            }}
          >
            {isLoading ? 'Memproses...' : 'Masuk'}
          </motion.button>
        </form>

        {/* Sign Up Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          className="text-center mt-6"
        >
          <p className="text-white text-opacity-80 text-sm">
            Belum punya akun?{' '}
            <Link
              href="/auth/register"
              className="text-white font-semibold hover:text-opacity-80 transition-all"
            >
              Daftar di sini
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
