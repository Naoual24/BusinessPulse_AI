'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
    BarChart3, 
    Zap, 
    LayoutDashboard, 
    BrainCircuit, 
    Upload, 
    ChevronRight, 
    Sparkles, 
    ShoppingBag, 
    Scan, 
    Activity, 
    MousePointer2,
    ShieldCheck,
    Globe2,
    ArrowRight,
    User
} from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import LanguageSelector from '@/components/LanguageSelector';

export default function Home() {
    const ctx = useLanguage();
    const t = ctx?.t ?? ((k: any) => k);
    const isRTL = ctx?.isRTL ?? false;
    const dir = isRTL ? 'rtl' : 'ltr';

    const fadeInUp = {
        hidden: { y: 40, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { duration: 0.6 } }
    };

    const stagger = {
        visible: { transition: { staggerChildren: 0.15 } }
    };

    const features = [
        {
            icon: Activity,
            title: t('decision_simulator' as any),
            desc: t('ai_recommendations_desc' as any),
            color: "text-blue-600",
            bg: "bg-blue-50",
            href: "/dashboard?step=decision_simulator"
        },
        {
            icon: Scan,
            title: t('magic_scanner' as any),
            desc: t('magic_scanner_desc' as any),
            color: "text-primary-600",
            bg: "bg-primary-50",
            href: "/dashboard?step=magic_scanner"
        },
        {
            icon: BrainCircuit,
            title: t('customer_intelligence' as any),
            desc: t('ai_recommendations_desc' as any),
            color: "text-indigo-600",
            bg: "bg-indigo-50",
            href: "/dashboard?step=intelligence_dashboard"
        },
        {
            icon: ShoppingBag,
            title: t('market_basket' as any),
            desc: t('market_basket_desc' as any),
            color: "text-rose-600",
            bg: "bg-rose-50",
            href: "/dashboard?step=market_basket_analysis"
        }
    ];

    return (
        <div className={`min-h-screen bg-[#fafbff] selection:bg-primary-100 selection:text-primary-700 ${isRTL ? 'font-arabic' : ''}`} dir={dir}>

            {/* Top Announcement Bar */}
            <div className="bg-gradient-to-r from-primary-600 via-indigo-600 to-violet-600 text-white text-center py-2 px-4 text-[10px] font-black uppercase tracking-[0.15em] flex items-center justify-center gap-2">
                <Sparkles size={11} className="animate-pulse shrink-0" />
                <span className="truncate max-w-[600px]">{t('landing_hero_badge' as any)}</span>
                <Sparkles size={11} className="animate-pulse shrink-0" />
            </div>

            {/* Header */}
            <header className="sticky top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-2xl border-b border-slate-100 shadow-[0_2px_24px_-4px_rgba(14,165,233,0.08)]">
                <div className="max-w-screen-xl mx-auto px-8 flex items-center justify-between gap-8" style={{height:'88px'}}>

                    {/* ── Logo ── */}
                    <Link href="/" className="flex items-center gap-3 group shrink-0">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary-400 blur-xl opacity-0 group-hover:opacity-70 transition-opacity duration-500 rounded-2xl scale-150" />
                            <div className="relative bg-gradient-to-br from-primary-400 via-primary-600 to-indigo-700 p-3 rounded-2xl shadow-lg shadow-primary-200/80 group-hover:scale-105 transition-transform duration-300">
                                <BarChart3 className="h-7 w-7 text-white drop-shadow" />
                            </div>
                        </div>
                        <div className="flex flex-col leading-none gap-1">
                            <span className="text-xl font-display font-black tracking-tight">
                                <span className="text-slate-900">Business</span>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-indigo-600">Pulse</span>
                            </span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">AI Platform</span>
                        </div>
                    </Link>

                    {/* ── Nav ── */}
                    <nav className="hidden lg:flex items-center bg-slate-50 rounded-2xl p-1.5 gap-1 border border-slate-100/80 shadow-inner shrink-0">
                        {[
                            { label: t('dashboard' as any).split(' ')[0], step: 'analytics', icon: LayoutDashboard, color: 'from-primary-500 to-cyan-500' },
                            { label: 'Magic Scanner', step: 'magic_scanner', icon: Scan, color: 'from-emerald-500 to-teal-500' },
                            { label: t('customer_intelligence' as any).split(' ').slice(0,2).join(' '), step: 'customer_intelligence', icon: BrainCircuit, color: 'from-violet-500 to-indigo-500' },
                        ].map(({ label, step, icon: Icon, color }) => (
                            <Link
                                key={step}
                                href={`/dashboard?step=${step}`}
                                className="group relative flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black text-slate-500 hover:text-white transition-all duration-300 whitespace-nowrap overflow-hidden"
                            >
                                {/* Hover background */}
                                <span className={`absolute inset-0 bg-gradient-to-r ${color} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl`} />
                                <Icon size={14} className="relative z-10 text-slate-400 group-hover:text-white transition-colors shrink-0" />
                                <span className="relative z-10 uppercase tracking-wider">{label}</span>
                            </Link>
                        ))}
                    </nav>

                    {/* ── Right Actions ── */}
                    <div className="flex items-center gap-3 shrink-0">
                        <LanguageSelector />

                        {/* Divider */}
                        <div className="w-px h-6 bg-slate-200 hidden sm:block" />

                        <Link href="/login" className="hidden sm:flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-primary-600 transition-colors px-4 py-2.5 rounded-xl hover:bg-primary-50 whitespace-nowrap">
                            <User size={15} />
                            {t('sign_in' as any)}
                        </Link>

                        <Link href="/signup" className="relative group overflow-hidden flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black text-white bg-gradient-to-r from-primary-500 via-indigo-500 to-violet-600 shadow-lg shadow-primary-200 hover:shadow-xl hover:shadow-primary-300 transition-all duration-300 hover:-translate-y-0.5 whitespace-nowrap">
                            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12" />
                            <Sparkles size={14} className="relative z-10" />
                            <span className="relative z-10">{t('start_free' as any)}</span>
                        </Link>
                    </div>
                </div>
            </header>



            <main>
                {/* ═══════════════════ HERO ═══════════════════ */}
                <section className="relative overflow-hidden pt-24 pb-40 bg-[#fafbff]">

                    {/* Animated gradient orbs */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-gradient-to-b from-primary-100/60 via-indigo-100/40 to-transparent rounded-full blur-3xl -z-10" />
                    <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-violet-200/30 rounded-full blur-3xl -z-10 animate-pulse" />
                    <div className="absolute top-40 left-0 w-[300px] h-[300px] bg-emerald-200/20 rounded-full blur-3xl -z-10" />

                    {/* Grid dot pattern */}
                    <div className="absolute inset-0 -z-10 opacity-[0.035]"
                        style={{ backgroundImage: 'radial-gradient(#0ea5e9 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

                    <div className="max-w-7xl mx-auto px-6">
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={stagger}
                            className="flex flex-col items-center text-center"
                        >
                            {/* Pill badge */}
                            <motion.div variants={fadeInUp} className="mb-8">
                                <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white border border-primary-100 shadow-md shadow-primary-100/50 text-primary-700 text-[11px] font-black uppercase tracking-[0.2em]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
                                    {t('landing_hero_badge' as any)}
                                </div>
                            </motion.div>

                            {/* Headline — unified gradient flow */}
                            <motion.h1
                                variants={fadeInUp}
                                className="text-6xl md:text-[88px] font-display font-black leading-[1.08] tracking-tight max-w-5xl mb-10"
                            >
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-950 via-teal-900 to-emerald-800">
                                    {t('landing_title' as any).split(' ').slice(0, -3).join(' ')}
                                </span>
                                <br />
                                <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-blue-600 mt-2">
                                    {t('landing_title' as any).split(' ').slice(-3).join(' ')}
                                    {/* Premium wavy underline */}
                                    <svg className="absolute -bottom-3 left-0 w-full" viewBox="0 0 400 10" preserveAspectRatio="none">
                                        <path d="M0,5 Q50,1 100,5 Q150,9 200,5 Q250,1 300,5 Q350,9 400,5" fill="none" stroke="url(#waveGrad)" strokeWidth="3.5" strokeLinecap="round"/>
                                        <defs>
                                            <linearGradient id="waveGrad" x1="0" x2="1" y1="0" y2="0">
                                                <stop offset="0%" stopColor="#059669"/>
                                                <stop offset="50%" stopColor="#14b8a6"/>
                                                <stop offset="100%" stopColor="#2563eb"/>
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                </span>
                            </motion.h1>

                            {/* Description */}
                            <motion.p
                                variants={fadeInUp}
                                className="text-xl text-slate-500 max-w-2xl font-medium leading-relaxed mb-12"
                            >
                                {t('landing_desc' as any)}
                            </motion.p>

                            {/* CTAs */}
                            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center gap-4 mb-20">
                                <Link href="/signup"
                                    className="relative group overflow-hidden flex items-center gap-3 px-8 py-4 rounded-2xl text-base font-black text-white bg-gradient-to-r from-primary-500 via-indigo-600 to-violet-600 shadow-2xl shadow-primary-200 hover:shadow-indigo-200 hover:-translate-y-1 transition-all duration-300">
                                    <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
                                    <Sparkles size={18} />
                                    {t('get_started' as any)}
                                    <ChevronRight size={18} className={isRTL ? 'rotate-180' : ''} />
                                </Link>
                                <Link href="/dashboard"
                                    className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-white border-2 border-slate-200 text-slate-700 font-black hover:border-primary-300 hover:text-primary-600 hover:-translate-y-1 transition-all duration-300 shadow-sm">
                                    {t('learn_more' as any)}
                                </Link>
                            </motion.div>

                            {/* Stats Row */}
                            <motion.div
                                variants={fadeInUp}
                                className="grid grid-cols-3 gap-8 pt-8 border-t border-slate-100 w-full max-w-2xl"
                            >
                                {[
                                    { value: '+42%', label: t('ai_revenues' as any), color: 'text-emerald-600' },
                                    { value: '3min', label: t('magic_scanner' as any), color: 'text-primary-600' },
                                    { value: '100%', label: t('secure_data' as any), color: 'text-violet-600' },
                                ].map((stat, i) => (
                                    <div key={i} className="text-center">
                                        <p className={`text-3xl font-black ${stat.color} mb-1`}>{stat.value}</p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                    </div>
                                ))}
                            </motion.div>
                        </motion.div>

                        {/* ── Dashboard Mockup ── */}
                        <motion.div
                            initial={{ opacity: 0, y: 120, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ delay: 0.7, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                            className="mt-28 relative"
                        >
                            {/* Glow behind mockup */}
                            <div className="absolute inset-x-20 -bottom-8 h-20 bg-primary-400/30 blur-3xl rounded-full" />

                            <div className="relative p-2 rounded-[2.5rem] bg-gradient-to-br from-slate-300/80 via-white/40 to-slate-400/80 shadow-[0_40px_120px_-20px_rgba(14,165,233,0.25)] border border-white/60">
                                <div className="bg-slate-50 rounded-[2.1rem] overflow-hidden">
                                    {/* Browser chrome */}
                                    <div className="bg-white border-b border-slate-100 px-6 py-3 flex items-center gap-3">
                                        <div className="flex gap-1.5">
                                            <div className="w-3 h-3 rounded-full bg-red-400" />
                                            <div className="w-3 h-3 rounded-full bg-amber-400" />
                                            <div className="w-3 h-3 rounded-full bg-emerald-400" />
                                        </div>
                                        <div className="flex-1 bg-slate-100 h-6 rounded-lg flex items-center px-3 gap-2">
                                            <div className="w-2 h-2 rounded-full bg-slate-300" />
                                            <div className="w-32 h-2 bg-slate-200 rounded-full" />
                                        </div>
                                    </div>

                                    {/* Dashboard UI */}
                                    <div className="grid grid-cols-12 gap-0 h-[380px]">
                                        {/* Sidebar */}
                                        <div className="col-span-2 bg-white border-r border-slate-100 p-4 space-y-3">
                                            <div className="w-8 h-8 rounded-xl bg-primary-600 mb-6 flex items-center justify-center">
                                                <BarChart3 size={14} className="text-white" />
                                            </div>
                                            {[1,2,3,4,5].map(i => (
                                                <div key={i} className={`h-8 rounded-xl flex items-center gap-2 px-2 ${i === 1 ? 'bg-primary-50' : ''}`}>
                                                    <div className={`w-3 h-3 rounded-md ${i === 1 ? 'bg-primary-400' : 'bg-slate-200'}`} />
                                                    <div className="flex-1 h-2 rounded-full bg-slate-100" />
                                                </div>
                                            ))}
                                        </div>

                                        {/* Main area */}
                                        <div className="col-span-10 p-6 space-y-5">
                                            {/* KPI row */}
                                            <div className="grid grid-cols-4 gap-4">
                                                {[
                                                    { color: 'bg-primary-500', light: 'bg-primary-50' },
                                                    { color: 'bg-emerald-500', light: 'bg-emerald-50' },
                                                    { color: 'bg-violet-500', light: 'bg-violet-50' },
                                                    { color: 'bg-amber-500', light: 'bg-amber-50' },
                                                ].map((c, i) => (
                                                    <div key={i} className={`${c.light} rounded-2xl p-4 border border-white`}>
                                                        <div className={`w-6 h-6 rounded-lg ${c.color} mb-3`} />
                                                        <div className="h-2 w-3/4 bg-slate-200 rounded-full mb-1.5" />
                                                        <div className="h-4 w-1/2 bg-slate-300 rounded-full" />
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Chart + sidebar */}
                                            <div className="grid grid-cols-3 gap-4 h-48">
                                                <div className="col-span-2 bg-white rounded-2xl border border-slate-100 p-4 flex flex-col">
                                                    <div className="w-24 h-2 bg-slate-100 rounded-full mb-4" />
                                                    <div className="flex-1 relative">
                                                        <svg className="w-full h-full" viewBox="0 0 300 80" preserveAspectRatio="none">
                                                            <defs>
                                                                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.3"/>
                                                                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0"/>
                                                                </linearGradient>
                                                            </defs>
                                                            <motion.path initial={{pathLength:0}} animate={{pathLength:1}} transition={{duration:2,delay:1.5}}
                                                                d="M0,70 C40,60 70,20 110,35 C150,50 180,10 220,25 C260,40 280,5 300,15 L300,80 L0,80 Z" fill="url(#g1)" />
                                                            <motion.path initial={{pathLength:0}} animate={{pathLength:1}} transition={{duration:2,delay:1.5}}
                                                                d="M0,70 C40,60 70,20 110,35 C150,50 180,10 220,25 C260,40 280,5 300,15"
                                                                fill="none" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round"/>
                                                        </svg>
                                                    </div>
                                                </div>
                                                <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
                                                    {[70, 45, 85, 60].map((pct, i) => (
                                                        <div key={i} className="space-y-1">
                                                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                <motion.div
                                                                    initial={{width:0}} animate={{width:`${pct}%`}}
                                                                    transition={{delay: 1.5 + i*0.2, duration:0.8}}
                                                                    className="h-full rounded-full bg-gradient-to-r from-primary-400 to-indigo-500"
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Floating cards */}
                            <motion.div
                                animate={{ y: [0, -14, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute -left-16 top-1/3 hidden lg:flex items-center gap-3 bg-white p-4 rounded-2xl shadow-2xl shadow-slate-200 border border-white z-20"
                            >
                                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-300">
                                    <Zap size={18} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('ai_revenues' as any)}</p>
                                    <p className="text-lg font-black text-slate-900">+42.8%</p>
                                </div>
                            </motion.div>

                            <motion.div
                                animate={{ y: [0, 14, 0] }}
                                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                className="absolute -right-16 bottom-1/3 hidden lg:flex items-center gap-3 bg-white p-4 rounded-2xl shadow-2xl shadow-slate-200 border border-white z-20"
                            >
                                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-300">
                                    <BrainCircuit size={18} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('gemini_analyses' as any)}</p>
                                    <p className="text-lg font-black text-slate-900">{t('in_progress' as any)}</p>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                </section>

                {/* ═══════════════════ FEATURES ═══════════════════ */}
                <section className="py-32 bg-white">
                    <div className="max-w-7xl mx-auto px-6">
                        <motion.div 
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                            className="text-center max-w-3xl mx-auto mb-20"
                        >
                            <motion.p 
                                initial={{ opacity: 0, scale: 0.8 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="inline-block text-xs font-black text-primary-600 uppercase tracking-[0.3em] mb-6 px-6 py-2 rounded-full bg-primary-50 border border-primary-100 shadow-sm"
                            >
                                {t('landing_header_solutions' as any)}
                            </motion.p>
                            <h2 className="text-4xl md:text-[52px] font-display font-black tracking-tight leading-[1.15]">
                                <span className="text-slate-900">
                                    {t('landing_features_title' as any).split(' ').slice(0, -3).join(' ')}
                                </span>
                                <br className="hidden md:block" />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600 drop-shadow-sm inline-block">
                                    {' '}{t('landing_features_title' as any).split(' ').slice(-3).join(' ')}
                                </span>
                            </h2>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {features.map((f, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 40 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    whileHover={{ y: -8, scale: 1.02 }}
                                    className="group relative p-8 rounded-[2rem] bg-slate-50 border border-slate-100 hover:border-primary-200 hover:bg-white hover:shadow-2xl hover:shadow-primary-100 transition-all duration-500 cursor-pointer overflow-hidden"
                                >
                                    {/* Number */}
                                    <span className="absolute top-5 right-6 text-[48px] font-black text-slate-100 group-hover:text-primary-50 transition-colors leading-none select-none">
                                        0{i+1}
                                    </span>
                                    <div className={`relative z-10 ${f.bg} ${f.color} w-14 h-14 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 shadow-sm`}>
                                        <f.icon size={26} />
                                    </div>
                                    <h3 className="relative z-10 text-xl font-display font-black text-slate-900 mb-3 tracking-tight">{f.title}</h3>
                                    <p className="relative z-10 text-slate-500 text-sm font-medium leading-relaxed mb-8">{f.desc}</p>
                                    <Link href={f.href} className="relative z-10 inline-flex items-center gap-2 text-xs font-black text-primary-600 uppercase tracking-widest group-hover:gap-4 transition-all">
                                        Explorer <ArrowRight size={14} className={isRTL ? 'rotate-180' : ''} />
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ═══════════════════ INNOVATION ═══════════════════ */}
                <section className="py-32 mx-6 mb-6 rounded-[3rem] overflow-hidden relative bg-gradient-to-br from-slate-900 via-[#0f172a] to-indigo-950 text-white">
                    {/* Decorative gradients */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-600/15 blur-[120px] rounded-full" />
                    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-violet-600/10 blur-[100px] rounded-full" />

                    {/* Grid lines */}
                    <div className="absolute inset-0 opacity-[0.04]"
                        style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

                    <div className="relative max-w-7xl mx-auto px-12 grid lg:grid-cols-2 gap-20 items-center">
                        <div className="space-y-8">
                            <div>
                                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-primary-400 text-[10px] font-black uppercase tracking-widest mb-6">
                                    <Globe2 size={12} />
                                    {t('innovation_title' as any).split(' ').slice(0,2).join(' ')}
                                </span>
                                <h2 className="text-4xl md:text-5xl font-display font-black tracking-tight leading-[1.1] text-white">
                                    {t('innovation_title' as any)}
                                </h2>
                            </div>
                            <p className="text-lg text-slate-400 font-medium leading-relaxed">
                                {t('innovation_desc' as any)}
                            </p>
                            <div className="space-y-5">
                                {[
                                    { icon: ShieldCheck, label: t('secure_data' as any), color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                                    { icon: Activity, label: t('realtime_analysis' as any), color: 'text-primary-400', bg: 'bg-primary-500/10 border-primary-500/20' },
                                    { icon: Globe2, label: 'Multilingue — FR / AR / EN', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
                                ].map((item, i) => (
                                    <div key={i} className={`flex items-center gap-4 p-4 rounded-2xl border ${item.bg}`}>
                                        <div className={`w-10 h-10 rounded-xl ${item.bg} border flex items-center justify-center ${item.color}`}>
                                            <item.icon size={20} />
                                        </div>
                                        <p className="font-bold text-white/90">{item.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Visual */}
                        <div className="relative flex items-center justify-center">
                            <div className="w-80 h-80 relative">
                                {/* Outer ring */}
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                                    className="absolute inset-0 rounded-full border-2 border-dashed border-primary-500/20"
                                />
                                {/* Middle ring */}
                                <motion.div
                                    animate={{ rotate: -360 }}
                                    transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                                    className="absolute inset-8 rounded-full border border-dashed border-indigo-500/30"
                                />
                                {/* Center */}
                                <div className="absolute inset-16 rounded-full bg-gradient-to-br from-primary-500/20 to-indigo-600/20 border border-white/10 backdrop-blur-xl flex items-center justify-center">
                                    <BrainCircuit size={80} className="text-primary-400/60 animate-pulse" />
                                </div>

                                {/* Orbiting dots */}
                                {[0, 120, 240].map((deg, i) => (
                                    <motion.div
                                        key={i}
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 10 + i * 3, repeat: Infinity, ease: 'linear' }}
                                        className="absolute inset-0"
                                        style={{ transformOrigin: 'center' }}
                                    >
                                        <div
                                            className="absolute w-3 h-3 rounded-full bg-white shadow-lg shadow-white/50"
                                            style={{ top: '0%', left: '50%', transform: `translateX(-50%) rotate(${deg}deg) translateY(0px)`, transformOrigin: '50% 160px' }}
                                        />
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══════════════════ CTA ═══════════════════ */}
                <section className="py-40 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-white via-primary-50/30 to-white" />
                    <div className="relative max-w-4xl mx-auto px-6 text-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-primary-50 border border-primary-100 shadow-sm text-primary-600 text-xs font-black uppercase tracking-[0.3em] mb-8">
                                <Sparkles size={14} className="animate-pulse" />
                                {t('start_free' as any)}
                            </div>
                            <h2 className="text-5xl md:text-7xl font-display font-black tracking-tight mb-6 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 pb-2">
                                {t('ready_to_transform' as any)}
                            </h2>
                            <p className="text-xl text-slate-500 font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
                                {t('join_merchants' as any)}
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link href="/signup"
                                    className="relative group overflow-hidden flex items-center gap-3 px-10 py-5 rounded-2xl text-base font-black text-white bg-gradient-to-r from-primary-500 to-indigo-600 shadow-2xl shadow-primary-200 hover:shadow-indigo-200 hover:-translate-y-1 transition-all duration-300">
                                    <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
                                    <Sparkles size={18} />
                                    {t('start_free' as any)}
                                </Link>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('no_card' as any)}</p>
                            </div>
                        </motion.div>
                    </div>
                </section>
            </main>

            {/* ═══════════════════ FOOTER ═══════════════════ */}
            <footer className="bg-slate-900 text-white py-16 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-12">
                        <div className="space-y-4 max-w-xs">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary-600 p-2 rounded-xl">
                                    <BarChart3 className="h-5 w-5 text-white" />
                                </div>
                                <span className="text-xl font-display font-black">Business<span className="text-primary-400">Pulse</span></span>
                            </div>
                            <p className="text-sm text-slate-400 font-medium leading-relaxed">
                                {t('landing_desc' as any).slice(0, 100)}…
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-12">
                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('landing_header_solutions' as any)}</p>
                                {[t('dashboard' as any), t('magic_scanner' as any), t('customer_intelligence' as any), t('market_basket' as any)].map(l => (
                                    <p key={l}><Link href="/dashboard" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">{l}</Link></p>
                                ))}
                            </div>
                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Compte</p>
                                {[t('sign_in' as any), t('start_free' as any)].map(l => (
                                    <p key={l}><Link href="/login" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">{l}</Link></p>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest">© 2026 {t('all_rights_reserved' as any)}</p>
                        <div className="flex gap-3">
                            {['FR', 'AR', 'EN'].map(lang => (
                                <span key={lang} className="text-[10px] font-black text-slate-600 px-2 py-1 rounded-md border border-white/5">{lang}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
