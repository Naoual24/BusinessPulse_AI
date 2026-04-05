'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { MessageSquare, ThumbsUp, ThumbsDown, Minus, Hash, AlertTriangle, Lightbulb } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

interface SentimentData {
    distribution: {
        positive: number;
        negative: number;
        neutral: number;
    };
    satisfaction_score: number;
    top_keywords: string[];
    main_issues: string[];
}

export default function SentimentView({ data }: { data: SentimentData }) {
    const { t, isRTL } = useLanguage();

    const chartData = [
        { name: t('positive'), value: data.distribution.positive, color: '#10B981' },
        { name: t('neutral'), value: data.distribution.neutral, color: '#6B7280' },
        { name: t('negative'), value: data.distribution.negative, color: '#EF4444' },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            <h2 className={`text-2xl font-bold text-gray-800 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <MessageSquare className="text-primary-600" />
                {t('customer_feedback')}
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Satisfaction Score Gauge-like Card */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
                    <h3 className="text-gray-500 font-medium mb-4">{t('feedback_score')}</h3>
                    <div className="relative flex items-center justify-center">
                        <svg className="w-40 h-40">
                            <circle
                                cx="80" cy="80" r="70"
                                fill="none"
                                stroke="#F3F4F6"
                                strokeWidth="12"
                            />
                            <circle
                                cx="80" cy="80" r="70"
                                fill="none"
                                stroke={data.satisfaction_score > 70 ? '#10B981' : data.satisfaction_score > 40 ? '#F59E0B' : '#EF4444'}
                                strokeWidth="12"
                                strokeDasharray={2 * Math.PI * 70}
                                strokeDashoffset={2 * Math.PI * 70 * (1 - data.satisfaction_score / 100)}
                                strokeLinecap="round"
                                className="transition-all duration-1000 ease-out"
                                transform="rotate(-90 80 80)"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-black text-gray-900">{data.satisfaction_score}%</span>
                        </div>
                    </div>
                </div>

                {/* Sentiment Distribution Pie Chart */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm lg:col-span-2">
                    <h3 className="text-gray-500 font-medium mb-4 text-center">{t('sentiment_distribution')}</h3>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="middle" align={isRTL ? 'left' : 'right'} layout="vertical" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Keywords Cloud-like Section */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className={`text-gray-800 font-bold mb-4 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <Hash className="h-5 w-5 text-blue-500" />
                        {t('top_keywords')}
                    </h3>
                    <div className={`flex flex-wrap gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        {data.top_keywords.map((word, i) => (
                            <span
                                key={i}
                                className={`px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors cursor-default`}
                                style={{ fontSize: `${Math.max(0.8, 1.2 - i * 0.02)}rem` }}
                            >
                                {word}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Main Issues Section */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className={`text-gray-800 font-bold mb-4 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        {t('main_issues')}
                    </h3>
                    <div className="space-y-3">
                        {data.main_issues.length > 0 ? data.main_issues.map((issue, i) => (
                            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl bg-red-50 border border-red-100 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <div className="h-2 w-2 rounded-full bg-red-500" />
                                <span className="text-red-700 font-bold capitalize">{issue}</span>
                            </div>
                        )) : (
                            <div className="flex flex-col items-center justify-center py-4 text-gray-400">
                                <Lightbulb size={32} className="mb-2 opacity-20" />
                                <p className="text-sm italic">No major issues identified.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
