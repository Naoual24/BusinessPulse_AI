'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ShieldCheck, AlertCircle, Cpu, Coins, ArrowRight, Settings2, Info, Loader2 } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

export default function MappingDialog({ columns, onComplete }: { columns: string[], onComplete: (mapping: any) => void }) {
    const { t, isRTL } = useLanguage();
    const fieldsContainerRef = useRef<HTMLDivElement>(null);

    const INITIAL_FIELDS = [
        { key: 'customer', label: isRTL ? 'العميل' : 'Client', required: false, type: 'intelligence', icon: '👤' },
        { key: 'transaction_id', label: isRTL ? 'رقم المعاملة' : 'ID Transaction / Facture', required: false, type: 'text', icon: '🧾' },
        { key: 'date', label: isRTL ? 'التاريخ' : 'Date', required: true, type: 'date', icon: '📅' },
        { key: 'product', label: isRTL ? 'اسم المنتج' : 'Produit', required: true, type: 'text', icon: '📦' },
        { key: 'quantity', label: isRTL ? 'الكمية المباعة' : 'Quantité', required: true, type: 'number', icon: '🔢' },
        { key: 'price', label: isRTL ? 'سعر الوحدة' : 'Prix Unitaire', required: true, type: 'number', icon: '💰' },
        { key: 'feedback', label: isRTL ? 'تعليقات العملاء' : 'Feedback Client', required: false, type: 'text', icon: '💬' },
    ];

    const [fields, setFields] = useState<any[]>(INITIAL_FIELDS);
    const [mapping, setMapping] = useState<any>({});
    const [sourceCurrency, setSourceCurrency] = useState('MAD');
    const [customFieldLabel, setCustomFieldLabel] = useState('');

    // Update labels when language changes
    useEffect(() => {
        setFields(prev => prev.map(f => {
            const initial = INITIAL_FIELDS.find(i => i.key === f.key);
            if (initial) return { ...f, label: initial.label };
            return f;
        }));
    }, [isRTL]);

    // Auto-mapping logic
    useEffect(() => {
        const newMapping: any = { ...mapping };
        columns.forEach(col => {
            const normalizedCol = col.toLowerCase().trim();
            const field = fields.find(f =>
                f.key === normalizedCol ||
                f.label.toLowerCase() === normalizedCol ||
                (normalizedCol.includes('date') && f.key === 'date') ||
                (normalizedCol.includes('prix') && f.key === 'price') ||
                (normalizedCol.includes('quant') && f.key === 'quantity') ||
                (normalizedCol.includes('produit') && f.key === 'product') ||
                (normalizedCol.includes('client') && f.key === 'customer') ||
                ((normalizedCol.includes('facture') || normalizedCol.includes('id') || normalizedCol.includes('trans')) && f.key === 'transaction_id')
            );
            if (field && !newMapping[field.key]) {
                newMapping[field.key] = col;
            }
        });
        setMapping(newMapping);
    }, [columns, fields.length]);

    const handleSelect = (fieldKey: string, colName: string) => {
        setMapping({ ...mapping, [fieldKey]: colName });
    };

    const addCustomField = () => {
        if (!customFieldLabel.trim()) return;
        let key = customFieldLabel.toLowerCase().replace(/\s+/g, '_').normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        // Handle collisions by adding a suffix
        let finalKey = key;
        let counter = 1;
        while (fields.find(f => f.key === finalKey)) {
            finalKey = `${key}_${counter}`;
            counter++;
        }

        setFields([...fields, {
            key: finalKey,
            label: customFieldLabel,
            required: false,
            type: 'dynamic',
            icon: '🧩'
        }]);
        setCustomFieldLabel('');

        // Scroll to the new field
        setTimeout(() => {
            const container = document.getElementById('mapping-fields-container');
            if (container) {
                container.scrollTo({
                    top: container.scrollHeight,
                    behavior: 'smooth'
                });
            }
        }, 100);
    };

    const removeField = (key: string) => {
        if (INITIAL_FIELDS.some(f => f.key === key)) return;
        setFields(fields.filter(f => f.key !== key));
        const newMapping = { ...mapping };
        delete newMapping[key];
        setMapping(newMapping);
    };

    const isComplete = fields.filter(f => f.required).every(f => !!mapping[f.key]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    return (
        <div className={`max-w-5xl mx-auto glass rounded-[3.5rem] shadow-glass-2xl border border-white/50 overflow-hidden ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="bg-slate-950 p-12 text-white relative overflow-hidden">
                {/* Background effects */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-600/10 blur-[130px] -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/10 blur-[110px] translate-y-1/2 -translate-x-1/4" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white/10 p-5 rounded-[2.5rem] backdrop-blur-2xl border border-white/10 shadow-2xl"
                        >
                            <Settings2 className="h-10 w-10 text-primary-400" />
                        </motion.div>
                        <div>
                            <motion.h2
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-4xl font-display font-black tracking-tight"
                            >
                                {t('configure_dashboard' as any)}
                            </motion.h2>
                            <motion.p
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-slate-400 text-base font-medium mt-2 max-w-xl"
                            >
                                Liez les colonnes de votre fichier aux indicateurs de performance clés pour activer l'IA.
                            </motion.p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-12 space-y-12 bg-white/60 backdrop-blur-xl">
                {/* Currency Section - Enhanced */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-glass-sm flex flex-col lg:flex-row lg:items-center justify-between gap-8 group hover:shadow-glass-md transition-all duration-500"
                >
                    <div className="flex items-center gap-6">
                        <div className="bg-slate-50 p-5 rounded-3xl group-hover:bg-primary-50 transition-colors shadow-inner">
                            <Coins className="h-8 w-8 text-emerald-500" />
                        </div>
                        <div>
                            <p className="font-display font-black text-slate-900 text-xl leading-none">{t('source_currency' as any)}</p>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-2">{t('select_currency' as any)} · CONVERSION AUTO</p>
                        </div>
                    </div>
                    <div className="flex bg-slate-50 p-2 rounded-3xl border border-slate-200 shadow-inner min-w-[320px]">
                        {['MAD', 'USD', 'EUR'].map((curr) => (
                            <button
                                key={curr}
                                onClick={() => setSourceCurrency(curr)}
                                className={`flex-1 py-4 px-6 rounded-2xl text-sm font-black transition-all ${sourceCurrency === curr ? 'bg-white text-slate-900 shadow-xl border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {curr}
                            </button>
                        ))}
                    </div>
                </motion.div>

                <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-8 px-4">
                        <div className="w-2 h-2 rounded-full bg-primary-600 animate-pulse" />
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Mappage Intelligent</span>
                    </div>

                    <div
                        id="mapping-fields-container"
                        className="grid grid-cols-1 gap-6 max-h-[60vh] overflow-y-auto pr-4 scroll-smooth custom-scrollbar pb-10"
                    >
                        <AnimatePresence>
                            {fields.map((field, idx) => {
                                const isMatched = !!mapping[field.key];
                                // Colors for left accent
                                const colors = [
                                    'bg-sky-400', 'bg-indigo-400', 'bg-violet-400',
                                    'bg-rose-400', 'bg-amber-400', 'bg-emerald-400'
                                ];
                                const accentColor = colors[idx % colors.length];

                                return (
                                    <motion.div
                                        key={field.key}
                                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, y: -20 }}
                                        className="group relative"
                                    >
                                        <div className={`relative p-8 rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:shadow-glass-lg hover:border-primary-100 transition-all duration-500 overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-8`}>

                                            {/* Matches accent color shown on screenshot */}
                                            <div className={`absolute top-0 left-0 w-1.5 h-full ${accentColor} opacity-80 group-hover:opacity-100 transition-opacity`} />

                                            <div className="flex items-center gap-8 flex-1">
                                                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-3xl shadow-inner group-hover:bg-primary-50 transition-all duration-500 group-hover:scale-105">
                                                    {field.icon}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-4">
                                                        <h4 className="font-display font-black text-slate-900 text-xl group-hover:text-primary-600 transition-colors uppercase tracking-tight">{field.label}</h4>
                                                        {field.required && (
                                                            <span className="bg-rose-50 text-rose-600 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-rose-100/50">Obligatoire</span>
                                                        )}
                                                        {isMatched && (
                                                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-emerald-50 text-emerald-600 p-1 rounded-full">
                                                                <ShieldCheck size={16} />
                                                            </motion.div>
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-2.5 flex items-center gap-2">
                                                        <Info size={12} className="text-slate-300" />
                                                        {field.type === 'date' ? 'Analyse temporelle' : field.type === 'number' ? 'Calculs financiers' : field.type === 'intelligence' ? 'Segmentation IA' : 'Indicateur personnalisé'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="relative min-w-[360px] group/select">
                                                <div className="absolute inset-0 bg-primary-600 opacity-0 group-hover/select:opacity-[0.03] rounded-2xl transition-opacity animate-pulse" />
                                                <select
                                                    className={`w-full pl-8 pr-12 py-5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-black text-sm appearance-none cursor-pointer relative z-10 ${isMatched ? 'text-slate-900 border-primary-200 bg-primary-50/20' : 'text-slate-400'}`}
                                                    onChange={(e) => handleSelect(field.key, e.target.value)}
                                                    value={mapping[field.key] || ''}
                                                >
                                                    <option value="">Sélectionner une colonne...</option>
                                                    {columns.map(col => (
                                                        <option key={col} value={col}>{col}</option>
                                                    ))}
                                                </select>
                                                <div className={`absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300 z-20 ${isMatched ? 'text-primary-600 scale-110' : 'text-slate-300 group-hover/select:text-slate-400'}`}>
                                                    <ArrowRight size={22} />
                                                </div>
                                            </div>

                                            {/* Action buttons on hover for custom fields */}
                                            {!field.required && field.type === 'dynamic' && (
                                                <button
                                                    onClick={() => removeField(field.key)}
                                                    className="absolute -top-2 -right-2 p-3 bg-white shadow-lg rounded-full text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 border border-slate-100"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Custom Fields Section Redesigned */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="pt-12 border-t border-slate-100"
                >
                    <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 shadow-inner group focus-within:ring-4 focus-within:ring-primary-500/5 transition-all">
                        <button
                            type="button"
                            onClick={addCustomField}
                            className="bg-white p-4 rounded-2xl shadow-sm text-primary-600 hover:bg-primary-600 hover:text-white transition-all transform active:scale-90"
                        >
                            <Plus size={24} />
                        </button>
                        <input
                            type="text"
                            placeholder="Entrez un indicateur (ex: Pays, Canal de vente...)"
                            className="flex-1 bg-transparent border-none focus:ring-0 outline-none font-black text-slate-900 placeholder:text-slate-400 text-lg"
                            value={customFieldLabel}
                            onChange={(e) => setCustomFieldLabel(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addCustomField()}
                        />
                        <button
                            type="button"
                            onClick={addCustomField}
                            disabled={!customFieldLabel.trim()}
                            className="bg-white text-slate-900 px-10 py-5 rounded-2xl font-black hover:bg-slate-900 hover:text-white transition-all shadow-lg active:scale-95 text-xs uppercase tracking-widest whitespace-nowrap border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {customFieldLabel.trim() ? 'Ajouter au mappage' : 'Tapez un nom'}
                        </button>
                    </div>
                </motion.div>

                {/* Footer Redesigned */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-10 pt-8 mt-4">
                    <div className="flex items-center gap-6">
                        <AnimatePresence mode="wait">
                            {isComplete ? (
                                <motion.div
                                    key="complete"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center gap-4 text-emerald-600 bg-emerald-50 px-6 py-3 rounded-full border border-emerald-100 shadow-sm"
                                >
                                    <ShieldCheck className="h-6 w-6" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Configuration Validée</span>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="incomplete"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center gap-4 text-amber-600 bg-amber-50 px-6 py-3 rounded-full border border-amber-100 shadow-sm"
                                >
                                    <AlertCircle className="h-6 w-6" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Liaisons obligatoires manquantes</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button
                        onClick={() => onComplete({ ...mapping, source_currency: sourceCurrency })}
                        disabled={!isComplete}
                        className="btn-primary w-full lg:w-auto px-20 h-20 text-lg rounded-[2.5rem] gap-5 shadow-2xl shadow-primary-500/40 group disabled:opacity-30 disabled:grayscale transition-all hover:scale-[1.02] active:scale-95 border-b-4 border-primary-700"
                    >
                        <span className="font-black tracking-tight uppercase">Générer le Tableau de Bord</span>
                        <div className="bg-white/20 p-2 rounded-xl group-hover:rotate-180 transition-transform duration-700">
                            <Cpu className="h-6 w-6" />
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}
