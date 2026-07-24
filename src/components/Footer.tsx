import React from 'react';
import { Shield, HelpCircle, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-slate-50 border-t border-slate-100 py-6 px-8 flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto" id="app-footer">
      <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
        <span>© ٢٠٢٦ أكاديمية نبا للتعليم عن بعد (Naba Academy) - جميع الحقوق محفوظة.</span>
      </div>
      <div className="flex items-center gap-6">
        <a href="#" className="text-xs text-slate-400 hover:text-slate-800 font-bold flex items-center gap-1.5 transition-colors">
          <Shield className="h-3.5 w-3.5" />
          سياسة الخصوصية والمراقبة الذكية
        </a>
        <a href="#" className="text-xs text-slate-400 hover:text-slate-800 font-bold flex items-center gap-1.5 transition-colors">
          <HelpCircle className="h-3.5 w-3.5" />
          مركز المساعدة والدعم التقني
        </a>
      </div>
    </footer>
  );
}
