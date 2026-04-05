'use client';

import {
    AlertCircle,
    Zap,
    TrendingUp,
    Calendar,
    ArrowDownRight,
    ArrowUpRight
} from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

interface Alert {
    type: 'red' | 'green';
    message: string;
    date: string;
}

export default function AlertsSection({ alerts }: { alerts: Alert[] }) {
    const { t, isRTL } = useLanguage();
    if (!alerts || alerts.length === 0) return null;

    return (
        <div className={`space-y-4 mb-8 ${isRTL ? 'font-arabic' : ''}`}>
            <h3 className={`text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                <Zap size={16} className="text-primary-500" />
                {t('intelligent_alerts')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {alerts.map((alert, i) => (
                    <div
                        key={i}
                        className={`p-4 rounded-xl border-2 animate-in slide-in-from-top-2 duration-500 delay-${i * 100} ${alert.type === 'red'
                            ? 'bg-red-50 border-red-100 text-red-800'
                            : 'bg-green-50 border-green-100 text-green-800'
                            }`}
                    >
                        <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                            <div className={`p-2 rounded-lg ${alert.type === 'red' ? 'bg-red-100' : 'bg-green-100'}`}>
                                {alert.type === 'red' ? (
                                    <ArrowDownRight className="h-5 w-5 text-red-600" />
                                ) : (
                                    <ArrowUpRight className="h-5 w-5 text-green-600" />
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-sm leading-tight">{alert.message}</p>
                                <div className={`flex items-center gap-2 mt-2 text-[10px] font-bold uppercase opacity-60 ${isRTL ? 'justify-end' : ''}`}>
                                    <Calendar size={12} />
                                    {t('detected_at')} {new Date(alert.date).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
