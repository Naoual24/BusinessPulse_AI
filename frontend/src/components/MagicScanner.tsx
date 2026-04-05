import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Camera,
    Upload,
    Sparkles,
    Loader2,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    Package,
    Tag,
    Hash,
    Scan,
    Download,
    FileSpreadsheet,
    History as HistoryIcon,
    LayoutDashboard,
    TrendingUp,
    Store,
    ShoppingBag,
    BarChart3,
    Calendar,
    ArrowUpRight
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import { useLanguage } from '@/lib/LanguageContext';
import api from '@/lib/api';
import ScanHistoryView from './ScanHistoryView';

interface ExtractedItem {
    product: string;
    quantity: number;
    unit_price: number;
    total: number;
}

interface ExtractedData {
    vendor_name: string;
    date: string;
    items: ExtractedItem[];
    total_amount: number;
    currency: string;
}

interface ScanRecord extends ExtractedData {
    id: number;
    created_at: string;
}

interface MagicScannerProps {
    onSaveSuccess?: () => void;
}

export default function MagicScanner({ onSaveSuccess }: MagicScannerProps) {
    const { t, isRTL } = useLanguage();
    const [activeTab, setActiveTab] = useState<'scanner' | 'history' | 'stats'>('scanner');
    const [loading, setLoading] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [result, setResult] = useState<ExtractedData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [history, setHistory] = useState<ScanRecord[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchHistory = useCallback(async () => {
        setHistoryLoading(true);
        try {
            const res = await api.get('/magic-scanner/history');
            setHistory(res.data);
        } catch (err) {
            console.error("Failed to fetch history:", err);
        } finally {
            setHistoryLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const handleUpload = async (file: File) => {
        setLoading(true);
        setError(null);
        setResult(null);
        setSaveSuccess(false);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/magic-scanner/scan', formData);
            setResult(res.data);
        } catch (err: any) {
            setError(err.response?.data?.detail || "L'analyse a échoué. Veuillez réessayer.");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveToInventory = async () => {
        if (!result) return;
        setSaveLoading(true);
        setError(null);
        try {
            await api.post('/magic-scanner/save', {
                vendor_name: result.vendor_name,
                date: result.date,
                items: result.items,
                total_amount: result.total_amount,
                currency: result.currency
            });
            setSaveSuccess(true);
            fetchHistory(); // Refresh history
            if (onSaveSuccess) onSaveSuccess();
        } catch (err: any) {
            setError(err.response?.data?.detail || "Échec de l'enregistrement.");
        } finally {
            setSaveLoading(false);
        }
    };

    const handleExportCSV = () => {
        if (!result) return;
        const header = 'Produit,Quantité,Prix Unitaire,Total\n';
        const rows = result.items.map(i =>
            `"${i.product}",${i.quantity},${i.unit_price},${i.total}`
        ).join('\n');
        const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scan_${result.vendor_name || 'facture'}_${result.date || 'date'}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExportExcel = async () => {
        if (!result) return;
        const rows = result.items.map(i =>
            `<tr><td>${i.product}</td><td>${i.quantity}</td><td>${i.unit_price}</td><td>${i.total}</td></tr>`
        ).join('');
        const html = `<table><thead><tr><th>Produit</th><th>Quantité</th><th>Prix Unitaire</th><th>Total (${result.currency})</th></tr></thead><tbody>${rows}<tr><td colspan="3"><b>Total Facture</b></td><td><b>${result.total_amount}</b></td></tr></tbody></table>`;
        const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scan_${result.vendor_name || 'facture'}_${result.date || 'date'}.xls`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleUpload(file);
    };

    // --- DASHBOARD ANALYTICS LOGIC ---
    const stats = useMemo(() => {
        if (!history || history.length === 0) return null;

        const totalSpend = history.reduce((sum, r) => sum + (r.total_amount || 0), 0);
        const avgInvoice = totalSpend / history.length;
        
        // Spending Trend
        const trendMap = new Map();
        history.forEach(r => {
            const date = r.date || new Date(r.created_at).toISOString().split('T')[0];
            trendMap.set(date, (trendMap.get(date) || 0) + r.total_amount);
        });
        const trendData = Array.from(trendMap.entries())
            .map(([date, amount]) => ({ date, amount }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // Suppliers
        const supplierMap = new Map();
        history.forEach(r => {
            const name = r.vendor_name || 'Inconnu';
            supplierMap.set(name, (supplierMap.get(name) || 0) + r.total_amount);
        });
        const supplierData = Array.from(supplierMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        // Products
        const productMap = new Map();
        const productQtyMap = new Map();
        history.forEach(r => {
            (r.items || []).forEach(item => {
                productMap.set(item.product, (productMap.get(item.product) || 0) + item.total);
                productQtyMap.set(item.product, (productQtyMap.get(item.product) || 0) + item.quantity);
            });
        });
        const topProductsBySpend = Array.from(productMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
        
        const topProductsByQty = Array.from(productQtyMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        return { totalSpend, avgInvoice, trendData, supplierData, topProductsBySpend, topProductsByQty };
    }, [history]);

    const COLORS = ['#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

    return (
        <div className={`max-w-6xl mx-auto space-y-10 focus:outline-none ${isRTL ? 'font-arabic' : ''}`}>
            {/* Nav Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 p-1 bg-slate-50/50 rounded-2xl w-full md:w-auto">
                    <button 
                        onClick={() => setActiveTab('scanner')}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl transition-all font-black text-xs uppercase tracking-wider ${activeTab === 'scanner' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <Scan size={16} />
                        Scanner
                    </button>
                    <button 
                        onClick={() => setActiveTab('stats')}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl transition-all font-black text-xs uppercase tracking-wider ${activeTab === 'stats' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <BarChart3 size={16} />
                        Statistiques
                    </button>
                    <button 
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl transition-all font-black text-xs uppercase tracking-wider ${activeTab === 'history' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <HistoryIcon size={16} />
                        Historique
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'stats' ? (
                    <motion.div key="stats" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                        {stats ? (
                            <>
                                {/* KPI Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="bg-primary-50 p-3 rounded-2xl text-primary-600"><TrendingUp size={24}/></div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Achats</p>
                                                <h4 className="text-2xl font-black text-slate-900">{stats.totalSpend.toLocaleString()} DH</h4>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg w-fit">
                                            <ArrowUpRight size={12}/> Basé sur {history.length} factures
                                        </div>
                                    </div>
                                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="bg-violet-50 p-3 rounded-2xl text-violet-600"><ShoppingBag size={24}/></div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Moyenne / Facture</p>
                                                <h4 className="text-2xl font-black text-slate-900">{stats.avgInvoice.toLocaleString()} DH</h4>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="bg-amber-50 p-3 rounded-2xl text-amber-600"><Store size={24}/></div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Top Fournisseur</p>
                                                <h4 className="text-xl font-black text-slate-900 truncate">{stats.supplierData[0]?.name || 'N/A'}</h4>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Main Trend Chart */}
                                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                                    <h3 className="text-lg font-black text-slate-900 mb-8 flex items-center gap-3">
                                        <Calendar className="text-primary-600" size={20}/>
                                        Évolution des Dépenses
                                    </h3>
                                    <div className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={stats.trendData}>
                                                <defs>
                                                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                                                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} tickFormatter={(v: any) => `${v}DH`} />
                                                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)'}} />
                                                <Area type="monotone" dataKey="amount" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Distribution Charts */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                                        <h3 className="text-lg font-black text-slate-900 mb-8">Dépenses par Fournisseur</h3>
                                        <div className="h-[250px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={stats.supplierData} layout="vertical">
                                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                                    <XAxis type="number" hide />
                                                    <YAxis dataKey="name" type="category" width={80} axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                                                    <Tooltip />
                                                    <Bar dataKey="value" fill="#8b5cf6" radius={[0, 8, 8, 0]} barSize={20} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                                        <h3 className="text-lg font-black text-slate-900 mb-8">Top Produits (Montant)</h3>
                                        <div className="h-[250px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie data={stats.topProductsBySpend} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                                        {stats.topProductsBySpend.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                    <Legend />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-[3rem] border border-slate-100">
                                <BarChart3 className="h-16 w-16 text-slate-200 mb-4" />
                                <p className="text-slate-400 font-medium">Pas encore de données. Scannez vos premières factures !</p>
                            </div>
                        )}
                    </motion.div>
                ) : activeTab === 'history' ? (
                    <motion.div key="history" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                        <ScanHistoryView data={history} loading={historyLoading} />
                    </motion.div>
                ) : !result ? (
                    <motion.div key="scanner-input" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                        className="glass-card p-12 flex flex-col items-center justify-center gap-10 min-h-[400px] border-none shadow-2xl shadow-primary-900/5 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/20 via-transparent to-transparent -z-10" />
                        {loading ? (
                            <div className="flex flex-col items-center gap-6 text-center">
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-full border-4 border-primary-100 border-t-primary-600 animate-spin" />
                                    <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-primary-400 animate-pulse" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-display font-black text-slate-900 mb-2">{t('scanning_ai' as any)}</h3>
                                    <p className="text-slate-500 font-medium">Vision IA analyse les produits, prix et quantités...</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex flex-col items-center text-center gap-4">
                                    <div className="bg-primary-50 p-6 rounded-[2rem] text-primary-600 relative group transition-all hover:scale-105 active:scale-95 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                        <Camera size={48} strokeWidth={1.5} />
                                        <motion.div className="absolute inset-0 border-2 border-primary-400 rounded-[2rem]" animate={{ opacity: [0, 1, 0], scale: [0.9, 1.1, 0.9] }} transition={{ duration: 2, repeat: Infinity }} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-display font-black text-slate-900 mb-1">{t('scan_invoice' as any)}</h3>
                                        <p className="text-slate-400 font-medium text-sm">Capturez une photo nette de votre bon de commande</p>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                                    <button onClick={() => fileInputRef.current?.click()} className="flex-1 btn-primary h-14 rounded-2xl gap-3 bg-slate-900 hover:bg-slate-800 border-none text-white shadow-xl shadow-slate-200">
                                        <Camera size={18} /> <span className="font-bold">{t('take_photo' as any)}</span>
                                    </button>
                                    <button onClick={() => fileInputRef.current?.click()} className="flex-1 bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 h-14 rounded-2xl flex items-center justify-center gap-3 transition-all font-bold">
                                        <Upload size={18} /> <span>{t('upload_invoice' as any)}</span>
                                    </button>
                                </div>
                                {error && (
                                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-3 bg-rose-50 text-rose-600 px-6 py-3 rounded-2xl border border-rose-100 text-sm font-bold">
                                        <AlertCircle size={16} /> {error}
                                    </motion.div>
                                )}
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" capture="environment" />
                            </>
                        )}
                    </motion.div>
                ) : (
                    <motion.div key="scanner-result" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                        {saveSuccess && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-500 text-white p-4 rounded-2xl flex items-center gap-3 font-bold shadow-lg shadow-emerald-200">
                                <CheckCircle2 size={20} /> <span>Inventaire mis à jour avec succès !</span>
                            </motion.div>
                        )}
                        {error && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-rose-50 text-rose-600 p-4 rounded-2xl flex items-center gap-3 font-bold border border-rose-100">
                                <AlertCircle size={20} /> <span>{error}</span>
                            </motion.div>
                        )}
                        <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[2rem] flex items-center justify-between gap-6 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="bg-emerald-500 p-3 rounded-2xl text-white shadow-lg shadow-emerald-200"><CheckCircle2 size={24} /></div>
                                <div>
                                    <p className="text-emerald-700 font-black text-sm uppercase tracking-widest leading-none mb-1">Analyse Terminée</p>
                                    <h3 className="text-xl font-display font-black text-slate-900">{result.vendor_name || 'Fournisseur Inconnu'}</h3>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Date Facture</p>
                                    <p className="font-display font-black text-slate-900">{result.date || 'Non détectée'}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={handleExportCSV} className="p-3 bg-white hover:bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl shadow-sm"><Download size={20} /></button>
                                    <button onClick={handleExportExcel} className="p-3 bg-white hover:bg-violet-50 text-violet-600 border border-violet-100 rounded-2xl shadow-sm"><FileSpreadsheet size={20} /></button>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                                <h3 className="text-lg font-display font-black text-slate-900 flex items-center gap-3"><Package size={20} className="text-primary-600" /> {t('extracted_data' as any)}</h3>
                                <span className="text-[10px] font-black text-primary-600 bg-primary-50 px-3 py-1.5 rounded-full uppercase tracking-widest">{result.items.length} Article{result.items.length > 1 ? 's' : ''}</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50/50">
                                        <tr>
                                            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Article</th>
                                            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Qté</th>
                                            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Prix Unitaire</th>
                                            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {result.items.map((item, i) => (
                                            <tr key={i} className="hover:bg-slate-50/50">
                                                <td className="p-6"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center"><Tag size={14} className="text-slate-400" /></div><span className="font-bold text-slate-900">{item.product}</span></div></td>
                                                <td className="p-6 text-center"><div className="inline-flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full text-xs font-black text-slate-600"><Hash size={10} />{item.quantity}</div></td>
                                                <td className="p-6 text-right font-bold text-slate-600">{item.unit_price.toFixed(2)} {result.currency}</td>
                                                <td className="p-6 text-right font-black text-slate-900">{item.total.toFixed(2)} {result.currency}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-slate-900 text-white">
                                        <tr>
                                            <td colSpan={3} className="p-8 text-right font-display font-black text-lg uppercase tracking-tight">Total Facture</td>
                                            <td className="p-8 text-right font-display font-black text-2xl text-primary-400">{result.total_amount.toFixed(2)} {result.currency}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 justify-end">
                            <button onClick={() => { setResult(null); setSaveSuccess(false); }} className="px-8 py-4 rounded-2xl bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-50">Recommencer</button>
                            {saveSuccess && (
                                <button onClick={() => setActiveTab('stats')} className="px-8 py-4 rounded-2xl bg-emerald-600 text-white font-black hover:bg-emerald-500 shadow-xl shadow-emerald-100 flex items-center gap-2">
                                    <LayoutDashboard size={20} /> Voir les Statistiques
                                </button>
                            )}
                            <button onClick={handleSaveToInventory} disabled={saveLoading || saveSuccess} className={`px-10 py-4 rounded-2xl font-black shadow-xl flex items-center gap-3 transition-all group ${saveSuccess ? 'bg-emerald-100 text-emerald-600' : 'bg-primary-600 text-white hover:bg-primary-500 disabled:opacity-70'}`}>
                                {saveLoading ? <Loader2 size={20} className="animate-spin" /> : saveSuccess ? <CheckCircle2 size={20} /> : <ArrowRight size={20} className="group-hover:translate-x-1" />}
                                {saveSuccess ? 'Enregistré' : t('save_to_inventory' as any)}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
