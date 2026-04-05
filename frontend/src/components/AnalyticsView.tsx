'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend, AreaChart, Area
} from 'recharts';
import { TrendingUp, Package, DollarSign, Activity, Sparkles, AlertCircle, Download, FileText, BarChart3, Loader2, Zap, ArrowUpRight, ArrowDownRight, ShoppingBag } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import AlertsSection from './AlertsSection';
import SentimentView from './SentimentView';
import { useLanguage } from '@/lib/LanguageContext';

export default function AnalyticsView({ data, user }: { data: any, user?: any }) {
    const { t, isRTL } = useLanguage();
    const summary = data.summary || data;
    const forecast = data.forecast || { forecast: [], confidence_indicator: 'Medium' };
    const recommendations = data.recommendations || [];
    const alerts = data.alerts || [];

    const getCurrencySymbol = (code: string) => {
        const symbols: Record<string, string> = {
            'MAD': 'DH',
            'USD': '$',
            'EUR': '€'
        };
        return symbols[code] || code;
    };

    const currency = getCurrencySymbol(user?.currency || 'MAD');

    const kpis = [
        {
            title: t('total_sales' as any),
            value: `${currency}${(summary.total_sales_value || 0).toLocaleString()}`,
            icon: DollarSign,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            growth: summary.sales_growth
        },
        {
            title: t('avg_order_value' as any),
            value: `${currency}${(summary.aov || 0).toLocaleString()}`,
            icon: Activity,
            color: 'text-blue-600',
            bg: 'bg-blue-50'
        },
        {
            title: t('profit_margin' as any),
            value: `${(summary.profit_margin || 0).toFixed(1)}%`,
            icon: TrendingUp,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50'
        },
        {
            title: t('top_product' as any),
            value: Object.keys(summary.top_products || {})[0] || 'N/A',
            icon: Package,
            color: 'text-orange-600',
            bg: 'bg-orange-50'
        },
    ];

    const topProductsData = Object.entries(summary?.top_products || {}).map(([name, value]: [string, any]) => ({
        name: name.length > 20 ? name.substring(0, 20) + '...' : name,
        sales: value
    }));

    const forecastData = forecast.forecast || [];
    const [isExporting, setIsExporting] = useState(false);

    const handleExportPDF = async () => {
        setIsExporting(true);
        await new Promise(resolve => setTimeout(resolve, 800));

        const element = document.getElementById('analytics-report');
        if (!element) return;

        try {
            const canvas = await html2canvas(element, {
                scale: 3,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
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
            pdf.text('BusinessPulse Report', 15, 20);
            pdf.setFontSize(10);
            pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 15, 30);
            pdf.addImage(imgData, 'JPEG', margin, 45, contentWidth, contentHeight);
            pdf.save(`BusinessPulse_Report_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            setIsExporting(false);
        }
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
        <div className={`space-y-10 focus:outline-none ${isRTL ? 'font-arabic' : ''}`}>
            {/* Top Bar */}
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="bg-primary-50 p-3 rounded-2xl">
                        <BarChart3 className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-display font-black text-slate-900 tracking-tight">{t('operational_overview' as any)}</h2>
                        <p className="text-sm text-slate-500 font-medium tracking-tight">Analyse en temps réel de vos performances commerciales</p>
                    </div>
                </div>
                <button
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    className="btn-primary gap-2 h-12"
                >
                    {isExporting ? <Loader2 className="animate-spin h-5 w-5" /> : <Download className="h-5 w-5" />}
                    <span className="hidden sm:inline">{isExporting ? t('generating_report' as any) : t('download_pdf' as any)}</span>
                </button>
            </div>

            <motion.div
                id="analytics-report"
                className="space-y-10"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                {/* Alerts */}
                <motion.div variants={itemVariants}>
                    <AlertsSection alerts={alerts} />
                </motion.div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {kpis.map((kpi, i) => (
                        <motion.div
                            key={i}
                            variants={itemVariants}
                            whileHover={{ y: -5 }}
                            className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between group cursor-default"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={`${kpi.bg} p-3 rounded-2xl transition-transform group-hover:scale-110`}>
                                    <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
                                </div>
                                {kpi.growth !== undefined && (
                                    <div className={`flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full ${kpi.growth >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                        {kpi.growth >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                        {Math.abs(kpi.growth).toFixed(1)}%
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{kpi.title}</p>
                                <p className="text-2xl font-display font-black text-slate-900">{kpi.value}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {Object.entries(summary?.categorical_breakdowns || {}).map(([field, breakdown]: [string, any], idx) => (
                        <motion.div
                            key={field}
                            variants={itemVariants}
                            className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-lg font-display font-black text-slate-900 capitalize">{t('total_sales' as any)} by {field.replace(/_/g, ' ')}</h3>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Répartition catégorielle</p>
                                </div>
                                <Package className="h-5 w-5 text-slate-300" />
                            </div>
                            <div className="h-[320px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={breakdown || []}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
                                        <YAxis orientation={isRTL ? 'right' : 'left'} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v: any) => `${currency}${v?.toLocaleString() || 0}`} />
                                        <Tooltip
                                            cursor={{ fill: '#f8fafc', radius: 8 }}
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.08)', padding: '12px' }}
                                            formatter={(value: any) => [`${currency}${value?.toLocaleString() || 0}`, t('total_sales' as any)]}
                                        />
                                        <Bar dataKey="value" fill="#0ea5e9" radius={[6, 6, 0, 0]} barSize={idx === 0 ? 30 : 45} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>
                    ))}

                    {/* Sales Trend */}
                    <motion.div variants={itemVariants} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-lg font-display font-black text-slate-900">{t('sales_trend' as any)}</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Évolution temporelle</p>
                            </div>
                            <TrendingUp className="h-5 w-5 text-slate-300" />
                        </div>
                        <div className="h-[320px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={summary?.monthly_trends || []}>
                                    <defs>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
                                    <YAxis orientation={isRTL ? 'right' : 'left'} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v: any) => `${currency}${v?.toLocaleString() || 0}`} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.08)', padding: '12px' }}
                                        formatter={(v: any) => [`${currency}${v?.toLocaleString() || 0}`, t('total_sales' as any)]}
                                    />
                                    <Area type="monotone" dataKey="total_sales" stroke="#0ea5e9" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Period Comparison */}
                    <motion.div variants={itemVariants} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-lg font-display font-black text-slate-900">{t('period_comparison' as any)}</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Comparaison des revenus</p>
                            </div>
                            <Zap className="h-5 w-5 text-yellow-500" />
                        </div>
                        <div className="h-[320px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={[
                                    { name: 'Sales', current: summary?.comparison?.current_sales || 0, previous: summary?.comparison?.previous_sales || 0 }
                                ]}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" hide />
                                    <YAxis orientation={isRTL ? 'right' : 'left'} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v: any) => `${currency}${v?.toLocaleString() || 0}`} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.08)', padding: '12px' }}
                                        formatter={(value: any) => [`${currency}${value?.toLocaleString() || 0}`, '']}
                                    />
                                    <Legend verticalAlign="top" iconType="circle" wrapperStyle={{ paddingTop: '0px', paddingBottom: '30px', fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }} />
                                    <Bar name={t('dashboard' as any)} dataKey="current" fill="#0ea5e9" radius={[12, 12, 0, 0]} barSize={80} />
                                    <Bar name={t('vs_previous' as any)} dataKey="previous" fill="#e2e8f0" radius={[12, 12, 0, 0]} barSize={80} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                </div>

                {/* Sentiment Analysis */}
                {summary?.sentiment_analysis && (
                    <motion.div variants={itemVariants} className="pt-10 border-t border-slate-100">
                        <SentimentView data={summary.sentiment_analysis} />
                    </motion.div>
                )}

                {/* Forecast & AI Recommendations */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <motion.div variants={itemVariants} className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50/30 blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-lg font-display font-black text-slate-900">{t('forecast_30_days' as any)}</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Prédictions algorithmiques</p>
                            </div>
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${forecast.confidence_indicator === 'High' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                {t('confidence' as any)}: {forecast.confidence_indicator}
                            </span>
                        </div>
                        <div className="h-[320px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={forecastData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} />
                                    <YAxis orientation={isRTL ? 'right' : 'left'} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v: any) => `${currency}${v?.toLocaleString() || 0}`} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.08)', padding: '12px' }}
                                        formatter={(v: any) => [`${currency}${v?.toLocaleString() || 0}`, t('total_sales' as any)]}
                                    />
                                    <Line type="monotone" dataKey="predicted_sales" stroke="#0ea5e9" strokeWidth={4} dot={{ r: 0 }} activeDot={{ r: 6, strokeWidth: 0, fill: '#0ea5e9' }} strokeDasharray="6 6" animationDuration={1500} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="bg-slate-900 text-white p-8 rounded-3xl shadow-2xl shadow-slate-900/40 border border-slate-800 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-8 text-primary-400">
                                <Sparkles className="h-6 w-6 animate-pulse" />
                                <h3 className="text-lg font-display font-black text-white tracking-tight">{t('ai_recommendations' as any)}</h3>
                            </div>
                            <ul className="space-y-4">
                                {recommendations.map((rec: string, i: number) => (
                                    <motion.li
                                        key={i}
                                        initial={{ x: 20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.5 + i * 0.1 }}
                                        className="flex gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 hover:bg-white/10 transition-all cursor-default group/item backdrop-blur-md"
                                    >
                                        <AlertCircle className="h-5 w-5 text-primary-400 shrink-0 group-hover/item:scale-110 transition-transform" />
                                        <span className="text-[13px] leading-relaxed font-medium text-slate-300">{rec}</span>
                                    </motion.li>
                                ))}
                            </ul>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}
