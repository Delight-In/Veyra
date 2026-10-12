/**
 * Comprehensive Speech Synthesis Engine with Genuine Indian Accent & High-Fidelity Hindi Support.
 * 
 * Features:
 * 1. Prioritization of natural neural Hindi voices (Swara, Madhur, Google हिन्दी, Kalpana, Hemant, Lekha).
 * 2. Prioritization of natural Indian English voices (Neerja, Prabhat, Heera, Ravi, Google en-IN, Veena, Rishi).
 * 3. Sound-form phonetic conversion for LaTeX, mathematics, kinematics formulas, markdown symbols, and numbers.
 * 4. Parentheses and bracket speech-artifact removal (no more "bracket open / bracket close").
 * 5. Deterministic phonetic transliteration fallback if no native Hindi voice is installed on the host OS.
 * 6. Chrome long-speech pause/resume heartbeat preventing mid-sentence cutoff.
 */

let cachedVoices: SpeechSynthesisVoice[] = [];

export const preloadSpeechVoices = (): void => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  
  const updateVoices = () => {
    const list = window.speechSynthesis.getVoices();
    if (list && list.length > 0) {
      cachedVoices = list;
    }
  };

  updateVoices();
  window.speechSynthesis.addEventListener('voiceschanged', updateVoices);
  // Also register onvoiceschanged as fallback for older Chromium
  if (window.speechSynthesis.onvoiceschanged === null) {
    window.speechSynthesis.onvoiceschanged = updateVoices;
  }
};

// Auto-preload on script evaluation
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  preloadSpeechVoices();
}

export const getAllAvailableVoices = (): SpeechSynthesisVoice[] => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  const current = window.speechSynthesis.getVoices();
  if (current && current.length > 0) {
    cachedVoices = current;
    return current;
  }
  return cachedVoices;
};

export const isHindiVoice = (v: SpeechSynthesisVoice): boolean => {
  const lang = v.lang.toLowerCase().replace('_', '-');
  const name = v.name.toLowerCase();
  return (
    lang === 'hi-in' ||
    lang === 'hi' ||
    lang.startsWith('hi-') ||
    name.includes('hindi') ||
    name.includes('हिन्दी') ||
    name.includes('kalpana') ||
    name.includes('swara') ||
    name.includes('madhur') ||
    name.includes('hemant') ||
    name.includes('lekha') ||
    name.includes('madhavi')
  );
};

export const getBestHindiVoice = (preferredVoiceName?: string): SpeechSynthesisVoice | null => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

  const voices = getAllAvailableVoices();
  if (!voices || voices.length === 0) return null;

  // 0. User explicit preference
  const pref = preferredVoiceName || (typeof localStorage !== 'undefined' ? localStorage.getItem('preferred_tts_voice_hi') : null);
  if (pref) {
    const matched = voices.find(v => v.name.toLowerCase() === pref.toLowerCase() && isHindiVoice(v));
    if (matched) return matched;
  }

  const hindiVoices = voices.filter(isHindiVoice);
  if (hindiVoices.length > 0) {
    // 1. Natural / Online Neural voices (Microsoft Swara / Madhur, Google हिन्दी)
    const natural = hindiVoices.find(v => {
      const name = v.name.toLowerCase();
      return (
        name.includes('natural') || 
        name.includes('online') || 
        name.includes('neural') ||
        name.includes('google') || 
        name.includes('swara') || 
        name.includes('madhur')
      );
    });
    if (natural) return natural;

    // 2. Windows OneCore Hindi (Kalpana / Hemant)
    const oneCore = hindiVoices.find(v => {
      const name = v.name.toLowerCase();
      return name.includes('kalpana') || name.includes('hemant');
    });
    if (oneCore) return oneCore;

    // 3. Exact hi-IN tag
    const exactHiIn = hindiVoices.find(v => v.lang.toLowerCase().replace('_', '-') === 'hi-in');
    if (exactHiIn) return exactHiIn;

    return hindiVoices[0];
  }

  // Fallback: If no Hindi voice on system, try Indian English voice for Hinglish phonetic transliteration
  const fallbackIndianEng = voices.find(v => isIndianEnglishVoice(v));
  if (fallbackIndianEng) return fallbackIndianEng;

  return voices.find(v => v.lang.startsWith('en')) || voices[0] || null;
};

