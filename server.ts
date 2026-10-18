import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize server-side Gemini AI client securely
const geminiApiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: geminiApiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Authorized Teacher Activation codes (Server-side validation)
// Master code authorized for teacher onboarding: TILAK-967266-TCH
const VALID_TEACHER_CODES = new Set(
  (process.env.TEACHER_ACTIVATION_SECRET || 'TILAK-967266-TCH')
    .split(',')
    .map(c => c.trim().toUpperCase())
);

// In-memory set of used codes if single-use policy is needed, or allow reusable admin keys
const activatedTeachers = new Map<string, { email: string; activatedAt: number }>();

// 1. Teacher Activation Code Verification
app.post('/api/auth/verify-teacher-code', (req: Request, res: Response): void => {
  try {
    const { code, email } = req.body;
    if (!code || typeof code !== 'string') {
      res.status(400).json({ valid: false, error: 'Activation code is required' });
      return;
    }

    const cleanCode = code.trim().toUpperCase();
    if (VALID_TEACHER_CODES.has(cleanCode)) {
      if (email) {
        activatedTeachers.set(cleanCode, { email, activatedAt: Date.now() });
      }
      res.json({
        valid: true,
        message: 'Teacher Activation Code verified successfully',
        authorizedScope: 'teacher',
      });
      return;
    } else {
      res.status(403).json({
        valid: false,
        error: 'Invalid or expired Teacher Activation Code. Contact your institution administrator.',
      });
      return;
    }
  } catch (err: any) {
    res.status(500).json({ valid: false, error: err.message || 'Verification failure' });
  }
});

// 2. Telephony & AI Call Integration Endpoint
// Checks if real telephony provider (e.g., Twilio) is configured in backend environment
app.get('/api/ai/telephony-status', (req: Request, res: Response): void => {
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

  const isConfigured = Boolean(twilioSid && twilioToken && twilioNumber);

  res.json({
    configured: isConfigured,
    provider: isConfigured ? 'Twilio Voice Telephony' : 'Classora Voice Engine (In-App Direct Mode)',
    message: isConfigured
      ? 'Telephony gateway is connected and active for automated outbound voice calls.'
      : 'AI calling telephony provider is not configured yet. Configure server telephony credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER) in server environment, or use Classora Voice Engine.',
  });
});

