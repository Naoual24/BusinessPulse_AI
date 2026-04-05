'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Target, Zap, TrendingUp,
    Search, ArrowUpRight, Sparkles, ShieldAlert, Download,
    ChevronDown, ChevronUp, Upload, Clock, FileText,
    Calendar, Loader2, BrainCircuit, ArrowRight, Activity, Filter, Info
} from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
    Legend
} from 'recharts';
import api from '@/lib/api';
import MappingDialog from './MappingDialog';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const COLORS = ['#0ea5e9', '#f59e0b', '#ef4444', '#10b981', '#6366f1'];
const SEGMENT_COLORS: Record<string, string> = {
    'Faithful Premium': 'text-emerald-600 bg-emerald-50 border-emerald-100',
    'At Risk': 'text-orange-600 bg-orange-50 border-orange-100',
    'Sleeping Clients': 'text-red-600 bg-red-50 border-red-100',
    'New Clients': 'text-sky-600 bg-sky-50 border-sky-100',
};

interface Customer {
    id: string;
    recency: number;
    frequency: number;
    monetary: number;
    segment: string;
    churn_probability: number;
    clv: number;
}

interface HistoryEntry {
    id: number;
    filename: string;
    total_sales: string;
    created_at: string;
    upload_id: number;
    analysis_type: string;
}

type IntelligenceTab = 'analysis' | 'upload' | 'history';

