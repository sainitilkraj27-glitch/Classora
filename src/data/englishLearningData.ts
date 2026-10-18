import { EnglishMaterial } from '../types';

export interface TenseDetail {
  id: string;
  name: string;
  hindiName: string;
  category: 'Present' | 'Past' | 'Future';
  identificationHindi: string; // पहचान (e.g. ता है, ते हैं)
  affirmativeFormula: string;
  negativeFormula: string;
  interrogativeFormula: string;
  examples: Array<{ en: string; hi: string; type?: string }>;
  mistakeToAvoid: string;
  tip: string;
}

export const BUILTIN_TENSES: TenseDetail[] = [
  // PRESENT TENSES
  {
    id: 'present-simple',
    name: 'Simple Present (Present Indefinite)',
    hindiName: 'सामान्य वर्तमान काल',
    category: 'Present',
    identificationHindi: 'क्रिया के अंत में ता है, ती है, ते हैं, ता हूँ आता है। (दैनिक आदतें, सच, रूटीन)',
    affirmativeFormula: 'Subject + V1 (s/es with He/She/It/Singular) + Object',
    negativeFormula: 'Subject + do not / does not + V1 + Object',
    interrogativeFormula: 'Do / Does + Subject + V1 + Object?',
    examples: [
      { en: 'I attend college every day.', hi: 'मैं हर रोज़ कॉलेज जाता हूँ।' },
      { en: 'She teaches English very well.', hi: 'वह अंग्रेजी बहुत अच्छी पढ़ाती है।' },
      { en: 'He does not know the answer.', hi: 'वह उत्तर नहीं जानता है।' },
      { en: 'Do you study late at night?', hi: 'क्या आप रात को देर तक पढ़ते हैं?' },
    ],
    mistakeToAvoid: 'गलती: "He go to college" ❌ -> सही: "He goes to college" ✅ (He/She/It के साथ V1 में s/es लगता है, और Does के बाद s/es हट जाता है!)',
    tip: 'Daily habits, universal facts और routine बताने के लिए हमेशा Simple Present का प्रयोग करें।',
  },
  {
    id: 'present-continuous',
    name: 'Present Continuous (Progressive)',
    hindiName: 'अपूर्ण वर्तमान काल (काम चल रहा है)',
    category: 'Present',
    identificationHindi: 'क्रिया के अंत में रहा है, रही है, रहे हैं, रहा हूँ आता है।',
    affirmativeFormula: 'Subject + is / am / are + V1+ing + Object',
    negativeFormula: 'Subject + is / am / are + not + V1+ing + Object',
    interrogativeFormula: 'Is / Am / Are + Subject + V1+ing + Object?',
    examples: [
      { en: 'We are preparing for the upcoming exams.', hi: 'हम आगामी परीक्षाओं की तैयारी कर रहे हैं।' },
      { en: 'The teacher is explaining the grammar rule.', hi: 'शिक्षक व्याकरण का नियम समझा रहे हैं।' },
      { en: 'I am not wasting my time.', hi: 'मैं अपना समय बर्बाद नहीं कर रहा हूँ।' },
      { en: 'Are you listening to me?', hi: 'क्या आप मुझे सुन रहे हैं?' },
    ],
    mistakeToAvoid: 'गलती: "I am agree with you" ❌ -> सही: "I agree with you" ✅ (Agree एक verb है, continuous में feelings/state नहीं बदलते)',
    tip: 'I के साथ am, He/She/It के साथ is, और You/We/They/Plural के साथ are का प्रयोग करें।',
  },
  {
    id: 'present-perfect',
    name: 'Present Perfect',
    hindiName: 'पूर्ण वर्तमान काल (काम पूरा हो चुका है)',
    category: 'Present',
    identificationHindi: 'क्रिया के अंत में चुका है, चुकी है, चुके हैं, या है, ई है, ए हैं आता है।',
    affirmativeFormula: 'Subject + has / have + V3 (3rd form) + Object',
    negativeFormula: 'Subject + has / have + not + V3 + Object',
    interrogativeFormula: 'Has / Have + Subject + V3 + Object?',
    examples: [
      { en: 'I have submitted my assignment.', hi: 'मैंने अपना असाइनमेंट जमा कर दिया है।' },
      { en: 'The train has just arrived.', hi: 'ट्रेन अभी-अभी आ चुकी है।' },
      { en: 'She has not received the message yet.', hi: 'उसे अभी तक संदेश नहीं मिला है।' },
      { en: 'Have you completed your homework?', hi: 'क्या तुमने अपना गृहकार्य पूरा कर लिया है?' },
    ],
    mistakeToAvoid: 'गलती: "I have saw the movie" ❌ -> सही: "I have seen the movie" ✅ (Has/Have के साथ हमेशा क्रिया की 3rd Form (V3) ही आती है!)',
    tip: 'He/She/It/Singular के साथ Has और I/We/You/They के साथ Have लगाएं।',
  },
  {
    id: 'present-perfect-continuous',
    name: 'Present Perfect Continuous',
    hindiName: 'पूर्णापूर्ण वर्तमान काल (समय से चल रहा है)',
    category: 'Present',
    identificationHindi: 'से रहा है, से रही है, से रहे हैं + समय (Time) दिया होता है।',
    affirmativeFormula: 'Subject + has / have been + V1+ing + Object + since / for + time',
    negativeFormula: 'Subject + has / have not been + V1+ing + Object + since / for + time',
    interrogativeFormula: 'Has / Have + Subject + been + V1+ing + since / for + time?',
    examples: [
      { en: 'I have been studying English since morning.', hi: 'मैं सुबह से अंग्रेजी पढ़ रहा हूँ।' },
      { en: 'It has been raining for two hours.', hi: 'दो घंटे से बारिश हो रही है।' },
      { en: 'He has not been attending classes since Monday.', hi: 'वह सोमवार से कक्षाएं नहीं ले रहा है।' },
    ],
    mistakeToAvoid: 'नियम: निश्चित समय (Morning, 2024, Monday, 5 PM) के लिए "Since", और समय की अवधि (2 hours, 5 days, 3 years) के लिए "For" लगता है।',
    tip: 'Point of time = Since (सुबह, शाम, साल, वार); Duration of time = For (घंटे, दिन, महीने)।',
  },

  // PAST TENSES
  {
    id: 'past-simple',
    name: 'Simple Past (Past Indefinite)',
    hindiName: 'सामान्य भूतकाल (बीता हुआ काम)',
    category: 'Past',
    identificationHindi: 'क्रिया के अंत में आ, ई, ए, ता था, ती थी, ते थे आता है।',
    affirmativeFormula: 'Subject + V2 (2nd form) + Object',
    negativeFormula: 'Subject + did not + V1 + Object (Did के बाद हमेशा V1)',
    interrogativeFormula: 'Did + Subject + V1 + Object?',
    examples: [
      { en: 'I called you yesterday evening.', hi: 'मैंने कल शाम आपको फोन किया था।' },
      { en: 'She went to Delhi last week.', hi: 'वह पिछले हफ्ते दिल्ली गई थी।' },
      { en: 'He did not attend the lecture today.', hi: 'उसने आज व्याख्यान में भाग नहीं लिया।' },
      { en: 'Did you understand the question?', hi: 'क्या आपको प्रश्न समझ आया?' },
    ],
    mistakeToAvoid: 'बड़ी गलती: "Did you went there?" ❌ -> सही: "Did you go there?" ✅ (Did के साथ कभी 2nd form नहीं आती, हमेशा V1 आती है!)',
    tip: 'Affirmative में केवल V2 लगती है, negative व question में did के साथ हमेशा V1 लगती है।',
  },
  {
    id: 'past-continuous',
    name: 'Past Continuous',
    hindiName: 'अपूर्ण भूतकाल (भूतकाल में काम चल रहा था)',
    category: 'Past',
    identificationHindi: 'क्रिया के अंत में रहा था, रही थी, रहे थे आता है।',
    affirmativeFormula: 'Subject + was / were + V1+ing + Object',
    negativeFormula: 'Subject + was / were + not + V1+ing + Object',
    interrogativeFormula: 'Was / Were + Subject + V1+ing + Object?',
    examples: [
      { en: 'I was revising my notes when the power went out.', hi: 'जब बिजली गई तब मैं अपने नोट्स दोहरा रहा था।' },
      { en: 'Students were discussing the project.', hi: 'छात्र प्रोजेक्ट पर चर्चा कर रहे थे।' },
      { en: 'She was not driving fast.', hi: 'वह तेज़ गाड़ी नहीं चला रही थी।' },
    ],
    mistakeToAvoid: 'I/He/She/It/Singular के साथ Was, और You/We/They/Plural के साथ Were आता है।',
    tip: 'अतीत में किसी खास समय पर जो काम जारी था, उसके लिए Past Continuous प्रयोग होता है।',
  },
  {
    id: 'past-perfect',
    name: 'Past Perfect',
    hindiName: 'पूर्ण भूतकाल (काम पहले ही हो चुका था)',
    category: 'Past',
    identificationHindi: 'क्रिया के अंत में चुका था, चुकी थी, चुके थे, या था आता है।',
    affirmativeFormula: 'Subject + had + V3 (3rd form) + Object',
    negativeFormula: 'Subject + had not + V3 + Object',
    interrogativeFormula: 'Had + Subject + V3 + Object?',
    examples: [
      { en: 'The bus had already left before I reached the station.', hi: 'मेरे स्टेशन पहुँचने से पहले बस जा चुकी थी।' },
      { en: 'I had finished my revision before the test.', hi: 'मैंने टेस्ट से पहले अपना रिवीजन पूरा कर लिया था।' },
    ],
    mistakeToAvoid: 'नियम: जो काम भूतकाल में पहले हुआ उसमें Had + V3, और जो बाद में हुआ उसमें Simple Past (V2) आता है।',
    tip: 'सभी Subjects (I, He, She, They) के साथ केवल Had + V3 ही लगता है।',
  },
  {
    id: 'past-perfect-continuous',
    name: 'Past Perfect Continuous',
    hindiName: 'पूर्णापूर्ण भूतकाल',
    category: 'Past',
    identificationHindi: 'भूतकाल में किसी समय से काम चल रहा था (से रहा था + time)',
    affirmativeFormula: 'Subject + had been + V1+ing + Object + since / for + time',
    negativeFormula: 'Subject + had not been + V1+ing + Object + since / for + time',
    interrogativeFormula: 'Had + Subject + been + V1+ing + since / for + time?',
    examples: [
      { en: 'He had been preparing for the exam for six months.', hi: 'वह छह महीने से परीक्षा की तैयारी कर रहा था।' },
    ],
    mistakeToAvoid: 'समय का ध्यान रखें - निश्चित समय के लिए Since और समय सीमा के लिए For का ही प्रयोग करें।',
    tip: 'भूतकाल में किसी कार्य की निरंतर अवधि बताने के लिए उपयोग होता है।',
  },

  // FUTURE TENSES
  {
    id: 'future-simple',
    name: 'Simple Future (Future Indefinite)',
    hindiName: 'सामान्य भविष्यत् काल (आने वाला समय)',
    category: 'Future',
    identificationHindi: 'क्रिया के अंत में गा, गी, गे आता है।',
    affirmativeFormula: 'Subject + will + V1 (1st form) + Object',
    negativeFormula: 'Subject + will not (won\'t) + V1 + Object',
    interrogativeFormula: 'Will + Subject + V1 + Object?',
    examples: [
      { en: 'I will attend tomorrow\'s practical session.', hi: 'मैं कल के प्रैक्टिकल सत्र में शामिल होऊंगा।' },
      { en: 'The results will be declared next week.', hi: 'परिणाम अगले सप्ताह घोषित किए जाएंगे।' },
      { en: 'I will definitely help you with this project.', hi: 'मैं इस प्रोजेक्ट में निश्चित रूप से आपकी मदद करूंगा।' },
      { en: 'Will you join us for the group study?', hi: 'क्या आप हमारे साथ ग्रुप स्टडी में शामिल होंगे?' },
    ],
    mistakeToAvoid: 'गलती: "I will going tomorrow" ❌ -> सही: "I will go tomorrow" ✅ (Will के बाद हमेशा V1 आती है!)',
    tip: 'Modern English में सभी subjects के साथ "Will" पूरी तरह मान्य है।',
  },
  {
    id: 'future-continuous',
    name: 'Future Continuous',
    hindiName: 'अपूर्ण भविष्यत् काल (काम चल रहा होगा)',
    category: 'Future',
    identificationHindi: 'क्रिया के अंत में रहा होगा, रही होगी, रहे होंगे आता है।',
    affirmativeFormula: 'Subject + will be + V1+ing + Object',
    negativeFormula: 'Subject + will not be + V1+ing + Object',
    interrogativeFormula: 'Will + Subject + be + V1+ing + Object?',
    examples: [
      { en: 'I will be traveling to Mumbai this Sunday.', hi: 'मैं इस रविवार मुंबई की यात्रा कर रहा होऊंगा।' },
      { en: 'They will be writing the examination at this time tomorrow.', hi: 'वे कल इस समय परीक्षा लिख रहे होंगे।' },
    ],
    mistakeToAvoid: 'गलती: "Will be go" ❌ -> सही: "Will be going" ✅ (Be के बाद ing रूप आता है)',
    tip: 'भविष्य में किसी खास समय पर होने वाली निरंतर क्रिया के लिए प्रयोग करें।',
  },
  {
    id: 'future-perfect',
    name: 'Future Perfect',
    hindiName: 'पूर्ण भविष्यत् काल (काम हो चुका होगा)',
    category: 'Future',
    identificationHindi: 'क्रिया के अंत में चुका होगा, चुकी होगी, चुके होंगे आता है।',
    affirmativeFormula: 'Subject + will have + V3 + Object',
    negativeFormula: 'Subject + will not have + V3 + Object',
    interrogativeFormula: 'Will + Subject + have + V3 + Object?',
    examples: [
      { en: 'By 5 PM, I will have finished my syllabus.', hi: 'शाम 5 बजे तक, मैं अपना पाठ्यक्रम पूरा कर चुका होऊंगा।' },
    ],
    mistakeToAvoid: 'Will have के साथ हमेशा V3 (3rd form) ही आती है।',
    tip: 'भविष्य की किसी समय सीमा तक कार्य पूर्ण होने का अनुमान व्यक्त करने के लिए।',
  },
  {
    id: 'future-perfect-continuous',
    name: 'Future Perfect Continuous',
    hindiName: 'पूर्णापूर्ण भविष्यत् काल',
    category: 'Future',
    identificationHindi: 'भविष्य में किसी समय से कार्य जारी रहेगा (समय + से रहा होगा)',
    affirmativeFormula: 'Subject + will have been + V1+ing + Object + since/for + time',
    negativeFormula: 'Subject + will not have been + V1+ing + Object + since/for + time',
    interrogativeFormula: 'Will + Subject + have been + V1+ing + since/for + time?',
    examples: [
      { en: 'By next year, she will have been teaching here for 5 years.', hi: 'अगले साल तक, वह यहाँ 5 साल से पढ़ा रही होगी।' },
    ],
    mistakeToAvoid: 'यह लंबा टेंस है, ध्यान से will + have + been + ing का क्रम याद रखें।',
    tip: 'भविष्य के किसी बिंदु तक किसी क्रिया की निरंतरता दर्शाने के लिए।',
  },
];