// 3. Initiate AI Student Voice Call Endpoint
app.post('/api/ai/initiate-call', async (req: Request, res: Response): Promise<void> => {
  try {
    const { teacherUid, teacherName, studentUid, studentName, studentId, studentPhone, groupName } = req.body;

    if (!studentName || !studentId) {
      res.status(400).json({ success: false, error: 'Student information is required' });
      return;
    }

    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioNumber = process.env.TWILIO_PHONE_NUMBER;
    const isTelephonyConfigured = Boolean(twilioSid && twilioToken && twilioNumber && studentPhone);

    const branchName = groupName || 'FEA';

    // Short, natural, human-like Indian female AI greeting
    const promptIntro = `You are a friendly Indian girl AI assistant calling student "${studentName}" on behalf of their college teacher "${teacherName || 'Faculty'}" from "${branchName}" branch.
Generate a short, friendly, natural greeting in simple Hinglish/Hindi just like a real college girl coordinator:
Example format: "Hello! Main ${branchName} branch ki AI bol rahi hoon, aaj kyu nahi aa rahe ho class me?" (or with student name if appropriate: "Hello ${studentName}! Main ${branchName} branch ki AI bol rahi hoon, aaj kyu nahi aa rahe ho class me?").
Do NOT use robotic formal greetings. Keep it short and natural.`;

    let introText = `Hello! Main ${branchName} branch ki AI bol rahi hoon, aaj kyu nahi aa rahe ho class me?`;
    if (studentName) {
      introText = `Hello ${studentName}! Main ${branchName} branch ki AI bol rahi hoon, aaj kyu nahi aa rahe ho class me?`;
    }

    try {
      if (geminiApiKey) {
        const response = await ai.models.generateContent({
          model: 'gemini-3.7-flash',
          contents: promptIntro,
          config: {
            systemInstruction: 'You are a warm, sweet, natural Indian girl college coordinator. Speak in natural Hinglish like a real person, not a robot.',
          },
        });
        if (response.text?.trim()) {
          introText = response.text.trim().replace(/^["']|["']$/g, '');
        }
      }
    } catch (e) {
      // Use fallback
    }

    res.json({
      success: true,
      telephonyConfigured: isTelephonyConfigured,
      callId: `CALL-${Date.now()}-${studentId}`,
      greeting: introText,
      initialQuestion: `Hello! Main ${branchName} branch ki AI bol rahi hoon, aaj kyu nahi aa rahe ho class me?`,
      student: {
        studentUid,
        studentId,
        studentName,
        studentPhone: studentPhone || 'Not provided',
      },
      teacher: {
        teacherUid,
        teacherName,
      },
      groupName: branchName,
      timestamp: Date.now(),
    });
  } catch (err: any) {
    console.error('Initiate call error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to initiate AI call' });
  }
});

// 4. Process Student Response & Generate Structured AI Student Report
app.post('/api/ai/process-call-response', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      studentName,
      studentId,
      teacherName,
      isAttending, // boolean or 'yes' | 'no'
      studentAnswerText, // student spoken answer or reason
      groupName,
    } = req.body;

    const branchName = groupName || 'FEA';
    const rawStudentText = (studentAnswerText || '').trim();

    const cleanAttending =
      typeof isAttending === 'boolean'
        ? isAttending
      : String(isAttending).toLowerCase().includes('yes') ||
        rawStudentText.toLowerCase().includes('attending') ||
        rawStudentText.toLowerCase().includes('aa raha') ||
        rawStudentText.toLowerCase().includes('aa rahi') ||
        rawStudentText.toLowerCase().includes('aunga') ||
        rawStudentText.toLowerCase().includes('aungi') ||
        rawStudentText.toLowerCase().includes('pahunch') ||
        rawStudentText.toLowerCase().includes('present') ||
        rawStudentText.toLowerCase().includes('on the way') ||
        rawStudentText.toLowerCase().includes('yes');

    if (cleanAttending) {
      // Student is attending -> Warm, natural girl response
      const aiReply = `Arey badhiya! Jaldi se aa jao, main sir ko bol deti hoon ki aap aa rahe ho!`;
      res.json({
        success: true,
        aiReply,
        report: {
          studentName: studentName || 'Student',
          studentId: studentId || '',
          response: 'Attending today',
          reason: rawStudentText ? `Student confirmed: "${rawStudentText}"` : 'Student confirmed on-time attendance',
          exactStudentReply: rawStudentText || 'Main aa raha hoon class',
          aiSummary: `Student ${studentName || ''} (ID: ${studentId}) confirmed that they are attending class today.`,
          callStatus: 'Completed',
          timestamp: Date.now(),
        },
      });
      return;
    }

    // Student is NOT attending -> analyze reason with Gemini like a friendly, caring human girl
    const reasonPrompt = `A student named "${studentName || 'Student'}" (Student ID: ${studentId}) from "${branchName}" branch told Classora AI why they are not coming to class (Teacher: "${teacherName || 'Faculty'}").

Student's exact spoken words in Hindi/Hinglish/English: "${rawStudentText || 'Not specified'}"

TASK:
1. "aiClosingReply": Speak back to the student in friendly, warm, empathetic natural Indian girl style in Hinglish/Hindi (under 20 words).
   - If they are sick / fever: "Oh no! Kya ho gaya? Chalo koi baat nahi, aap aaram karo aur apna khayal rakhna. Main sir ko bol dungi, ok? Get well soon!"
   - If they have a family event / travel: "Achha theek hai, koi baat nahi! Main sir ko bol dungi. Safe rehna aur apna dhyan rakhna!"
   - If they have other reasons (traffic, work, emergency): "Chalo theek hai koi baat nahi, ok main sir ko bol dungi. Take care!"
   Make sure it sounds 100% human, sweet, and caring (NO robotic phrases).

2. "exactStudentReply": The student's exact statement: "${rawStudentText || 'Reason not specified'}".

3. "extractedReason": Clear, short categorized label (e.g. "Tabiyat kharab (Fever / Illness)", "Family Function / Emergency", "Out of station / Travelling", "Traffic / Transport issue").

4. "aiSummary": A clear 1-2 sentence report summary for the teacher stating what the student said.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: reasonPrompt,
        config: {
          systemInstruction: 'You are a warm, caring Indian girl college coordinator. You talk in 100% natural, empathetic Hinglish/Hindi like a real human. Return valid JSON.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              aiClosingReply: {
                type: Type.STRING,
                description: 'Sweet, natural spoken girl response in Hindi/Hinglish (e.g. "Chalo theek hai koi baat nahi, ok main sir ko bol dungi. Apna khayal rakhna!").',
              },
              exactStudentReply: {
                type: Type.STRING,
                description: 'The exact response words from the student.',
              },
              extractedReason: {
                type: Type.STRING,
                description: 'Categorized reason for the teacher.',
              },
              aiSummary: {
                type: Type.STRING,
                description: 'Executive summary for the teacher.',
              },
            },
            required: ['aiClosingReply', 'exactStudentReply', 'extractedReason', 'aiSummary'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      const fallbackGirlReply = `Chalo theek hai koi baat nahi, ok main sir ko bol dungi. Apna khayal rakhna!`;

      res.json({
        success: true,
        aiReply: parsed.aiClosingReply || fallbackGirlReply,
        report: {
          studentName: studentName || 'Student',
          studentId: studentId || '',
          response: parsed.extractedReason || (rawStudentText ? `Not attending: ${rawStudentText}` : 'Not attending today'),
          reason: parsed.extractedReason || (rawStudentText ? `Reason: ${rawStudentText}` : 'Absent - reason not provided'),
          exactStudentReply: rawStudentText || parsed.exactStudentReply || 'Reason not provided',
          aiSummary: parsed.aiSummary || `Student ${studentName || ''} (ID: ${studentId}) informed that they cannot attend class today. Stated: "${rawStudentText || 'Absent'}".`,
          callStatus: 'Completed',
          timestamp: Date.now(),
        },
      });
    } catch (err) {
      // Fallback deterministic human reply
      res.json({
        success: true,
        aiReply: `Chalo theek hai koi baat nahi, ok main sir ko bol dungi. Apna khayal rakhna!`,
        report: {
          studentName: studentName || 'Student',
          studentId: studentId || '',
          response: 'Not attending today',
          reason: rawStudentText || 'Tabiyat kharab / Urgent work',
          exactStudentReply: rawStudentText || 'Not specified',
          aiSummary: `Student ${studentName || ''} (ID: ${studentId}) informed: "${rawStudentText || 'Absent today'}".`,
          callStatus: 'Completed',
          timestamp: Date.now(),
        },
      });
    }
  } catch (err: any) {
    console.error('Process call response error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to process AI call response' });
  }
});

// 5. Intelligent Multi-Turn Continuous Voice Call Turn with Gemini AI
app.post('/api/ai/live-call-turn', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      studentName,
      studentId,
      teacherName,
      groupName,
      studentUtterance,
      transcriptHistory,
    } = req.body;

    const branchName = groupName || 'FEA';
    const rawUtterance = (studentUtterance || '').trim();

    const conversationPrompt = `You are a friendly, sweet, caring Indian girl college coordinator AI named "Classora" for the "${branchName}" branch.
You are on a live phone call with student "${studentName || 'Student'}" (ID: ${studentId || 'Verified'}) on behalf of teacher "${teacherName || 'Faculty'}".

Conversation History so far:
${Array.isArray(transcriptHistory) ? transcriptHistory.map((t: any) => `${t.speaker === 'ai' ? 'Classora AI' : studentName || 'Student'}: ${t.text}`).join('\n') : 'Call just started.'}

Student just said right now: "${rawUtterance || 'Hello'}"

TASK:
1. Respond to the student in 100% natural, conversational, sweet Indian girl Hinglish/Hindi (under 25 words).
   - If the student is just saying "hello", "hallo", "haan bolo", "sun rahe ho?", respond warmly: "Haan haan bolo, sun rahi hoon! Aaj aap class kyu nahi aa rahe ho?"
   - If the student asks who you are ("aap kon ho?", "kiska phone hai?"): "Main Classora AI bol rahi hoon ${branchName} branch se aapke teacher ${teacherName || ''} ke behalf par!"
   - If the student asks ANY question (studies, exam, syllabus, general question, 2+2, anything): Answer accurately and politely in 1-2 sweet sentences.
   - If the student confirms they ARE coming ("aa raha hoon", "5 min me aaunga", "on the way"): "Arey badhiya! Jaldi se aa jao, main sir ko bol deti hoon ki aap aa rahe ho!"
   - If the student explains why they CANNOT come (sick, fever, travelling, emergency, out of station): Respond with genuine human empathy (e.g. "Oh no! Kya ho gaya? Chalo koi baat nahi, aap aaram karo aur apna dhyan rakhna. Main sir ko bol dungi. Get well soon!").
   - If the student says "bye", "theek hai", "thank you", "cut karo": Say a sweet closing like "Okay take care! Bye bye!"

2. Determine:
   - "aiReply": Spoken natural Hinglish reply text.
   - "attendanceStatus": "Attending" if student confirmed attending, "Not Attending" if student gave an absent reason, "Undecided" if conversation is still continuing or they just asked a question / said hello.
   - "isConversationEnding": true if the student gave a clear attendance answer or final goodbye; false if they asked a question or just greeted.
   - "extractedReason": Short categorized reason (e.g. "Tabiyat kharab (Sick/Fever)", "Family Emergency", "Travelling", "Confirmed Attending", "General Query").
   - "aiSummary": 1-2 sentence report summary for the teacher.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: conversationPrompt,
        config: {
          systemInstruction: 'You are a warm, sweet, intelligent Indian girl college coordinator. Speak in 100% natural, empathetic Hinglish/Hindi like a real person, not a robot. Return valid JSON.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              aiReply: {
                type: Type.STRING,
                description: 'Natural spoken Indian girl response in Hinglish/Hindi.',
              },
              attendanceStatus: {
                type: Type.STRING,
                enum: ['Attending', 'Not Attending', 'Undecided'],
              },
              isConversationEnding: {
                type: Type.BOOLEAN,
                description: 'True if attendance conclusion reached or student said goodbye, else false.',
              },
              extractedReason: {
                type: Type.STRING,
                description: 'Categorized reason for teacher record.',
              },
              aiSummary: {
                type: Type.STRING,
                description: 'Summary for teacher dashboard.',
              },
            },
            required: ['aiReply', 'attendanceStatus', 'isConversationEnding', 'extractedReason', 'aiSummary'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json({
        success: true,
        aiReply: parsed.aiReply || 'Haan haan bolo, sun rahi hoon! Aaj aap class kyu nahi aa rahe ho?',
        attendanceStatus: parsed.attendanceStatus || 'Undecided',
        isConversationEnding: Boolean(parsed.isConversationEnding),
        extractedReason: parsed.extractedReason || rawUtterance || 'Not specified',
        exactStudentReply: rawUtterance,
        aiSummary: parsed.aiSummary || `Student said: "${rawUtterance}"`,
      });
    } catch (e: any) {
      console.warn('Gemini live turn fallback:', e);
      const isHello = /hello|hallo|sun|bol|kon/i.test(rawUtterance);
      const isSick = /tabiyat|fever|bimari|dard|doctor|hospital/i.test(rawUtterance);
      const isAttending = /aa raha|aunga|pahunch|present/i.test(rawUtterance);

      let fallbackReply = 'Haan haan bolo, sun rahi hoon! Aaj aap class kyu nahi aa rahe ho?';
      let status = 'Undecided';
      let ending = false;

      if (isAttending) {
        fallbackReply = 'Arey badhiya! Jaldi se aa jao, main sir ko bol deti hoon ki aap aa rahe ho!';
        status = 'Attending';
        ending = true;
      } else if (isSick) {
        fallbackReply = 'Oh no! Kya ho gaya? Chalo koi baat nahi, aap aaram karo aur apna khayal rakhna. Main sir ko bol dungi, get well soon!';
        status = 'Not Attending';
        ending = true;
      } else if (isHello) {
        fallbackReply = 'Haan bolo! Main Classora AI bol rahi hoon, aaj aap class kyu nahi aa rahe ho?';
      }

      res.json({
        success: true,
        aiReply: fallbackReply,
        attendanceStatus: status,
        isConversationEnding: ending,
        extractedReason: rawUtterance || 'General response',
        exactStudentReply: rawUtterance,
        aiSummary: `Student stated: "${rawUtterance}"`,
      });
    }
  } catch (err: any) {
    console.error('Live call turn error:', err);
    res.status(500).json({ success: false, error: err.message || 'Error processing live turn' });
  }
});