export default function CustomerIntelligenceView({
    intelligence: initialIntelligence,
    user,
    activeTabExternal,
    onTabChange,
    onIntelligenceUpdate,
}: {
    intelligence: any;
    user?: any;
    activeTabExternal?: IntelligenceTab;
    onTabChange?: (tab: IntelligenceTab) => void;
    onIntelligenceUpdate?: (data: any) => void;
}) {
    const { t, isRTL } = useLanguage();
    const [activeTab, setActiveTab] = useState<IntelligenceTab>(
        initialIntelligence?.segmentation ? 'analysis' : 'upload'
    );
    const [intelligence, setIntelligence] = useState(initialIntelligence);
    const [search, setSearch] = useState('');
    const [segmentFilter, setSegmentFilter] = useState('');
    const [sortField, setSortField] = useState<keyof Customer>('monetary');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [isExportingPDF, setIsExportingPDF] = useState(false);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [pendingUploadId, setPendingUploadId] = useState<number | null>(null);
    const [pendingColumns, setPendingColumns] = useState<string[]>([]);
    const [showMapping, setShowMapping] = useState(false);
    const analysisRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const hasData = intelligence?.segmentation?.customers?.length > 0;
    const segmentation = intelligence?.segmentation || {};
    const marketing_actions = intelligence?.marketing_actions || [];
    const insights = intelligence?.insights || { avg_clv: 0, high_risk_count: 0 };
    const customers: Customer[] = segmentation.customers || [];
    const segments = segmentation.segments || [];

    const currencySymbol = useMemo(() => {
        const syms: Record<string, string> = { 'MAD': 'DH', 'USD': '$', 'EUR': '€' };
        return syms[user?.currency || 'MAD'] || (user?.currency || 'DH');
    }, [user]);

    const getIntelligenceUploadIds = (): number[] => {
        try {
            const stored = localStorage.getItem('intelligence_upload_ids');
            return stored ? JSON.parse(stored) : [];
        } catch { return []; }
    };

    const saveIntelligenceUploadId = (id: number) => {
        const existing = getIntelligenceUploadIds();
        if (!existing.includes(id)) {
            localStorage.setItem('intelligence_upload_ids', JSON.stringify([id, ...existing]));
        }
    };

    const fetchHistory = useCallback(async () => {
        setHistoryLoading(true);
        try {
            const res = await api.get('/analytics/history');
            const intelligenceIds = getIntelligenceUploadIds();
            const filtered = (res.data || []).filter((item: HistoryEntry) =>
                item.analysis_type === 'intelligence' || intelligenceIds.includes(item.upload_id)
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
        setIntelligence(initialIntelligence);
        if (initialIntelligence?.segmentation?.customers?.length > 0) {
            setActiveTab('analysis');
        }
    }, [initialIntelligence]);

    const setActiveTabControlled = (tab: IntelligenceTab) => {
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
            const res = await api.get(`/analytics/${pendingUploadId}/customer-intelligence`);
            setIntelligence(res.data);
            onIntelligenceUpdate?.(res.data);
            saveIntelligenceUploadId(pendingUploadId);
            setActiveTabControlled('analysis');
        } catch (err: any) {
            setUploadError(err.response?.data?.detail || 'Erreur lors de l\'analyse.');
        } finally {
            setUploadLoading(false);
        }
    };

    const handleHistoryClick = async (uploadId: number) => {
        setUploadLoading(true);
        setActiveTabControlled('analysis');
        try {
            const res = await api.get(`/analytics/${uploadId}/customer-intelligence`);
            setIntelligence(res.data);
            onIntelligenceUpdate?.(res.data);
        } catch (err: any) {
            setUploadError(err.response?.data?.detail || 'Erreur lors du chargement.');
        } finally {
            setUploadLoading(false);
        }
    };

    const handleExportPDF = async () => {
        if (!analysisRef.current) return;
        setIsExportingPDF(true);
        try {
            const canvas = await html2canvas(analysisRef.current, {
                scale: 3, useCORS: true, backgroundColor: '#ffffff',
                logging: false
            });
            const imgData = canvas.toDataURL('image/jpeg', 0.9);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const margin = 10;
            const contentWidth = pdfWidth - (2 * margin);
            const contentHeight = (canvas.height * contentWidth) / canvas.width;

            pdf.setFillColor(2, 132, 199);
            pdf.rect(0, 0, pdfWidth, 40, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(24);
            pdf.text('Intelligence Client Report', 15, 20);
            pdf.addImage(imgData, 'JPEG', margin, 45, contentWidth, contentHeight);
            pdf.save(`Intelligence_Report_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (e) {
            console.error('PDF export error:', e);
        } finally {
            setIsExportingPDF(false);
        }
    };

    const filteredCustomers = useMemo(() => {
        return customers
            .filter(c => {
                const matchesSearch = c.id.toLowerCase().includes(search.toLowerCase());
                const matchesSegment = !segmentFilter || c.segment === segmentFilter;
                return matchesSearch && matchesSegment;
            })
            .sort((a, b) => {
                const aVal = a[sortField];
                const bVal = b[sortField];
                if (typeof aVal === 'string' && typeof bVal === 'string') {
                    return sortOrder === 'desc' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
                }
                return sortOrder === 'desc' ? (Number(bVal) - Number(aVal)) : (Number(aVal) - Number(bVal));
            });
    }, [customers, search, segmentFilter, sortField, sortOrder]);

    const handleSort = (field: keyof Customer) => {
        if (sortField === field) setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
        else { setSortField(field); setSortOrder('desc'); }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
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
                                    <div className="bg-primary-500/20 p-4 rounded-2xl w-fit mb-8 border border-white/10 backdrop-blur-md">
                                        <BrainCircuit className="h-8 w-8 text-primary-400" />
                                    </div>
                                    <h3 className="text-2xl font-display font-black mb-4 tracking-tight">Intelligence Client IA</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed font-medium">
                                        Exploitez la puissance de l'IA pour segmenter automatiquement votre base client et prédire les comportements futurs.
                                    </p>
                                </div>
                                <div className="mt-12 space-y-4 relative z-10">
                                    <p className="text-primary-400 text-[10px] uppercase font-black tracking-[0.2em]">Exigences Système</p>
                                    <div className="space-y-3">
                                        {['Date de transaction', 'ID/Nom Client', 'Libellé Produit', 'Montant Vente'].map(col => (
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
                                                <p className="text-slate-900 font-display font-black text-xl mb-2">Calcul en cours...</p>
                                                <p className="text-slate-500 text-sm font-medium">Nos algorithmes RFM analysent vos données clients</p>
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
                                                <p className="text-slate-900 font-display font-black text-2xl mb-2 tracking-tight">Déposez votre jeu de données</p>
                                                <p className="text-slate-500 text-sm font-medium">Fichiers CSV, XLSX ou XLS supportés jusqu'à 50MB</p>
                                            </div>
                                            <div className="flex gap-3">
                                                {['Excel', 'CSV', 'JSON'].map(fmt => (
                                                    <span key={fmt} className="text-[10px] bg-slate-100 text-slate-500 px-3 py-1 rounded-full font-black uppercase tracking-wider">{fmt}</span>
                                                ))}
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
                                    <span>Parcourir mes documents</span>
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
                                Journal des Analyses
                            </h3>
                            <p className="text-slate-500 font-medium text-sm mt-1">Accédez à vos segmentations IA précédentes</p>
                        </div>
                        <button onClick={fetchHistory} className="p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors text-slate-600">
                            <Activity className="h-5 w-5" />
                        </button>
                    </div>

                    {historyLoading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <Loader2 className="h-12 w-12 text-primary-600 animate-spin" />
                            <p className="text-slate-500 font-black text-sm uppercase tracking-widest">Récupération des archives...</p>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-32 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                            <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100">
                                <FileText className="h-8 w-8 text-slate-300" />
                            </div>
                            <p className="text-slate-900 font-display font-black text-xl mb-2">Historique vide</p>
                            <p className="text-slate-400 font-medium text-sm">Vos futures analyses d'intelligence client apparaîtront ici.</p>
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
                                                <span className="text-emerald-600 font-black">{item.total_sales} CAP</span>
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
                                <ShieldAlert className="h-12 w-12 text-amber-500" />
                            </div>
                            <h3 className="text-2xl font-display font-black text-slate-900 mb-3">Aucune donnée exploitable</h3>
                            <p className="text-slate-500 text-center max-w-md font-medium mb-10 leading-relaxed">
                                {intelligence?.error || 'Veuillez importer un fichier contenant l\'historique de vos ventes pour générer l\'intelligence client.'}
                            </p>
                            <button
                                onClick={() => setActiveTabControlled('upload')}
                                className="btn-primary h-12 px-8"
                            >
                                <Upload className="h-5 w-5 mr-3" />
                                Démarrer l'importation
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            ref={analysisRef}
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="space-y-10"
                        >
                            {/* Header / Stats */}
                            <motion.div variants={itemVariants} className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20">
                                <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/10 blur-[100px] -translate-y-1/2 translate-x-1/2" />
                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 blur-[80px] translate-y-1/2 -translate-x-1/4" />

                                <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-10">
                                    <div className="flex items-center gap-6">
                                        <div className="bg-white/10 p-5 rounded-[1.5rem] backdrop-blur-xl border border-white/10">
                                            <Sparkles className="h-8 w-8 text-primary-400" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1.5 font-bold text-primary-400 text-xs uppercase tracking-[0.2em]">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                IA BusinessPulse Connectée
                                            </div>
                                            <h2 className="text-3xl font-display font-black tracking-tight tracking-tight">Analyse Prédictive Client</h2>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 xl:gap-12">
                                        <div className="bg-white/5 p-4 rounded-3xl border border-white/5 backdrop-blur-sm">
                                            <p className="text-slate-400 text-[10px] uppercase font-black tracking-widest mb-1">CLV Moyen</p>
                                            <p className="text-2xl font-display font-black text-white">{currencySymbol}{insights.avg_clv.toLocaleString()}</p>
                                        </div>
                                        <div className="bg-white/5 p-4 rounded-3xl border border-white/5 backdrop-blur-sm">
                                            <p className="text-slate-400 text-[10px] uppercase font-black tracking-widest mb-1">Risque Élevé</p>
                                            <p className="text-2xl font-display font-black text-rose-400">{insights.high_risk_count}</p>
                                        </div>
                                        <div className="bg-white/5 p-4 rounded-3xl border border-white/5 backdrop-blur-sm">
                                            <p className="text-slate-400 text-[10px] uppercase font-black tracking-widest mb-1">Base Clients</p>
                                            <p className="text-2xl font-display font-black text-primary-400">{customers.length.toLocaleString()}</p>
                                        </div>
                                        <button
                                            onClick={handleExportPDF}
                                            disabled={isExportingPDF}
                                            className="h-full bg-primary-600 hover:bg-primary-500 rounded-3xl flex flex-col items-center justify-center p-4 transition-all border border-primary-500/30 group disabled:opacity-50"
                                        >
                                            {isExportingPDF ? <Loader2 className="h-6 w-6 animate-spin" /> : <Download className="h-6 w-6 group-hover:-translate-y-1 transition-transform" />}
                                            <span className="text-[10px] uppercase font-black tracking-widest mt-2">{isExportingPDF ? 'Export...' : 'PDF'}</span>
                                        </button>
                                    </div>
                                </div>
                            </motion.div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Segmentation Chart */}
                                <motion.div variants={itemVariants} className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-lg font-display font-black text-slate-900 flex items-center gap-3">
                                            <Target className="h-5 w-5 text-primary-600" />
                                            Segmentation RFM
                                        </h3>
                                        <div className="bg-slate-50 p-2 rounded-xl">
                                            <Info className="h-4 w-4 text-slate-400" />
                                        </div>
                                    </div>
                                    <div className="h-[280px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={segments}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={65}
                                                    outerRadius={85}
                                                    paddingAngle={8}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    {segments.map((_: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip
                                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', padding: '12px' }}
                                                />
                                                <Legend
                                                    verticalAlign="bottom"
                                                    height={36}
                                                    iconType="circle"
                                                    wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </motion.div>

                                {/* IA Recommendations */}
                                <motion.div variants={itemVariants} className="lg:col-span-2 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h3 className="text-lg font-display font-black text-slate-900 flex items-center gap-3">
                                                <Zap className="h-5 w-5 text-yellow-500" />
                                                Actions Marketing Prioritaires
                                            </h3>
                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Généré par le moteur d'intelligence</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {marketing_actions.map((action: any, i: number) => (
                                            <motion.div
                                                key={i}
                                                initial={{ scale: 0.95, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                transition={{ delay: 0.3 + i * 0.1 }}
                                                className="p-5 rounded-3xl border border-slate-50 bg-slate-50/50 hover:bg-white hover:border-primary-100 hover:shadow-lg hover:shadow-primary-100/30 transition-all cursor-default group"
                                            >
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${SEGMENT_COLORS[action.segment] || 'text-slate-500 bg-slate-50 border-slate-100'}`}>
                                                        {action.segment}
                                                    </span>
                                                    {action.priority === 'Critical' || action.priority === 'High' ? (
                                                        <div className="bg-rose-50 p-1.5 rounded-lg border border-rose-100">
                                                            <ShieldAlert className="h-4 w-4 text-rose-500" />
                                                        </div>
                                                    ) : (
                                                        <div className="bg-emerald-50 p-1.5 rounded-lg border border-emerald-100">
                                                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                                                        </div>
                                                    )}
                                                </div>
                                                <h4 className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors mb-2 leading-tight">{action.action}</h4>
                                                <p className="text-[13px] text-slate-500 leading-relaxed font-medium line-clamp-2">{action.desc}</p>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            </div>

                            {/* Client Intelligence Table */}
                            <motion.div variants={itemVariants} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                                <div className="p-8 border-b border-slate-50 flex flex-wrap items-center justify-between gap-6 bg-slate-50/50">
                                    <div className="relative flex-1 max-w-md">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                                        <input
                                            type="text"
                                            placeholder="Filtrer par ID Client..."
                                            className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-[1.25rem] focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-bold text-sm text-slate-900 placeholder:text-slate-400"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-slate-200">
                                            <Filter className="h-4 w-4 text-slate-400" />
                                            <select
                                                className="bg-transparent text-sm font-black text-slate-700 outline-none cursor-pointer uppercase tracking-wider"
                                                value={segmentFilter}
                                                onChange={(e) => setSegmentFilter(e.target.value)}
                                            >
                                                <option value="">Tous les segments</option>
                                                {segments.map((s: any) => (
                                                    <option key={s.name} value={s.name}>{s.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50/30">
                                            <tr>
                                                <th onClick={() => handleSort('id')} className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] cursor-pointer hover:text-primary-600 transition-colors">Client</th>
                                                <th onClick={() => handleSort('segment')} className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] cursor-pointer hover:text-primary-600 transition-colors">Profil IA</th>
                                                <th onClick={() => handleSort('monetary')} className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] cursor-pointer hover:text-primary-600 transition-colors text-right">Valeur</th>
                                                <th onClick={() => handleSort('churn_probability')} className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] cursor-pointer hover:text-primary-600 transition-colors">Probabilité Attrition</th>
                                                <th onClick={() => handleSort('clv')} className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] cursor-pointer hover:text-primary-600 transition-colors text-right">Potentiel (CLV)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {filteredCustomers.map((c, i) => (
                                                <motion.tr
                                                    key={c.id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: i < 10 ? i * 0.05 : 0 }}
                                                    className="hover:bg-primary-50/40 transition-colors group"
                                                >
                                                    <td className="p-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center font-display font-black text-[10px] group-hover:bg-white transition-colors">
                                                                {c.id.substring(0, 2).toUpperCase()}
                                                            </div>
                                                            <span className="font-display font-black text-slate-900">{c.id}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-6">
                                                        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${SEGMENT_COLORS[c.segment] || 'text-slate-500 bg-slate-50 border-slate-100'}`}>
                                                            {c.segment}
                                                        </span>
                                                    </td>
                                                    <td className="p-6 text-right">
                                                        <span className="font-display font-black text-slate-900">{currencySymbol}{c.monetary.toLocaleString()}</span>
                                                    </td>
                                                    <td className="p-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden min-w-[100px] border border-slate-200/50">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${c.churn_probability * 100}%` }}
                                                                    transition={{ duration: 1 }}
                                                                    className={`h-full rounded-full ${c.churn_probability > 0.7 ? 'bg-rose-500 shadow-sm shadow-rose-200' : c.churn_probability > 0.4 ? 'bg-amber-500 shadow-sm shadow-amber-200' : 'bg-emerald-500 shadow-sm shadow-emerald-200'}`}
                                                                />
                                                            </div>
                                                            <span className={`text-xs font-black min-w-[32px] ${c.churn_probability > 0.7 ? 'text-rose-600' : 'text-slate-500'}`}>
                                                                {(c.churn_probability * 100).toFixed(0)}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="p-6 text-right">
                                                        <div className="flex flex-col items-end">
                                                            <span className="font-display font-black text-emerald-600">{currencySymbol}{c.clv.toLocaleString()}</span>
                                                            <div className="flex items-center gap-1 mt-1">
                                                                <ArrowUpRight className="h-3 w-3 text-emerald-400" />
                                                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Projection Long Terme</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}
        </div>
    );
}