export const isIndianEnglishVoice = (v: SpeechSynthesisVoice): boolean => {
  const lang = v.lang.toLowerCase().replace('_', '-');
  const name = v.name.toLowerCase();
  return (
    lang === 'en-in' ||
    lang.startsWith('en-in') ||
    lang === 'en_in' ||
    name.includes('india') ||
    name.includes('indian') ||
    name.includes('heera') ||
    name.includes('ravi') ||
    name.includes('neerja') ||
    name.includes('prabhat') ||
    name.includes('veena') ||
    name.includes('rishi') ||
    name.includes('isha') ||
    name.includes('sangeeta') ||
    name.includes('aarav') ||
    name.includes('aditi') ||
    name.includes('kavya') ||
    name.includes('priya')
  );
};

export const getBestEnglishVoice = (preferredVoiceName?: string): SpeechSynthesisVoice | null => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

  const voices = getAllAvailableVoices();
  if (!voices || voices.length === 0) return null;

  // 0. User explicit preference
  const pref = preferredVoiceName || (typeof localStorage !== 'undefined' ? localStorage.getItem('preferred_tts_voice_en') : null);
  if (pref) {
    const matched = voices.find(v => v.name.toLowerCase() === pref.toLowerCase() && !isHindiVoice(v));
    if (matched) return matched;
  }

  // 1. Natural / Online Neural Indian English (Neerja, Prabhat)
  const neuralIndian = voices.find(v => {
    const name = v.name.toLowerCase();
    return isIndianEnglishVoice(v) && !isHindiVoice(v) && (
      name.includes('natural') || 
      name.includes('online') || 
      name.includes('neural') ||
      name.includes('neerja') || 
      name.includes('prabhat')
    );
  });
  if (neuralIndian) return neuralIndian;

  // 2. Windows Desktop / OneCore Indian English (Heera, Ravi)
  const windowsIndian = voices.find(v => {
    const name = v.name.toLowerCase();
    return (name.includes('heera') || name.includes('ravi')) && !isHindiVoice(v);
  });
  if (windowsIndian) return windowsIndian;

  // 3. Exact en-IN tag (e.g. Google English (India))
  const exactEnIn = voices.find(v => {
    const lang = v.lang.toLowerCase().replace('_', '-');
    return (lang === 'en-in' || lang === 'en_in') && !isHindiVoice(v);
  });
  if (exactEnIn) return exactEnIn;

  // 4. macOS / iOS / Mobile Indian English (Veena, Rishi, Isha, Sangeeta, Aditi, Priya)
  const deviceIndian = voices.find(v => isIndianEnglishVoice(v) && !isHindiVoice(v));
  if (deviceIndian) return deviceIndian;

  // 5. High-clarity Natural / Online Neural English (Microsoft Jenny, Aria, Guy, Sonia, Google US/UK)
  const neuralEnglish = voices.find(v => {
    const name = v.name.toLowerCase();
    const lang = v.lang.toLowerCase().replace('_', '-');
    return lang.startsWith('en') && !isHindiVoice(v) && (
      name.includes('natural') ||
      name.includes('online') ||
      name.includes('neural') ||
      name.includes('jenny') ||
      name.includes('aria') ||
      name.includes('guy') ||
      name.includes('sonia') ||
      name.includes('google')
    );
  });
  if (neuralEnglish) return neuralEnglish;

  // 6. Windows Desktop / OneCore English (Microsoft Zira, David, Mark) - crystal clear articulation
  const desktopFemale = voices.find(v => {
    const name = v.name.toLowerCase();
    return (name.includes('zira') || name.includes('eva') || name.includes('susan')) && !isHindiVoice(v);
  });
  if (desktopFemale) return desktopFemale;

  const desktopMale = voices.find(v => {
    const name = v.name.toLowerCase();
    return (name.includes('david') || name.includes('mark') || name.includes('george')) && !isHindiVoice(v);
  });
  if (desktopMale) return desktopMale;

  // 7. Any English voice on system that is NOT a Hindi voice
  const anyEnglish = voices.find(v => {
    const lang = v.lang.toLowerCase().replace('_', '-');
    return lang.startsWith('en') && !isHindiVoice(v);
  });
  if (anyEnglish) return anyEnglish;

  // 8. System default voice (as long as it's not a Hindi voice)
  const defaultVoice = voices.find(v => v.default && !isHindiVoice(v));
  if (defaultVoice) return defaultVoice;

  return voices.find(v => !isHindiVoice(v)) || voices[0] || null;
};