export interface VerbDetail {
  v1: string; // Base / Present
  v2: string; // Past Simple
  v3: string; // Past Participle
  v4: string; // -ing (Continuous)
  v5: string; // -s/-es (3rd person singular)
  hindi: string; // Meaning in Hindi
  exampleEn: string;
  exampleHi: string;
  category: 'Daily Routine' | 'Irregular' | 'Academic & Work' | 'Action' | 'Common';
}

export const BUILTIN_VERBS: VerbDetail[] = [
  // 1-10
  { v1: 'write', v2: 'wrote', v3: 'written', v4: 'writing', v5: 'writes', hindi: 'लिखना', exampleEn: 'Please write your notes carefully.', exampleHi: 'कृपया अपने नोट्स ध्यानपूर्वक लिखें।', category: 'Academic & Work' },
  { v1: 'speak', v2: 'spoke', v3: 'spoken', v4: 'speaking', v5: 'speaks', hindi: 'बोलना', exampleEn: 'Always speak politely in class.', exampleHi: 'कक्षा में हमेशा विनम्रता से बोलें।', category: 'Common' },
  { v1: 'learn', v2: 'learnt', v3: 'learnt', v4: 'learning', v5: 'learns', hindi: 'सीखना', exampleEn: 'We are learning spoken English step by step.', exampleHi: 'हम कदम दर कदम स्पोकन इंग्लिश सीख रहे हैं।', category: 'Academic & Work' },
  { v1: 'teach', v2: 'taught', v3: 'taught', v4: 'teaching', v5: 'teaches', hindi: 'पढ़ाना / सिखाना', exampleEn: 'Sir taught us an important concept today.', exampleHi: 'सर ने आज हमें एक महत्वपूर्ण विषय पढ़ाया।', category: 'Academic & Work' },
  { v1: 'go', v2: 'went', v3: 'gone', v4: 'going', v5: 'goes', hindi: 'जाना', exampleEn: 'He went to college early this morning.', exampleHi: 'वह आज सुबह जल्दी कॉलेज गया था।', category: 'Daily Routine' },
  { v1: 'come', v2: 'came', v3: 'come', v4: 'coming', v5: 'comes', hindi: 'आना', exampleEn: 'Will you come to college tomorrow?', exampleHi: 'क्या तुम कल कॉलेज आओगे?', category: 'Daily Routine' },
  { v1: 'take', v2: 'took', v3: 'taken', v4: 'taking', v5: 'takes', hindi: 'लेना', exampleEn: 'Take this book and read chapter two.', exampleHi: 'यह किताब लो और दूसरा अध्याय पढ़ो।', category: 'Common' },
  { v1: 'give', v2: 'gave', v3: 'given', v4: 'giving', v5: 'gives', hindi: 'देना', exampleEn: 'The teacher gave clear instructions.', exampleHi: 'शिक्षक ने स्पष्ट निर्देश दिए।', category: 'Common' },
  { v1: 'understand', v2: 'understood', v3: 'understood', v4: 'understanding', v5: 'understands', hindi: 'समझना', exampleEn: 'Did you understand the formula?', exampleHi: 'क्या आपको सूत्र समझ आया?', category: 'Academic & Work' },
  { v1: 'read', v2: 'read', v3: 'read', v4: 'reading', v5: 'reads', hindi: 'पढ़ना', exampleEn: 'I read two newspaper articles daily.', exampleHi: 'मैं रोज़ाना दो समाचार पत्र के लेख पढ़ता हूँ।', category: 'Daily Routine' },

  // 11-20
  { v1: 'know', v2: 'knew', v3: 'known', v4: 'knowing', v5: 'knows', hindi: 'जानना / पता होना', exampleEn: 'Do you know where the library is?', exampleHi: 'क्या आप जानते हैं पुस्तकालय कहाँ है?', category: 'Common' },
  { v1: 'think', v2: 'thought', v3: 'thought', v4: 'thinking', v5: 'thinks', hindi: 'सोचना', exampleEn: 'I thought about your suggestion.', exampleHi: 'मैंने आपके सुझाव के बारे में सोचा।', category: 'Common' },
  { v1: 'see', v2: 'saw', v3: 'seen', v4: 'seeing', v5: 'sees', hindi: 'देखना', exampleEn: 'I saw the notice on the board.', exampleHi: 'मैंने नोटिस बोर्ड पर सूचना देखी।', category: 'Common' },
  { v1: 'hear', v2: 'heard', v3: 'heard', v4: 'hearing', v5: 'hears', hindi: 'सुनना', exampleEn: 'I heard the announcement clearly.', exampleHi: 'मैंने घोषणा स्पष्ट रूप से सुनी।', category: 'Common' },
  { v1: 'listen', v2: 'listened', v3: 'listened', v4: 'listening', v5: 'listens', hindi: 'ध्यान से सुनना', exampleEn: 'Listen to the audio clip attentively.', exampleHi: 'ऑडियो क्लिप को ध्यान से सुनें।', category: 'Academic & Work' },
  { v1: 'do', v2: 'did', v3: 'done', v4: 'doing', v5: 'does', hindi: 'करना', exampleEn: 'I have done all my assignments.', exampleHi: 'मैंने अपने सभी असाइनमेंट कर लिए हैं।', category: 'Common' },
  { v1: 'make', v2: 'made', v3: 'made', v4: 'making', v5: 'makes', hindi: 'बनाना', exampleEn: 'She made a wonderful presentation.', exampleHi: 'उसने एक शानदार प्रेजेंटेशन बनाई।', category: 'Common' },
  { v1: 'eat', v2: 'ate', v3: 'eaten', v4: 'eating', v5: 'eats', hindi: 'खाना', exampleEn: 'Have you eaten your lunch?', exampleHi: 'क्या तुमने दोपहर का खाना खा लिया है?', category: 'Daily Routine' },
  { v1: 'drink', v2: 'drank', v3: 'drunk', v4: 'drinking', v5: 'drinks', hindi: 'पीना', exampleEn: 'Drink plenty of water in summer.', exampleHi: 'गर्मियों में खूब पानी पिएं।', category: 'Daily Routine' },
  { v1: 'sleep', v2: 'slept', v3: 'slept', v4: 'sleeping', v5: 'sleeps', hindi: 'सोना', exampleEn: 'Try to sleep for at least seven hours.', exampleHi: 'कम से कम सात घंटे सोने का प्रयास करें।', category: 'Daily Routine' },

  // 21-30
  { v1: 'wake', v2: 'woke', v3: 'woken', v4: 'waking', v5: 'wakes', hindi: 'जागना / उठना', exampleEn: 'I wake up at 6:00 AM every day.', exampleHi: 'मैं रोज़ सुबह 6:00 बजे उठता हूँ।', category: 'Daily Routine' },
  { v1: 'buy', v2: 'bought', v3: 'bought', v4: 'buying', v5: 'buys', hindi: 'खरीदना', exampleEn: 'He bought a new dictionary yesterday.', exampleHi: 'उसने कल एक नई डिक्शनरी खरीदी।', category: 'Common' },
  { v1: 'bring', v2: 'brought', v3: 'brought', v4: 'bringing', v5: 'brings', hindi: 'लाना', exampleEn: 'Did you bring your identity card?', exampleHi: 'क्या आप अपना पहचान पत्र लाए हैं?', category: 'Daily Routine' },
  { v1: 'sell', v2: 'sold', v3: 'sold', v4: 'selling', v5: 'sells', hindi: 'बेचना', exampleEn: 'They sell stationery at reasonable prices.', exampleHi: 'वे उचित मूल्य पर स्टेशनरी बेचते हैं।', category: 'Common' },
  { v1: 'send', v2: 'sent', v3: 'sent', v4: 'sending', v5: 'sends', hindi: 'भेजना', exampleEn: 'I sent the PDF in the WhatsApp group.', exampleHi: 'मैंने व्हाट्सएप ग्रुप में पीडीएफ भेज दी।', category: 'Academic & Work' },
  { v1: 'receive', v2: 'received', v3: 'received', v4: 'receiving', v5: 'receives', hindi: 'प्राप्त करना / मिलना', exampleEn: 'I received the verification code.', exampleHi: 'मुझे सत्यापन कोड प्राप्त हुआ।', category: 'Academic & Work' },
  { v1: 'ask', v2: 'asked', v3: 'asked', v4: 'asking', v5: 'asks', hindi: 'पूछना', exampleEn: 'Feel free to ask any doubt.', exampleHi: 'कोई भी संदेह बिना झिझक पूछें।', category: 'Academic & Work' },
  { v1: 'tell', v2: 'told', v3: 'told', v4: 'telling', v5: 'tells', hindi: 'बताना / कहना', exampleEn: 'He told me about the meeting time.', exampleHi: 'उसने मुझे बैठक के समय के बारे में बताया।', category: 'Common' },
  { v1: 'say', v2: 'said', v3: 'said', v4: 'saying', v5: 'says', hindi: 'कहना', exampleEn: 'What did the principal say?', exampleHi: 'प्राचार्य जी ने क्या कहा?', category: 'Common' },
  { v1: 'call', v2: 'called', v3: 'called', v4: 'calling', v5: 'calls', hindi: 'बुलाना / फोन करना', exampleEn: 'I called him twice, but he did not answer.', exampleHi: 'मैंने उसे दो बार फोन किया, लेकिन उसने उत्तर नहीं दिया।', category: 'Daily Routine' },

  // 31-40
  { v1: 'begin', v2: 'began', v3: 'begun', v4: 'beginning', v5: 'begins', hindi: 'शुरू होना / करना', exampleEn: 'The examination begins at 10 AM.', exampleHi: 'परीक्षा सुबह 10 बजे शुरू होगी।', category: 'Academic & Work' },
  { v1: 'start', v2: 'started', v3: 'started', v4: 'starting', v5: 'starts', hindi: 'शुरू करना', exampleEn: 'Let us start the class now.', exampleHi: 'आइए अब कक्षा शुरू करते हैं।', category: 'Academic & Work' },
  { v1: 'finish', v2: 'finished', v3: 'finished', v4: 'finishing', v5: 'finishes', hindi: 'समाप्त करना / पूरा करना', exampleEn: 'Finish your work before lunch.', exampleHi: 'दोपहर के भोजन से पहले अपना काम समाप्त करें।', category: 'Academic & Work' },
  { v1: 'forget', v2: 'forgot', v3: 'forgotten', v4: 'forgetting', v5: 'forgets', hindi: 'भूलना', exampleEn: 'Do not forget to bring your lab coat.', exampleHi: 'अपना लैब कोट लाना न भूलें।', category: 'Daily Routine' },
  { v1: 'remember', v2: 'remembered', v3: 'remembered', v4: 'remembering', v5: 'remembers', hindi: 'याद रखना / याद आना', exampleEn: 'Always remember the key points.', exampleHi: 'हमेशा मुख्य बिंदुओं को याद रखें।', category: 'Academic & Work' },
  { v1: 'choose', v2: 'chose', v3: 'chosen', v4: 'choosing', v5: 'chooses', hindi: 'चुनना', exampleEn: 'You can choose between Hindi and English.', exampleHi: 'आप हिंदी और अंग्रेजी में से चुन सकते हैं।', category: 'Academic & Work' },
  { v1: 'break', v2: 'broke', v3: 'broken', v4: 'breaking', v5: 'breaks', hindi: 'तोड़ना / टूटना', exampleEn: 'Be careful, do not break the beaker.', exampleHi: 'सावधान रहें, बीकर को न तोड़ें।', category: 'Action' },
  { v1: 'build', v2: 'built', v3: 'built', v4: 'building', v5: 'builds', hindi: 'निर्माण करना / बनाना', exampleEn: 'We should build strong vocabulary daily.', exampleHi: 'हमें प्रतिदिन मजबूत शब्दावली बनानी चाहिए।', category: 'Common' },
  { v1: 'drive', v2: 'drove', v3: 'driven', v4: 'driving', v5: 'drives', hindi: 'गाड़ी चलाना', exampleEn: 'He drives safely on the highway.', exampleHi: 'वह हाईवे पर सुरक्षित गाड़ी चलाता है।', category: 'Daily Routine' },
  { v1: 'fall', v2: 'fell', v3: 'fallen', v4: 'falling', v5: 'falls', hindi: 'गिरना', exampleEn: 'Leaves fall from trees in autumn.', exampleHi: 'पतझड़ में पेड़ों से पत्तियां गिरती हैं।', category: 'Action' },

  // 41-55
  { v1: 'feel', v2: 'felt', v3: 'felt', v4: 'feeling', v5: 'feels', hindi: 'महसूस करना', exampleEn: 'I feel very confident in English now.', exampleHi: 'अब मुझे अंग्रेजी में बहुत आत्मविश्वास महसूस होता है।', category: 'Common' },
  { v1: 'find', v2: 'found', v3: 'found', v4: 'finding', v5: 'finds', hindi: 'ढूंढना / मिलना', exampleEn: 'I found my lost notebook in the hall.', exampleHi: 'मुझे हॉल में अपनी खोई हुई नोटबुक मिल गई।', category: 'Common' },
  { v1: 'fly', v2: 'flew', v3: 'flown', v4: 'flying', v5: 'flies', hindi: 'उड़ना / उड़ाना', exampleEn: 'Birds fly high in the morning sky.', exampleHi: 'सुबह के आकाश में पक्षी ऊंचे उड़ते हैं।', category: 'Action' },
  { v1: 'help', v2: 'helped', v3: 'helped', v4: 'helping', v5: 'helps', hindi: 'मदद करना', exampleEn: 'Thank you for helping me with this project.', exampleHi: 'इस प्रोजेक्ट में मेरी मदद करने के लिए धन्यवाद।', category: 'Common' },
  { v1: 'keep', v2: 'kept', v3: 'kept', v4: 'keeping', v5: 'keeps', hindi: 'रखना / जारी रखना', exampleEn: 'Keep practicing every day.', exampleHi: 'हर दिन अभ्यास जारी रखें।', category: 'Common' },
  { v1: 'leave', v2: 'left', v3: 'left', v4: 'leaving', v5: 'leaves', hindi: 'छोड़ना / रवाना होना', exampleEn: 'The bus leaves sharp at 8:30 AM.', exampleHi: 'बस ठीक 8:30 बजे रवाना होती है।', category: 'Daily Routine' },
  { v1: 'meet', v2: 'met', v3: 'met', v4: 'meeting', v5: 'meets', hindi: 'मिलना', exampleEn: 'Let us meet after the lecture.', exampleHi: 'आइए व्याख्यान के बाद मिलते हैं।', category: 'Daily Routine' },
  { v1: 'pay', v2: 'paid', v3: 'paid', v4: 'paying', v5: 'pays', hindi: 'भुगतान करना / चुकाना', exampleEn: 'Pay attention to the teacher\'s pronunciation.', exampleHi: 'शिक्षक के उच्चारण पर ध्यान दें।', category: 'Academic & Work' },
  { v1: 'run', v2: 'ran', v3: 'run', v4: 'running', v5: 'runs', hindi: 'दौड़ना / चलाना', exampleEn: 'He ran fast to catch the morning train.', exampleHi: 'वह सुबह की ट्रेन पकड़ने के लिए तेज़ दौड़ा।', category: 'Action' },
  { v1: 'show', v2: 'showed', v3: 'shown', v4: 'showing', v5: 'shows', hindi: 'दिखाना / प्रदर्शित करना', exampleEn: 'Show me your progress report.', exampleHi: 'मुझे अपनी प्रगति रिपोर्ट दिखाएं।', category: 'Academic & Work' },
  { v1: 'sit', v2: 'sat', v3: 'sat', v4: 'sitting', v5: 'sits', hindi: 'बैठना', exampleEn: 'Please sit in your assigned seat.', exampleHi: 'कृपया अपने निर्धारित स्थान पर बैठें।', category: 'Daily Routine' },
  { v1: 'stand', v2: 'stood', v3: 'stood', v4: 'standing', v5: 'stands', hindi: 'खड़े होना', exampleEn: 'Please stand up when answering questions.', exampleHi: 'प्रश्नों का उत्तर देते समय कृपया खड़े हों।', category: 'Daily Routine' },
  { v1: 'wear', v2: 'wore', v3: 'worn', v4: 'wearing', v5: 'wears', hindi: 'पहनना', exampleEn: 'Always wear college uniform on Mondays.', exampleHi: 'सोमवार को हमेशा कॉलेज यूनिफॉर्म पहनें।', category: 'Daily Routine' },
  { v1: 'win', v2: 'won', v3: 'won', v4: 'winning', v5: 'wins', hindi: 'जीतना', exampleEn: 'Our team won the debate competition.', exampleHi: 'हमारी टीम ने वाद-विवाद प्रतियोगिता जीती।', category: 'Action' },
  { v1: 'work', v2: 'worked', v3: 'worked', v4: 'working', v5: 'works', hindi: 'काम करना / मेहनत करना', exampleEn: 'Hard work always leads to success.', exampleHi: 'कड़ी मेहनत हमेशा सफलता की ओर ले जाती है।', category: 'Academic & Work' },
];

