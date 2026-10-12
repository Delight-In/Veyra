import { BlogPost } from '../types';
import { cleanScriptForAudio } from './speechVoice';

export interface SpeechParagraph {
  id: string;
  paragraphIndex: number;
  sectionTitle?: string;
  spokenText: string;
  previewText: string;
  rawMarkdown?: string;
}

/**
 * Handcrafted, pedagogical audio scripts for initial Veyra dispatches.
 * Accurately translates complex STEM/Computing concepts, eliminates raw code clutter,
 * and optimizes phonetic pauses for high-fidelity browser speech synthesis.
 */
const HANDCRAFTED_BLOG_SCRIPTS: Record<string, {
  en: Array<{ section?: string; text: string; rawSnippet?: string }>;
  hi: Array<{ section?: string; text: string; rawSnippet?: string }>;
}> = {
  'blog-death-of-passive-lectures': {
    en: [
      {
        section: 'Introduction',
        text: 'Welcome to Veyra Research Dispatch. Today\'s article: The Death of Passive Lectures - Why 60 frames per second Interactive Simulations Beat Traditional EdTech. Written by Priyanka, Founder and Chief Academic Officer. Video-based online learning leaves 92 percent of students disengaged. Here is how kinesthetic computing transforms conceptual physics into intuitive understanding.',
        rawSnippet: '## The Mirage of Video Comprehension'
      },
      {
        section: 'The Mirage of Video Comprehension',
        text: 'Section: The Mirage of Video Comprehension. For the last fifteen years, educational technology has relied on a single, fundamentally flawed premise: that watching an expert explain a concept translates into genuine cognitive mastery.',
        rawSnippet: 'For the last fifteen years, educational technology has relied'
      },
      {
        section: 'The Mirage of Video Comprehension',
        text: 'Countless platforms recorded hour-long whiteboard lectures, split them into five-minute video chunks, and called it the future of education. Yet the empirical data reveals a somber reality: M O O C completion rates worldwide linger below eight percent.',
        rawSnippet: 'Countless platforms recorded hour-long whiteboard lectures'
      },
      {
        section: 'The Mirage of Video Comprehension',
        text: 'When a student watches a lecturer calculate parabolic trajectory on a screen, the brain enters a passive receptive state. The illusion of competence sets in. Because the solution appears fluid and logical, the student believes they have mastered the mechanics. But place a blank sheet of paper in front of them with slightly altered boundary conditions, and the illusion collapses.',
        rawSnippet: 'When a student watches a lecturer calculate parabolic trajectory'
      },
      {
        section: 'The Mirage of Video Comprehension',
        text: 'As noted in pedagogical research: True comprehension is not a spectator sport. You do not learn the laws of gravitation by looking at an apple. You learn by adjusting the gravitational constant of the cosmos and watching the trajectory warp in real time.',
        rawSnippet: '> "True pedagogical comprehension is not spectator sport."'
      },
      {
        section: 'The Kinesthetic Physics Paradigm',
        text: 'Section: The Kinesthetic Physics Paradigm. At Veyra, we eliminated pre-recorded passive lectures entirely. Instead, every foundational principle, from classical Newtonian mechanics to wave interference, is instantiated as an interactive, 60 frames per second mathematical canvas.',
        rawSnippet: '## The Kinesthetic Physics Paradigm'
      },
      {
        section: 'The Kinesthetic Physics Paradigm',
        text: 'When learners encounter projectile motion on our platform, they are not told that horizontal range is dictated by formula: R equals, initial velocity v naught squared times sine of two theta, divided by gravity. Instead, first: They adjust initial velocity and launch angle with immediate optical feedback. Second: They alter planetary gravity, switching between Earth at 9.8 meters per second squared, the Moon at 1.62 meters per second squared, and Jupiter at 24.8 meters per second squared. Third: They witness how trajectory curvature and flight duration instantaneously adapt.',
        rawSnippet: 'When learners encounter projectile motion on our platform'
      },
      {
        section: 'The Kinesthetic Physics Paradigm',
        text: 'By engaging the kinesthetic and visual feedback loops simultaneously, the cognitive load transfers from rote formula memorization to causal reasoning. The learner feels the quadratic dependency on velocity before they ever touch a formula sheet. In our interactive sandbox, trajectory calculus is rendered dynamically in browser memory at sub-millisecond precision.',
        rawSnippet: 'By engaging the kinesthetic and visual feedback loops simultaneously'
      },
      {
        section: 'Cognitive Bandwidth & Zero Passive Latency',
        text: 'Section: Cognitive Bandwidth and Zero Passive Latency. Educational psychology has long validated Sweller\'s Cognitive Load Theory. Working memory has limited capacity. When extraneous cognitive load, such as scrubbing through a 40-minute video or listening to tangential verbal anecdotes, occupies this buffer, germane cognitive load, the mental energy dedicated to schema formation, is depleted.',
        rawSnippet: '## Cognitive Bandwidth & Zero Passive Latency'
      },
      {
        section: 'Cognitive Bandwidth & Zero Passive Latency',
        text: 'Interactive simulations provide zero extraneous latency. The parameters are tangible. The outcome is immediate. The feedback loop is unmediated.',
        rawSnippet: 'Interactive simulations provide **zero extraneous latency**'
      },
      {
        section: 'Conclusion',
        text: 'As we scale Veyra across disciplines, incorporating algorithmic execution for computer science, biochemical molecular models for chemistry, and macroeconomic models for humanities, our thesis remains steadfast: The future belongs to active learners who build, manipulate, and explore systems directly.',
        rawSnippet: 'As we scale Veyra across disciplines'
      }
    ],
    hi: [
      {
        section: 'प्रस्तावना',
        text: 'वेयरा रिसर्च पॉडकास्ट में आपका स्वागत है। आज का विशेष आलेख: निष्क्रिय लेक्चर्स का अंत - 60 एफ पी एस इंटरैक्टिव सिमुलेशन पारंपरिक एडटेक से बेहतर क्यों हैं। लेखिका: प्रियंका, संस्थापक एवं मुख्य अकादमिक अधिकारी। वीडियो-आधारित ऑनलाइन शिक्षा 92 प्रतिशत विद्यार्थियों को निष्क्रिय छोड़ देती है। जानिए गतिज संगणना कैसे वैचारिक भौतिकी को सहज समझ में बदलती है।',
        rawSnippet: '## The Mirage of Video Comprehension'
      },
      {
        section: 'वीडियो समझ का भ्रम',
        text: 'पहला खंड: वीडियो समझ का भ्रम। पिछले पंद्रह वर्षों से, शैक्षणिक तकनीक एक बुनियादी रूप से त्रुटिपूर्ण धारणा पर निर्भर रही है: कि किसी विशेषज्ञ को अवधारणा समझाते देखना ही वास्तविक संज्ञानात्मक महारत में बदल जाता है।',
        rawSnippet: 'For the last fifteen years, educational technology has relied'
      },
      {
        section: 'वीडियो समझ का भ्रम',
        text: 'अनगिनत मंचों ने घंटे भर के व्हाइटबोर्ड लेक्चर्स रिकॉर्ड किए, उन्हें पांच-पांच मिनट के वीडियो क्लिप्स में बांटा, और इसे शिक्षा का भविष्य घोषित कर दिया। फिर भी अनुभवजन्य डेटा एक गंभीर सच्चाई उजागर करता है: दुनिया भर में एम ओ ओ सी पाठ्यक्रम पूरा करने की दर 8 प्रतिशत से भी कम है।',
        rawSnippet: 'Countless platforms recorded hour-long whiteboard lectures'
      },
      {
        section: 'वीडियो समझ का भ्रम',
        text: 'जब कोई विद्यार्थी किसी शिक्षक को स्क्रीन पर प्रक्षेप्य पथ की गणना करते देखता है, तो मस्तिष्क एक निष्क्रिय ग्रहणशील अवस्था में चला जाता है। यहाँ दक्षता का भ्रम पैदा होता है। चूँकि समाधान स्पष्ट और तार्किक प्रतीत होता है, विद्यार्थी समझता है कि उसने यांत्रिकी सीख ली है। लेकिन जब उसके सामने थोड़ी बदली हुई स्थितियों वाला कोरा कागज़ रखा जाता है, तो यह भ्रम टूट जाता है।',
        rawSnippet: 'When a student watches a lecturer calculate parabolic trajectory'
      },
      {
        section: 'वीडियो समझ का भ्रम',
        text: 'जैसा कि शैक्षणिक अनुसंधान में कहा गया है: सच्ची शैक्षणिक समझ कोई मूक दर्शक का खेल नहीं है। आप केवल सेब को देखकर गुरुत्वाकर्षण के नियम नहीं सीख सकते। आप ब्रह्मांड के गुरुत्वाकर्षण स्थिरांक को बदलते हैं और वास्तविक समय में प्रक्षेप्य पथ को मुड़ते हुए देखकर सीखते हैं।',
        rawSnippet: '> "True pedagogical comprehension is not spectator sport."'
      },
      {
        section: 'गतिज भौतिकी का प्रतिमान',
        text: 'दूसरा खंड: गतिज भौतिकी का प्रतिमान। वेयरा में, हमने पहले से रिकॉर्ड किए गए निष्क्रिय लेक्चर्स को पूरी तरह हटा दिया है। इसके बजाय, प्रत्येक मूलभूत सिद्धांत, शास्त्रीय न्यूटनियन यांत्रिकी से लेकर तरंग व्यतिकरण तक, एक इंटरैक्टिव, 60 एफ पी एस गणितीय कैनवास के रूप में प्रस्तुत किया जाता है।',
        rawSnippet: '## The Kinesthetic Physics Paradigm'
      },
      {
        section: 'गतिज भौतिकी का प्रतिमान',
        text: 'जब शिक्षार्थी हमारे मंच पर प्रक्षेप्य गति का अध्ययन करते हैं, तो उन्हें केवल यह नहीं रटाया जाता कि क्षैतिज परास सूत्र: R बराबर, प्रारंभिक वेग वी नॉट स्क्वायर गुणा साइन टू थीटा, बटा गुरुत्वाकर्षण जी होता है। बल्कि, पहला: वे तत्काल दृश्य प्रतिक्रिया के साथ प्रारंभिक वेग और प्रक्षेपण कोण को नियंत्रित करते हैं। दूसरा: वे ग्रहीय गुरुत्वाकर्षण को बदलते हैं, पृथ्वी पर 9.8 मीटर प्रति सेकंड स्क्वायर, चंद्रमा पर 1.62 मीटर प्रति सेकंड स्क्वायर, और बृहस्पति पर 24.8 मीटर प्रति सेकंड स्क्वायर के बीच अदला-बदली करते हैं। तीसरा: वे साक्षात देखते हैं कि प्रक्षेप्य की वक्रता और उड्डयन काल कैसे तात्कालिक रूप से अनुकूलित होते हैं।',
        rawSnippet: 'When learners encounter projectile motion on our platform'
      },
      {
        section: 'गतिज भौतिकी का प्रतिमान',
        text: 'गतिज और दृश्य दोनों फीडबैक को एक साथ जोड़कर, मानसिक भार रटने की बजाय कारण और प्रभाव के तर्क में बदल जाता है। विद्यार्थी सूत्र पुस्तिका को छूने से पहले ही वेग पर द्विघाती निर्भरता को गहराई से महसूस कर लेता है।',
        rawSnippet: 'By engaging the kinesthetic and visual feedback loops simultaneously'
      },
      {
        section: 'संज्ञानात्मक बैंडविड्थ',
        text: 'तीसरा खंड: संज्ञानात्मक बैंडविड्थ और शून्य निष्क्रिय विलंबता। शैक्षणिक मनोविज्ञान ने लंबे समय से स्वेलर के संज्ञानात्मक भार सिद्धांत को प्रमाणित किया है। कार्यशील स्मृति की क्षमता सीमित होती है। जब बाहरी संज्ञानात्मक भार, जैसे 40 मिनट के वीडियो को आगे-पीछे करना, इस बफर को घेर लेता है, तो वास्तविक सीखने के लिए समर्पित मानसिक ऊर्जा समाप्त हो जाती है।',
        rawSnippet: '## Cognitive Bandwidth & Zero Passive Latency'
      },
      {
        section: 'संज्ञानात्मक बैंडविड्थ',
        text: 'इंटरैक्टिव सिमुलेशन शून्य बाहरी विलंबता प्रदान करते हैं। पैरामीटर पूरी तरह मूर्त और नियंत्रणीय हैं। परिणाम तात्कालिक और स्पष्ट है। फीडबैक लूप बिना किसी मध्यस्थता के काम करता है।',
        rawSnippet: 'Interactive simulations provide **zero extraneous latency**'
      },
      {
        section: 'निष्कर्ष',
        text: 'जैसे-जैसे हम विभिन्न विषयों में वेयरा का विस्तार कर रहे हैं, कंप्यूटर विज्ञान के लिए एल्गोरिदम निष्पादन, रसायन विज्ञान के लिए आणविक मॉडल, और मानविकी के लिए मैक्रोइकॉनॉमिक मॉडल, हमारा दृष्टिकोण अडिग है: भविष्य उन सक्रिय शिक्षार्थियों का है जो सीधे प्रणालियों का निर्माण, विश्लेषण और अन्वेषण करते हैं।',
        rawSnippet: 'As we scale Veyra across disciplines'
      }
    ]
  },
  'blog-reimagining-computer-science': {
    en: [
      {
        section: 'Introduction',
        text: 'Welcome to Veyra Research Dispatch. Reimagining Computer Science Pedagogy: From Static Syntax to Live Memory Execution. Written by Priyanka, Founder and Chief Academic Officer. Why teaching recursion and binary trees with slide decks fails, and how client-side state engines illuminate abstract pointer traversal.',
        rawSnippet: '## The Invisible Machine'
      },
      {
        section: 'The Invisible Machine',
        text: 'Section: The Invisible Machine. Computer science education has a notorious retention cliff. In introductory programming courses around the world, dropout and failure rates routinely hover between 30 and 40 percent.',
        rawSnippet: 'Computer science education has a notorious retention cliff.'
      },
      {
        section: 'The Invisible Machine',
        text: 'Why? Because when human beings learn natural languages, they hear spoken words, see gestures, and map vocabulary directly to tangible physical objects. When they learn computer programming, they are asked to reason about invisible electrical state transitions happening inside silicon transistors.',
        rawSnippet: 'Why? Because when human beings learn natural languages'
      },
      {
        section: 'Moving Beyond Syntax Errors',
        text: 'Section: Moving Beyond Syntax Errors. Traditional computer science instruction places disproportionate emphasis on syntax: semicolons and brackets, type signatures, and compiler error parsing. While syntactic fluency is necessary, it is not computer science. Computer science is state transformation over time.',
        rawSnippet: '## Moving Beyond Syntax Errors'
      },
      {
        section: 'Moving Beyond Syntax Errors',
        text: 'When students struggle with a Binary Search Tree or Merge Sort, they are almost never struggling with the syntax of an if statement. They are struggling to visualize: which memory addresses are being referenced, what happens when a call stack frame pops, and how an array partition divides pointers in logarithmic time.',
        rawSnippet: 'When students struggle with a Binary Search Tree'
      },
      {
        section: 'Live In-Browser Execution',
        text: 'Section: Live In-Browser Execution. At Veyra, we integrated a full client-side execution sandbox into our curriculum. Every code sample is not a static code block; it is an executable engine.',
        rawSnippet: '## Live In-Browser Execution'
      },
      {
        section: 'Live In-Browser Execution',
        text: 'When a student tests a binary search algorithm: First, they input their target key. Second, the browser executes the bytecode in an isolated sandbox with sub-millisecond latency. Third, every step of the left, mid, and right pointer convergence is rendered with live telemetry. By watching the logarithmic search space halve with every step, Big O asymptotic notation stops being an abstract exam question. It becomes an observable physical law of computational time.',
        rawSnippet: 'When a student tests a binary search algorithm'
      },
      {
        section: 'The AI Co-Pilot Paradigm',
        text: 'Section: The A I Co-Pilot Paradigm. In an era where generative A I models can generate boilerplate code in milliseconds, the value of mechanical coding has plummeted. What has exponentially increased in value is system architecture and mental modeling. A student who deeply understands how algorithms scale will always outperform someone who merely copies snippets. Our mission is to make the invisible visible, empowering every engineer to reason from first principles.',
        rawSnippet: '## The AI Co-Pilot Paradigm'
      }
    ],
    hi: [
      {
        section: 'प्रस्तावना',
        text: 'वेयरा रिसर्च पॉडकास्ट में आपका स्वागत है। कंप्यूटर विज्ञान शिक्षा की पुनर्कल्पना: स्थिर सिंटैक्स से लाइव मेमोरी निष्पादन तक। लेखिका: प्रियंका, संस्थापक एवं मुख्य अकादमिक अधिकारी। स्लाइड्स के माध्यम से रिकर्शन और बाइनरी ट्री पढ़ाना क्यों विफल रहता है, और क्लाइंट-साइड स्टेट इंजन अमूर्त पॉइंटर ट्रैवर्सल को कैसे जीवंत बनाते हैं।',
        rawSnippet: '## The Invisible Machine'
      },
      {
        section: 'अदृश्य मशीन',
        text: 'पहला खंड: अदृश्य मशीन। कंप्यूटर विज्ञान की शिक्षा में एक कुख्यात रुकावट आती है। दुनिया भर में प्रारंभिक प्रोग्रामिंग पाठ्यक्रमों में, ड्रॉपआउट और असफलता की दर आमतौर पर 30 से 40 प्रतिशत के बीच रहती है।',
        rawSnippet: 'Computer science education has a notorious retention cliff.'
      },
      {
        section: 'अदृश्य मशीन',
        text: 'क्यों? क्योंकि जब मनुष्य प्राकृतिक भाषाएं सीखते हैं, तो वे बोले गए शब्द सुनते हैं, इशारे देखते हैं, और शब्दावली को सीधे भौतिक वस्तुओं से जोड़ते हैं। लेकिन जब वे कंप्यूटर प्रोग्रामिंग सीखते हैं, तो उनसे सिलिकॉन ट्रांजिस्टर के अंदर होने वाले अदृश्य विद्युत अवस्था परिवर्तनों के बारे में तर्क करने को कहा जाता है।',
        rawSnippet: 'Why? Because when human beings learn natural languages'
      },
      {
        section: 'सिंटैक्स से आगे',
        text: 'दूसरा खंड: सिंटैक्स त्रुटियों से आगे बढ़ना। पारंपरिक कंप्यूटर विज्ञान निर्देश सिंटैक्स पर अत्यधिक बल देता है: अर्धविराम और कोष्ठक, प्रकार हस्ताक्षर, और कंपाइलर त्रुटि विश्लेषण। हालाँकि सिंटैक्स आवश्यक है, लेकिन यह कंप्यूटर विज्ञान नहीं है। कंप्यूटर विज्ञान समय के साथ अवस्था का रूपांतरण है।',
        rawSnippet: '## Moving Beyond Syntax Errors'
      },
      {
        section: 'सिंटैक्स से आगे',
        text: 'जब छात्र बाइनरी सर्च ट्री या मर्ज सॉर्ट से जूझते हैं, तो वे शायद ही कभी इफ़ स्टेटमेंट के सिंटैक्स से परेशान होते हैं। वे यह कल्पना करने के लिए संघर्ष कर रहे होते हैं: कौन से मेमोरी पते संदर्भित किए जा रहे हैं, जब कॉल स्टैक फ्रेम पॉप होता है तो क्या होता है, और कैसे एक सरणी विभाजन लघुगणकीय समय में पॉइंटर्स को विभाजित करता है।',
        rawSnippet: 'When students struggle with a Binary Search Tree'
      },
      {
        section: 'लाइव निष्पादन',
        text: 'तीसरा खंड: ब्राउज़र में लाइव निष्पादन। वेयरा में, हमने अपने पाठ्यक्रम में एक पूर्ण क्लाइंट-साइड निष्पादन सैंडबॉक्स को एकीकृत किया है। प्रत्येक कोड नमूना केवल स्थिर पाठ नहीं है; यह एक सक्रिय निष्पादन योग्य इंजन है।',
        rawSnippet: '## Live In-Browser Execution'
      },
      {
        section: 'लाइव निष्पादन',
        text: 'जब कोई विद्यार्थी बाइनरी खोज एल्गोरिदम का परीक्षण करता है: पहला, वे अपना लक्ष्य मान दर्ज करते हैं। दूसरा, ब्राउज़र सब-मिलीसेकंड विलंबता के साथ सैंडबॉक्स में बाइटकोड निष्पादित करता है। तीसरा, बाएं, मध्य और दाएं पॉइंटर के अभिसरण का प्रत्येक चरण लाइव टेलीमेट्री के साथ प्रस्तुत किया जाता है। प्रत्येक चरण के साथ खोज स्थान को आधा होते देखकर, बिग ओ नोटेशन केवल एक परीक्षा प्रश्न नहीं रह जाता, बल्कि अभिकलनात्मक समय का दृश्य नियम बन जाता है।',
        rawSnippet: 'When a student tests a binary search algorithm'
      },
      {
        section: 'एआई को-पायलट प्रतिमान',
        text: 'चौथा खंड: ए आई को-पायलट प्रतिमान। ऐसे युग में जहां जनरेटिव ए आई मॉडल मिलीसेकंड में बॉयलरप्लेट कोड उत्पन्न कर सकते हैं, यांत्रिक कोडिंग का मूल्य घट गया है। जो मूल्य तेजी से बढ़ा है वह है सिस्टम आर्किटेक्चर और मानसिक मॉडलिंग। जो विद्यार्थी गहराई से समझता है कि एल्गोरिदम कैसे स्केल करते हैं, वह हमेशा उस व्यक्ति से बेहतर प्रदर्शन करेगा जो केवल कोड की नकल करता है। हमारा मिशन अदृश्य को दृश्यमान बनाना है।',
        rawSnippet: '## The AI Co-Pilot Paradigm'
      }
    ]
  },
  'blog-ebbinghaus-spaced-recall': {
    en: [
      {
        section: 'Introduction',
        text: 'Welcome to Veyra Research Dispatch. The Ebbinghaus Equation: Engineering Long-Term Recall with the SM-2 Algorithm. Written by Priyanka, Founder and Chief Academic Officer. How intelligent interval spacing eliminates the cycle of cramming and forgetting in STEM examinations.',
        rawSnippet: '## The Forgetting Curve That Governs Us All'
      },
      {
        section: 'The Forgetting Curve',
        text: 'Section: The Forgetting Curve That Governs Us All. In 1885, German psychologist Hermann Ebbinghaus published a landmark empirical study detailing how human memory decays over time. His findings yielded what we now know as the Forgetting Curve.',
        rawSnippet: 'In 1885, German psychologist Hermann Ebbinghaus published'
      },
      {
        section: 'The Forgetting Curve',
        text: 'Within 24 hours of learning new material, the average student forgets roughly 50 to 70 percent of newly acquired information if no active recall intervention takes place. Within 30 days, retention plummets below 10 percent.',
        rawSnippet: 'Within 24 hours of learning new material'
      },
      {
        section: 'The Forgetting Curve',
        text: 'Yet the overwhelming majority of academic institutions still structure learning around cramming cycles: teach an intense chapter over two weeks, test students immediately afterwards, move on to the next topic, and never revisit the earlier chapter until annual finals. This method guarantees academic exhaustion and long-term amnesia. As noted: Cramming builds castles in the sand right before high tide. Spaced repetition builds bedrock that withstands years of mental weathering.',
        rawSnippet: 'Yet the overwhelming majority of academic institutions'
      },
      {
        section: 'How Spaced Repetition (SM-2) Works',
        text: 'Section: How Spaced Repetition S M 2 Works. The mathematical solution to the Forgetting Curve is Spaced Repetition. Each time you actively retrieve a fact or equation right as you are on the verge of forgetting it, two miraculous cognitive shifts happen: first, the memory trace strengthens significantly; second, the decay slope of the subsequent forgetting curve flattens.',
        rawSnippet: '## How Spaced Repetition (SM-2) Works'
      },
      {
        section: 'How Spaced Repetition (SM-2) Works',
        text: 'The Super Memo S M 2 algorithm formalizes this into an exact schedule: Interval 1: 1 day after initial study. Interval 2: 6 days after successful retrieval. Interval 3: Interval I n equals previous interval I n minus 1, multiplied by Easiness Factor E F, adjusted between 1.3 and 2.5 based on retrieval ease.',
        rawSnippet: 'The **SuperMemo SM-2** algorithm formalizes this'
      },
      {
        section: 'Native Integration into Veyra',
        text: 'Section: Native Integration into Veyra. Rather than asking students to manage external flashcard decks, Veyra weaves S M 2 intervals directly into the interactive curriculum: after mastering a kinematic simulation or coding challenge, algorithmic flashcards are dynamically scheduled in the student\'s review queue. If a concept is marked Hard, it resurfaces the next day. If marked Mastered, the interval expands to 16 days, then 40 days, and eventually months. The result is effortless, lifelong retention. Students spend less total time studying, but retain over 90 percent of their learning permanently.',
        rawSnippet: '## Native Integration into Veyra'
      }
    ],
    hi: [
      {
        section: 'प्रस्तावना',
        text: 'वेयरा रिसर्च पॉडकास्ट में आपका स्वागत है। एबिंगहॉस समीकरण: एस एम 2 एल्गोरिदम के साथ दीर्घकालिक स्मरण क्षमता का निर्माण। लेखिका: प्रियंका, संस्थापक एवं मुख्य अकादमिक अधिकारी। बुद्धिमान अंतराल पुनरावृत्ति कैसे विज्ञान व गणित परीक्षाओं में रटने और भूलने के चक्र को समाप्त करती है।',
        rawSnippet: '## The Forgetting Curve That Governs Us All'
      },
      {
        section: 'विस्मृति वक्र',
        text: 'पहला खंड: विस्मृति वक्र जो हम सभी को प्रभावित करता है। 1885 में, जर्मन मनोवैज्ञानिक हरमन एबिंगहॉस ने एक ऐतिहासिक अनुभवजन्य अध्ययन प्रकाशित किया जिसमें विस्तृत रूप से बताया गया कि समय के साथ मानव स्मृति कैसे क्षीण होती है। उनके निष्कर्षों से वह प्राप्त हुआ जिसे आज हम विस्मृति वक्र के रूप में जानते हैं।',
        rawSnippet: 'In 1885, German psychologist Hermann Ebbinghaus published'
      },
      {
        section: 'विस्मृति वक्र',
        text: 'नई सामग्री सीखने के 24 घंटों के भीतर, औसत छात्र नई अर्जित जानकारी का लगभग 50 से 70 प्रतिशत भूल जाता है यदि कोई सक्रिय स्मरण हस्तक्षेप न किया जाए। 30 दिनों के भीतर, स्मृति अवधारण 10 प्रतिशत से नीचे गिर जाता है।',
        rawSnippet: 'Within 24 hours of learning new material'
      },
      {
        section: 'विस्मृति वक्र',
        text: 'फिर भी अधिकांश शैक्षणिक संस्थान अभी भी रटने के चक्रों के इर्द-गिर्द शिक्षण की रचना करते हैं: दो सप्ताह तक एक कठिन अध्याय पढ़ाना, उसके तुरंत बाद परीक्षा लेना, अगले विषय पर आगे बढ़ना और वार्षिक परीक्षा तक पिछले अध्याय पर कभी वापस न लौटना। यह तरीका शैक्षणिक थकावट और दीर्घकालिक विस्मृति की गारंटी देता है। जैसा कि कहा गया है: परीक्षा से पहले रटना ज्वार आने से ठीक पहले रेत के महल बनाने जैसा है। अंतराल पुनरावृत्ति वह ठोस चट्टान बनाती है जो वर्षों के मानसिक क्षरण को सहन करती है।',
        rawSnippet: 'Yet the overwhelming majority of academic institutions'
      },
      {
        section: 'एस एम 2 कैसे काम करता है',
        text: 'दूसरा खंड: अंतराल पुनरावृत्ति एस एम 2 कैसे काम करती है। विस्मृति वक्र का गणितीय समाधान अंतराल पुनरावृत्ति है। हर बार जब आप किसी तथ्य या समीकरण को भूलने के कगार पर पहुँचते ही सक्रिय रूप से पुनः याद करते हैं, तो दो आश्चर्यजनक संज्ञानात्मक बदलाव होते हैं: पहला, स्मृति का निशान काफी मजबूत हो जाता है; दूसरा, बाद के विस्मृति वक्र के क्षय का ढलान चपटा हो जाता है।',
        rawSnippet: '## How Spaced Repetition (SM-2) Works'
      },
      {
        section: 'एस एम 2 कैसे काम करता है',
        text: 'सुपरमेमो एस एम 2 एल्गोरिदम इसे एक सटीक समय सारिणी में औपचारिक रूप देता है: अंतराल 1: प्रारंभिक अध्ययन के 1 दिन बाद। अंतराल 2: सफल स्मरण के 6 दिन बाद। अंतराल 3: अंतराल I n बराबर पिछला अंतराल I n ऋण 1, गुणा सुगमता कारक E F, जो स्मरण की सहजता के आधार पर 1.3 और 2.5 के बीच समायोजित होता है।',
        rawSnippet: 'The **SuperMemo SM-2** algorithm formalizes this'
      },
      {
        section: 'वेयरा में मूल एकीकरण',
        text: 'तीसरा खंड: वेयरा में मूल एकीकरण। छात्रों को बाहरी फ्लैशकार्ड डेक प्रबंधित करने के लिए कहने के बजाय, वेयरा एस एम 2 अंतरालों को सीधे इंटरैक्टिव पाठ्यक्रम में बुनता है: गतिकीय सिमुलेशन या कोडिंग चुनौती में महारत हासिल करने के बाद, छात्र की समीक्षा कतार में एल्गोरिदम फ्लैशकार्ड गतिशील रूप से निर्धारित होते हैं। यदि किसी अवधारणा को कठिन चिह्नित किया जाता है, तो वह अगले दिन फिर से सामने आती है। यदि महारत प्राप्त चिह्नित किया जाता है, तो अंतराल 16 दिन, फिर 40 दिन और अंततः महीनों तक फैल जाता है। परिणाम सहज, आजीवन स्मृति अवधारण है। छात्र अध्ययन में कम समय बिताते हैं, लेकिन अपने सीखने का 90 प्रतिशत से अधिक स्थायी रूप से बनाए रखते हैं।',
        rawSnippet: '## Native Integration into Veyra'
      }
    ]
  }
};