export const getBestVoiceForLanguage = (
  targetLang: 'en' | 'hi' = 'en',
  preferredVoiceName?: string
): SpeechSynthesisVoice | null => {
  if (targetLang === 'hi') {
    return getBestHindiVoice(preferredVoiceName);
  }
  return getBestEnglishVoice(preferredVoiceName);
};

export const getAvailableVoicesForLanguage = (targetLang: 'en' | 'hi'): SpeechSynthesisVoice[] => {
  const voices = getAllAvailableVoices();
  if (!voices || voices.length === 0) return [];

  if (targetLang === 'hi') {
    const hindi = voices.filter(isHindiVoice);
    if (hindi.length > 0) return hindi;
    return voices.filter(v => isIndianEnglishVoice(v) || v.lang.startsWith('en'));
  }

  // English: All voices that speak English and are NOT pure Hindi voices
  return voices.filter(v => (v.lang.toLowerCase().startsWith('en') || !isHindiVoice(v)));
};

export const getActiveIndianVoiceLabel = (
  targetLang: 'en' | 'hi' = 'en',
  preferredVoiceName?: string
): string => {
  const voice = getBestVoiceForLanguage(targetLang, preferredVoiceName);
  if (voice) {
    if (targetLang === 'hi' && isHindiVoice(voice)) {
      return `🇮🇳 ${voice.name} (हिन्दी)`;
    }
    if (isIndianEnglishVoice(voice)) {
      return `🇮🇳 ${voice.name} (Indian Accent)`;
    }
    return `🎙️ ${voice.name} (High Accuracy)`;
  }
  return targetLang === 'hi' 
    ? '🇮🇳 भारतीय हिन्दी ध्वनि (hi-IN)' 
    : '🎙️ High-Accuracy English Engine (en-IN/en-US)';
};

// Aliases for backwards compatibility
export const getIndianVoice = (targetLang: 'en' | 'hi' = 'en'): SpeechSynthesisVoice | null => {
  return getBestVoiceForLanguage(targetLang);
};

export const getBestIndianEnglishVoice = (): SpeechSynthesisVoice | null => {
  return getBestEnglishVoice();
};

/**
 * Clean spoken script for SpeechSynthesis:
 * - Replaces LaTeX formulas with spoken words
 * - Removes markdown formatting
 * - Strips parentheses and brackets so TTS doesn't say "bracket open / bracket close"
 */
