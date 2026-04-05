import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import api from '../lib/api';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

interface PulseTalkProps {
    uploadId?: number | null;
}

export default function PulseTalk({ uploadId }: PulseTalkProps) {
    const { t, language } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isRTL = language === 'ar';

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([{
                id: 'welcome',
                text: t('pulsetalk_welcome' as any),
                sender: 'ai',
                timestamp: new Date()
            }]);
        }
    }, [isOpen]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text: input,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await api.post('/pulsetalk/chat', {
                message: input,
                upload_id: uploadId
            });

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: response.data.response,
                sender: 'ai',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error('PulseTalk Error:', error);
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: t('pulsetalk_error' as any),
                sender: 'ai',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="mb-4 w-96 max-w-[calc(100vw-2rem)] h-[500px] bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-4 bg-primary-600 text-white flex justify-between items-center shadow-lg">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 p-2 rounded-xl">
                                    <Bot size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">PulseTalk AI</h3>
                                    <p className="text-[10px] opacity-80 uppercase tracking-widest font-black">Online Assistant</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="hover:bg-white/20 p-2 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, x: msg.sender === 'user' ? 20 : -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`flex gap-2 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <div className={`mt-1 p-1.5 rounded-lg ${msg.sender === 'user' ? 'bg-primary-100 text-primary-600' : 'bg-slate-100 text-slate-600'}`}>
                                            {msg.sender === 'user' ? <User size={14} /> : <Bot size={14} />}
                                        </div>
                                        <div className={`p-3 rounded-2xl text-sm font-medium leading-relaxed ${msg.sender === 'user'
                                            ? 'bg-primary-600 text-white rounded-tr-none shadow-md shadow-primary-100'
                                            : 'bg-white text-slate-700 rounded-tl-none border border-slate-100 shadow-sm'
                                            }`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="flex gap-2 items-center bg-white border border-slate-100 p-3 rounded-2xl rounded-tl-none shadow-sm">
                                        <Loader2 size={16} className="animate-spin text-primary-600" />
                                        <span className="text-xs text-slate-400 font-bold uppercase tracking-widest italic">PulseTalk is thinking...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-slate-50 border-t border-slate-100">
                            <form
                                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                className="flex gap-2 relative"
                            >
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={t('pulsetalk_placeholder' as any)}
                                    className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 pr-12 transition-all shadow-sm"
                                    dir={isRTL ? 'rtl' : 'ltr'}
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isLoading}
                                    className={`absolute right-1.5 top-1.5 bottom-1.5 w-10 flex items-center justify-center rounded-xl transition-all ${input.trim() && !isLoading
                                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-200 scale-100'
                                        : 'bg-slate-200 text-slate-400 scale-95 cursor-not-allowed'
                                        }`}
                                >
                                    <Send size={18} />
                                </button>
                            </form>
                            <p className="mt-2 text-[9px] text-center text-slate-400 font-bold uppercase tracking-widest">
                                Powered by BusinessPulse AI Engine
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center relative group overflow-hidden ${isOpen ? 'bg-slate-100 text-slate-600' : 'bg-primary-600 text-white'
                    }`}
            >
                <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                >
                    {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
                </motion.div>
                {!isOpen && (
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary-400/0 via-white/20 to-primary-400/0 group-hover:translate-x-full transition-transform duration-1000 -translate-x-full" />
                )}
                {/* Notification Badge */}
                {!isOpen && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 bg-sky-400 text-white p-1 rounded-full border-4 border-white shadow-lg"
                    >
                        <Sparkles size={12} fill="currentColor" />
                    </motion.div>
                )}
            </motion.button>
        </div>
    );
}