/**
 * Checks if the content is primarily Hindi (Devanagari characters).
 */
export const isPrimarilyHindi = (text: string): boolean => {
  if (!text) return false;
  const devanagariCount = (text.match(/[\u0900-\u097F]/g) || []).length;
  const latinCount = (text.match(/[a-zA-Z]/g) || []).length;
  return devanagariCount > 10 && devanagariCount > latinCount * 0.4;
};

/**
 * Detect the language of a blog post, default to 'en'.
 */
export const detectBlogLanguage = (blog: BlogPost): 'en' | 'hi' => {
  if (isPrimarilyHindi(blog.title) || isPrimarilyHindi(blog.content)) {
    return 'hi';
  }
  return 'en';
};

/**
 * Parses any blog post into an array of clean, spoken paragraph units.
 */
export const getBlogSpokenParagraphs = (
  blog: BlogPost, 
  targetLang: 'en' | 'hi' = 'en'
): SpeechParagraph[] => {
  // 1. Check for handcrafted pedagogical audio script
  if (HANDCRAFTED_BLOG_SCRIPTS[blog.id] && HANDCRAFTED_BLOG_SCRIPTS[blog.id][targetLang]) {
    const scriptItems = HANDCRAFTED_BLOG_SCRIPTS[blog.id][targetLang];
    return scriptItems.map((item, index) => ({
      id: `${blog.id}-${targetLang}-p-${index}`,
      paragraphIndex: index,
      sectionTitle: item.section,
      spokenText: item.text,
      previewText: item.text.slice(0, 120) + (item.text.length > 120 ? '...' : ''),
      rawMarkdown: item.rawSnippet
    }));
  }

  // 2. Dynamic decomposition for custom or edited blog posts
  const paragraphs: SpeechParagraph[] = [];
  const title = (targetLang === 'hi' && blog.hindiTitle) ? blog.hindiTitle : blog.title;
  const subtitle = (targetLang === 'hi' && blog.hindiSubtitle) ? blog.hindiSubtitle : (blog.subtitle || '');
  const content = (targetLang === 'hi' && blog.hindiContent) ? blog.hindiContent : blog.content;

  // Intro Paragraph
  const introText = targetLang === 'hi'
    ? cleanScriptForAudio(`वेयरा रिसर्च पॉडकास्ट में आपका स्वागत है। आज का आलेख: ${title}। लेखिका: ${blog.authorName}। ${subtitle}`, 'hi')
    : cleanScriptForAudio(`Welcome to Veyra Research Dispatch. Today's article: ${title}. Authored by ${blog.authorName}. ${subtitle}`, 'en');

  paragraphs.push({
    id: `${blog.id}-${targetLang}-intro`,
    paragraphIndex: 0,
    sectionTitle: targetLang === 'hi' ? 'प्रस्तावना' : 'Introduction',
    spokenText: introText,
    previewText: introText.slice(0, 120) + (introText.length > 120 ? '...' : ''),
    rawMarkdown: blog.title
  });

  // Split content by double newlines
  const rawSections = content.split(/\n{2,}/);
  let currentSectionTitle = targetLang === 'hi' ? 'मुख्य आलेख' : 'Main Story';
  let pIdx = 1;

  for (const rawSec of rawSections) {
    const trimmed = rawSec.trim();
    if (!trimmed) continue;

    // Check if paragraph is purely code block
    if (trimmed.startsWith('```') && trimmed.endsWith('```')) {
      continue; // Skip raw code blocks in audio narration
    }

    // Check if paragraph is a heading
    const headingMatch = trimmed.match(/^#{1,6}\s+(.+)$/m);
    if (headingMatch && trimmed.split('\n').length === 1) {
      currentSectionTitle = headingMatch[1].replace(/[*_`]/g, '').trim();
      continue;
    }

    // Clean text for speech
    const cleaned = cleanScriptForAudio(trimmed, targetLang);
    if (cleaned.length < 15) continue; // Skip meaningless fragments

    // If section heading was inline or preceding
    const speechText = headingMatch 
      ? cleaned
      : (targetLang === 'hi' ? cleaned : cleaned);

    paragraphs.push({
      id: `${blog.id}-${targetLang}-p-${pIdx}`,
      paragraphIndex: pIdx,
      sectionTitle: currentSectionTitle,
      spokenText: speechText,
      previewText: speechText.slice(0, 120) + (speechText.length > 120 ? '...' : ''),
      rawMarkdown: trimmed
    });

    pIdx++;
  }

  return paragraphs;
};