export const cleanScriptForAudio = (text: string, lang: 'en' | 'hi'): string => {
  if (!text) return '';

  let cleaned = text;

  // 1. Remove Markdown code blocks & blockquotes
  cleaned = cleaned.replace(/```[\s\S]*?```/g, ' ');
  cleaned = cleaned.replace(/^>+\s*/gm, '');

  // 2. Remove Video embeds, image markdown, and URLs
  cleaned = cleaned.replace(/\[video:[^\]]+\]/g, ' ');
  cleaned = cleaned.replace(/!\[[^\]]*\]\([^)]+\)/g, ' ');
  cleaned = cleaned.replace(/https?:\/\/[^\s)]+/g, ' ');

  // 3. Remove Markdown Headings & Formatting
  cleaned = cleaned.replace(/^#{1,6}\s+(.*)$/gm, lang === 'hi' ? 'खंड: $1। ' : 'Section: $1. ');
  cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '$1');
  cleaned = cleaned.replace(/\*(.*?)\*/g, '$1');
  cleaned = cleaned.replace(/__(.*?)__/g, '$1');
  cleaned = cleaned.replace(/_(.*?)_/g, '$1');
  cleaned = cleaned.replace(/~~(.*?)~~/g, '$1');
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1');
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // markdown links

  // 4. Clean LaTeX Math & Spoken Sound-Form Conversion
  if (lang === 'hi') {
    cleaned = cleaned
      // Fractions \frac{a}{b} -> a बटा b
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1 बटा $2')
      // Greek letters
      .replace(/\\theta/g, 'थीटा')
      .replace(/\\lambda/g, 'लैम्ब्डा')
      .replace(/\\pi/g, 'पाई')
      .replace(/\\Delta/g, 'डेल्टा')
      .replace(/\\alpha/g, 'अल्फा')
      .replace(/\\beta/g, 'बीटा')
      // Trigonometric & math functions
      .replace(/\\sin\(2\\theta\)/g, 'साइन टू थीटा')
      .replace(/\\sin\s*\(?2\s*\\theta\)?/g, 'साइन टू थीटा')
      .replace(/\\sin\^2\\theta/g, 'साइन स्क्वायर थीटा')
      .replace(/\\cos\^2\\theta/g, 'कॉस स्क्वायर थीटा')
      .replace(/\\sin\^2/g, 'साइन स्क्वायर')
      .replace(/\\cos\^2/g, 'कॉस स्क्वायर')
      .replace(/\\sin/g, 'साइन')
      .replace(/\\cos/g, 'कॉस')
      .replace(/\\tan/g, 'टैन')
      .replace(/\\log/g, 'लॉग')
      // Physics Variables & Kinematics
      .replace(/v_0/g, 'वी नॉट')
      .replace(/v_x/g, 'वी एक्स')
      .replace(/v_y/g, 'वी वाई')
      .replace(/\bv0\b/g, 'वी नॉट')
      .replace(/u_x/g, 'यू एक्स')
      .replace(/u_y/g, 'यू वाई')
      .replace(/a_x/g, 'क्षैतिज त्वरण ए एक्स')
      .replace(/a_y/g, 'ऊर्ध्वाधर त्वरण ए वाई')
      // Powers
      .replace(/\^2/g, ' स्क्वायर')
      .replace(/\^3/g, ' क्यूब')
      .replace(/²/g, ' स्क्वायर')
      .replace(/³/g, ' क्यूब')
      // Units & Constants
      .replace(/\\text\{\s*मी\/से\s*\}\^2/g, ' मीटर प्रति सेकंड स्क्वायर')
      .replace(/\\text\{\s*मी\/से\s*\}/g, ' मीटर प्रति सेकंड')
      .replace(/मी\/से\^2/g, ' मीटर प्रति सेकंड स्क्वायर')
      .replace(/मी\/से/g, ' मीटर प्रति सेकंड')
      .replace(/m\/s\^2/g, ' मीटर प्रति सेकंड स्क्वायर')
      .replace(/m\/s/g, ' मीटर प्रति सेकंड')
      .replace(/\\text\{([^}]+)\}/g, '$1')
      // SM-2 Spaced repetition formula in Hindi
      .replace(/I\(n\)\s*=\s*I\(n-1\)\s*\\times\s*EF/g, 'अंतराल I n बराबर, पिछला अंतराल I n ऋण एक, गुणा सुगमता कारक E F')
      // Acronyms and Technical Terms in Hindi
      .replace(/\b60\s*FPS\b/g, '60 एफ पी एस')
      .replace(/\bFPS\b/g, 'एफ पी एस')
      .replace(/\bMOOCs\b/g, 'एम ओ ओ सी')
      .replace(/\bMOOC\b/g, 'एम ओ ओ सी')
      .replace(/\bEdTech\b/g, 'एडटेक')
      .replace(/\bSM-2\b/g, 'एस एम 2')
      .replace(/\bEF\b/g, 'सुगमता कारक E F')
      .replace(/\bVeyra\b/g, 'वेयरा')
      .replace(/\bBST\b/g, 'बाइनरी सर्च ट्री')
      .replace(/\bBig-O\b/g, 'बिग ओ')
      .replace(/O\(log\s*n\)/g, 'ओ ऑफ लॉग एन')
      .replace(/\bAI\b/g, 'ए आई')
      // Operators
      .replace(/\\cdot/g, ' गुणा ')
      .replace(/\\times/g, ' गुणा ')
      .replace(/\\pm/g, ' प्लस माइनस ')
      .replace(/\\le/g, ' लेस दैन ')
      .replace(/\\ge/g, ' ग्रेटर दैन ')
      .replace(/<=/g, ' लेस दैन या बराबर ')
      .replace(/>=/g, ' ग्रेटर दैन या बराबर ')
      .replace(/!=/g, ' नॉट इक्वल टू ')
      .replace(/\s*=\s*/g, ' बराबर ')
      .replace(/\s*\+\s*/g, ' प्लस ')
      .replace(/\s*-\s*/g, ' माइनस ')
      .replace(/°/g, ' डिग्री ')
      .replace(/%/g, ' प्रतिशत ')
      // Kinematics Formulas
      .replace(/\bR\s*बराबर/g, 'क्षैतिज परास R बराबर')
      .replace(/\bH\s*बराबर/g, 'अधिकतम ऊंचाई H बराबर')
      .replace(/\bT\s*बराबर/g, 'उड्डयन काल T बराबर');
  } else {
    // English Math conversion with clear articulation
    cleaned = cleaned
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1 over $2')
      .replace(/\\theta/g, 'theta')
      .replace(/\\lambda/g, 'lambda')
      .replace(/\\pi/g, 'pi')
      .replace(/\\Delta/g, 'delta')
      .replace(/\\alpha/g, 'alpha')
      .replace(/\\beta/g, 'beta')
      .replace(/\\sin\(2\\theta\)/g, 'sine of two theta')
      .replace(/\\sin\s*\(?2\s*\\theta\)?/g, 'sine of two theta')
      .replace(/\\sin\^2\\theta/g, 'sine squared theta')
      .replace(/\\cos\^2\\theta/g, 'cosine squared theta')
      .replace(/\\sin\^2/g, 'sine squared')
      .replace(/\\cos\^2/g, 'cosine squared')
      .replace(/\\sin/g, 'sine')
      .replace(/\\cos/g, 'cosine')
      .replace(/\\tan/g, 'tangent')
      .replace(/v_0/g, 'v naught')
      .replace(/\bv0\b/g, 'v naught')
      .replace(/v_x/g, 'v x')
      .replace(/v_y/g, 'v y')
      .replace(/u_x/g, 'u x')
      .replace(/u_y/g, 'u y')
      .replace(/a_x/g, 'horizontal acceleration a x')
      .replace(/a_y/g, 'vertical acceleration a y')
      .replace(/\bR\s*=\s*/g, 'horizontal range R equals ')
      .replace(/\bH\s*=\s*/g, 'maximum height H equals ')
      .replace(/\bT\s*=\s*/g, 'time of flight T equals ')
      .replace(/\^2/g, ' squared')
      .replace(/\^3/g, ' cubed')
      .replace(/²/g, ' squared')
      .replace(/³/g, ' cubed')
      .replace(/\\text\{\s*m\/s\s*\}\^2/g, ' meters per second squared')
      .replace(/\\text\{\s*m\/s\s*\}/g, ' meters per second')
      .replace(/m\/s\^2/g, ' meters per second squared')
      .replace(/m\/s/g, ' meters per second')
      .replace(/\\cdot/g, ' times ')
      .replace(/\\times/g, ' times ')
      .replace(/\\pm/g, ' plus or minus ')
      .replace(/<=/g, ' less than or equal to ')
      .replace(/>=/g, ' greater than or equal to ')
      .replace(/!=/g, ' not equal to ')
      .replace(/\s*=\s*/g, ' equals ')
      .replace(/\s*\+\s*/g, ' plus ')
      .replace(/\s*-\s*/g, ' minus ')
      .replace(/°/g, ' degrees ')
      .replace(/%/g, ' percent ')
      .replace(/\\text\{([^}]+)\}/g, '$1')
      // SM-2 Spaced repetition formula in English
      .replace(/I\(n\)\s*=\s*I\(n-1\)\s*\\times\s*EF/g, 'Interval I n equals, previous interval I n minus 1, multiplied by Easiness Factor E F')
      // Acronyms and Technical Terms in English
      .replace(/\b60\s*FPS\b/gi, '60 frames per second')
      .replace(/\bFPS\b/g, 'frames per second')
      .replace(/\bMOOCs\b/g, 'M O O C s')
      .replace(/\bMOOC\b/g, 'M O O C')
      .replace(/\bEdTech\b/g, 'Ed Tech')
      .replace(/\bSM-2\b/g, 'S M 2')
      .replace(/\bEF\b/g, 'Easiness Factor')
      .replace(/\bVeyra\b/g, 'Veyra')
      .replace(/\bBST\b/g, 'Binary Search Tree')
      .replace(/\bBig-O\b/g, 'Big O')
      .replace(/O\(log\s*n\)/g, 'O of log n')
      .replace(/\bAI\b/g, 'A I')
      .replace(/\bAPI\b/g, 'A P I')
      .replace(/\bUI\b/g, 'U I')
      .replace(/\bUX\b/g, 'U X')
      .replace(/\bmins?\s+read\b/gi, 'minute read');
  }

  // 5. Strip leftover LaTeX delimiters and backslashes
  cleaned = cleaned.replace(/\$\$/g, ' ');
  cleaned = cleaned.replace(/\$/g, ' ');
  cleaned = cleaned.replace(/\\/g, ' ');

  // 6. Parentheses & Brackets removal (prevent "bracket open / bracket close" speech artifacts)
  // Instead of brackets, add natural comma breathing pauses
  cleaned = cleaned.replace(/[([<{]/g, ', ');
  cleaned = cleaned.replace(/[)\]>}]/g, ', ');

  // 7. Clean Table bars, dashes, bullet hyphens
  cleaned = cleaned.replace(/\|/g, ' ');
  cleaned = cleaned.replace(/--+/g, ' ');
  cleaned = cleaned.replace(/^\s*[-*]\s+/gm, ''); // clean bullet dashes

  // 8. Normalize spaces and punctuation pauses
  cleaned = cleaned.replace(/,{2,}/g, ',');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
};

