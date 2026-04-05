'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileText, CheckCircle2, Loader2, FileUp, Sparkles } from 'lucide-react';
import api from '@/lib/api';
import { useLanguage } from '@/lib/LanguageContext';

export default function UploadZone({ onSuccess }: { onSuccess: (id: number) => void }) {
    const { t, isRTL } = useLanguage();
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            const ext = selectedFile.name.split('.').pop()?.toLowerCase();
            if (['csv', 'xlsx', 'xls'].includes(ext || '')) {
                setFile(selectedFile);
                setError('');
            } else {
                setError(t('supported_formats' as any));
            }
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        setError('');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/analytics/upload', formData);
            onSuccess(res.data.id);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Le téléchargement a échoué');
        } finally {
            setUploading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`max-w-2xl mx-auto glass rounded-[2.5rem] p-10 shadow-glass-lg border border-white/40 overflow-hidden relative ${isRTL ? 'font-arabic text-right' : ''}`}
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />

            <AnimatePresence mode="wait">
                {!file ? (
                    <motion.div
                        key="dropzone"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-10"
                    >
                        <div className="bg-primary-50 p-6 rounded-[1.5rem] mb-6 relative group transition-transform hover:scale-110">
                            <Upload className="h-10 w-10 text-primary-600 transition-transform group-hover:-translate-y-1" />
                            <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <h3 className="text-2xl font-display font-black text-slate-900 mb-3 tracking-tight">{t('upload_your_data' as any)}</h3>
                        <p className="text-slate-500 mb-8 text-center font-medium max-w-sm leading-relaxed">
                            {isRTL ? 'تنسيقات الملفات المدعومة: CSV، XLSX، XLS' : 'Importez vos données de vente (CSV, Excel) pour générer des insights stratégiques.'}
                        </p>

                        <label className="btn-primary px-10 h-14 cursor-pointer gap-3 shadow-xl shadow-primary-500/20">
                            <FileUp size={20} />
                            <span className="font-bold text-sm">Choisir un document</span>
                            <input type="file" className="hidden" onChange={handleFileChange} accept=".csv,.xlsx,.xls" />
                        </label>

                        {error && (
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-rose-500 text-[10px] font-black uppercase tracking-widest mt-6 bg-rose-50 px-4 py-2 rounded-xl border border-rose-100"
                            >
                                ⚠️ {error}
                            </motion.p>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="file-selected"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        className="flex flex-col items-center py-4"
                    >
                        <div className="flex items-center gap-6 bg-slate-50 p-6 rounded-[2rem] w-full mb-10 border border-slate-100 group">
                            <div className="bg-white p-4 rounded-2xl shadow-sm group-hover:bg-primary-50 transition-colors">
                                <FileText className="h-8 w-8 text-slate-400 group-hover:text-primary-600 transition-colors" />
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="font-display font-black text-slate-900 truncate text-lg">{file.name}</p>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{(file.size / 1024).toFixed(1)} KB — Prêt pour l'analyse</p>
                            </div>
                            <button
                                onClick={() => setFile(null)}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100"
                                aria-label="Supprimer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {error && (
                            <p className="text-rose-500 text-sm font-bold mb-6">⚠️ {error}</p>
                        )}

                        <button
                            onClick={handleUpload}
                            disabled={uploading}
                            className="btn-primary w-full h-16 rounded-3xl font-black text-base gap-4 shadow-2xl shadow-primary-500/30 group disabled:opacity-50"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                    <span>Traitement des algorithmes...</span>
                                </>
                            ) : (
                                <>
                                    <span>Lancer l'analyse décisionnelle</span>
                                    <CheckCircle2 size={24} className="group-hover:scale-110 transition-transform" />
                                </>
                            )}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
