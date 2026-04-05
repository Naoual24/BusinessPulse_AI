import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { Activity, TrendingUp, TrendingDown, DollarSign, Package, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { useLanguage } from '@/lib/LanguageContext';

export default function DecisionSimulatorView({ uploadId }: { uploadId: number }) {
    const { t } = useLanguage();
    const [products, setProducts] = useState<{name: string, price: number}[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<string>('');
    const [currentPrice, setCurrentPrice] = useState<number>(0);
    const [newPrice, setNewPrice] = useState<number | ''>('');
    const [loading, setLoading] = useState(false);
    const [simulating, setSimulating] = useState(false);
    const [simulationResult, setSimulationResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (uploadId) {
            fetchProducts();
        }
    }, [uploadId]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/analytics/${uploadId}/products`);
            if (res.data?.products) {
                setProducts(res.data.products);
                if (res.data.products.length > 0) {
                    handleProductSelect(res.data.products[0].name, res.data.products[0].price);
                }
            }
        } catch (err: any) {
            setError("Impossible de charger les produits.");
        } finally {
            setLoading(false);
        }
    };

    const handleProductSelect = (name: string, price: number) => {
        setSelectedProduct(name);
        setCurrentPrice(price);
        setNewPrice(price);
        setSimulationResult(null);
    };

    const runSimulation = async () => {
        if (!selectedProduct || newPrice === '' || Number(newPrice) <= 0) return;
        
        setSimulating(true);
        setError(null);
        try {
            const res = await api.post(`/analytics/${uploadId}/simulate`, {
                product_name: selectedProduct,
                new_price: Number(newPrice)
            });
            setSimulationResult(res.data);
        } catch (err: any) {
            setError(err.response?.data?.detail || "Erreur lors de la simulation.");
        } finally {
            setSimulating(false);
        }
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(val);
    const formatNumber = (val: number) => new Intl.NumberFormat('fr-MA').format(val);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header & Controls */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                
                <div className="flex flex-col md:flex-row gap-8 items-start md:items-end relative">
                    <div className="flex-1 space-y-2 w-full">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('product_to_simulate' as any) || 'Produit à simuler'}</label>
                        <select 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                            value={selectedProduct}
                            onChange={(e) => {
                                const p = products.find(p => p.name === e.target.value);
                                if (p) handleProductSelect(p.name, p.price);
                            }}
                            disabled={loading || products.length === 0}
                        >
                            {products.length === 0 && <option>Chargement...</option>}
                            {products.map(p => (
                                <option key={p.name} value={p.name}>{p.name} ({formatCurrency(p.price)})</option>
                            ))}
                        </select>
                    </div>

                    <div className="w-full md:w-48 space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('new_price' as any) || 'Nouveau Prix'}</label>
                        <input 
                            type="number"
                            step="0.1"
                            value={newPrice}
                            onChange={(e) => setNewPrice(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                        />
                    </div>
                    
                    <button 
                        onClick={runSimulation}
                        disabled={simulating || !selectedProduct}
                        className="w-full md:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-200 flex items-center justify-center gap-2 group"
                    >
                        {simulating ? <Activity className="h-5 w-5 animate-spin" /> : <Activity className="h-5 w-5 group-hover:scale-110 transition-transform" />}
                        {t('run_simulation' as any) || 'Lancer la Simulation'}
                    </button>
                </div>
                {error && <p className="mt-4 text-rose-500 text-sm font-medium flex items-center gap-2"><AlertCircle size={16}/>{error}</p>}
            </div>

            {/* Simulation Results */}
            <AnimatePresence mode="wait">
                {simulationResult && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-8"
                    >
                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
                                <div className="flex items-start justify-between">
                                    <div className="bg-slate-50 p-3 rounded-2xl"><DollarSign className="text-slate-400 w-6 h-6" /></div>
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('price' as any) || 'Prix'}</span>
                                </div>
                                <div className="mt-4 space-y-1">
                                    <h3 className="text-3xl font-display font-black text-slate-900">{formatCurrency(simulationResult.predicted.price)}</h3>
                                    <p className="text-sm font-bold text-slate-500">
                                        Ancien: {formatCurrency(simulationResult.current.price)}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
                                <div className="flex items-start justify-between">
                                    <div className={`p-3 rounded-2xl ${simulationResult.predicted.quantity_change_pct >= 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                                        <Package className={`${simulationResult.predicted.quantity_change_pct >= 0 ? 'text-emerald-500' : 'text-rose-500'} w-6 h-6`} />
                                    </div>
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('volume_qty' as any) || 'Volume (Qté)'}</span>
                                </div>
                                <div className="mt-4 space-y-1">
                                    <h3 className="text-3xl font-display font-black text-slate-900">{formatNumber(simulationResult.predicted.quantity)}</h3>
                                    <p className={`text-sm font-bold flex items-center gap-1 ${simulationResult.predicted.quantity_change_pct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {simulationResult.predicted.quantity_change_pct >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                        {simulationResult.predicted.quantity_change_pct > 0 ? '+' : ''}{simulationResult.predicted.quantity_change_pct}% prévu
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
                                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-indigo-50 rounded-full blur-2xl pointer-events-none" />
                                <div className="flex items-start justify-between relative">
                                    <div className={`p-3 rounded-2xl ${simulationResult.predicted.profit_change_pct >= 0 ? 'bg-indigo-50' : 'bg-rose-50'}`}>
                                        <Activity className={`${simulationResult.predicted.profit_change_pct >= 0 ? 'text-indigo-600' : 'text-rose-600'} w-6 h-6`} />
                                    </div>
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('net_profit' as any) || 'Profit Net'}</span>
                                </div>
                                <div className="mt-4 space-y-1 relative">
                                    <h3 className="text-3xl font-display font-black text-slate-900">{formatCurrency(simulationResult.predicted.profit)}</h3>
                                    <p className={`text-sm font-bold flex items-center gap-1 ${simulationResult.predicted.profit_change_pct >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                                        {simulationResult.predicted.profit_change_pct >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                        {simulationResult.predicted.profit_change_pct > 0 ? '+' : ''}{simulationResult.predicted.profit_change_pct}% prévu
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 px-2">{t('volume_comparison' as any) || 'Comparaison du Volume'}</h4>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={[
                                            { name: 'Actuel', Quantité: simulationResult.current.quantity },
                                            { name: 'Prévu', Quantité: simulationResult.predicted.quantity }
                                        ]}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 700}} />
                                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                            <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                                            <Bar dataKey="Quantité" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={60} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            
                            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 px-2">{t('profit_comparison' as any) || 'Comparaison du Profit'}</h4>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={[
                                            { name: 'Actuel', Profit: simulationResult.current.profit },
                                            { name: 'Prévu', Profit: simulationResult.predicted.profit }
                                        ]}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 700}} />
                                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                            <RechartsTooltip formatter={(value: number) => formatCurrency(value)} cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                                            <Bar dataKey="Profit" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={60} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
