'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    User,
    Settings as SettingsIcon,
    Upload,
    Lock,
    Save,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Coins,
    Camera,
    Mail,
    ShieldCheck,
    Zap,
    BrainCircuit,
    Eye,
    EyeOff
} from 'lucide-react';
import api from '@/lib/api';
import { useLanguage } from '@/lib/LanguageContext';

export default function SettingsView() {
    const { t, isRTL } = useLanguage();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [showApiKey, setShowApiKey] = useState(false);

    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/users/me');
            setProfile(res.data);
        } catch (err) {
            console.error("Failed to fetch profile:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (updates: any) => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await api.patch('/users/me', updates);
            setProfile(res.data);
            setMessage({ type: 'success', text: t('save_changes' as any) });
        } catch (err) {
            setMessage({ type: 'error', text: 'Erreur lors de la mise à jour.' });
        } finally {
            setSaving(false);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;

        setSaving(true);
        const formData = new FormData();
        formData.append('file', e.target.files[0]);

        try {
            const res = await api.post('/users/me/logo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setProfile(res.data);
            setMessage({ type: 'success', text: t('company_logo' as any) + ' mis à jour !' });
        } catch (err) {
            setMessage({ type: 'error', text: 'Erreur lors du téléchargement du logo.' });
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            setMessage({ type: 'error', text: 'Les nouveaux mots de passe ne correspondent pas.' });
            return;
        }

        setSaving(true);
        try {
            await api.post('/users/me/password', {
                current_password: passwords.current,
                new_password: passwords.new
            });
            setMessage({ type: 'success', text: 'Mot de passe modifié avec succès !' });
            setPasswords({ current: '', new: '', confirm: '' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.detail || 'Erreur lors du changement de mot de passe.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[40vh]">
                <Loader2 className="h-12 w-12 text-primary-600 animate-spin" />
            </div>
        );
    }

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
        <div className={`max-w-5xl mx-auto space-y-10 focus:outline-none ${isRTL ? 'font-arabic' : ''}`}>
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50/30 blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-primary-50 p-2 rounded-xl text-primary-600">
                            <SettingsIcon className="h-6 w-6" />
                        </div>
                        <h2 className="text-2xl font-display font-black text-slate-900 tracking-tight">{t('profile_settings' as any)}</h2>
                    </div>
                    <p className="text-slate-500 text-sm font-medium">Gérez vos informations personnelles et vos préférences système.</p>
                </div>

                {message && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`px-6 py-3 rounded-2xl flex items-center gap-3 border shadow-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}
                    >
                        {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                        <p className="font-bold text-xs uppercase tracking-widest">{message.text}</p>
                    </motion.div>
                )}
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
                {/* Profile & Logo */}
                <div className="lg:col-span-2 space-y-8">
                    <motion.div variants={itemVariants} className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="bg-blue-50 p-2 rounded-xl text-blue-600">
                                <User size={20} />
                            </div>
                            <h3 className="text-lg font-display font-black text-slate-900">{t('general_info' as any)}</h3>
                        </div>

                        <div className="space-y-10">
                            <div className="flex flex-col sm:flex-row items-center gap-8">
                                <div className="relative group">
                                    <div className="w-32 h-32 rounded-[2rem] bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-primary-400 group-hover:bg-primary-50/30">
                                        {profile?.company_logo ? (
                                            <img src={profile.company_logo} alt="Logo" className="w-full h-full object-contain p-2" />
                                        ) : (
                                            <Camera className="text-slate-300 group-hover:text-primary-400 transition-colors" size={40} />
                                        )}
                                    </div>
                                    <label className="absolute -bottom-2 -right-2 bg-slate-900 text-white p-3 rounded-2xl cursor-pointer hover:bg-primary-600 transition-all shadow-lg hover:scale-110 active:scale-95">
                                        <input type="file" className="hidden" onChange={handleLogoUpload} accept="image/*" />
                                        <Upload size={14} className="font-black" />
                                    </label>
                                </div>

                                <div className="flex-1 text-center sm:text-left space-y-3">
                                    <div className="inline-flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                                        <Mail className="h-3 w-3 text-slate-400" />
                                        <span className="text-xs font-black text-slate-600 truncate max-w-[200px]">{profile?.email}</span>
                                    </div>
                                    <h4 className="text-2xl font-display font-black text-slate-900 tracking-tight">Utilisateur BusinessPulse</h4>
                                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                            Membre depuis {new Date(profile?.created_at).toLocaleDateString()}
                                        </p>
                                        <div className="w-1 h-1 bg-slate-200 rounded-full" />
                                        <p className="text-[10px] text-primary-600 font-black bg-primary-50 px-3 py-1 rounded-full uppercase tracking-widest border border-primary-100">
                                            Tier Professionnel
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-slate-50">
                                <div className="flex items-center gap-2 mb-6">
                                    <Coins className="h-4 w-4 text-emerald-500" />
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{t('preferred_currency' as any)}</label>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-1 gap-4 max-w-xs">
                                    <button
                                        onClick={() => handleUpdateProfile({ currency: 'MAD' })}
                                        className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all relative group ${profile?.currency === 'MAD' ? 'border-primary-600 bg-primary-50/30' : 'border-slate-50 bg-slate-50/50 hover:border-slate-200 hover:bg-white'}`}
                                    >
                                        <div className={`p-3 rounded-xl ${profile?.currency === 'MAD' ? 'bg-primary-600 text-white' : 'bg-emerald-50 text-emerald-600'} transition-colors`}>
                                            <Coins size={20} />
                                        </div>
                                        <div className="text-left">
                                            <span className={`block text-sm font-black ${profile?.currency === 'MAD' ? 'text-primary-600' : 'text-slate-900'}`}>MAD</span>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Moroccan Dirham</span>
                                        </div>
                                        {profile?.currency === 'MAD' && (
                                            <motion.div layoutId="active-curr" className="absolute top-2 right-2">
                                                <CheckCircle2 size={16} className="text-primary-600" />
                                            </motion.div>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* AI Configuration */}
                    <motion.div variants={itemVariants} className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="bg-primary-600 p-2 rounded-xl text-white">
                                <BrainCircuit size={20} />
                            </div>
                            <h3 className="text-lg font-display font-black text-slate-900 tracking-tight">Configuration Intelligence Artificielle</h3>
                        </div>

                        <div className="space-y-6">
                            <p className="text-slate-500 text-sm font-medium leading-relaxed">
                                Pour utiliser les fonctionnalités de **PulseTalk** et **Magic Scanner**, vous devez configurer votre clé API Google Gemini.
                            </p>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Google Gemini API KEY</label>
                                <div className="relative group">
                                    <input
                                        type={showApiKey ? "text" : "password"}
                                        placeholder="Votre Clé API (ex: AIza...)"
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-bold text-sm text-slate-900 placeholder:text-slate-400 pr-14"
                                        value={profile?.google_api_key || ''}
                                        onChange={e => setProfile({ ...profile, google_api_key: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowApiKey(!showApiKey)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-primary-600 transition-colors"
                                    >
                                        {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium px-1">
                                    Vous pouvez obtenir une clé gratuite sur le <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary-600 font-black hover:underline">Google AI Studio</a>.
                                </p>
                            </div>

                            <button
                                onClick={() => handleUpdateProfile({ google_api_key: profile.google_api_key })}
                                disabled={saving}
                                className="btn-primary w-full sm:w-auto px-10 h-14 gap-3 bg-primary-600 border-none shadow-xl shadow-primary-200"
                            >
                                {saving ? <Loader2 className="animate-spin h-5 w-5" /> : <Save size={20} />}
                                <span className="font-bold">Enregistrer la Configuration IA</span>
                            </button>
                        </div>
                    </motion.div>

                    {/* Password Change */}
                    <motion.div variants={itemVariants} className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="bg-slate-900 p-2 rounded-xl text-white">
                                <Lock size={20} />
                            </div>
                            <h3 className="text-lg font-display font-black text-slate-900">{t('security' as any)}</h3>
                        </div>

                        <form onSubmit={handlePasswordChange} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">{t('current_password' as any)}</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-bold text-sm text-slate-900 placeholder:text-slate-400"
                                    value={passwords.current}
                                    onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">{t('new_password' as any)}</label>
                                    <input
                                        type="password"
                                        required
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-bold text-sm text-slate-900 placeholder:text-slate-400"
                                        value={passwords.new}
                                        onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">{t('confirm_password' as any)}</label>
                                    <input
                                        type="password"
                                        required
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-bold text-sm text-slate-900 placeholder:text-slate-400"
                                        value={passwords.confirm}
                                        onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={saving}
                                className="btn-primary w-full sm:w-auto px-10 h-14 gap-3 bg-slate-900 hover:bg-slate-800 border-none shadow-xl shadow-slate-200"
                            >
                                {saving ? <Loader2 className="animate-spin h-5 w-5" /> : <ShieldCheck size={20} />}
                                <span className="font-bold">{t('update_password' as any)}</span>
                            </button>
                        </form>
                    </motion.div>
                </div>

                {/* Sidebar info */}
                <motion.div variants={itemVariants} className="space-y-6">
                    <div className="bg-slate-900 text-white p-10 rounded-[2.5rem] shadow-2xl shadow-slate-900/20 relative overflow-hidden group h-full">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 blur-[80px] -translate-y-1/2 translate-x-1/2" />
                        <div className="relative z-10">
                            <div className="bg-white/10 p-4 rounded-3xl w-fit mb-8 backdrop-blur-md border border-white/5">
                                <Zap size={32} className="text-primary-400 group-hover:scale-110 transition-transform duration-500" />
                            </div>
                            <h4 className="text-2xl font-display font-black mb-4 tracking-tight">{t('personalization' as any)}</h4>
                            <p className="text-slate-400 text-sm leading-relaxed font-medium mb-10">
                                {t('personalization_desc' as any)}
                            </p>

                            <div className="space-y-6">
                                <div className="bg-white/5 p-6 rounded-3xl border border-white/5 hover:bg-white/10 transition-colors cursor-default">
                                    <p className="text-[10px] font-black uppercase tracking-widest mb-4 text-primary-400">Configuration en vigueur</p>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center font-display font-black text-sm shadow-lg shadow-primary-600/30">
                                            {profile?.currency}
                                        </div>
                                        <div>
                                            <span className="block font-black text-white text-base leading-none">
                                                Moroccan Dirham
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Devise de reporting</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 rounded-3xl border border-white/5 bg-white/5">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Système BusinessPulse</p>
                                    <div className="flex items-center gap-3 text-xs font-bold text-slate-300">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        Version Engine 2.1.0 Cloud
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div >
        </div >
    );
}
