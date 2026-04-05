'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    History,
    Building2,
    CalendarDays,
    Package,
    DollarSign,
    Download,
    FileSpreadsheet,
    ChevronDown,
    ChevronUp,
    Loader2,
    AlertCircle,
    ShoppingBag,
} from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import api from '@/lib/api';

interface ScanItem {
    product: string;
    quantity: number;
    unit_price: number;
    total: number;
}

interface ScanRecord {
    id: number;
    vendor_name: string;
    date: string;
    items: ScanItem[];
    total_amount: number;
    currency: string;
    created_at: string;
}

export default function ScanHistoryView({ data, loading: externalLoading }: { data?: ScanRecord[], loading?: boolean }) {
    const { isRTL } = useLanguage();
    const [history, setHistory] = useState<ScanRecord[]>(data || []);
    const [loading, setLoading] = useState(externalLoading !== undefined ? externalLoading : true);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<number | null>(null);

    const fetchHistory = useCallback(async () => {
        if (data) {
            setHistory(data);
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await api.get('/magic-scanner/history');
            setHistory(res.data);
        } catch (err: any) {
            setError("Impossible de charger l'historique des scans.");
        } finally {
            setLoading(false);
        }
    }, [data]);

    useEffect(() => {
        if (data) {
            setHistory(data);
            setLoading(externalLoading !== undefined ? externalLoading : false);
        } else {
            fetchHistory();
        }
    }, [data, externalLoading, fetchHistory]);

    const handleExportCSV = (record: ScanRecord) => {
        const header = 'Produit,Quantité,Prix Unitaire,Total\n';
        const rows = record.items.map(i =>
            `"${i.product}",${i.quantity},${i.unit_price},${i.total}`
        ).join('\n');
        const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scan_${record.vendor_name || 'facture'}_${record.date || 'date'}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExportExcel = (record: ScanRecord) => {
        const rows = record.items.map(i =>
            `<tr><td>${i.product}</td><td>${i.quantity}</td><td>${i.unit_price}</td><td>${i.total}</td></tr>`
        ).join('');
        const html = `<table><thead><tr><th>Produit</th><th>Quantité</th><th>Prix Unitaire</th><th>Total (${record.currency})</th></tr></thead><tbody>${rows}<tr><td colspan="3"><b>Total Facture</b></td><td><b>${record.total_amount}</b></td></tr></tbody></table>`;
        const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scan_${record.vendor_name || 'facture'}_${record.date || 'date'}.xls`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className={`max-w-5xl mx-auto space-y-10 ${isRTL ? 'font-arabic' : ''}`}>
            {/* Header */}
            <div className="flex items-center gap-4 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="bg-violet-50 p-3 rounded-2xl text-violet-600">
                    <History className="h-7 w-7" />
                </div>
                <div>
                    <h2 className="text-2xl font-display font-black text-slate-900 tracking-tight">Historique des Scans</h2>
                    <p className="text-slate-400 text-sm font-medium">Toutes vos factures scannées</p>
                </div>
                <div className="ml-auto">
                    <span className="bg-violet-50 text-violet-600 font-black text-sm px-4 py-2 rounded-full">
                        {history.length} scan{history.length !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center items-center py-24">
                    <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
                </div>
            ) : error ? (
                <div className="flex items-center gap-3 bg-rose-50 text-rose-600 px-6 py-4 rounded-2xl border border-rose-100 font-bold">
                    <AlertCircle size={20} />
                    {error}
                </div>
            ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
                    <div className="bg-slate-50 p-8 rounded-[2rem]">
                        <ShoppingBag className="h-12 w-12 text-slate-300 mx-auto" />
                    </div>
                    <p className="text-slate-400 font-medium max-w-xs">
                        Aucun scan enregistré. Scannez une facture et cliquez sur "Enregistrer".
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    <AnimatePresence>
                        {history.map((record) => (
                            <motion.div
                                key={record.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm overflow-hidden"
                            >
                                {/* Row Summary */}
                                <div
                                    className="flex flex-col sm:flex-row sm:items-center gap-4 p-6 cursor-pointer hover:bg-slate-50/50 transition-colors"
                                    onClick={() => setExpanded(expanded === record.id ? null : record.id)}
                                >
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className="bg-violet-50 p-3 rounded-2xl text-violet-600 shrink-0">
                                            <Building2 size={18} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-black text-slate-900 truncate">{record.vendor_name || 'Fournisseur inconnu'}</p>
                                            <div className="flex items-center gap-3 text-xs text-slate-400 font-medium mt-0.5">
                                                <span className="flex items-center gap-1"><CalendarDays size={11}/>{record.date || '—'}</span>
                                                <span className="flex items-center gap-1"><Package size={11}/>{record.items?.length || 0} article(s)</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 ml-auto shrink-0">
                                        <div className="text-right">
                                            <p className="font-black text-slate-900 text-lg">{record.total_amount?.toFixed(2)} {record.currency}</p>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                                {new Date(record.created_at).toLocaleDateString('fr-FR')}
                                            </p>
                                        </div>
                                        <button
                                            className="p-2 text-slate-400 hover:text-slate-700 transition-colors"
                                            onClick={(e) => { e.stopPropagation(); setExpanded(expanded === record.id ? null : record.id); }}
                                        >
                                            {expanded === record.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Expandable Detail */}
                                <AnimatePresence>
                                    {expanded === record.id && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="border-t border-slate-50">
                                                <table className="w-full text-left text-sm">
                                                    <thead className="bg-slate-50">
                                                        <tr>
                                                            <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Produit</th>
                                                            <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Qté</th>
                                                            <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">P.U.</th>
                                                            <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-50">
                                                        {record.items?.map((item, i) => (
                                                            <tr key={i} className="hover:bg-slate-50/50">
                                                                <td className="px-6 py-3 font-medium text-slate-800">{item.product}</td>
                                                                <td className="px-6 py-3 text-center text-slate-500">{item.quantity}</td>
                                                                <td className="px-6 py-3 text-right text-slate-500">{item.unit_price?.toFixed(2)}</td>
                                                                <td className="px-6 py-3 text-right font-bold text-slate-800">{item.total?.toFixed(2)} {record.currency}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>

                                                {/* Export Actions */}
                                                <div className="flex items-center gap-3 p-4 bg-slate-50 border-t border-slate-100 justify-end">
                                                    <button
                                                        onClick={() => handleExportCSV(record)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all"
                                                    >
                                                        <Download size={14} />
                                                        CSV
                                                    </button>
                                                    <button
                                                        onClick={() => handleExportExcel(record)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200 transition-all"
                                                    >
                                                        <FileSpreadsheet size={14} />
                                                        Excel
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