export interface DailySentence {
  en: string;
  hi: string;
  category: 'Daily Routine' | 'College & Class' | 'Polite & Etiquette' | 'Travel & Market' | 'Confidence & Fluency';
  contextTip?: string;
}

export const BUILTIN_SENTENCES: DailySentence[] = [
  // College & Class
  { en: 'Could you please explain this concept once again?', hi: 'क्या आप कृपया यह विषय एक बार फिर समझा सकते हैं?', category: 'College & Class', contextTip: 'शिक्षक से दोबारा समझने का सबसे विनम्र तरीका' },
  { en: 'Excuse me sir, may I come in?', hi: 'माफ़ कीजियेगा सर, क्या मैं अंदर आ सकता हूँ?', category: 'College & Class' },
  { en: 'When is the last date to submit the assignment?', hi: 'असाइनमेंट जमा करने की अंतिम तिथि कब है?', category: 'College & Class' },
  { en: 'I could not attend class yesterday because of illness.', hi: 'मैं कल अस्वस्थता के कारण कक्षा में उपस्थित नहीं हो सका।', category: 'College & Class' },
  { en: 'Could you please share your class notes with me?', hi: 'क्या आप कृपया अपने क्लास नोट्स मेरे साथ साझा कर सकते हैं?', category: 'College & Class' },
  { en: 'What is the syllabus for the upcoming unit test?', hi: 'आगामी यूनिट टेस्ट का सिलेबस क्या है?', category: 'College & Class' },
  { en: 'I have a quick doubt in question number three.', hi: 'मुझे प्रश्न संख्या तीन में एक छोटा सा संदेह है।', category: 'College & Class' },
  { en: 'Shall we discuss this in the library after class?', hi: 'क्या हम क्लास के बाद लाइब्रेरी में इस पर चर्चा करें?', category: 'College & Class' },

  // Daily Routine
  { en: 'I am getting ready for college right now.', hi: 'मैं अभी कॉलेज के लिए तैयार हो रहा हूँ।', category: 'Daily Routine' },
  { en: 'What time does the morning assembly begin?', hi: 'सुबह की प्रार्थना कितने बजे शुरू होती है?', category: 'Daily Routine' },
  { en: 'I have to wake up early tomorrow morning.', hi: 'मुझे कल सुबह जल्दी उठना होगा।', category: 'Daily Routine' },
  { en: 'Let us have lunch together today.', hi: 'आइए आज साथ में दोपहर का भोजन करते हैं।', category: 'Daily Routine' },
  { en: 'My phone battery is about to die; let me charge it.', hi: 'मेरे फोन की बैटरी खत्म होने वाली है, मुझे इसे चार्ज करने दें।', category: 'Daily Routine' },
  { en: 'I will call you back in five minutes.', hi: 'मैं आपको पाँच मिनट में वापस कॉल करता हूँ।', category: 'Daily Routine' },

  // Polite & Etiquette
  { en: 'Thank you very much for your kind support.', hi: 'आपके सहृदय सहयोग के लिए बहुत-बहुत धन्यवाद।', category: 'Polite & Etiquette' },
  { en: 'I sincerely apologize for the delay.', hi: 'देरी के लिए मैं ईमानदारी से क्षमा चाहता हूँ।', category: 'Polite & Etiquette' },
  { en: 'Would you mind if I open the window?', hi: 'यदि मैं खिड़की खोल दूँ तो आपको कोई आपत्ति तो नहीं होगी?', category: 'Polite & Etiquette', contextTip: 'अत्यंत सभ्य और प्रभावशाली वाक्य' },
  { en: 'It is a pleasure to meet you.', hi: 'आपसे मिलकर बहुत खुशी हुई।', category: 'Polite & Etiquette' },
  { en: 'Please take your time, there is no hurry.', hi: 'कृपया अपना समय लें, कोई जल्दबाजी नहीं है।', category: 'Polite & Etiquette' },
  { en: 'I appreciate your timely help.', hi: 'समय पर आपकी मदद की मैं सराहना करता हूँ।', category: 'Polite & Etiquette' },

  // Travel & Market
  { en: 'How much does this textbook cost?', hi: 'इस पाठ्यपुस्तक की कीमत कितनी है?', category: 'Travel & Market' },
  { en: 'Which bus goes directly to the university campus?', hi: 'कौन सी बस सीधे विश्वविद्यालय परिसर जाती है?', category: 'Travel & Market' },
  { en: 'Is this seat occupied or can I sit here?', hi: 'क्या यह सीट आरक्षित है या मैं यहाँ बैठ सकता हूँ?', category: 'Travel & Market' },
  { en: 'Could you please tell me the way to the railway station?', hi: 'क्या आप कृपया मुझे रेलवे स्टेशन का रास्ता बता सकते हैं?', category: 'Travel & Market' },
  { en: 'Do you accept UPI or online payments here?', hi: 'क्या आप यहाँ यूपीआई या ऑनलाइन भुगतान स्वीकार करते हैं?', category: 'Travel & Market' },

  // Confidence & Fluency
  { en: 'Don\'t hesitate to speak, practice makes you perfect.', hi: 'बोलने में संकोच न करें, अभ्यास ही आपको निपुण बनाता है।', category: 'Confidence & Fluency' },
  { en: 'In my opinion, continuous effort is the key to fluency.', hi: 'मेरी राय में, निरंतर प्रयास ही धाराप्रवाह बोलने की कुंजी है।', category: 'Confidence & Fluency' },
  { en: 'I am working hard to improve my communication skills.', hi: 'मैं अपने संचार कौशल को सुधारने के लिए कड़ी मेहनत कर रहा हूँ।', category: 'Confidence & Fluency' },
  { en: 'Everything will be fine if you stay consistent.', hi: 'यदि आप नियमित रहेंगे तो सब कुछ ठीक हो जाएगा।', category: 'Confidence & Fluency' },
];

