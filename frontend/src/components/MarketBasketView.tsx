'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShoppingBag, TrendingUp, Calendar, Info, ArrowRight,
    Upload, Clock, FileText, Loader2, Sparkles, Activity, FileSearch
} from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import api from '@/lib/api';
import MappingDialog from './MappingDialog';
import MarketBasketAnalysis from './MarketBasketAnalysis';

interface HistoryEntry {
    id: number;
    filename: string;
    total_sales: string;
    created_at: string;
    upload_id: number;
    analysis_type: string;
}

type MBA_Tab = 'analysis' | 'upload' | 'history';

export default function MarketBasketView({
    data: initialData,
    user,
    activeTabExternal,
    onTabChange,
    onDataUpdate,
}: {
    data: any;
    user?: any;
    activeTabExternal?: MBA_Tab;
    onTabChange?: (tab: MBA_Tab) => void;
    onDataUpdate?: (data: any) => void;
}) {
    const { t, isRTL, language } = useLanguage();
    const [activeTab, setActiveTab] = useState<MBA_Tab>(
        initialData?.top_rules ? 'analysis' : 'upload'
    );
    const [marketBasketData, setMarketBasketData] = useState(initialData);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [pendingUploadId, setPendingUploadId] = useState<number | null>(null);
    const [pendingColumns, setPendingColumns] = useState<string[]>([]);
    const [showMapping, setShowMapping] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const hasData = marketBasketData?.top_rules?.length > 0 || marketBasketData?.best_opportunities?.length > 0;

    const getMBAUploadIds = (): number[] => {
        try {
            const stored = localStorage.getItem('mba_upload_ids');
            return stored ? JSON.parse(stored) : [];
        } catch { return []; }
    };

    const saveMBAUploadId = (id: number) => {
        const existing = getMBAUploadIds();
        if (!existing.includes(id)) {
            localStorage.setItem('mba_upload_ids', JSON.stringify([id, ...existing]));
        }
    };

    const fetchHistory = useCallback(async () => {
        setHistoryLoading(true);
        try {
            const res = await api.get('/analytics/history');
            const mbaIds = getMBAUploadIds();
            const filtered = (res.data || []).filter((item: HistoryEntry) =>
                item.analysis_type === 'mba' || mbaIds.includes(item.upload_id)
            );
            setHistory(filtered);
        } catch {
        } finally {
            setHistoryLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'history') {
            fetchHistory();
        }
    }, [activeTab, fetchHistory]);

    useEffect(() => {
        setMarketBasketData(initialData);
        if (initialData?.top_rules?.length > 0 || initialData?.best_opportunities?.length > 0) {
            setActiveTab('analysis');
        }
    }, [initialData]);

    const setActiveTabControlled = (tab: MBA_Tab) => {
        setActiveTab(tab);
        onTabChange?.(tab);
    };

    useEffect(() => {
        if (activeTabExternal && activeTabExternal !== activeTab) {
            setActiveTab(activeTabExternal);
        }
    }, [activeTabExternal]);

    const handleFileUpload = async (file: File) => {
        setUploadLoading(true);
        setUploadError(null);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const uploadRes = await api.post('/analytics/upload', formData);
            const uploadId = uploadRes.data.id;
            const colRes = await api.get(`/analytics/${uploadId}/columns`);
            if (colRes.data.columns?.length > 0) {
                setPendingUploadId(uploadId);
                setPendingColumns(colRes.data.columns);
                setShowMapping(true);
            } else {
                setUploadError('Aucune colonne trouvée dans le fichier.');
            }
        } catch (err: any) {
            setUploadError(err.response?.data?.detail || 'Erreur lors du téléchargement.');
        } finally {
            setUploadLoading(false);
        }
    };

    const handleMappingComplete = async (mapping: any) => {
        if (!pendingUploadId) return;
        setUploadLoading(true);
        setShowMapping(false);
        try {
            await api.post(`/analytics/${pendingUploadId}/map`, mapping);
            const res = await api.get(`/analytics/${pendingUploadId}/market-basket`);
            if (res.data.error) {
                setUploadError(res.data.error);
                setActiveTabControlled('upload');
            } else {
                setMarketBasketData(res.data);
                onDataUpdate?.(res.data);
                saveMBAUploadId(pendingUploadId);
                setActiveTabControlled('analysis');
            }
        } catch (err: any) {
            setUploadError(err.response?.data?.detail || 'Erreur lors de l\'analyse.');
            setActiveTabControlled('upload');
        } finally {
            setUploadLoading(false);
        }
    };

    const handleHistoryClick = async (uploadId: number) => {
        setUploadLoading(true);
        setActiveTabControlled('analysis');
        try {
            const res = await api.get(`/analytics/${uploadId}/market-basket`);
            setMarketBasketData(res.data);
            onDataUpdate?.(res.data);
        } catch (err: any) {
            setUploadError(err.response?.data?.detail || 'Erreur lors du chargement.');
        } finally {
            setUploadLoading(false);
        }
    };

    return (
        <div className={`space-y-8 focus:outline-none ${isRTL ? 'font-arabic' : ''}`}>
            {/* ── UPLOAD TAB ── */}
            {activeTab === 'upload' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-[2rem] shadow-glass-lg overflow-hidden border border-white/40"
                >
                    {showMapping && pendingColumns.length > 0 ? (
                        <div className="p-8">
                            <MappingDialog columns={pendingColumns} onComplete={handleMappingComplete} />
                        </div>
                    ) : (
                        <div className="flex flex-col lg:flex-row min-h-[500px]">
                            {/* Left panel - info */}
                            <div className="bg-slate-900 text-white p-10 lg:w-80 flex flex-col justify-between relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 blur-3xl -translate-y-1/2 translate-x-1/2" />
                                <div className="relative z-10">
                                    <div className="bg-primary-50/10 p-4 rounded-2xl w-fit mb-8 border border-white/10 backdrop-blur-md">
                                        <ShoppingBag className="h-8 w-8 text-primary-400" />
                                    </div>
                                    <h3 className="text-2xl font-display font-black mb-4 tracking-tight">{t('market_basket' as any)}</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed font-medium">
                                        {t('market_basket_desc' as any)}
                                    </p>
                                </div>
                                <div className="mt-12 space-y-4 relative z-10">
                                    <p className="text-primary-400 text-[10px] uppercase font-black tracking-[0.2em]">{t('data_requirements' as any)}</p>
                                    <div className="space-y-3">
                                        {[t('col_transaction_id' as any), t('col_product_name' as any), t('total_sales' as any), t('date_label' as any)].map(col => (
                                            <div key={col} className="flex items-center gap-3 text-sm text-slate-300 font-medium">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary-500 shadow-lg shadow-primary-500/50" />
                                                {col}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right panel - drop zone */}
                            <div className="flex-1 p-10 flex flex-col items-center justify-center gap-8 bg-white/30 backdrop-blur-sm self-stretch">
                                {uploadError && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="bg-red-50 text-red-700 border border-red-100 rounded-2xl px-6 py-4 text-sm w-full max-w-lg text-center font-bold"
                                    >
                                        ⚠️ {uploadError}
                                    </motion.div>
                                )}

                                <div
                                    className="w-full max-w-xl border-2 border-dashed border-slate-200 rounded-[2rem] p-16 flex flex-col items-center gap-6 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-all group relative bg-white/50"
                                    onClick={() => !uploadLoading && fileInputRef.current?.click()}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        const file = e.dataTransfer.files[0];
                                        if (file && !uploadLoading) handleFileUpload(file);
                                    }}
                                >
                                    {uploadLoading ? (
                                        <>
                                            <div className="relative">
                                                <Loader2 className="h-16 w-16 text-primary-600 animate-spin" />
                                                <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-primary-400 animate-pulse" />
                                            </div>
                                            <div>
                                                <p className="text-slate-900 font-display font-black text-xl mb-2">{t('calculating_mba' as any)}</p>
                                                <p className="text-slate-500 text-sm font-medium">{t('apriori_running' as any)}</p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="bg-primary-50 group-hover:bg-primary-100 transition-colors p-6 rounded-[1.5rem] relative">
                                                <Upload className="h-12 w-12 text-primary-600 group-hover:scale-110 transition-transform" />
                                                <div className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-full shadow-sm">
                                                    <div className="bg-emerald-500 w-2 h-2 rounded-full" />
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-slate-900 font-display font-black text-2xl mb-2 tracking-tight">{t('upload_your_sales' as any)}</p>
                                                <p className="text-slate-500 text-sm font-medium">{t('supported_formats_short' as any)}</p>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv,.xlsx,.xls"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFileUpload(file);
                                        e.target.value = '';
                                    }}
                                />

                                <button
                                    onClick={() => !uploadLoading && fileInputRef.current?.click()}
                                    disabled={uploadLoading}
                                    className="btn-primary px-10 py-4 h-14 text-base gap-3 group"
                                >
                                    <Upload className="h-5 w-5 group-hover:-translate-y-1 transition-transform" />
                                    <span>{t('browse_files' as any)}</span>
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            )}

            {/* ── HISTORY TAB ── */}
            {activeTab === 'history' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-10"
                >
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-2xl font-display font-black text-slate-900 tracking-tight flex items-center gap-3">
                                <Clock className="h-7 w-7 text-primary-600" />
                                {t('mba_history_title' as any)}
                            </h3>
                            <p className="text-slate-500 font-medium text-sm mt-1">{t('mba_history_desc' as any)}</p>
                        </div>
                        <button onClick={fetchHistory} className="p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors text-slate-600">
                            <Activity className="h-5 w-5" />
                        </button>
                    </div>

                    {historyLoading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <Loader2 className="h-12 w-12 text-primary-600 animate-spin" />
                            <p className="text-slate-500 font-black text-sm uppercase tracking-widest">{t('fetching_archives' as any)}</p>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-32 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                            <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100">
                                <FileSearch className="h-8 w-8 text-slate-300" />
                            </div>
                            <p className="text-slate-900 font-display font-black text-xl mb-2">{t('no_mba_history' as any)}</p>
                            <p className="text-slate-400 font-medium text-sm">{t('no_mba_history_desc' as any)}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {history.map((item, i) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all border border-transparent hover:border-slate-100 group"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className="bg-white p-4 rounded-2xl shadow-sm group-hover:bg-primary-50 transition-colors">
                                            <FileText className="h-6 w-6 text-slate-400 group-hover:text-primary-600 transition-colors" />
                                        </div>
                                        <div>
                                            <p className="font-display font-black text-slate-900 group-hover:text-primary-600 transition-colors">{item.filename}</p>
                                            <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(item.created_at).toLocaleDateString('fr-FR')}
                                                <span className="text-slate-200">|</span>
                                                <span className="text-emerald-600 font-black">MBA Analysis</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleHistoryClick(item.upload_id)}
                                        className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white shadow-sm hover:bg-primary-600 hover:text-white transition-all group/btn"
                                    >
                                        <ArrowRight className="h-5 w-5 group-hover/btn:translate-x-1 transition-transform" />
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}

            {/* ── ANALYSIS TAB ── */}
            {activeTab === 'analysis' && (
                <AnimatePresence mode="wait">
                    {!hasData ? (
                        <motion.div
                            key="no-data"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center py-32 bg-white rounded-[2rem] border border-slate-100 shadow-sm"
                        >
                            <div className="bg-amber-50 p-6 rounded-full mb-8">
                                <ShoppingBag className="h-12 w-12 text-amber-500" />
                            </div>
                            <h3 className="text-2xl font-display font-black text-slate-900 mb-3">
                                {marketBasketData?.message ? 'Analyse Limitée' : t('data_unavailable' as any)}
                            </h3>
                            <p className="text-slate-500 text-center max-w-md font-medium mb-10 leading-relaxed">
                                {marketBasketData?.message || t('upload_first_mba' as any)}
                            </p>
                            <button
                                onClick={() => setActiveTabControlled('upload')}
                                className="btn-primary h-12 px-8"
                            >
                                <Upload className="h-5 w-5 mr-3" />
                                {t('start_import' as any)}
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <MarketBasketAnalysis data={marketBasketData} />
                        </motion.div>
                    )}
                </AnimatePresence>
            )}
        </div>
    );
}
