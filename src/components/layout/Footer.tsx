import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Globe, Heart, Shield, Sparkles } from 'lucide-react';
import { VeyraLogo } from '../common/VeyraLogo';

interface FooterProps {
  onNavigate: (page: string) => void;
  currentPage?: string;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, currentPage }) => {
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          {/* Col 1: Brand & Mission */}
          <div className="space-y-4 md:col-span-1">
            <VeyraLogo size="md" showTagline={true} />
            <p className="text-xs text-slate-400 leading-relaxed font-devanagari">
              {language === 'hi' 
                ? 'मातृभाषा हिंदी और वैश्विक अंग्रेजी में असीमित गहराई वाली शिक्षा। बच्चों के सिमुलेशन से लेकर उच्च भौतिकी तक।'
                : 'Pioneering unlimited-depth bilingual education from playful wonder labs to advanced STEM mechanics.'}
            </p>
            <div className="pt-2">
              <button
                onClick={toggleLanguage}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700"
              >
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span>{language === 'hi' ? 'Switch to English' : 'हिंदी में बदलें'}</span>
              </button>
            </div>
          </div>

          {/* Col 2: Learning Pillars */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              {language === 'hi' ? 'शिक्षण पद्धतियाँ' : 'Learning Science'}
            </h4>
            <ul className="space-y-2 text-xs text-slate-400 font-devanagari">
              <li>{language === 'hi' ? '• सक्रिय स्मरण अभ्यास (Active Retrieval)' : '• Active Retrieval Practice'}</li>
              <li>{language === 'hi' ? '• इंटरैक्टिव HTML5 सिमुलेशन' : '• Interactive HTML5 Simulations'}</li>
              <li>{language === 'hi' ? '• अंतरालीय दोहराव फ़्लैशकार्ड्स' : '• Spaced Repetition Flashcards'}</li>
              <li>{language === 'hi' ? '• वीडियो चेकपॉइंट क्विज़' : '• Video Checkpoint Quizzes'}</li>
              <li>{language === 'hi' ? '• संज्ञानात्मक शिक्षण संरचना' : '• Scoped Cognitive Scaffolding'}</li>
            </ul>
          </div>

          {/* Col 3: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              {language === 'hi' ? 'त्वरित लिंक' : 'Quick Navigation'}
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              {currentPage === 'landing' && (
                <li>
                  <button onClick={() => onNavigate('simulations')} className="hover:text-white transition-colors">
                    {t('nav.simulations')}
                  </button>
                </li>
              )}
              <li>
                <button onClick={() => onNavigate('classroom')} className="hover:text-white transition-colors">
                  {t('nav.myLearning')}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('blogs')} className="hover:text-white transition-colors flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>{language === 'hi' ? 'सुपर एडमिन आलेख (Blogs)' : 'Super Admin Blogs'}</span>
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-white transition-colors">
                  {t('nav.about')}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('contact')} className="hover:text-white transition-colors">
                  {t('nav.contact')}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('admin')} className="hover:text-white transition-colors">
                  {t('nav.adminPortal')}
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Compliance & Safety */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-400" />
              {language === 'hi' ? 'डेटा सुरक्षा एवं गोपनीयता' : 'Data Security & Privacy'}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed font-devanagari">
              {language === 'hi'
                ? "भारत के डिजिटल व्यक्तिगत डेटा संरक्षण (DPDP) अधिनियम 2023 के पूर्णतः अनुरूप। शून्य अनैतिक ट्रैकिंग, सुरक्षित प्रमाणीकरण और पूर्णतः संरक्षित निजी डेटा ढांचा।"
                : "Fully compliant with India's Digital Personal Data Protection (DPDP) Act 2023. Zero behavioral tracking, enterprise authentication, and strict privacy safeguards."}
            </p>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>{language === 'hi' ? '© 2026 वेयरा टेक्नोलॉजीज। सर्वाधिकार सुरक्षित।' : '© 2026 Veyra Technologies. All rights reserved.'}</p>
          <p className="flex items-center gap-1">
            {language === 'hi' ? (
              <>भारत और विश्व भर के शिक्षार्थियों के लिए <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" /> से निर्मित।</>
            ) : (
              <>Built with <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" /> for learners across Bharat & the world.</>
            )}
          </p>
        </div>
      </div>
    </footer>
  );
};
