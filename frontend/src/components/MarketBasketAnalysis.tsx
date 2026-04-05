'use client';

import React from 'react';
import { ShoppingBag, TrendingUp, Calendar, Info, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/LanguageContext';
import { translations } from '@/lib/translations';

interface MBARule {
    if: string[];
    then: string[];
    support: number;
    confidence: number;
    lift: number;
}

interface MarketBasketData {
    top_rules: MBARule[];
    best_opportunities: MBARule[];
    seasonal_patterns: Record<number, { if: string[]; then: string[] }[]>;
    total_baskets: number;
}

interface MarketBasketAnalysisProps {
    data: MarketBasketData;
}

const MarketBasketAnalysis: React.FC<MarketBasketAnalysisProps> = ({ data }) => {
    const { language } = useLanguage();
    const t = translations[language];

    const getMonthName = (monthNum: number) => {
        const date = new Date();
        date.setMonth(monthNum - 1);
        return date.toLocaleString(language === 'fr' ? 'fr-FR' : language === 'ar' ? 'ar-SA' : 'en-US', { month: 'long' });
    };

    if (!data || (!data.top_rules?.length && !data.best_opportunities?.length)) {
        return (
            <div className="bg-white border border-slate-200 rounded-[2rem] p-12 text-center shadow-sm">
                <ShoppingBag className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">{t.no_items_found}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header section with total baskets */}
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                        <ShoppingBag className="text-blue-600" />
                        {t.market_basket}
                    </h2>
                    <p className="text-slate-500 font-medium text-sm mt-1">{t.market_basket_desc}</p>
                </div>
                <div className="bg-blue-50 border border-blue-100 px-4 py-2 rounded-xl text-blue-700 text-sm font-bold shadow-sm">
                    <strong>{data.total_baskets}</strong> {t.transactions_analyzed}
                </div>
            </div>

            {/* Top 5 Cross-Selling Opportunities */}
            <section>
                <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                    <TrendingUp className="text-emerald-500 w-5 h-5" />
                    {t.top_cross_selling}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.best_opportunities.map((rule, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-blue-500/30 transition-all group"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{t.bundle_score}</span>
                                <div className="flex gap-1">
                                    {[1, 2, 3].map(s => (
                                        <div key={s} className={`w-1.5 h-1.5 rounded-full ${rowScoreColor(rule.lift, s)}`} />
                                    ))}
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex flex-wrap gap-2 items-center">
                                    {rule.if.map((item, i) => (
                                        <span key={i} className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-bold">
                                            {item}
                                        </span>
                                    ))}
                                    <ArrowRight className="w-4 h-4 text-slate-300 mx-1" />
                                    {rule.then.map((item, i) => (
                                        <span key={i} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-black shadow-sm shadow-blue-200">
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100">
                                <div className="text-center">
                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1.5">{t.support}</p>
                                    <p className="text-sm font-black text-slate-900">{(rule.support * 100).toFixed(1)}%</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1.5">Conf.</p>
                                    <p className="text-sm font-black text-slate-900">{(rule.confidence * 100).toFixed(1)}%</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1.5">Lift</p>
                                    <p className="text-sm font-black text-blue-600">{rule.lift.toFixed(2)}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Heatmap/Matrix View */}
            <section className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                        <Info className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Relations entre Produits</h3>
                        <p className="text-xs text-slate-500 font-medium mt-1">Plus la couleur est intense, plus le lien est fort (Lift).</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr>
                                <th className="p-2"></th>
                                {getUniqueProducts(data.top_rules).map(p => (
                                    <th key={p} className="p-3 text-slate-400 font-black text-[10px] uppercase tracking-widest [writing-mode:vertical-rl] rotate-180 h-32 whitespace-nowrap">{p}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {getUniqueProducts(data.top_rules).map(p1 => (
                                <tr key={p1} className="border-b border-slate-50 last:border-0">
                                    <td className="p-3 text-slate-500 font-bold text-xs text-right pr-6">{p1}</td>
                                    {getUniqueProducts(data.top_rules).map(p2 => {
                                        const lift = getLift(data.top_rules, p1, p2);
                                        return (
                                            <td 
                                                key={p2} 
                                                className="p-1"
                                                title={`${p1} + ${p2}: Lift ${lift.toFixed(2)}`}
                                            >
                                                <div 
                                                    className={`w-full aspect-square rounded-sm flex items-center justify-center transition-all hover:scale-110 cursor-help ${getHeatmapColor(lift)}`}
                                                >
                                                    {lift > 0 && <span className="text-[8px] font-bold text-white/50">{lift.toFixed(1)}</span>}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Seasonal Recommendations */}
            {Object.keys(data.seasonal_patterns).length > 0 && (
                <section>
                    <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                        <Calendar className="text-orange-500 w-5 h-5" />
                        {t.seasonal_recommendations}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {Object.entries(data.seasonal_patterns).map(([month, rules], idx) => (
                            <div key={month} className="bg-white border border-slate-100 rounded-[2rem] p-8 relative overflow-hidden group shadow-sm hover:shadow-md transition-all">
                                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Calendar className="w-16 h-16" />
                                </div>
                                <h4 className="text-orange-600 font-black text-lg mb-6 uppercase tracking-tight">{getMonthName(parseInt(month))}</h4>
                                <ul className="space-y-6">
                                    {rules.map((rule, rIdx) => (
                                        <li key={rIdx} className="text-sm border-l-4 border-orange-500/20 pl-4 py-1">
                                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">{t.often_bought_with} <span className="text-slate-900">{rule.if.join(', ')}</span></p>
                                            <p className="text-slate-900 font-black text-sm leading-snug">{rule.then.join(', ')}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

// Helper functions
const rowScoreColor = (lift: number, step: number) => {
    if (lift > 2.5) return step <= 3 ? 'bg-emerald-500' : 'bg-slate-100';
    if (lift > 1.5) return step <= 2 ? 'bg-blue-500' : 'bg-slate-100';
    return step <= 1 ? 'bg-orange-500' : 'bg-slate-100';
};

const getUniqueProducts = (rules: MBARule[]) => {
    const products = new Set<string>();
    rules.forEach(r => {
        r.if.forEach(p => products.add(p));
        r.then.forEach(p => products.add(p));
    });
    return Array.from(products).slice(0, 15); // Limit to top 15 for heatmap clarity
};

const getLift = (rules: MBARule[], p1: string, p2: string) => {
    if (p1 === p2) return 0;
    const rule = rules.find(r => 
        (r.if.includes(p1) && r.then.includes(p2))
    );
    return rule ? rule.lift : 0;
};

const getHeatmapColor = (lift: number) => {
    if (lift === 0) return 'bg-slate-50';
    if (lift > 3) return 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]';
    if (lift > 2.5) return 'bg-blue-500';
    if (lift > 2) return 'bg-blue-400';
    if (lift > 1.5) return 'bg-blue-300';
    if (lift > 1) return 'bg-blue-200';
    return 'bg-blue-50';
};

export default MarketBasketAnalysis;