// Character mappings for comprehensive Devanagari transliteration fallback
const DEVANAGARI_CONSONANTS: Record<string, string> = {
  '\u0915': 'k', '\u0916': 'kh', '\u0917': 'g', '\u0918': 'gh', '\u0919': 'ng',
  '\u091a': 'ch', '\u091b': 'chh', '\u091c': 'j', '\u091d': 'jh', '\u091e': 'ny',
  '\u091f': 't', '\u0920': 'th', '\u0921': 'd', '\u0922': 'dh', '\u0923': 'n',
  '\u0924': 't', '\u0925': 'th', '\u0926': 'd', '\u0927': 'dh', '\u0928': 'n',
  '\u092a': 'p', '\u092b': 'ph', '\u092c': 'b', '\u092d': 'bh', '\u092e': 'm',
  '\u092f': 'y', '\u0930': 'r', '\u0932': 'l', '\u0933': 'l', '\u0935': 'v',
  '\u0936': 'sh', '\u0937': 'sh', '\u0938': 's', '\u0939': 'h',
  '\u0958': 'q', '\u0959': 'kh', '\u095a': 'gh', '\u095b': 'z', '\u095c': 'd', '\u095d': 'dh', '\u095e': 'f',
};

const DEVANAGARI_INDEPENDENT_VOWELS: Record<string, string> = {
  '\u0905': 'a', '\u0906': 'aa', '\u0907': 'i', '\u0908': 'ee', '\u0909': 'u', '\u090a': 'oo',
  '\u090b': 'ri', '\u090f': 'e', '\u0910': 'ai', '\u0913': 'o', '\u0914': 'au',
};