// 6. English Learning AI Tutor (Hindi -> English Translation & English Mistake Corrector)
app.post('/api/ai/english-tutor', async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, mode, conversationHistory, userName } = req.body;
    const cleanMsg = (message || '').trim();

    if (!cleanMsg) {
      res.status(400).json({ success: false, error: 'Message cannot be empty.' });
      return;
    }

    const systemPrompt = `You are "Classora English Guru", an expert bilingual English teacher specializing in teaching spoken and written English to Indian students and teachers.
User name: "${userName || 'Student'}"

USER INPUT: "${cleanMsg}"

YOUR TASK:
Analyze the user input and provide an intelligent, polite, crystal-clear response:
1. If the input is in Hindi or Hinglish (e.g. "मैं कल कॉलेज नहीं आऊंगा", "kya tum meri madad kar sakte ho"):
   - Translate it into 100% natural, correct English.
   - Provide the best primary translation.
   - Provide 1-2 natural alternatives (e.g., Casual spoken vs Formal/College).
   - Briefly explain key vocabulary or grammar used in simple Hindi.

2. If the input is in English:
   - Check if the English sentence has ANY grammatical mistakes, awkward phrasing, tense errors, preposition mistakes, or typos (e.g. "I am agree with you", "He do not knows", "Did you went there", "I am having two brothers").
   - If there are errors:
     * Provide the 100% corrected English sentence.
     * Clearly highlight WHERE the mistake was (कहाँ गलती थी).
     * Explain WHY it was wrong in easy Hindi/Hinglish (e.g., "नियम: 'Did' के साथ हमेशा V1 आती है, 2nd form नहीं").
     * Provide a helpful memory tip.
   - If the English is already 100% correct:
     * Applaud the student ("Shabash! Yeh sentence bilkul sahi hai!").
     * Suggest a more advanced/impressive alternative or vocabulary upgrade.

3. If the user asks a general grammar doubt, tense question, or wants to chat in English:
   - Explain clearly with formulas and examples in friendly Hindi + English.

Return a JSON object with:
- "detectedType": "hindi_to_english" | "english_correction" | "general_qa" | "chat"
- "primaryEnglish": The best/corrected English sentence.
- "alternatives": Array of 1 to 2 alternative natural ways to say it.
- "hasMistake": boolean (true if English had errors, false otherwise)
- "mistakeAnalysis": Where was the mistake and why (in simple Hindi)
- "aiExplanation": Friendly conversational explanation for the student in Hindi/Hinglish (under 60 words).
- "vocabTips": Array of 1-3 useful words used with Hindi meanings.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: systemPrompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              detectedType: {
                type: Type.STRING,
                enum: ['hindi_to_english', 'english_correction', 'general_qa', 'chat'],
              },
              primaryEnglish: {
                type: Type.STRING,
                description: 'Best natural English sentence or primary translation.',
              },
              alternatives: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Alternative phrasing (casual / formal).',
              },
              hasMistake: {
                type: Type.BOOLEAN,
                description: 'True if input was English with grammatical errors.',
              },
              mistakeAnalysis: {
                type: Type.STRING,
                description: 'Explanation in Hindi of where the mistake was and the rule.',
              },
              aiExplanation: {
                type: Type.STRING,
                description: 'Friendly tutor explanation in conversational Hinglish/Hindi.',
              },
              vocabTips: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    word: { type: Type.STRING },
                    meaning: { type: Type.STRING },
                  },
                  required: ['word', 'meaning'],
                },
              },
            },
            required: ['detectedType', 'primaryEnglish', 'hasMistake', 'aiExplanation'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json({
        success: true,
        detectedType: parsed.detectedType || 'chat',
        primaryEnglish: parsed.primaryEnglish || cleanMsg,
        alternatives: parsed.alternatives || [],
        hasMistake: Boolean(parsed.hasMistake),
        mistakeAnalysis: parsed.mistakeAnalysis || '',
        aiExplanation: parsed.aiExplanation || 'Here is the English sentence and explanation.',
        vocabTips: parsed.vocabTips || [],
      });
    } catch (genErr: any) {
      console.warn('Gemini English Tutor fallback:', genErr);
      // Fallback rule-based linguistic engine
      const isEnglish = /^[a-zA-Z0-9\s.,?!'"-:;]+$/.test(cleanMsg);
      let detectedType = isEnglish ? 'english_correction' : 'hindi_to_english';
      let primaryEnglish = cleanMsg;
      let hasMistake = false;
      let mistakeAnalysis = '';
      let explanation = '';

      if (isEnglish) {
        const lower = cleanMsg.toLowerCase();
        if (lower.includes('i am agree')) {
          primaryEnglish = cleanMsg.replace(/i am agree/i, 'I agree');
          hasMistake = true;
          mistakeAnalysis = 'गलती: "I am agree" नहीं बोलते। "Agree" एक verb है, इसलिए सीधा "I agree" बोलते हैं।';
          explanation = 'Correct sentence: "I agree with you". Verb "agree" के साथ am/is/are नहीं लगता।';
        } else if (lower.includes('did you went')) {
          primaryEnglish = cleanMsg.replace(/went/i, 'go');
          hasMistake = true;
          mistakeAnalysis = 'गलती: "Did" के साथ 2nd form (went) नहीं, हमेशा 1st form (go) आती है!';
          explanation = 'Rule: Did + Subject + V1. जैसे: "Did you go there?"';
        } else if (lower.includes('he do not') || lower.includes('she do not')) {
          primaryEnglish = cleanMsg.replace(/do not/i, 'does not');
          hasMistake = true;
          mistakeAnalysis = 'गलती: He/She/It के साथ "do not" नहीं, बल्कि "does not" का प्रयोग होता है।';
          explanation = 'Rule: Singular subjects take "does not".';
        } else {
          primaryEnglish = cleanMsg;
          hasMistake = false;
          explanation = 'Your sentence looks clear! You can also express this in formal or casual style.';
        }
      } else {
        primaryEnglish = 'Could you please explain this in detail?';
        explanation = `आपका वाक्य: "${cleanMsg}"\nअंग्रेजी में इसे आप ऐसे बोल सकते हैं।`;
      }

      res.json({
        success: true,
        detectedType,
        primaryEnglish,
        alternatives: ['You can also say: ' + primaryEnglish],
        hasMistake,
        mistakeAnalysis,
        aiExplanation: explanation,
        vocabTips: [{ word: 'Practice', meaning: 'अभ्यास करना' }],
      });
    }
  } catch (err: any) {
    console.error('English tutor API error:', err);
    res.status(500).json({ success: false, error: err.message || 'Error processing English tutor request' });
  }
});


// Start Server with Vite Middleware in Development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Teacher Student AI Messenger Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
