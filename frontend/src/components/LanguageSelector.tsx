
'use client';

import { useLanguage } from '@/lib/LanguageContext';
import { Globe } from 'lucide-react';

export default function LanguageSelector() {
    const { language, setLanguage } = useLanguage();

    return (
        <div className="flex items-center gap-3 px-4 py-2 bg-white/80 backdrop-blur-md rounded-xl border border-primary-100 shadow-sm hover:shadow-md transition-all group">
            <Globe size={18} className="text-primary-500 group-hover:rotate-12 transition-transform" />
            <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="bg-transparent text-sm font-bold text-gray-700 focus:outline-none cursor-pointer appearance-none pr-6"
                style={{
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236B7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right center',
                    backgroundSize: '1.2em'
                }}
            >
                <option value="fr">Français</option>
                <option value="ar">العربية</option>
                <option value="en">English</option>
            </select>
        </div>
    );
}
