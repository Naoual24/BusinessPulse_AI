'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Calendar,
    FileText,
    ArrowRight,
    Package,
    DollarSign,
    Loader2,
    Clock,
    Search,
    ChevronRight,
    History
} from 'lucide-react';
import api from '@/lib/api';
import { useLanguage } from '@/lib/LanguageContext';

interface HistoryItem {
    id: number;
    filename: string;
    total_sales: string;
    total_profit: string;
    top_product: string;
    full_data: any;
    created_at: string;
}

export default function HistoryView({ onViewAnalysis }: { onViewAnalysis: (data: any) => void }) {
    const { t, isRTL } = useLanguage();
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await api.get('/analytics/history');
                setHistory(res.data);
            } catch (err) {
                console.error("Failed to fetch history:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const filteredHistory = history.filter(item =>
        item.filename.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh]">
                <Loader2 className="h-12 w-12 text-primary-600 animate-spin" />
                <p className="mt-4 text-slate-500 font-black text-sm uppercase tracking-widest">{t('processing_data' as any)}</p>
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-16 rounded-[2.5rem] shadow-sm border border-slate-100 text-center"
            >
                <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 border border-slate-100">
                    <History className="h-10 w-10 text-slate-300" />
                </div>
                <h3 className="text-2xl font-display font-black text-slate-900 mb-3">
                    {isRTL ? 'لا يوجد سجل بعد' : 'Aucun historique'}
                </h3>
                <p className="text-slate-500 max-w-md mx-auto font-medium leading-relaxed">
                    {isRTL ? 'قم بتحميل أول ملف بيانات مبيعاتك لبدء بناء سجل تحليلاتك.' : 'Importez votre premier fichier de données pour commencer à construire votre historique d\'analyses opérationnelles.'}
                </p>
            </motion.div>
        );
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const itemVariants = {
        hidden: { x: -20, opacity: 0 },
        visible: { x: 0, opacity: 1 }
    };

    return (
        <div className={`space-y-8 ${isRTL ? 'font-arabic' : ''}`}>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-primary-50 p-2 rounded-xl">
                            <History className="h-6 w-6 text-primary-600" />
                        </div>
                        <h2 className="text-2xl font-display font-black text-slate-900 tracking-tight">{t('analysis_history' as any)}</h2>
                    </div>
                    <p className="text-slate-500 text-sm font-medium">Consultez et restaurez vos rapports d'analyses opérationnelles précédents.</p>
                </div>

                <div className="relative w-full md:w-72">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Rechercher un rapport..."
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-bold text-sm text-slate-900 placeholder:text-slate-400"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 gap-4"
            >
                {filteredHistory.map((item) => (
                    <motion.div
                        key={item.id}
                        variants={itemVariants}
                        whileHover={{ x: 10 }}
                        className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-100 hover:border-primary-200 hover:shadow-xl hover:shadow-primary-100/20 transition-all group overflow-hidden relative"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50/20 blur-2xl -z-10 translate-x-1/2 -translate-y-1/2" />

                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                            <div className="flex items-center gap-5">
                                <div className="bg-slate-50 p-4 rounded-2xl text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <h4 className="font-display font-black text-slate-900 group-hover:text-primary-600 transition-colors text-lg">
                                        {item.filename}
                                    </h4>
                                    <div className="flex items-center gap-4 mt-2">
                                        <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <Calendar size={12} className="text-primary-400" />
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </div>
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                        <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <Package size={12} className="text-orange-400" />
                                            {item.top_product}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between lg:justify-end gap-10 border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-10">
                                <div className="flex flex-col">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{t('total_sales' as any)}</p>
                                    <p className="text-2xl font-display font-black text-emerald-600">
                                        {item.total_sales.replace('$', '')}
                                        <span className="text-sm ml-1 opacity-60">CAP</span>
                                    </p>
                                </div>
                                <button
                                    onClick={() => onViewAnalysis(item.full_data)}
                                    className="btn-primary h-12 px-6 gap-2 group/btn"
                                >
                                    <span className="hidden sm:inline font-bold text-sm">Restaurer l'analyse</span>
                                    <span className="sm:hidden font-bold text-sm">Voir</span>
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}

                {filteredHistory.length === 0 && (
                    <div className="py-20 text-center bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200 mt-4">
                        <p className="text-slate-500 font-bold">Aucun résultat pour cette recherche.</p>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
