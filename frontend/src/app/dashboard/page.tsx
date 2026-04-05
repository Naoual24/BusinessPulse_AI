'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import {
    BarChart3,
    LayoutDashboard,
    Upload as UploadIcon,
    LogOut,
    TrendingUp,
    Package,
    DollarSign,
    Activity,
    ChevronRight,
    Loader2,
    Clock,
    BrainCircuit,
    Settings,
    Home,
    Sparkles,
    User,
    Scan,
    ShoppingBag,
    PanelLeftClose,
    PanelLeftOpen
} from 'lucide-react';
import UploadZone from '@/components/UploadZone';
import MappingDialog from '@/components/MappingDialog';
import AnalyticsView from '@/components/AnalyticsView';
import HistoryView from '@/components/HistoryView';
import SettingsView from '@/components/SettingsView';
import CustomerIntelligenceView from '@/components/CustomerIntelligenceView';
import DecisionSimulatorView from '@/components/DecisionSimulatorView';
import MagicScanner from '@/components/MagicScanner';
import MarketBasketView from '@/components/MarketBasketView';
import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import LanguageSelector from '@/components/LanguageSelector';
import PulseTalk from '@/components/PulseTalk';

export default function Dashboard() {
    const searchParams = useSearchParams();
    const { t, isRTL } = useLanguage();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    type Step =
        | 'upload'
        | 'mapping'
        | 'analytics'
        | 'history'
        | 'settings'
        | 'magic_scanner'
        | 'decision_simulator'
        | 'intelligence_upload'
        | 'intelligence_dashboard'
        | 'intelligence_history'
        | 'market_basket_upload'
        | 'market_basket_analysis'
        | 'market_basket_history';

    const [activeStep, setActiveStep] = useState<Step>('upload');
    const [user, setUser] = useState<any>(null);
    const [uploadId, setUploadId] = useState<number | null>(null);
    const [columns, setColumns] = useState<string[]>([]);
    const [analyticsData, setAnalyticsData] = useState<any>(null);
    const [intelligenceData, setIntelligenceData] = useState<any>(null);
    const [marketBasketData, setMarketBasketData] = useState<any>(null);
    const [latestUploadId, setLatestUploadId] = useState<number | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchProfile();
            fetchLatestUpload();
        }

        const stepParam = searchParams.get('step') as Step;
        if (stepParam) {
            if (stepParam === 'analytics') {
                setActiveStep('upload');
            } else {
                setActiveStep(stepParam);
            }
        }
    }, [searchParams]);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/users/me');
            setUser(res.data);
        } catch (err) {
            console.error("Failed to fetch profile:", err);
        }
    };

    const fetchLatestUpload = async () => {
        try {
            const res = await api.get('/analytics/history');
            if (res.data && res.data.length > 0) {
                const latestEntry = res.data[0];
                if (latestEntry.upload_id) {
                    setLatestUploadId(latestEntry.upload_id);
                }
            }
        } catch (err) {
            // Ignore history fetch errors
        }
    };
    const fetchLatestAnalysis = async () => {
        if (!latestUploadId) return;
        setLoading(true);
        try {
            const res = await api.get(`/analytics/${latestUploadId}/analytics`);
            setAnalyticsData(res.data);
        } catch (err) {
            console.error("Failed to fetch latest analysis:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeStep === 'analytics' && !analyticsData && latestUploadId) {
            fetchLatestAnalysis();
        }
    }, [activeStep, analyticsData, latestUploadId]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    };

    const onUploadSuccess = async (id: number) => {
        setUploadId(id);
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`/analytics/${id}/columns`);
            if (res.data.columns && res.data.columns.length > 0) {
                setColumns(res.data.columns);
                setActiveStep('mapping');
            } else {
                setError("No columns found in the uploaded file. Please check the file content.");
                setActiveStep('upload');
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to read file columns.");
            setActiveStep('upload');
        } finally {
            setLoading(false);
        }
    };

    const onMappingComplete = async (mapping: any) => {
        setLoading(true);
        setError(null);
        try {
            await api.post(`/analytics/${uploadId}/map`, mapping);
            const res = await api.get(`/analytics/${uploadId}/analytics`);
            setAnalyticsData(res.data);
            setActiveStep('analytics');
        } catch (err: any) {
            setError(err.response?.data?.detail || "An error occurred while analyzing your data.");
        } finally {
            setLoading(false);
        }
    };
    const handleFetchIntelligence = async (targetStep: Step = 'intelligence_dashboard') => {
        const targetId = uploadId || latestUploadId;
        if (!targetId) {
            setActiveStep('intelligence_upload');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`/analytics/${targetId}/customer-intelligence`);
            setIntelligenceData(res.data);
            setActiveStep(targetStep);
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to fetch customer intelligence.");
            setActiveStep('intelligence_upload');
        } finally {
            setLoading(false);
        }
    };

    const handleFetchMarketBasket = async (targetStep: Step = 'market_basket_analysis') => {
        const targetId = uploadId || latestUploadId;
        if (!targetId) {
            setActiveStep('market_basket_upload');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`/analytics/${targetId}/market-basket`);
            setMarketBasketData(res.data);
            setActiveStep(targetStep);
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to fetch market basket analysis.");
            setActiveStep('market_basket_upload');
        } finally {
            setLoading(false);
        }
    };

    const isIntelligenceStep =
        activeStep === 'intelligence_upload' ||
        activeStep === 'intelligence_dashboard' ||
        activeStep === 'intelligence_history';

    const isDataStep =
        activeStep === 'upload' ||
        activeStep === 'mapping' ||
        activeStep === 'analytics' ||
        activeStep === 'history';

    const isMarketBasketStep =
        activeStep === 'market_basket_upload' ||
        activeStep === 'market_basket_analysis' ||
        activeStep === 'market_basket_history';


    const sidebarItems = [
        {
            key: 'dashboard',
            icon: LayoutDashboard,
            step: 'analytics',
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            onClick: () => {
                if (analyticsData) setActiveStep('analytics');
                else setActiveStep('upload');
            }
        },
        { key: 'customer_intelligence', icon: BrainCircuit, step: 'intelligence_dashboard', color: 'text-sky-600', bg: 'bg-sky-50', onClick: () => { if (intelligenceData) setActiveStep('intelligence_dashboard'); else if (uploadId || latestUploadId) handleFetchIntelligence('intelligence_dashboard'); else setActiveStep('intelligence_upload'); } },
        { 
            key: 'market_basket', 
            icon: ShoppingBag, 
            step: 'market_basket_analysis', 
            color: 'text-blue-600', 
            bg: 'bg-blue-50', 
            onClick: () => { 
                if (marketBasketData) setActiveStep('market_basket_analysis'); 
                else if (uploadId || latestUploadId) handleFetchMarketBasket('market_basket_analysis'); 
                else setActiveStep('market_basket_upload'); 
            } 
        },
        { key: 'decision_simulator', icon: Activity, step: 'decision_simulator', color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { key: 'magic_scanner', icon: Scan, step: 'magic_scanner', color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { key: 'settings', icon: Settings, step: 'settings', color: 'text-orange-600', bg: 'bg-orange-50' },
    ];

    return (
        <div className={`flex h-screen bg-[#f8fafc] ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Sidebar */}
            <aside className={`${
                sidebarOpen ? 'w-72' : 'w-0'
            } bg-white border-r flex flex-col z-30 relative transition-all duration-300 overflow-hidden ${isRTL ? 'border-l border-r-0' : 'border-r'}`}>
                <Link href="/" className="p-8 flex items-center gap-3 hover:opacity-80 transition-opacity group">
                    <div className="bg-primary-600 p-2 rounded-xl shadow-lg shadow-primary-100 group-hover:scale-110 transition-transform">
                        <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-xl font-display font-black tracking-tight text-slate-900">BusinessPulse</span>
                </Link>

                <nav className="flex-1 px-6 space-y-1.5 overflow-y-auto pt-2">
                    <Link
                        href="/"
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200 text-slate-500 hover:text-primary-600 hover:bg-primary-50 group mb-4"
                    >
                        <Home size={20} className="group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-sm">Accueil</span>
                    </Link>

                    {sidebarItems.map((item: any) => {
                        const isActive = (item.key === 'dashboard' && isDataStep) ||
                            (item.key === 'customer_intelligence' && isIntelligenceStep) ||
                            (item.key === 'market_basket' && isMarketBasketStep) ||
                            (item.step === activeStep);
                        return (
                            <div key={item.key} className="space-y-1">
                                <button
                                    disabled={item.disabled}
                                    className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200 group relative ${isActive ? `${item.bg} ${item.color}` : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'} ${item.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                                    onClick={item.onClick || (() => setActiveStep(item.step as Step))}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="active-pill"
                                            className={`absolute inset-0 rounded-xl border-l-4 ${item.key === 'customer_intelligence' ? 'border-sky-500' : 'border-primary-600'} pointer-events-none`}
                                        />
                                    )}
                                    <item.icon size={20} className={`${isActive ? '' : 'group-hover:scale-110'} transition-transform`} />
                                    <span className="font-bold text-sm">{t(item.key as any)}</span>
                                    {isActive && (item.key === 'dashboard' || item.key === 'customer_intelligence') && (
                                        <ChevronRight size={14} className={`ml-auto transition-transform ${isActive ? 'rotate-90' : ''}`} />
                                    )}
                                </button>

                                {isActive && item.key === 'dashboard' && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="ml-10 mt-2 space-y-1 border-l-2 border-primary-100 pl-4 py-2"
                                    >
                                        {[
                                            { key: 'upload', label: t('importation' as any), isActive: activeStep === 'upload' || activeStep === 'mapping', icon: UploadIcon },
                                            { key: 'analytics', label: t('analytics_sub' as any), isActive: activeStep === 'analytics', icon: BarChart3, disabled: !analyticsData },
                                            { key: 'history', label: t('history_sub' as any), isActive: activeStep === 'history', icon: Clock },
                                        ].map((sub) => (
                                            <button
                                                key={sub.key}
                                                disabled={sub.disabled}
                                                className={`flex items-center gap-2 text-xs text-left w-full px-3 py-2 rounded-lg transition-colors font-bold ${sub.isActive ? 'bg-primary-100 text-primary-700' : 'text-slate-500 hover:bg-slate-50'} ${sub.disabled ? 'opacity-30 grayscale cursor-not-allowed' : ''}`}
                                                onClick={() => setActiveStep(sub.key as Step)}
                                            >
                                                <sub.icon size={14} />
                                                {sub.label}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}

                                {isActive && item.key === 'customer_intelligence' && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="ml-10 mt-2 space-y-1 border-l-2 border-sky-100 pl-4 py-2"
                                    >
                                        {[
                                            { key: 'intelligence_upload', label: '📂 Importation', isActive: activeStep === 'intelligence_upload' },
                                            { key: 'intelligence_dashboard', label: '📊 Dashboard IA', isActive: activeStep === 'intelligence_dashboard' },
                                            { key: 'intelligence_history', label: '📋 Historique IA', isActive: activeStep === 'intelligence_history' },
                                        ].map((sub) => (
                                            <button
                                                key={sub.key}
                                                className={`text-xs text-left w-full px-3 py-2 rounded-lg transition-colors font-bold ${sub.isActive ? 'bg-sky-100 text-sky-700' : 'text-slate-500 hover:bg-slate-50'}`}
                                                onClick={() => setActiveStep(sub.key as Step)}
                                            >
                                                {sub.label}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}

                                {isActive && item.key === 'market_basket' && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="ml-10 mt-2 space-y-1 border-l-2 border-blue-100 pl-4 py-2"
                                    >
                                        {[
                                            { key: 'market_basket_upload', label: t('mba_upload' as any), isActive: activeStep === 'market_basket_upload' },
                                            { key: 'market_basket_analysis', label: t('mba_analysis' as any), isActive: activeStep === 'market_basket_analysis' },
                                            { key: 'market_basket_history', label: t('mba_history' as any), isActive: activeStep === 'market_basket_history' },
                                        ].map((sub) => (
                                            <button
                                                key={sub.key}
                                                className={`text-xs text-left w-full px-3 py-2 rounded-lg transition-colors font-bold ${sub.isActive ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}
                                                onClick={() => setActiveStep(sub.key as Step)}
                                            >
                                                {sub.label}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </div>
                        )
                    })}


                    <div className="pt-8 mt-4 border-t border-slate-100">
                        <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black px-4 mb-4 block">
                            {t('language' as any)}
                        </label>
                        <div className="px-1"><LanguageSelector /></div>
                    </div>
                </nav>

                <div className="p-6 border-t border-slate-100 space-y-3">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all font-bold text-sm group"
                    >
                        <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span>{t('logout' as any)}</span>
                    </button>

                    {user && (
                        <div className="flex items-center gap-3 px-4 py-3 bg-slate-900 rounded-2xl text-white shadow-lg shadow-slate-200">
                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-black ring-2 ring-white/10 uppercase">
                                {user.email?.substring(0, 2)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-black truncate">{user.email}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t('welcome' as any)}</p>
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            <main className="flex-1 overflow-auto flex flex-col relative">
                {/* Header */}
                <header className="h-20 bg-white/80 backdrop-blur-md border-b sticky top-0 z-20 px-10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {/* Sidebar Toggle */}
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-primary-300 text-slate-500 hover:text-primary-600 transition-all shadow-sm"
                            title={sidebarOpen ? 'Masquer le menu' : 'Afficher le menu'}
                        >
                            <motion.div
                                animate={{ rotate: sidebarOpen ? 0 : 180 }}
                                transition={{ duration: 0.3 }}
                            >
                                {sidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
                            </motion.div>
                        </button>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-primary-600 uppercase tracking-[0.2em] mb-1">BusinessPulse System</span>
                            <h1 className="text-xl font-display font-black text-slate-900 tracking-tight">
                                {activeStep === 'upload'
                                    ? t('upload_your_data' as any)
                                    : activeStep === 'mapping'
                                        ? t('analysis_history' as any)
                                        : activeStep === 'settings'
                                            ? t('profile_settings' as any)
                                            : isIntelligenceStep
                                                ? t('customer_intelligence' as any)
                                                : isMarketBasketStep
                                                    ? t('market_basket' as any)
                                                    : activeStep === 'magic_scanner'
                                                        ? t('magic_scanner' as any)
                                                        : activeStep === 'decision_simulator'
                                                            ? t('decision_simulator' as any)
                                                    : t('operational_overview' as any)}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <Link href="/" className="hidden lg:flex items-center gap-2 text-xs font-black text-slate-400 hover:text-primary-600 transition-colors uppercase tracking-widest border border-slate-200 px-3 py-1.5 rounded-lg">
                            <Home size={14} />
                            Retour au Site
                        </Link>
                        <div className="flex flex-col text-right">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Status</span>
                            <span className="flex items-center gap-1.5 text-[11px] font-black text-green-600 uppercase">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                Live System
                            </span>
                        </div>
                    </div>
                </header>

                <div className="p-8 lg:p-12 max-w-7xl mx-auto w-full flex-1">
                    <AnimatePresence mode="wait">
                        {error ? (
                            <motion.div
                                key="error"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="mb-8 p-6 bg-red-50 border border-red-100 text-red-700 flex items-center gap-4 rounded-3xl shadow-sm"
                            >
                                <div className="bg-red-100 p-2 rounded-xl">
                                    <Activity className="h-5 w-5 text-red-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-black text-sm uppercase tracking-widest mb-1.5">Attention</p>
                                    <p className="font-medium text-sm leading-relaxed">{error}</p>
                                </div>
                                <button onClick={() => setError(null)} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-red-100 transition-colors text-red-700 font-bold">
                                    ✕
                                </button>
                            </motion.div>
                        ) : null}

                        {loading ? (
                            <motion.div
                                key="loader"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center h-[50vh]"
                            >
                                <div className="relative">
                                    <Loader2 className="h-16 w-16 text-primary-600 animate-spin" />
                                    <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-primary-400 animate-pulse" />
                                </div>
                                <p className="mt-8 text-slate-500 font-display font-black text-xl tracking-tight">{t('processing_data' as any)}</p>
                                <p className="mt-2 text-slate-400 text-sm font-medium">L'IA de BusinessPulse analyse vos données...</p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key={activeStep}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="min-h-[60vh]"
                            >
                                {activeStep === 'upload' && <UploadZone onSuccess={onUploadSuccess} />}
                                {activeStep === 'mapping' && <MappingDialog columns={columns} onComplete={onMappingComplete} />}
                                {activeStep === 'analytics' && (
                                    analyticsData ? (
                                        <AnalyticsView data={analyticsData} user={user} />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-[50vh] bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center">
                                            <div className="bg-primary-50 p-6 rounded-3xl mb-6">
                                                <BarChart3 className="h-12 w-12 text-primary-600" />
                                            </div>
                                            <h3 className="text-2xl font-display font-black text-slate-900 mb-2">Pas encore d'analyses</h3>
                                            <p className="text-slate-500 max-w-sm mb-8">Importez vos données de ventes (CSV/Excel) pour générer votre premier tableau de bord intelligent.</p>
                                            <button 
                                                onClick={() => setActiveStep('upload')}
                                                className="btn-primary px-8"
                                            >
                                                Commencer maintenant
                                            </button>
                                        </div>
                                    )
                                )}
                                {activeStep === 'history' && (
                                    <HistoryView onViewAnalysis={(data) => {
                                        setAnalyticsData(data);
                                        setActiveStep('analytics');
                                    }} />
                                )}
                                {activeStep === 'settings' && <SettingsView />}
                                {isIntelligenceStep && (
                                    <CustomerIntelligenceView
                                        intelligence={intelligenceData}
                                        user={user}
                                        activeTabExternal={
                                            activeStep === 'intelligence_upload' ? 'upload' :
                                                activeStep === 'intelligence_history' ? 'history' : 'analysis'
                                        }
                                        onTabChange={(tab: string) => {
                                            if (tab === 'upload') setActiveStep('intelligence_upload');
                                            else if (tab === 'history') setActiveStep('intelligence_history');
                                            else setActiveStep('intelligence_dashboard');
                                        }}
                                        onIntelligenceUpdate={(data: any) => setIntelligenceData(data)}
                                    />
                                )}
                                 {activeStep === 'magic_scanner' && (
                                    <MagicScanner 
                                        onNavigateToDashboard={() => setActiveStep('analytics')} 
                                    />
                                )}
                                {activeStep === 'decision_simulator' && <DecisionSimulatorView uploadId={uploadId || latestUploadId || 0} />}
                                {isMarketBasketStep && (
                                    <MarketBasketView
                                        data={marketBasketData}
                                        user={user}
                                        activeTabExternal={
                                            activeStep === 'market_basket_upload' ? 'upload' :
                                                activeStep === 'market_basket_history' ? 'history' : 'analysis'
                                        }
                                        onTabChange={(tab: string) => {
                                            if (tab === 'upload') setActiveStep('market_basket_upload');
                                            else if (tab === 'history') setActiveStep('market_basket_history');
                                            else setActiveStep('market_basket_analysis');
                                        }}
                                        onDataUpdate={(data: any) => setMarketBasketData(data)}
                                    />
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <footer className="py-8 px-12 border-t border-slate-100 bg-white/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex justify-between items-center">
                    <span>© 2024 BusinessPulse Engine v2.1.0</span>
                    <div className="flex gap-6">
                        <Link href="/" className="hover:text-primary-600 transition-colors">Documentation</Link>
                        <Link href="/" className="hover:text-primary-600 transition-colors">API Status</Link>
                    </div>
                </footer>
                <PulseTalk uploadId={uploadId || latestUploadId} />
            </main>
        </div>
    );
}
