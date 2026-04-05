'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { BarChart3, Home, LayoutDashboard, Clock, Settings, Upload, Mail, Lock, Loader2, Sparkles, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import LanguageSelector from '@/components/LanguageSelector';

export default function Login() {
    const { t, isRTL } = useLanguage();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('username', email);
            formData.append('password', password);

            const response = await api.post('/auth/login', formData);
            localStorage.setItem('token', response.data.access_token);
            router.push('/dashboard');
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            let msg = 'Erreur de connexion';
            if (err.code === 'ECONNREFUSED' || err.message?.includes('Network')) {
                msg = 'Le serveur ne répond pas. Vérifiez que le backend est démarré.';
            } else if (detail) {
                msg = typeof detail === 'string' ? detail : Array.isArray(detail) ? detail.map((d: any) => d?.msg || d?.message).filter(Boolean).join(', ') || msg : detail?.message || msg;
            }
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`flex min-h-screen bg-[#fcfdfe] relative overflow-hidden items-center justify-center p-6 ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Dynamic Background Blobs */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 90, 0],
                    x: [0, 100, 0],
                    y: [0, 50, 0],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] bg-primary-200/20 blur-[120px] rounded-full -z-10"
            />
            <motion.div
                animate={{
                    scale: [1, 1.3, 1],
                    rotate: [0, -45, 0],
                    x: [0, -80, 0],
                    y: [0, -100, 0],
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute bottom-[-15%] left-[-10%] w-[50vw] h-[50vw] bg-emerald-100/30 blur-[120px] rounded-full -z-10"
            />
            <motion.div
                animate={{
                    scale: [1, 1.5, 1],
                    x: [0, 150, 0],
                    y: [0, -150, 0],
                }}
                transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                className="absolute top-[20%] left-[10%] w-[30vw] h-[30vw] bg-indigo-100/20 blur-[100px] rounded-full -z-10"
            />

            {/* Back to Home Button */}
            <Link
                href="/"
                className="absolute top-8 left-8 flex items-center gap-2 text-surface-400 hover:text-primary-600 font-black text-xs uppercase tracking-widest transition-all group z-50"
            >
                <div className="bg-white p-2 rounded-xl shadow-sm border border-surface-100 group-hover:bg-primary-50 transition-colors">
                    <Home size={16} />
                </div>
                <span>{isRTL ? 'الرئيسية' : 'Accueil'}</span>
            </Link>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full max-w-lg relative z-10"
            >
                <div className="glass p-10 md:p-14 rounded-[40px] shadow-glass-2xl relative overflow-hidden backdrop-blur-2xl border border-white/40">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-100/30 blur-3xl -translate-y-1/2 translate-x-1/2 -z-10" />

                    <div className="flex flex-col items-center mb-12">
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="bg-primary-600 p-4 rounded-3xl shadow-xl shadow-primary-200 mb-6"
                        >
                            <BarChart3 className="h-8 w-8 text-white" />
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-4xl font-display font-black text-surface-900 tracking-tight"
                        >
                            BusinessPulse
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="mt-3 text-surface-500 font-bold uppercase tracking-[0.2em] text-[10px]"
                        >
                            {t('login_title')}
                        </motion.p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                            className="space-y-4"
                        >
                            <div className="relative group">
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-400 group-focus-within:text-primary-600 transition-colors">
                                    <Mail size={20} />
                                </div>
                                <input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    required
                                    className="block w-full rounded-2xl border-surface-100 bg-white/40 pl-14 pr-6 py-4 text-surface-900 placeholder:text-surface-400 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-medium text-sm outline-none shadow-sm"
                                    placeholder={t('email_label')}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="relative group">
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-400 group-focus-within:text-primary-600 transition-colors">
                                    <Lock size={20} />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    className="block w-full rounded-2xl border-surface-100 bg-white/40 pl-14 pr-6 py-4 text-surface-900 placeholder:text-surface-400 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-medium text-sm outline-none shadow-sm"
                                    placeholder={t('password_placeholder')}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </motion.div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-4 rounded-2xl bg-red-50 text-red-600 text-[13px] font-black text-center border border-red-100/50"
                            >
                                {error}
                            </motion.div>
                        )}

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                        >
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary w-full h-14 rounded-2xl gap-3 text-base shadow-xl shadow-primary-200 group relative overflow-hidden active:scale-95 transition-transform"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin h-6 w-6" />
                                ) : (
                                    <>
                                        <span>{t('sign_in')}</span>
                                        <Sparkles className="h-5 w-5 group-hover:scale-125 transition-transform" />
                                    </>
                                )}
                            </button>
                        </motion.div>
                    </form>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="mt-10 pt-8 border-t border-surface-100 text-center space-y-4"
                    >
                        <p className="text-sm text-surface-500 font-medium">
                            {t('no_account')}
                        </p>
                        <Link
                            href="/signup"
                            className="inline-flex items-center gap-2 text-primary-600 font-black text-sm hover:gap-3 transition-all"
                        >
                            {t('sign_up')}
                            <ChevronRight size={18} />
                        </Link>
                    </motion.div>
                </div>

                <div className="mt-8 flex justify-center items-center gap-6">
                    <LanguageSelector />
                </div>
            </motion.div>
        </div>
    );
}
