import React from 'react';
import { Shield, HelpCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Footer() {
  const { t, language } = useLanguage();

  return (
    <footer className="w-full bg-slate-50 border-t border-slate-100 py-6 px-8 flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto" id="app-footer">
      <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
        <span>© {language === 'ar' ? '٢٠٢٦' : '2026'} {t('footer_rights')}</span>
      </div>
      <div className="flex items-center gap-6">
        <a href="#" className="text-xs text-slate-400 hover:text-slate-800 font-bold flex items-center gap-1.5 transition-colors">
          <Shield className="h-3.5 w-3.5" />
          {language === 'ar' ? 'سياسة الخصوصية والمراقبة الذكية' : 'Privacy & Proctoring Policy'}
        </a>
        <a href="#" className="text-xs text-slate-400 hover:text-slate-800 font-bold flex items-center gap-1.5 transition-colors">
          <HelpCircle className="h-3.5 w-3.5" />
          {language === 'ar' ? 'مركز المساعدة والدعم التقني' : 'Help & Support Center'}
        </a>
      </div>
    </footer>
  );
}
