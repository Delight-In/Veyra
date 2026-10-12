import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Mail, MessageSquare, Send, CheckCircle2, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const { language, t } = useLanguage();

  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [honeypot, setHoneypot] = useState<string>(''); // invisible spam honeypot
  const [spamAnswer, setSpamAnswer] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Math challenge: 8 + 5 = 13
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) {
      // Bot trapped in honeypot
      return;
    }

    if (!name.trim() || !email.trim() || !message.trim()) {
      setErrorMessage(language === 'hi' ? 'कृपया सभी आवश्यक फ़ील्ड भरें।' : 'Please fill all required fields.');
      return;
    }

    if (spamAnswer.trim() !== '13') {
      setErrorMessage(language === 'hi' ? 'गलत एंटी-स्पैम सुरक्षा उत्तर। 8 + 5 = 13' : 'Incorrect anti-spam security answer. 8 + 5 = 13');
      return;
    }

    setErrorMessage(null);
    setIsSubmitted(true);
    setName('');
    setEmail('');
    setSubject('');
    setMessage('');
    setSpamAnswer('');
  };

  const faqs = [
    {
      qEn: 'Is Veyra completely free to learn?',
      qHi: 'क्या वेयरा (Veyra) पर पढ़ना पूरी तरह से निःशुल्क है?',
      aEn: 'Yes! All core conceptual lessons, interactive simulations, and video checkpoints are freely accessible to all learners.',
      aHi: 'हाँ! सभी मूलभूत पाठ, इंटरैक्टिव प्रयोगशालाएं और वीडियो चेकपॉइंट्स सभी विद्यार्थियों के लिए निःशुल्क उपलब्ध हैं।'
    },
    {
      qEn: 'How does the bilingual Hindi & English engine work?',
      qHi: 'द्विभाषी हिंदी और अंग्रेजी प्रणाली कैसे काम करती है?',
      aEn: 'You can toggle the language switch at any point on any page. Technical scientific terms retain precise Devanagari translation while preserving English equivalents for exams.',
      aHi: 'आप किसी भी पृष्ठ पर किसी भी समय भाषा बदल सकते हैं। वैज्ञानिक शब्दों को देवनागरी और अंग्रेजी दोनों में स्पष्ट रखा गया है।'
    },
    {
      qEn: 'How is children\'s safety ensured under DPDP Act 2023?',
      qHi: 'DPDP अधिनियम 2023 के तहत बच्चों की सुरक्षा कैसे सुनिश्चित होती है?',
      aEn: 'Child accounts operate without public profiles or open chat. Parents link to their accounts, set screen time limits, and protect settings with a Parent Gate.',
      aHi: 'बाल खातों में कोई सार्वजनिक प्रोफ़ाइल या खुला चैट नहीं होता। अभिभावक स्क्रीन समय नियंत्रित कर सकते हैं और पैरेंट गेट द्वारा सुरक्षा तय कर सकते हैं।'
    },
    {
      qEn: 'Can teachers or professors create new topics and simulations?',
      qHi: 'क्या शिक्षक या प्राध्यापक नए विषय और सिमुलेशन बना सकते हैं?',
      aEn: 'Yes! Our multi-layer RBAC allows institutions to assign Branch Admins (e.g. for Physics or Biology) who appoint creators and publish approved interactive lessons.',
      aHi: 'हाँ! हमारी बहुस्तरीय भूमिका प्रणाली के माध्यम से शिक्षक शाखा प्रबंधक या कंटेंट क्रिएटर बनकर अपनी सामग्री जोड़ सकते हैं।'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-16 py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400">
          {language === 'hi' ? 'सहायता एवं शैक्षणिक पूछताछ' : 'Support & Educator Enquiries'}
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight">
          {t('contact.title')}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-devanagari">
          {t('contact.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Contact Form with Spam Protection */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Mail className="w-5 h-5 text-indigo-600" />
            {language === 'hi' ? 'संदेश भेजें' : 'Send a Message'}
          </h2>

          {isSubmitted ? (
            <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-3 animate-in fade-in">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="font-bold text-base text-emerald-900 dark:text-emerald-200">
                {t('contact.successMsg')}
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                {language === 'hi' ? 'हमारी शैक्षणिक टीम जल्द ही आपके पंजीकृत ईमेल पर उत्तर देगी।' : 'Our academic team will respond to your registered email shortly.'}
              </p>
              <button
                onClick={() => setIsSubmitted(false)}
                className="mt-2 text-xs font-bold text-emerald-700 hover:underline"
              >
                {language === 'hi' ? 'दूसरा संदेश भेजें' : 'Send another message'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs font-semibold border border-rose-200">
                  {errorMessage}
                </div>
              )}

              {/* Invisible Honeypot for bots */}
              <input
                type="text"
                name="website_url_hp"
                value={honeypot}
                onChange={e => setHoneypot(e.target.value)}
                style={{ display: 'none' }}
                tabIndex={-1}
                autoComplete="off"
              />

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t('contact.name')} *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full text-xs md:text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t('contact.email')} *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full text-xs md:text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t('contact.subject')}
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder={language === 'hi' ? 'उदा. स्कूल सिमुलेशन उपयोग / प्रतिक्रिया' : 'e.g. School Simulation Adoption / Feedback'}
                  className="w-full text-xs md:text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t('contact.message')} *
                </label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="w-full text-xs md:text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-devanagari"
                />
              </div>

              {/* Anti-Spam Human Verification */}
              <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-900/60 space-y-1.5">
                <label className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  {t('contact.spamQuestion')} 8 + 5? *
                </label>
                <input
                  type="number"
                  required
                  placeholder={language === 'hi' ? '13 दर्ज करें' : 'Enter 13'}
                  value={spamAnswer}
                  onChange={e => setSpamAnswer(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                {t('contact.submitBtn')}
              </button>
            </form>
          )}
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            {t('contact.faqTitle')}
          </h2>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-all"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full text-left p-4 flex items-center justify-between gap-3 font-bold text-xs md:text-sm text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400"
                  >
                    <span>{language === 'hi' ? faq.qHi : faq.qEn}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 flex-shrink-0" />}
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-devanagari border-t border-slate-100 dark:border-slate-800 pt-3">
                      {language === 'hi' ? faq.aHi : faq.aEn}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
