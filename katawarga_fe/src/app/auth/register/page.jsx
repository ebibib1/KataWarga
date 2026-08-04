'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ChevronRight } from 'lucide-react';

const visionItems = [
  {
    title: 'Transparansi Pemerintahan',
    description: 'Setiap laporan masyarakat tercatat, terverifikasi, dan dapat dipantau secara realtime oleh publik.',
  },
  {
    title: 'Pemberdayaan Warga',
    description: 'Warga memiliki suara dan kekuatan untuk melaporkan masalah langsung ke pemerintah tanpa intermediary.',
  },
  {
    title: 'Kota yang Lebih Baik',
    description: 'Dengan partisipasi aktif, kita bangun infrastruktur kota yang responsif terhadap kebutuhan komunitas.',
  },
  {
    title: 'Kolaborasi Komunitas',
    description: 'Platform sosial untuk saling mendukung, berbagi solusi, dan bersama menyelesaikan masalah bersama.',
  },
];

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentVision, setCurrentVision] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentVision((prev) => (prev + 1) % visionItems.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert('Password tidak cocok');
      return;
    }

    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (response.ok) {
        alert('Registrasi berhasil! Silakan login.');
        window.location.href = '/auth/login';
      } else {
        const data = await response.json();
        alert(data.message || 'Registrasi gagal');
      }
    } catch (err) {
      console.error('Register error:', err);
      alert(`Terjadi kesalahan saat registrasi: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2" style={{ backgroundColor: '#FFFBF5' }}>
      {/* Left - Form */}
      <div className="flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="flex items-center justify-center mb-8"
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#60A5FA' }}
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="#FFFBF5" strokeWidth="2">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
            </div>
            <span
              className="ml-3 font-display text-xl font-bold"
              style={{ color: '#60A5FA' }}
            >
              KataWarga
            </span>
          </motion.div>

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-display font-bold mb-3" style={{ color: '#151E29' }}>
              Daftar Sekarang
            </h1>
            <p className="text-gray-600 text-sm">
              Bergabunglah dengan ribuan warga yang peduli dengan kota mereka
            </p>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <label className="block text-sm font-medium mb-2" style={{ color: '#151E29' }}>
                Nama Lengkap
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama kamu"
                required
                className="w-full px-4 py-3 rounded-xl border-0 outline-none text-white placeholder-gray-500 transition-all focus:ring-2"
                style={{
                  backgroundColor: 'rgba(10, 10, 10, 0.8)',
                  focusRingColor: '#60A5FA',
                }}
              />
            </motion.div>

            {/* Email */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35, duration: 0.4 }}
            >
              <label className="block text-sm font-medium mb-2" style={{ color: '#151E29' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                required
                className="w-full px-4 py-3 rounded-xl border-0 outline-none text-white placeholder-gray-500 transition-all focus:ring-2"
                style={{
                  backgroundColor: 'rgba(10, 10, 10, 0.8)',
                }}
              />
            </motion.div>

            {/* Password */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <label className="block text-sm font-medium mb-2" style={{ color: '#151E29' }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Buat password yang kuat"
                  required
                  className="w-full px-4 py-3 rounded-xl border-0 outline-none text-white placeholder-gray-500 transition-all focus:ring-2"
                  style={{
                    backgroundColor: 'rgba(10, 10, 10, 0.8)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-opacity-60 hover:text-opacity-100"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </motion.div>

            {/* Confirm Password */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45, duration: 0.4 }}
            >
              <label className="block text-sm font-medium mb-2" style={{ color: '#151E29' }}>
                Konfirmasi Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password"
                  required
                  className="w-full px-4 py-3 rounded-xl border-0 outline-none text-white placeholder-gray-500 transition-all focus:ring-2"
                  style={{
                    backgroundColor: 'rgba(10, 10, 10, 0.8)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-opacity-60 hover:text-opacity-100"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </motion.div>

            {/* Terms Checkbox */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-4 h-4 mt-1 cursor-pointer"
                  required
                />
                <span className="text-xs text-gray-600">
                  Saya setuju dengan{' '}
                  <Link href="/terms" className="text-blue-500 hover:underline">
                    Syarat & Ketentuan
                  </Link>{' '}
                  dan{' '}
                  <Link href="/privacy" className="text-blue-500 hover:underline">
                    Kebijakan Privasi
                  </Link>
                </span>
              </label>
            </motion.div>

            {/* Submit Button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.4 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading || !agreeTerms}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all duration-300 mt-6 flex items-center justify-center gap-2"
              style={{
                backgroundColor: isLoading || !agreeTerms ? '#868A99' : '#A8ADBF',
              }}
              onMouseEnter={(e) => {
                if (!isLoading && agreeTerms) e.currentTarget.style.backgroundColor = '#868A99';
              }}
              onMouseLeave={(e) => {
                if (!isLoading && agreeTerms) e.currentTarget.style.backgroundColor = '#A8ADBF';
              }}
            >
              {isLoading ? 'Mendaftar...' : 'Buat Akun'}
              {!isLoading && <ChevronRight size={18} />}
            </motion.button>
          </form>

          {/* Sign In Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="text-center mt-6"
          >
            <p className="text-gray-600 text-sm">
              Sudah punya akun?{' '}
              <Link href="/auth/login" className="text-blue-500 font-semibold hover:underline">
                Masuk di sini
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Right - Vision Carousel */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="hidden lg:flex items-center justify-center p-8"
        style={{ backgroundColor: '#151E29' }}
      >
        <div className="max-w-md text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentVision}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              {/* Icon placeholder */}
              <motion.div
                className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: '#60A5FA' }}
                whileHover={{ scale: 1.1 }}
              >
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                </svg>
              </motion.div>

              <h3 className="text-2xl font-display font-bold text-white mb-4">
                {visionItems[currentVision].title}
              </h3>
              <p className="text-white text-opacity-70 leading-relaxed">
                {visionItems[currentVision].description}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Dots */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="flex gap-2 justify-center mt-8"
          >
            {visionItems.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentVision(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentVision ? 'bg-white w-8' : 'bg-white bg-opacity-30 w-2'
                }`}
                aria-label={`Vision ${idx + 1}`}
              />
            ))}
          </motion.div>

          {/* Counter */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="text-white text-opacity-50 text-sm mt-8"
          >
            {currentVision + 1} dari {visionItems.length}
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
