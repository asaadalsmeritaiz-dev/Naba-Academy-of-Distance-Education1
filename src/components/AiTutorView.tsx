import React, { useState } from 'react';
import {
  BrainCircuit,
  Send,
  Loader2,
  Sparkles,
  HelpCircle,
  BookOpen,
  ArrowLeft,
  GraduationCap
} from 'lucide-react';

export default function AiTutorView() {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: 'مرحباً بك! أنا مرشدك الأكاديمي الشخصي المدعم بالذكاء الاصطناعي في أكاديمية نبا. كيف يمكنني مساعدتك اليوم في تحصيلك الدراسي، مراجعة المحاضرات، أو حل المسائل التقنية؟'
    }
  ]);
  const [input, setInput] = useState('');
  const [isAiResponding, setIsAiResponding] = useState(false);

  const quickPrompts = [
    { text: 'اشرح لي خوارزمية البحث A* بمثال حركي مبسط', topic: 'الذكاء الاصطناعي' },
    { text: 'ما الفرق الجوهري بين تشفير RSA وتشفير AES؟', topic: 'أمن الشبكات' },
    { text: 'كيف يعمل نموذج العصبون المفرد Perceptron في التعلم الآلي؟', topic: 'التعلم العميق' },
    { text: 'أريد نصائح أكاديمية لتجاوز امتحانات المراقبة الذكية بنجاح', topic: 'الإرشادات العامة' }
  ];

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    setMessages((prev) => [...prev, { sender: 'user', text: textToSend }]);
    setInput('');
    setIsAiResponding(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lectureTitle: 'المرشد العام للعلوم والتقنية',
          transcript: 'مساقات الذكاء الاصطناعي، أمن التشفير، تصميم تجربة المستخدم، وحلول الاستذكار الفعال.',
          message: textToSend
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [...prev, { sender: 'ai', text: data.reply }]);
      } else {
        throw new Error();
      }
    } catch (err) {
      // Fallback answers
      await new Promise((resolve) => setTimeout(resolve, 1100));
      let reply = 'أشكرك على هذا السؤال المهم جداً! ';
      if (textToSend.includes('A*')) {
        reply += `خوارزمية A* هي خوارزمية بحث موجهة لحساب أقصر مسار بين عقدة البداية وعقدة الهدف. تعتمد على دالة كلفة إجمالية:\n` +
          `f(n) = g(n) + h(n)\n\n` +
          `حيث:\n` +
          `• g(n) هي الكلفة الفعلية المقطوعة من البداية إلى العقدة n.\n` +
          `• h(n) هي الكلفة التقديرية (Heuristic) المتوقع قطعها من العقدة n للهدف.\n` +
          `الخوارزمية تضمن الوصول للحل الأمثل دائماً طالما كانت دالة التقدير مقبولة (Admissible) أي لا تبالغ أبداً في تقدير التكلفة الفعلية المتبقية.`;
      } else if (textToSend.includes('RSA') || textToSend.includes('AES')) {
        reply += `الفرق الجوهري يكمن في عدد المفاتيح المستعملة:\n\n` +
          `١. التشفير المتناظر (AES): يستخدم نفس المفتاح السري للتشفير وفك التشفير. يتميز بالسرعة الفائقة لذك يكثر استخدامه للبيانات الضخمة والملفات الكبيرة.\n` +
          `٢. التشفير غير المتناظر (RSA): يستخدم زوجاً من المفاتيح، مفتاح عام (Public Key) يشفر به الجميع، ومفتاح خاص (Private Key) يحتفظ به المستلم وحده لفك التشفير. هو أبطأ بكثير من AES ولكنه ممتاز جداً لتبادل المفاتيح وتأسيس قنوات اتصال آمنة في البداية (مثل بروتوكول HTTPS).`;
      } else if (textToSend.includes('Perceptron')) {
        reply += `البيرسبترون هو التمثيل الرياضي المبسط للعصبون البشري الحقيقي في هندسة الحوسبة العصبية. يتكون من:\n` +
          `• مدخلات (Inputs) تضرب بأوزان معينة تبرز أهمية كل مدخل.\n` +
          `• قيمة الانحياز (Bias) للتحكم في خط الفتح.\n` +
          `• دالة التنشيط (Activation Function) التي تحول حاصل الجمع لقرار نهائي (مثل تشغيل أو عدم تشغيل العصبون).\n` +
          `يعتبر حجر الأساس الذي مهد لظهور الشبكات العصبية العميقة متعددة الطبقات.`;
      } else {
        reply += `لتجاوز امتحانات المراقبة الذكية بنجاح، إليك أهم أربع توجيهات أكاديمية:\n\n` +
          `• تأكد من الجلوس في غرفة ذات إضاءة ممتازة ومواجهة تماماً للكاميرا حتى يسهل للذكاء الاصطناعي رصد حركة ملامح وجهك وصد البلاغات الخاطئة.\n` +
          `• أغلق جميع التبويبات والتطبيقات المفتوحة في المتصفح وتجنب الانتقال خارج صفحة الامتحان لمنع رصد تبديل النوافذ.\n` +
          `• حافظ على الهدوء التام والابتعاد عن التلقين الصوتي أو إثارة الضوضاء الشديدة حول الميكروفون.\n` +
          `• في حال حدوث أي انقطاع مفاجئ للتيار الكهربائي أو الإنترنت، تنفس بعمق وتواصل مباشرة مع عمادة شؤون الطلاب لتوثيق العذر الأكاديمي.`;
      }
      setMessages((prev) => [...prev, { sender: 'ai', text: reply }]);
    } finally {
      setIsAiResponding(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col h-[calc(100vh-140px)] justify-between" id="ai-tutor-standalone-view">
      {/* View Header */}
      <div className="p-6 border-b border-slate-50 flex items-center gap-3.5 bg-slate-50/50 rounded-t-3xl">
        <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-md">
          <BrainCircuit className="h-5.5 w-5.5 animate-pulse" />
        </div>
        <div>
          <h2 className="text-base font-black text-slate-900">المرشد والمساعد الأكاديمي الشخصي</h2>
          <p className="text-[10px] text-slate-400 font-bold">بوابة ذكاء اصطناعي تفاعلية لمراجعة المقررات واستفسارات الطلاب الفورية</p>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4" id="ai-tutor-standalone-chatbox">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 max-w-3xl ${msg.sender === 'user' ? 'mr-auto justify-start flex-row-reverse' : 'ml-auto justify-start'}`}>
            <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
              msg.sender === 'user' ? 'bg-slate-100 text-slate-900' : 'bg-slate-900 text-white'
            }`}>
              {msg.sender === 'user' ? 'أنا' : 'AI'}
            </div>
            <div className={`p-4 rounded-2xl text-xs leading-relaxed whitespace-pre-line font-semibold ${
              msg.sender === 'user'
                ? 'bg-slate-900 text-white rounded-tr-none'
                : 'bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isAiResponding && (
          <div className="flex gap-3 items-center text-slate-400 text-xs font-bold">
            <Loader2 className="h-4 w-4 animate-spin text-slate-800" />
            <span>المرشد الأكاديمي يقوم بالتحليل الفوري وصياغة الاستجابة...</span>
          </div>
        )}
      </div>

      {/* Quick Prompt Suggesters */}
      {messages.length === 1 && (
        <div className="px-6 pb-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickPrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(p.text)}
              className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-100 rounded-xl text-right text-xs transition-colors flex justify-between items-center group cursor-pointer font-bold"
            >
              <div className="space-y-0.5">
                <span className="text-[9px] text-slate-800 font-bold bg-slate-100 px-1.5 py-0.5 rounded-md">{p.topic}</span>
                <p className="text-slate-700 font-extrabold group-hover:text-slate-800 transition-colors">{p.text}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Input Message Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(input);
        }}
        className="p-4 border-t border-slate-100 bg-slate-50/20 flex gap-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="اكتب استفسارك الأكاديمي هنا بالتفصيل (مثل: شرح مسألة، اقتراح تلميحات اختبار)..."
          className="flex-1 bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-slate-1000 font-medium text-slate-800"
          id="ai-tutor-standalone-input"
        />
        <button
          type="submit"
          className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl transition-colors shrink-0 flex items-center gap-1.5 font-bold text-xs"
        >
          <span>إرسال الاستفسار</span>
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