const DEVANAGARI_MATRAS: Record<string, string> = {
  '\u093e': 'aa', '\u093f': 'i', '\u0940': 'ee', '\u0941': 'u', '\u0942': 'oo',
  '\u0943': 'ri', '\u0947': 'e', '\u0948': 'ai', '\u094b': 'o', '\u094c': 'au',
};

const COMMON_HINDI_VOCAB: Record<string, string> = {
  'नमस्ते दोस्तों': 'Namaste dosto',
  'नमस्ते': 'Namaste',
  'दोस्तों': 'dosto',
  'आज': 'aaj',
  'का': 'ka',
  'की': 'ki',
  'के': 'ke',
  'विषय': 'topic',
  'पाठ': 'lesson',
  'है': 'hai',
  'हैं': 'hain',
  'हम': 'hum',
  'अध्ययन': 'study',
  'करेंगे': 'karenge',
  'प्रक्षेप्य गति': 'Projectile Motion',
  'गतिकी': 'Kinematics',
  'गुरुत्वाकर्षण': 'Gravitation',
  'त्वरण': 'Acceleration',
  'वेग': 'Velocity',
  'क्षैतिज': 'Horizontal',
  'ऊर्ध्वाधर': 'Vertical',
  'परास': 'Range',
  'ऊंचाई': 'Height',
  'समय': 'Time',
  'सिद्धांत': 'Principle',
  'मुख्य': 'Main',
  'नोट्स': 'Notes',
  'सूत्र': 'Formula',
  'बराबर': 'equals',
  'गुणा': 'times',
  'बटा': 'divided by',
  'स्क्वायर': 'squared',
  'डिग्री': 'degrees',
  'मीटर प्रति सेकंड स्क्वायर': 'meters per second squared',
  'मीटर प्रति सेकंड': 'meters per second',
  'और': 'aur',
  'भी': 'bhi',
  'को': 'ko',
  'से': 'se',
  'में': 'mein',
  'पर': 'par',
  'यह': 'yeh',
  'वह': 'woh',
  'एक': 'ek',
  'दो': 'do',
  'तीन': 'teen',
  'चार': 'chaar',
  'पांच': 'paanch',
  'वैज्ञानिक': 'scientific',
  'अन्वेषण': 'exploration',
  'समतल': 'flat ground',
  'कोण': 'angle',
  'प्रारंभिक': 'initial',
  'अधिकतम': 'maximum',
  'दूरी': 'distance',
  'उड्डयन काल': 'Time of Flight',
  'परवलय': 'parabola',
};