export interface GrammarRule {
  title: string;
  hindiTitle: string;
  category: 'Modals' | 'Prepositions' | 'Common Mistakes' | 'Vocabulary';
  ruleFormula: string;
  hindiExplanation: string;
  examples: Array<{ en: string; hi: string; note?: string }>;
}

export const BUILTIN_GRAMMAR_RULES: GrammarRule[] = [
  {
    title: 'Can vs Could (सकना / क्षमता)',
    hindiTitle: 'Can और Could का सही प्रयोग',
    category: 'Modals',
    ruleFormula: 'Can = Present Ability / Casual Request; Could = Past Ability / Polite Request',
    hindiExplanation: 'वर्तमान क्षमता के लिए "Can" और विनम्र निवेदन या भूतकाल की क्षमता के लिए "Could" का प्रयोग करें।',
    examples: [
      { en: 'I can speak three languages fluently.', hi: 'मैं तीन भाषाएँ धाराप्रवाह बोल सकता हूँ। (Present ability)' },
      { en: 'Could you please lend me your pen for a minute?', hi: 'क्या आप कृपया एक मिनट के लिए मुझे अपना पेन दे सकते हैं? (Polite request)' },
      { en: 'When I was ten, I could run very fast.', hi: 'जब मैं दस साल का था, तब मैं बहुत तेज़ दौड़ सकता था। (Past ability)' },
    ],
  },
  {
    title: 'Should vs Must (चाहिए / अवश्य चाहिए)',
    hindiTitle: 'Should और Must का अंतर',
    category: 'Modals',
    ruleFormula: 'Should + V1 = सलाह (Advice); Must + V1 = अनिवार्यता / कानून (Obligation)',
    hindiExplanation: 'सलाह देने के लिए Should और सख्त नियम या अनिवार्यता के लिए Must लगता है।',
    examples: [
      { en: 'You should read English newspapers daily.', hi: 'आपको रोज़ अंग्रेजी अख़बार पढ़ना चाहिए। (सलाह)' },
      { en: 'Students must carry their college ID card.', hi: 'छात्रों को कॉलेज आईडी कार्ड साथ रखना ही होगा। (अनिवार्य)' },
    ],
  },
  {
    title: 'In vs On vs At (Prepositions of Time & Place)',
    hindiTitle: 'In, On और At का सही नियम',
    category: 'Prepositions',
    ruleFormula: 'At = Exact time & specific spot; On = Days & Dates & Surfaces; In = Months, Years, Cities & Enclosed spaces',
    hindiExplanation: 'समय: At 5 PM, On Monday, In July, In 2024. स्थान: At the bus stop, On the table, In Mumbai.',
    examples: [
      { en: 'The lecture begins at 9:00 AM on Monday.', hi: 'व्याख्यान सोमवार को सुबह 9:00 बजे शुरू होता है।' },
      { en: 'My birthday falls in December.', hi: 'मेरा जन्मदिन दिसंबर में आता है।' },
      { en: 'The book is lying on the table.', hi: 'किताब मेज पर रखी है।' },
    ],
  },
  {
    title: 'Since vs For (समय बताने के लिए)',
    hindiTitle: 'Since और For का नियम',
    category: 'Prepositions',
    ruleFormula: 'Since + Point of Time (निश्चित बिंदु); For + Period / Duration of Time (समय की अवधि)',
    hindiExplanation: 'Since 2021, Since morning, Since Monday. For 2 hours, For 5 days, For 3 years.',
    examples: [
      { en: 'She has been living in Jaipur since 2018.', hi: 'वह 2018 से जयपुर में रह रही है।' },
      { en: 'He has been practicing English for two months.', hi: 'वह दो महीने से अंग्रेजी का अभ्यास कर रहा है।' },
    ],
  },
  {
    title: 'Say vs Tell (कहना vs बताना)',
    hindiTitle: 'Say और Tell की आम गलतियाँ',
    category: 'Common Mistakes',
    ruleFormula: 'Say (बिना व्यक्ति के नाम के); Tell + Person (किसको बताया)',
    hindiExplanation: 'हम "He said to me" या "He told me" बोलते हैं। कभी भी "He told that" नहीं बोलते, "He said that" बोलते हैं।',
    examples: [
      { en: 'He said that he was busy.', hi: 'उसने कहा कि वह व्यस्त था। (सही)' },
      { en: 'He told me that he was busy.', hi: 'उसने मुझे बताया कि वह व्यस्त था। (सही)' },
    ],
  },
];
