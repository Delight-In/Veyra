import { ContentNode } from '../types';

export const initialNodes: ContentNode[] = [
  // ==========================================
  // LEVEL 0: ROOT CATEGORIES
  // ==========================================
  {
    id: 'node_science',
    parentId: null,
    path: 'node_science',
    depth: 0,
    type: 'category',
    order: 1,
    status: 'published',
    targetAgeBand: 'all',
    icon: 'Atom',
    badge: 'Popular (लोकप्रिय)',
    estimatedMinutes: 180,
    createdBy: 'user_super_admin',
    updatedAt: '2026-03-01T10:00:00Z',
    tags: ['Science', 'STEM', 'विज्ञान'],
    translations: {
      en: {
        language: 'en',
        title: 'Natural & Applied Sciences',
        description: 'Explore the fundamental laws governing our universe from physics to biology.',
      },
      hi: {
        language: 'hi',
        title: 'प्राकृतिक एवं अनुप्रयुक्त विज्ञान',
        description: 'भौतिकी से लेकर जीव विज्ञान तक हमारे ब्रह्मांड को संचालित करने वाले मूलभूत नियमों को समझें।',
      }
    }
  },
  {
    id: 'node_math',
    parentId: null,
    path: 'node_math',
    depth: 0,
    type: 'category',
    order: 2,
    status: 'published',
    targetAgeBand: 'all',
    icon: 'Binary',
    badge: 'Foundation',
    estimatedMinutes: 240,
    createdBy: 'user_super_admin',
    updatedAt: '2026-03-01T10:00:00Z',
    tags: ['Math', 'Logic', 'गणित'],
    translations: {
      en: {
        language: 'en',
        title: 'Mathematics & Computational Logic',
        description: 'From intuitive geometric forms to advanced calculus and wave synthesizers.',
      },
      hi: {
        language: 'hi',
        title: 'गणित एवं संगणकीय तर्कशास्त्र',
        description: 'सहज ज्यामितीय आकृतियों से लेकर उच्च कैलकुलस और तरंग विश्लेषण तक का सफर।',
      }
    }
  },
  {
    id: 'node_cs',
    parentId: null,
    path: 'node_cs',
    depth: 0,
    type: 'category',
    order: 3,
    status: 'published',
    targetAgeBand: 'all',
    icon: 'Binary',
    badge: 'Code IDE & Tests 💻',
    estimatedMinutes: 200,
    createdBy: 'user_branch_admin_cs',
    updatedAt: '2026-03-01T10:00:00Z',
    tags: ['Computer Science', 'Coding', 'Algorithms', 'कंप्यूटर'],
    translations: {
      en: {
        language: 'en',
        title: 'Computer Science & Software Engineering',
        description: 'Interactive coding environments, algorithmic puzzles, unit testing, and full software architectures.',
      },
      hi: {
        language: 'hi',
        title: 'संगणक विज्ञान एवं सॉफ्टवेयर इंजीनियरिंग',
        description: 'इंटरैक्टिव कोडिंग वातावरण, एल्गोरिदम चुनौतियां, स्वचालित परीक्षण एवं सॉफ्टवेयर संरचनाएं।',
      }
    },
    codingProblem: {
      id: 'prob_two_sum',
      title: 'Optimal Two-Sum Target Finder',
      language: 'python',
      description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\nTime complexity constraint: O(n).',
      starterCode: 'def two_sum(nums, target):\n    # Write your optimal O(n) hashmap solution here\n    seen = {}\n    for i, num in enumerate(nums):\n        diff = target - num\n        if diff in seen:\n            return [seen[diff], i]\n        seen[num] = i\n    return []\n\n# Test with demo parameters\nprint(two_sum([2, 7, 11, 15], 9))\n',
      testCases: [
        { id: 'tc1', input: 'nums = [2, 7, 11, 15], target = 9', expectedOutput: '[0, 1]' },
        { id: 'tc2', input: 'nums = [3, 2, 4], target = 6', expectedOutput: '[1, 2]' },
        { id: 'tc3', input: 'nums = [3, 3], target = 6', expectedOutput: '[0, 1]' }
      ]
    }
  },
  {
    id: 'node_kids_universe',
    parentId: null,
    path: 'node_kids_universe',
    depth: 0,
    type: 'category',
    order: 3,
    status: 'published',
    targetAgeBand: 'kids',
    icon: 'Sparkles',
    badge: 'Kids Only 🧸',
    estimatedMinutes: 60,
    createdBy: 'user_super_admin',
    updatedAt: '2026-03-01T10:00:00Z',
    tags: ['Kids', 'Fun', 'बच्चे'],
    translations: {
      en: {
        language: 'en',
        title: 'Wonder Zone: Magic of Nature',
        description: 'Big colourful adventures, stories, talking animals and planetary journeys for little explorers!',
      },
      hi: {
        language: 'hi',
        title: 'नन्हे वैज्ञानिक: प्रकृति का जादू',
        description: 'रंग-बिरंगी कहानियां, बोलते हुए तारे और सौरमंडल की जादुई सैर छोटे बच्चों के लिए!',
      }
    }
  },
  {
    id: 'node_humanities',
    parentId: null,
    path: 'node_humanities',
    depth: 0,
    type: 'category',
    order: 4,
    status: 'published',
    targetAgeBand: 'all',
    icon: 'BookOpen',
    badge: 'Humanities & Arts',
    estimatedMinutes: 160,
    createdBy: 'user_super_admin',
    updatedAt: '2026-03-01T10:00:00Z',
    tags: ['Humanities', 'History', 'Philosophy', 'मानविकी एवं दर्शन'],
    translations: {
      en: {
        language: 'en',
        title: 'Humanities, Philosophy & World Cultures',
        description: 'Critical thinking, civilizational history, ethical philosophy, and linguistic heritage.',
      },
      hi: {
        language: 'hi',
        title: 'मानविकी, दर्शनशास्त्र एवं विश्व संस्कृतियां',
        description: 'तार्किक चिंतन, सभ्यतागत इतिहास, नीतिशास्त्र और समृद्ध भाषाई धरोहर का अध्ययन।',
      }
    }
  },
  {
    id: 'node_economics',
    parentId: null,
    path: 'node_economics',
    depth: 0,
    type: 'category',
    order: 5,
    status: 'published',
    targetAgeBand: 'all',
    icon: 'BarChart3',
    badge: 'Commerce & Finance',
    estimatedMinutes: 150,
    createdBy: 'user_super_admin',
    updatedAt: '2026-03-01T10:00:00Z',
    tags: ['Economics', 'Commerce', 'Finance', 'अर्थशास्त्र'],
    translations: {
      en: {
        language: 'en',
        title: 'Economics, Commerce & Global Markets',
        description: 'Macroeconomic simulations, game theory, financial literacy, and trade dynamics.',
      },
      hi: {
        language: 'hi',
        title: 'अर्थशास्त्र, वाणिज्य एवं वैश्विक बाज़ार',
        description: 'समष्टि अर्थशास्त्र सिमुलेशन, गेम थ्योरी, वित्तीय साक्षरता और व्यापार तंत्र।',
      }
    }
  },

  // ==========================================
  // LEVEL 1: SUBJECTS
  // ==========================================
  {
    id: 'node_physics',
    parentId: 'node_science',
    path: 'node_science.node_physics',
    depth: 1,
    type: 'subject',
    order: 1,
    status: 'published',
    targetAgeBand: 'all',
    icon: 'Zap',
    estimatedMinutes: 120,
    createdBy: 'user_branch_admin_science',
    updatedAt: '2026-03-02T11:00:00Z',
    tags: ['Physics', 'Mechanics', 'भौतिकी'],
    translations: {
      en: {
        language: 'en',
        title: 'Physics: Forces, Motion & Energy',
        description: 'Understanding how matter moves and interacts across classical and modern regimes.',
      },
      hi: {
        language: 'hi',
        title: 'भौतिकी: बल, गति एवं ऊर्जा',
        description: 'पदार्थ की गति और ब्रह्मांडीय शक्तियों का सटीक और व्यावहारिक अध्ययन।',
      }
    }
  },
  {
    id: 'node_trig',
    parentId: 'node_math',
    path: 'node_math.node_trig',
    depth: 1,
    type: 'subject',
    order: 1,
    status: 'published',
    targetAgeBand: 'teens',
    icon: 'Activity',
    estimatedMinutes: 90,
    createdBy: 'user_branch_admin_math',
    updatedAt: '2026-03-02T11:00:00Z',
    tags: ['Trigonometry', 'Waves', 'त्रिकोणमिति'],
    translations: {
      en: {
        language: 'en',
        title: 'Trigonometry & Harmonic Waves',
        description: 'Explore angles, sinusoidal oscillations, sound frequencies, and harmonic audio.',
      },
      hi: {
        language: 'hi',
        title: 'त्रिकोणमिति एवं आवर्ती तरंगें',
        description: 'कोणों, ज्या व कोज्या तरंगों, ध्वनि की आवृत्तियों और कंपनों का दृश्य अध्ययन।',
      }
    }
  },

  // ==========================================
  // LEVEL 2: TOPICS
  // ==========================================
  {
    id: 'node_mechanics',
    parentId: 'node_physics',
    path: 'node_science.node_physics.node_mechanics',
    depth: 2,
    type: 'topic',
    order: 1,
    status: 'published',
    targetAgeBand: 'teens',
    icon: 'Compass',
    estimatedMinutes: 60,
    createdBy: 'user_creator_physics',
    updatedAt: '2026-03-03T09:00:00Z',
    translations: {
      en: {
        language: 'en',
        title: 'Classical Mechanics & Kinematics',
        description: 'Displacement, velocity, acceleration, and two-dimensional trajectories.',
      },
      hi: {
        language: 'hi',
        title: 'चिरसम्मत यांत्रिकी एवं शुद्ध गतिकी (Kinematics)',
        description: 'विस्थापन, वेग, त्वरण और द्विविमीय प्रक्षेप्य वक्रों का विश्लेषण।',
      }
    }
  },

  // ==========================================
  // LEVEL 3: SUBTOPICS
  // ==========================================
  {
    id: 'node_kinematics_2d',
    parentId: 'node_mechanics',
    path: 'node_science.node_physics.node_mechanics.node_kinematics_2d',
    depth: 3,
    type: 'subtopic',
    order: 1,
    status: 'published',
    targetAgeBand: 'teens',
    icon: 'Target',
    estimatedMinutes: 45,
    createdBy: 'user_creator_physics',
    updatedAt: '2026-03-04T14:00:00Z',
    translations: {
      en: {
        language: 'en',
        title: 'Two-Dimensional Motion & Gravity',
        description: 'How gravitational acceleration acts independently on horizontal and vertical components.',
      },
      hi: {
        language: 'hi',
        title: 'द्विविमीय गति एवं गुरुत्वाकर्षण का प्रभाव',
        description: 'गुरुत्वाकर्षण किस प्रकार क्षैतिज और ऊर्ध्वाधर घटकों पर स्वतंत्र रूप से कार्य करता है।',
      }
    }
  },

  // ==========================================
  // LEVEL 4: SUB-SUBTOPICS
  // ==========================================
  {
    id: 'node_projectile_unit',
    parentId: 'node_kinematics_2d',
    path: 'node_science.node_physics.node_mechanics.node_kinematics_2d.node_projectile_unit',
    depth: 4,
    type: 'sub_subtopic',
    order: 1,
    status: 'published',
    targetAgeBand: 'all',
    icon: 'Milestone',
    badge: 'Mastery Unit',
    estimatedMinutes: 35,
    createdBy: 'user_creator_physics',
    updatedAt: '2026-03-04T15:00:00Z',
    translations: {
      en: {
        language: 'en',
        title: 'Deep Dive: Projectile Motion & Parabolic Paths',
        description: 'Complete multimodal unit featuring interactive simulation, concept video, quiz, and spaced cards.',
      },
      hi: {
        language: 'hi',
        title: 'गहन अध्ययन: प्रक्षेप्य गति एवं परवलयाकार मार्ग',
        description: 'इंटरैक्टिव सिमुलेशन, व्याख्यात्मक वीडियो, प्रश्नोत्तरी और फ्लैशकार्ड्स से युक्त संपूर्ण इकाई।',
      }
    }
  },

  // ==========================================
  // LEVEL 5: INTERACTIVE LEAF NODES (Under Projectile Unit)
  // ==========================================
  // 1. Simulation Node
  {
    id: 'node_sim_projectile',
    parentId: 'node_projectile_unit',
    path: 'node_science.node_physics.node_mechanics.node_kinematics_2d.node_projectile_unit.node_sim_projectile',
    depth: 5,
    type: 'simulation',
    order: 1,
    status: 'published',
    targetAgeBand: 'all',
    icon: 'PlayCircle',
    badge: 'Hands-on Lab 🔬',
    estimatedMinutes: 15,
    createdBy: 'user_creator_physics',
    updatedAt: '2026-03-05T12:00:00Z',
    translations: {
      en: {
        language: 'en',
        title: 'Interactive Projectile Motion Simulator',
        description: 'Fire a projectile with variable launch angle, initial speed, and gravitational acceleration.',
        body: 'Use this virtual physics laboratory to test Galileo\'s principle of independent orthogonal motions.'
      },
      hi: {
        language: 'hi',
        title: 'इंटरैक्टिव प्रक्षेप्य गति सिमुलेटर (प्रायोगिक लैब)',
        description: 'प्रक्षेपण कोण, प्रारंभिक वेग और गुरुत्वीय त्वरण बदलकर तोप के गोले की गति देखें।',
        body: 'गैलीलियो के गति के स्वतंत्रता सिद्धांत को लाइव सिमुलेशन के जरिए स्वयं परखें।'
      }
    },
    simulationConfig: {
      type: 'projectile',
      initialParams: {
        angle: 45,
        velocity: 40,
        gravity: 9.8,
        airResistance: 0
      },
      instructions: {
        en: 'Adjust the angle slider (0° to 90°) and launch speed. Notice that a 45° angle provides maximum horizontal range on flat ground!',
        hi: 'कोण स्लाइडर (0° से 90°) और प्रक्षेपण वेग बदलें। ध्यान दें कि समतल जमीन पर 45° का कोण अधिकतम क्षैतिज परास (Range) प्रदान करता है!'
      },
      challenges: [
        {
          id: 'c1',
          description: {
            en: 'Hit the target at 140 meters by adjusting angle and velocity.',
            hi: 'कोण और वेग को समायोजित करके 140 मीटर पर रखे लक्ष्य पर सटीक निशाना लगाएं।'
          },
          targetCondition: 'range_near_140'
        },
        {
          id: 'c2',
          description: {
            en: 'Compare the range of 30° vs 60° at the exact same velocity.',
            hi: 'समान वेग पर 30° और 60° के कोणों के परास की तुलना करें (पूरक कोण सिद्धांत)।'
          },
          targetCondition: 'test_complementary_angles'
        }
      ]
    },
    audioExplanation: {
      narrationTitle: 'प्रक्षेप्य गति एवं गतिकी का संपूर्ण विश्लेषण (Projectile Motion Masterclass)',
      scriptHi: 'नमस्ते दोस्तों! आज हम प्रक्षेप्य गति यानी प्रोजेक्टाइल मोशन का वैज्ञानिक अध्ययन करेंगे। जब हम किसी वस्तु जैसे गेंद या तोप के गोले को क्षैतिज से किसी कोण थीटा पर प्रारंभिक वेग वी नॉट से फेंकते हैं, तो वह दो स्वतंत्र गतियों का अनुभव करती है। क्षैतिज दिशा में कोई बाह्य बल नहीं लगता, इसलिए क्षैतिज वेग स्थिर रहता है। लेकिन ऊर्ध्वाधर दिशा में गुरुत्वाकर्षण बल जी नीचे की ओर कार्य करता है। इसी कारण वस्तु का मार्ग एक सुंदर परवलय यानी पैराबोला बनाता है। समतल जमीन पर 45 डिग्री के प्रक्षेपण कोण पर वस्तु अधिकतम क्षैतिज दूरी तय करती है। आइए इस सिमुलेशन में विभिन्न कोणों और वेगों के साथ इसे प्रत्यक्ष देखें।',
      scriptEn: 'Namaste and welcome everyone! Today we are exploring projectile motion and kinematics in two dimensions. When a projectile is launched at an initial speed v zero and angle theta, its orthogonal horizontal and vertical motions are completely independent. Horizontally, zero acceleration occurs, keeping horizontal velocity constant. Vertically, downward gravitational acceleration constantly curves the path into a parabola. On flat terrain, a forty-five degree launch angle delivers maximum horizontal range. Test this dynamic behavior directly in the interactive sandbox.',
      durationSeconds: 120
    },
    notes: {
      title: 'प्रक्षेप्य गति सूत्र एवं त्वरित समीक्षा (Projectile Kinematics Quick Reference)',
      contentMarkdown: `### मुख्य सूत्र एवं सिद्धांत (Core Formulas)

* **क्षैतिज घटक (Horizontal Component):** $v_x = v_0 \\cos\\theta$ (त्वरण $a_x = 0$, वेग स्थिर रहता है)
* **ऊर्ध्वाधर घटक (Vertical Component):** $v_y = v_0 \\sin\\theta - g t$ (गुरुत्वीय त्वरण $g = 9.8\\text{ m/s}^2$)
* **उड्डयन काल (Time of Flight):** $T = \\frac{2 v_0 \\sin\\theta}{g}$
* **अधिकतम ऊंचाई (Maximum Height):** $H = \\frac{v_0^2 \\sin^2\\theta}{2g}$
* **क्षैतिज परास (Horizontal Range):** $R = \\frac{v_0^2 \\sin(2\\theta)}{g}$`,
      keyTakeaways: [
        'क्षैतिज और ऊर्ध्वाधर गतियां एक-दूसरे से पूरी तरह स्वतंत्र होती हैं।',
        'हवा के घर्षण के बिना क्षैतिज दिशा में त्वरण शून्य होता है, अतः क्षैतिज वेग नियत रहता है।',
        'समतल सतह पर 45° का प्रक्षेपण कोण अधिकतम क्षैतिज परास प्रदान करता है।',
        'पूरक कोणों (जैसे 30° और 60°) पर समान वेग से फेंकने पर समान परास प्राप्त होता है।'
      ]
    },
    flowchart: {
      flowchartType: 'decision',
      caption: 'प्रक्षेप्य गति गणना एवं प्रक्षेप पथ निर्धारण (Trajectory Determination Flow)',
      mermaidCode: `graph TD
    A([प्रारंभिक वेग v0 एवं कोण θ निर्धारित करें]) --> B[/घटकों में वियोजन: vx = v0 cosθ, vy = v0 sinθ/]
    B --> C{क्या हवा का घर्षण नगण्य है?}
    C -->|हाँ| D[क्षैतिज त्वरण ax = 0, vx स्थिर]
    C -->|नहीं| E[वायु प्रतिरोध ड्रैग मॉडल लागू करें]
    D --> F[ऊर्ध्वाधर गति पर गुरुत्वाकर्षण g = 9.8 m/s²]
    F --> G[उड्डयन काल T = 2 v0 sinθ / g]
    G --> H[अधिकतम ऊंचाई H एवं क्षैतिज परास R की गणना]
    H --> I([लक्ष्य पर सटीक लैंडिंग])`
    },
    quizQuestions: [
      {
        id: 'q_proj_1',
        question: {
          en: 'At what launch angle is the horizontal range of a projectile maximized on level ground?',
          hi: 'समतल जमीन पर प्रक्षेप्य का क्षैतिज परास (Range) किस कोण पर अधिकतम होता है?'
        },
        options: {
          en: ['30 degrees', '45 degrees', '60 degrees', '90 degrees'],
          hi: ['30 अंश (30°)', '45 अंश (45°)', '60 अंश (60°)', '90 अंश (90°)']
        },
        correctOptionIndex: 1,
        explanation: {
          en: 'Because R = (v0² sin(2θ))/g, the term sin(2θ) reaches its mathematical maximum value of 1 when 2θ = 90°, which means θ = 45°.',
          hi: 'चूँकि परास का सूत्र R = (v0² sin(2θ))/g है, sin(2θ) का मान 2θ = 90° यानी θ = 45° पर अधिकतम (1) होता है।'
        }
      }
    ]
  },

  // 2. Video Node with Interactive Checkpoints
  {
    id: 'node_video_projectile',
    parentId: 'node_projectile_unit',
    path: 'node_science.node_physics.node_mechanics.node_kinematics_2d.node_projectile_unit.node_video_projectile',
    depth: 5,
    type: 'video',
    order: 2,
    status: 'published',
    targetAgeBand: 'all',
    icon: 'Video',
    badge: 'With Checkpoints ⏱️',
    estimatedMinutes: 10,
    createdBy: 'user_creator_physics',
    updatedAt: '2026-03-05T13:00:00Z',
    translations: {
      en: {
        language: 'en',
        title: 'Concept Video: Why Projectile Trajectories are Parabolic',
        description: 'Visual breakdown showing how constant horizontal velocity combined with vertical gravitational acceleration produces a parabola.',
        transcript: 'Welcome everyone! Today we are exploring projectile motion. When you throw a ball forward, two completely independent motions occur simultaneously. Horizontally, there is zero acceleration (ignoring air resistance), so velocity remains constant: vx = v * cos(θ). Vertically, gravity constantly pulls it downward at g = 9.8 m/s². Combining x = v_x * t and y = v_y * t - 0.5 * g * t² yields the equation of a parabola: y = tan(θ)x - [g / (2 v² cos²(θ))] x²!'
      },
      hi: {
        language: 'hi',
        title: 'वीडियो व्याख्या: प्रक्षेप्य पथ परवलयाकार (Parabolic) क्यों होता है?',
        description: 'दृश्य प्रदर्शन: क्षैतिज एकसमान वेग और ऊर्ध्वाधर गुरुत्वीय त्वरण मिलकर परवलय कैसे बनाते हैं।',
        transcript: 'नमस्ते दोस्तों! आज हम प्रक्षेप्य गति (Projectile Motion) को समझेंगे। जब आप किसी गेंद को आगे फेंकते हैं, तो दो स्वतंत्र गतियाँ एक साथ होती हैं। क्षैतिज दिशा में कोई त्वरण नहीं होता, अतः वेग स्थिर रहता है: vx = v * cos(θ)। ऊर्ध्वाधर दिशा में पृथ्वी का गुरुत्वाकर्षण इसे लगातार नीचे खींचता है: g = 9.8 m/s²। इन दोनों को मिलाने पर परवलय का समीकरण प्राप्त होता है: y = tan(θ)x - [g / (2 v² cos²(θ))] x²!'
      }
    },
    videoData: {
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=800&q=80',
      durationSeconds: 180,
      checkpoints: [
        {
          id: 'cp_1',
          timestampSeconds: 15,
          question: {
            en: 'In ideal projectile motion (no air drag), what is the horizontal acceleration ax?',
            hi: 'आदर्श प्रक्षेप्य गति में हवा के घर्षण के बिना क्षैतिज त्वरण (ax) कितना होता है?'
          },
          options: {
            en: ['Zero (0 m/s²)', 'Equal to g (9.8 m/s²)', 'Depends on angle', 'Constantly increasing'],
            hi: ['शून्य (0 m/s²)', 'गुरुत्वीय त्वरण g के बराबर (9.8 m/s²)', 'कोण पर निर्भर करता है', 'लगातार बढ़ता है']
          },
          correctIndex: 0,
          explanation: {
            en: 'Because gravity acts strictly downwards in the vertical direction, there is zero force and zero acceleration horizontally (ax = 0).',
            hi: 'चूँकि गुरुत्वाकर्षण केवल नीचे की ओर ऊर्ध्वाधर दिशा में कार्य करता है, अतः क्षैतिज दिशा में कोई बल या त्वरण नहीं होता (ax = 0)।'
          }
        },
        {
          id: 'cp_2',
          timestampSeconds: 45,
          question: {
            en: 'At the maximum height of a projectile trajectory, what is its vertical velocity vy?',
            hi: 'प्रक्षेप्य के पथ के उच्चतम बिंदु पर ऊर्ध्वाधर वेग (vy) क्या होता है?'
          },
          options: {
            en: ['Maximum velocity', 'Zero (0 m/s)', 'Equal to horizontal velocity', 'Infinity'],
            hi: ['अधिकतम वेग', 'शून्य (0 m/s)', 'क्षैतिज वेग के बराबर', 'अनंत']
          },
          correctIndex: 1,
          explanation: {
            en: 'At the apex, the projectile momentarily ceases moving upward before accelerating downwards, so vy = 0.',
            hi: 'शीर्ष बिंदु पर प्रक्षेप्य कुछ क्षण के लिए ऊपर उठना बंद कर देता है और नीचे गिरना शुरू करता है, इसलिए vy = 0 होता है।'
          }
        }
      ]
    }
  },

  // 3. Core Lesson / Reading Node
  {
    id: 'node_lesson_projectile',
    parentId: 'node_projectile_unit',
    path: 'node_science.node_physics.node_mechanics.node_kinematics_2d.node_projectile_unit.node_lesson_projectile',
    depth: 5,
    type: 'lesson',
    order: 3,
    status: 'published',
    targetAgeBand: 'all',
    icon: 'BookOpen',
    estimatedMinutes: 8,
    createdBy: 'user_creator_physics',
    updatedAt: '2026-03-05T14:00:00Z',
    translations: {
      en: {
        language: 'en',
        title: 'Core Reading: Mathematical Derivations & Formulas',
        description: 'Complete step-by-step derivation of Time of Flight, Maximum Height, and Horizontal Range.',
        body: `### Fundamentals of Projectile Motion

When an object is propelled with initial velocity $u$ at an angle $\\theta$ to the horizontal:

1. **Initial Velocity Components:**
   * Horizontal: $u_x = u \\cos\\theta$
   * Vertical: $u_y = u \\sin\\theta$

2. **Time of Flight ($T$):**
   $$T = \\frac{2 u \\sin\\theta}{g}$$

3. **Maximum Height ($H$):**
   $$H = \\frac{u^2 \\sin^2\\theta}{2g}$$

4. **Horizontal Range ($R$):**
   $$R = \\frac{u^2 \\sin(2\\theta)}{g}$$

*Key Insight:* The range is identical for complementary angles $\\theta$ and $(90^\\circ - \\theta)$. For instance, $30^\\circ$ and $60^\\circ$ achieve the exact same range!`,
        summary: '• Motion in X and Y planes is mutually perpendicular and independent.\n• Gravity only alters vertical velocity.\n• 45° angle maximizes horizontal range on flat terrain.'
      },
      hi: {
        language: 'hi',
        title: 'मुख्य पाठ: गणितीय सूत्र एवं प्रमाण (प्रक्षेप्य गति)',
        description: 'उड्डयन काल (Time of Flight), अधिकतम ऊंचाई (Maximum Height) और क्षैतिज परास (Range) के सूत्र।',
        body: `### प्रक्षेप्य गति के मूलभूत सिद्धांत

जब किसी पिंड को क्षैतिज से $\\theta$ कोण पर प्रारंभिक वेग $u$ से प्रक्षेपित किया जाता है:

1. **प्रारंभिक वेग के घटक:**
   * क्षैतिज घटक: $u_x = u \\cos\\theta$
   * ऊर्ध्वाधर घटक: $u_y = u \\sin\\theta$

2. **उड्डयन काल (Time of Flight, $T$):**
   $$T = \\frac{2 u \\sin\\theta}{g}$$

3. **अधिकतम ऊंचाई (Maximum Height, $H$):**
   $$H = \\frac{u^2 \\sin^2\\theta}{2g}$$

4. **क्षैतिज परास (Horizontal Range, $R$):**
   $$R = \\frac{u^2 \\sin(2\\theta)}{g}$$

*महत्वपूर्ण निष्कर्ष:* पूरक कोणों $\\theta$ और $(90^\\circ - \\theta)$ के लिए परास समान होता है। उदाहरण के लिए, $30^\\circ$ और $60^\\circ$ पर एकसमान दूरी प्राप्त होती है!`,
        summary: '• क्षैतिज और ऊर्ध्वाधर गति एक-दूसरे से पूर्णतः स्वतंत्र होती हैं।\n• गुरुत्वाकर्षण केवल ऊर्ध्वाधर वेग को प्रभावित करता है।\n• समतल धरातल पर 45° कोण पर अधिकतम दूरी मिलती है।'
      }
    }
  },

  // 4. Practice Quiz Node
  {
    id: 'node_quiz_projectile',
    parentId: 'node_projectile_unit',
    path: 'node_science.node_physics.node_mechanics.node_kinematics_2d.node_projectile_unit.node_quiz_projectile',
    depth: 5,
    type: 'quiz',
    order: 4,
    status: 'published',
    targetAgeBand: 'all',
    icon: 'HelpCircle',
    badge: '100 XP',
    estimatedMinutes: 5,
    createdBy: 'user_creator_physics',
    updatedAt: '2026-03-05T15:00:00Z',
    translations: {
      en: {
        language: 'en',
        title: 'Mastery Quiz: Active Retrieval Assessment',
        description: 'Test your understanding with instant pedagogical explanations.'
      },
      hi: {
        language: 'hi',
        title: 'प्रश्नोत्तरी: सक्रिय स्मरण एवं मूल्यांकन',
        description: 'तुरंत वैज्ञानिक व्याख्या के साथ अपनी समझ का परीक्षण करें।'
      }
    },
    quizQuestions: [
      {
        id: 'q1',
        question: {
          en: 'At what launch angle is the horizontal range of a projectile maximized on level ground?',
          hi: 'समतल जमीन पर प्रक्षेप्य का क्षैतिज परास (Range) किस कोण पर अधिकतम होता है?'
        },
        options: {
          en: ['30 degrees', '45 degrees', '60 degrees', '90 degrees'],
          hi: ['30 अंश', '45 अंश', '60 अंश', '90 अंश']
        },
        correctOptionIndex: 1,
        explanation: {
          en: 'Because R = (u² sin(2θ))/g, the term sin(2θ) reaches its mathematical maximum value of 1 when 2θ = 90°, meaning θ = 45°.',
          hi: 'चूँकि R = (u² sin(2θ))/g है, और sin(2θ) का अधिकतम मान 1 तब होता है जब 2θ = 90° यानी θ = 45°।'
        }
      },
      {
        id: 'q2',
        question: {
          en: 'Which pair of launch angles will produce identical horizontal ranges for the same initial velocity?',
          hi: 'समान प्रारंभिक वेग के लिए प्रक्षेपण कोणों का कौन सा युग्म एक समान क्षैतिज दूरी देगा?'
        },
        options: {
          en: ['20° and 70°', '15° and 45°', '30° and 50°', '40° and 60°'],
          hi: ['20° एवं 70°', '15° एवं 45°', '30° एवं 50°', '40° एवं 60°']
        },
        correctOptionIndex: 0,
        explanation: {
          en: 'Complementary angles (angles that sum to 90°) have sin(2θ) = sin(2(90-θ)) = sin(180 - 2θ) = sin(2θ). Here 20° + 70° = 90°.',
          hi: 'पूरक कोणों (जिनका योग 90° होता है) का परास समान होता है, क्योंकि 20° + 70° = 90°।'
        }
      },
      {
        id: 'q3',
        question: {
          en: 'If gravity on the Moon is 1/6th of Earth, what happens to the maximum height reached by the same projectile?',
          hi: 'यदि चंद्रमा पर गुरुत्वाकर्षण पृथ्वी का 1/6 भाग हो, तो उसी प्रक्षेप्य की अधिकतम ऊंचाई पर क्या प्रभाव पड़ेगा?'
        },
        options: {
          en: ['Increases by 6 times', 'Decreases by 6 times', 'Remains identical', 'Increases by 36 times'],
          hi: ['6 गुना बढ़ जाएगी', '6 गुना कम हो जाएगी', 'समान रहेगी', '36 गुना बढ़ जाएगी']
        },
        correctOptionIndex: 0,
        explanation: {
          en: 'Maximum height H = (u² sin²θ)/(2g). Since g is in the denominator and decreases by 6x, H increases inversely by 6x!',
          hi: 'अधिकतम ऊंचाई H = (u² sin²θ)/(2g) होती है। चूँकि g हर (denominator) में है और 6 गुना घटता है, अतः ऊंचाई 6 गुना बढ़ जाएगी!'
        }
      }
    ]
  },

  // 5. Spaced Repetition Flashcards Node
  {
    id: 'node_flashcards_projectile',
    parentId: 'node_projectile_unit',
    path: 'node_science.node_physics.node_mechanics.node_kinematics_2d.node_projectile_unit.node_flashcards_projectile',
    depth: 5,
    type: 'lesson',
    order: 5,
    status: 'published',
    targetAgeBand: 'all',
    icon: 'Layers',
    badge: 'Spaced Recall 🧠',
    estimatedMinutes: 5,
    createdBy: 'user_creator_physics',
    updatedAt: '2026-03-05T16:00:00Z',
    translations: {
      en: {
        language: 'en',
        title: 'Rapid Revision: Spaced Flashcards',
        description: 'Digital flipcards designed for quick daily mobile revision.'
      },
      hi: {
        language: 'hi',
        title: 'त्वरित रिवीज़न: स्पैस्ड फ्लैशकार्ड्स',
        description: 'दैनिक मोबाइल रिवीज़न के लिए डिज़ाइन किए गए स्मार्ट फ्लैशकार्ड्स।'
      }
    },
    flashcards: [
      {
        id: 'fc1',
        front: {
          en: 'Formula for Horizontal Range (R) of a projectile?',
          hi: 'प्रक्षेप्य के क्षैतिज परास (R) का सूत्र क्या है?'
        },
        back: {
          en: 'R = (u² sin(2θ)) / g',
          hi: 'R = (u² sin(2θ)) / g'
        },
        hint: {
          en: 'Remember sin of double angle',
          hi: 'दोगुने कोण की ज्या याद करें'
        }
      },
      {
        id: 'fc2',
        front: {
          en: 'What is the velocity vector direction at the exact peak of trajectory?',
          hi: 'प्रक्षेप्य के उच्चतम बिंदु पर वेग सदिश की दिशा क्या होती है?'
        },
        back: {
          en: 'Strictly horizontal: v = ux î = (u cosθ) î. Vertical velocity vy = 0.',
          hi: 'पूर्णतः क्षैतिज दिशा में: v = ux î = (u cosθ) î। ऊर्ध्वाधर वेग vy = 0 होता है।'
        }
      },
      {
        id: 'fc3',
        front: {
          en: 'Why do complimentary launch angles produce equal range?',
          hi: 'पूरक कोण (जैसे 30° और 60°) समान परास क्यों देते हैं?'
        },
        back: {
          en: 'Because sin(2(90° - θ)) = sin(180° - 2θ) = sin(2θ).',
          hi: 'क्योंकि त्रिकोणमिति में sin(180° - 2θ) = sin(2θ) होता है।'
        }
      }
    ]
  },

  // ==========================================
  // MATHEMATICS WAVE SYNTH SIMULATION NODE
  // ==========================================
  {
    id: 'node_sim_wave',
    parentId: 'node_trig',
    path: 'node_math.node_trig.node_sim_wave',
    depth: 2,
    type: 'simulation',
    order: 1,
    status: 'published',
    targetAgeBand: 'all',
    icon: 'Radio',
    badge: 'Audio-Visual Lab 🎵',
    estimatedMinutes: 15,
    createdBy: 'user_branch_admin_math',
    updatedAt: '2026-03-06T10:00:00Z',
    translations: {
      en: {
        language: 'en',
        title: 'Trigonometric Wave Synthesizer & Harmonic Lab',
        description: 'Visualize sine & cosine waves while listening to real-time audio frequencies.',
        body: 'Connect mathematical formulas y(t) = A sin(2πft + φ) directly with visual waves and human hearing.'
      },
      hi: {
        language: 'hi',
        title: 'त्रिकोणमितीय तरंग सिंथेसाइज़र एवं ध्वनि प्रयोगशाला',
        description: 'ज्या (Sine) व कोज्या (Cosine) तरंगों का दृश्य अवलोकन करें और वास्तविक ध्वनि सुनें।',
        body: 'गणितीय समीकरण y(t) = A sin(2πft + φ) को सीधे दृश्य तरंगों और कानों से सुनी जाने वाली ध्वनि से जोड़ें।'
      }
    },
    simulationConfig: {
      type: 'wave_synth',
      initialParams: {
        frequency: 440,
        amplitude: 50,
        waveType: 'sine'
      },
      instructions: {
        en: 'Adjust frequency (Pitch) and amplitude (Volume). Notice how higher frequencies create denser wave crests and higher pitch audio!',
        hi: 'आवृत्ति (तारत्व/Pitch) और आयाम (प्रबलता/Volume) बदलें। देखें कि उच्च आवृत्ति से तरंगें कैसे पास-पास आती हैं और तीखी ध्वनि उत्पन्न होती है!'
      },
      challenges: [
        {
          id: 'wc1',
          description: {
            en: 'Create concert pitch standard A440 (Frequency = 440 Hz).',
            hi: 'संगीत मानक A440 आवृत्ति (440 Hz) सेट करें।'
          },
          targetCondition: 'freq_440'
        }
      ]
    }
  },

  // ==========================================
  // KIDS SOLAR SYSTEM / NATURE NODE
  // ==========================================
  {
    id: 'node_solar_kids',
    parentId: 'node_kids_universe',
    path: 'node_kids_universe.node_solar_kids',
    depth: 1,
    type: 'lesson',
    order: 1,
    status: 'published',
    targetAgeBand: 'kids',
    icon: 'Sun',
    badge: 'Story & Audio 🎧',
    estimatedMinutes: 10,
    createdBy: 'user_super_admin',
    updatedAt: '2026-03-07T10:00:00Z',
    translations: {
      en: {
        language: 'en',
        title: 'Meet Our Sun & The Dancing Planets! ☀️',
        description: 'A magical journey with audio read-aloud where our fiery Sun introduces Earth and its planet friends.',
        body: `### Hello Little Explorers! 🚀

Look up at the bright morning sky! That is our friendly star, **The Sun**.

1. The Sun is like a giant warm glowing ball of gold!
2. Our home planet **Earth (पृथ्वी)** spins around the Sun like a happy dancer.
3. It takes 365 days for Earth to complete one big circle around the Sun — that is one whole year!

**Did you know?**
The Sun is so big that one million Earths could fit inside it! Tap the 'Listen to Lesson' button above to hear the story out loud.`,
        summary: '• The Sun is a star at the center of our solar system.\n• Earth travels around the Sun.\n• We get daylight and warmth from our Sun!'
      },
      hi: {
        language: 'hi',
        title: 'मिलिए हमारे सूरज और नाचते हुए ग्रहों से! ☀️',
        description: 'बोलती हुई पुस्तक के साथ एक जादुई यात्रा, जहाँ हमारा प्यारा सूरज पृथ्वी और उसके मित्रों से मिलवाता है।',
        body: `### नमस्ते नन्हे दोस्तों! 🚀

सुबह के चमकीले आसमान को देखिए! वह मुस्कुराता हुआ सितारा हमारा **सूरज (The Sun)** है।

1. सूरज एक विशाल, सुनहरी और रोशनी से भरी जादुई गेंद जैसा है!
2. हमारी **पृथ्वी (Earth)** सूरज के चारों ओर एक नटखट बच्चे की तरह गोल-गोल घूमती है।
3. पृथ्वी को सूरज का एक पूरा चक्कर लगाने में 365 दिन लगते हैं — यानी पूरा एक साल!

**क्या आप जानते हैं?**
सूरज इतना बड़ा है कि उसके अंदर 10 लाख पृथ्वियां समा सकती हैं! ऊपर दिए गए 'पाठ सुनें' बटन को दबाकर यह कहानी आवाज में सुनें।`,
        summary: '• सूरज हमारे सौरमंडल के केंद्र में स्थित एक तारा है।\n• पृथ्वी सूरज के चारों ओर चक्कर लगाती है।\n• सूरज से हमें रोशनी और जीवनदायिनी ऊर्जा मिलती है!'
      }
    }
  },

  // ==========================================
  // WORKFLOW DEMO NODES: DRAFT & IN-REVIEW (For Admin & Reviewer Workflow)
  // ==========================================
  {
    id: 'node_draft_quantum',
    parentId: 'node_physics',
    path: 'node_science.node_physics.node_draft_quantum',
    depth: 2,
    type: 'topic',
    order: 2,
    status: 'in_review',
    targetAgeBand: 'adults',
    icon: 'Radioactive',
    badge: 'Under Review ⏳',
    estimatedMinutes: 50,
    createdBy: 'user_creator_physics',
    updatedAt: '2026-03-08T16:00:00Z',
    translations: {
      en: {
        language: 'en',
        title: 'Quantum Wave-Particle Duality (De Broglie)',
        description: 'Submitted by Vikram Singh. Waiting for Hindi translation check and Branch Admin approval.',
        body: 'Matter exhibits wave-like properties with wavelength λ = h / p. Currently awaiting Hindi translation validation.'
      },
      hi: {
        language: 'hi',
        title: 'क्वांटम तरंग-कण द्वैतवाद (डी ब्रोग्ली परिकल्पना)',
        description: 'विक्रम सिंह द्वारा प्रस्तुत। हिंदी अनुवाद एवं समीक्षा प्रतीक्षारत।',
        body: 'द्रव्य तरंग रूप में भी व्यवहार करता है जिसकी तरंगदैर्ध्य λ = h / p होती है।'
      }
    }
  },
  {
    id: 'node_draft_calculus_kids',
    parentId: 'node_math',
    path: 'node_math.node_draft_calculus_kids',
    depth: 1,
    type: 'topic',
    order: 3,
    status: 'draft',
    targetAgeBand: 'teens',
    icon: 'TrendingUp',
    badge: 'Draft ✍️',
    estimatedMinutes: 40,
    createdBy: 'user_branch_admin_math',
    updatedAt: '2026-03-09T08:00:00Z',
    translations: {
      en: {
        language: 'en',
        title: 'Visual Derivatives: The Slope of Speedometers',
        description: 'Draft topic authored by Prof. Alok Verma. Still missing complete Hindi translation.',
      }
      // Note: Hindi translation intentionally missing to showcase "Missing Translation" warning badge!
    }
  }
];