/**
 * Phonetic Devanagari to Hinglish transliterator.
 * Used ONLY when the client system has NO native Hindi TTS voice installed,
 * so the Indian English voice can speak the Hindi content fluently without going silent.
 */
export const devanagariToHinglish = (text: string): string => {
  const devanagariCharCount = (text.match(/[\u0900-\u097F]/g) || []).length;
  if (devanagariCharCount < 3) return text;

  // Step 1: Replace whole vocabulary words
  let processed = text;
  for (const [hindiWord, romanWord] of Object.entries(COMMON_HINDI_VOCAB)) {
    processed = processed.split(hindiWord).join(romanWord);
  }

  // Step 2: Transliterate any remaining Devanagari characters
  let result = '';
  for (let i = 0; i < processed.length; i++) {
    const ch = processed[i];
    const next = processed[i + 1] || '';

    if (DEVANAGARI_INDEPENDENT_VOWELS[ch]) {
      result += DEVANAGARI_INDEPENDENT_VOWELS[ch];
    } else if (DEVANAGARI_CONSONANTS[ch]) {
      const base = DEVANAGARI_CONSONANTS[ch];
      if (next === '\u094d') { // Virama (halant)
        result += base;
        i++; // skip virama
      } else if (DEVANAGARI_MATRAS[next]) {
        result += base + DEVANAGARI_MATRAS[next];
        i++; // skip matra
      } else {
        // Schwa logic: omit terminal 'a' at word boundaries
        const isEnd = !next || /[\s,.\-!?;:\"\'()\[\]]/.test(next);
        result += isEnd ? base : base + 'a';
      }
    } else if (ch === '\u0902' || ch === '\u0901') {
      result += 'n';
    } else if (ch === '\u0903') {
      result += 'h';
    } else if (ch === '\u0964' || ch === '\u0965') {
      result += '. ';
    } else if (ch !== '\u094d') {
      result += ch;
    }
  }

  return result.replace(/\s+/g, ' ').trim();
};

export interface SpeakOptions {
  lang?: 'en' | 'hi';
  rate?: number;
  pitch?: number;
  voice?: SpeechSynthesisVoice | null;
  preferredVoiceName?: string;
  onEnd?: () => void;
  onError?: (err?: any) => void;
  onBoundary?: (e: SpeechSynthesisEvent) => void;
}

export const speakWithIndianAccent = (
  rawText: string, 
  options: SpeakOptions = {}
): SpeechSynthesisUtterance | null => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return null;
  }

  const { lang = 'en', rate = 1, pitch = 1, voice: overrideVoice, preferredVoiceName, onEnd, onError, onBoundary } = options;

  window.speechSynthesis.cancel();

  // 1. Clean and sound-form format the script
  let cleanedText = cleanScriptForAudio(rawText, lang);
  if (!cleanedText.trim()) return null;

  // 2. Resolve the best voice
  let voice: SpeechSynthesisVoice | null = overrideVoice || getBestVoiceForLanguage(lang, preferredVoiceName);
  let targetLangTag = lang === 'hi' ? 'hi-IN' : 'en-US';
  let speechRate = rate;

  if (lang === 'hi') {
    if (voice && isHindiVoice(voice)) {
      targetLangTag = 'hi-IN';
      speechRate = Math.min(rate, 0.90);
    } else {
      // Fallback: No Hindi voice on OS -> use Indian English voice with transliterated Hinglish
      voice = voice || getBestIndianEnglishVoice();
      targetLangTag = 'en-IN';
      cleanedText = devanagariToHinglish(cleanedText);
      speechRate = Math.min(rate, 0.92);
    }
  } else {
    // English: Use selected voice tag or en-US/en-IN
    if (voice) {
      targetLangTag = voice.lang || 'en-US';
    } else {
      targetLangTag = 'en-US';
    }
    speechRate = Math.min(rate, 0.96);
  }

  const utterance = new SpeechSynthesisUtterance(cleanedText);
  utterance.lang = targetLangTag;
  utterance.rate = speechRate;
  utterance.pitch = Math.min(pitch, 1.0);

  if (voice) {
    utterance.voice = voice;
  }

  // 3. Heartbeat to prevent Chrome from pausing utterances longer than 15s
  let heartbeat: any = null;
  const clearHeartbeat = () => {
    if (heartbeat) {
      clearInterval(heartbeat);
      heartbeat = null;
    }
  };

  utterance.onend = () => {
    clearHeartbeat();
    if (onEnd) onEnd();
  };

  utterance.onerror = (e) => {
    clearHeartbeat();
    if (onError) onError(e);
  };

  if (onBoundary) {
    utterance.onboundary = onBoundary;
  }

  heartbeat = setInterval(() => {
    if (!window.speechSynthesis.speaking) {
      clearHeartbeat();
    } else {
      // Heartbeat pulse keeps Chrome audio channel open
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }
  }, 10000);

  window.speechSynthesis.speak(utterance);
  return utterance;
};
