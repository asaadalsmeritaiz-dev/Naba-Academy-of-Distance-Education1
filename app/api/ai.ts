import { Router, Request, Response } from "express";
import { authenticate } from "../../lib/middleware";
import { GoogleGenAI, Type } from "@google/genai";

const router = Router();

// Lazy initialize Gemini client
let ai: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environmental variable is missing");
    }
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return ai;
}

/**
 * 3.5.1 POST /api/ai/summarize
 * Accept lecture text, return bullet-point summary.
 */
router.post("/summarize", authenticate, async (req: Request, res: Response) => {
  try {
    const { lectureText } = req.body;
    if (!lectureText) {
      return res.status(400).json({
        success: false,
        error: "lectureText is required in body",
        code: "INVALID_INPUT"
      });
    }

    const client = getGeminiClient();
    const prompt = `يرجى تلخيص النص الأكاديمي التالي في نقاط واضحة ومكثفة باللغة العربية الفصحى. ركز على المبادئ والمصطلحات الرئيسية:\n\n${lectureText}`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    return res.json({
      success: true,
      data: {
        summary: response.text
      },
      message: "Lecture summarized successfully"
    });
  } catch (error: any) {
    console.error("AI summarize error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to generate summary",
      code: "AI_ERROR"
    });
  }
});

/**
 * 3.5.2 POST /api/ai/generate-questions
 * Accept text + number of questions. Return MCQ, True/False, Essay with correct answers.
 */
router.post("/generate-questions", authenticate, async (req: Request, res: Response) => {
  try {
    const { text, numQuestions = 3 } = req.body;
    if (!text) {
      return res.status(400).json({
        success: false,
        error: "text content is required",
        code: "INVALID_INPUT"
      });
    }

    const client = getGeminiClient();
    const prompt = `اقرأ المادة العلمية المرفقة بعناية، ثم قم بصياغة اختبار أكاديمي ذكي يتكون من ${numQuestions} أسئلة باللغة العربية الفصحى.
وزع الأسئلة بين الأنواع التالية:
1. اختيار من متعدد (mcq) مع 4 خيارات وإجابة صحيحة واحدة تطابق أحد الخيارات تماماً.
2. صح أو خطأ (true_false) مع خيارين ["صحيح", "خطأ"].
3. سؤال مقالي إنشائي (essay) يحتاج لإجابة كتابية من الطالب، واكتب نموذج الإجابة المتوقعة كمعيار للتقييم.

المادة العلمية:
${text}

يجب أن ترجع المخرجات بتنسيق JSON مطابق تماماً للمصفوفة التالية كـ JSON array:
[
  {
    "type": "mcq",
    "question_text": "نص السؤال هنا؟",
    "options": ["خيار أ", "خيار ب", "خيار ج", "خيار د"],
    "correct_answer": "خيار أ",
    "points": 5
  },
  {
    "type": "true_false",
    "question_text": "نص سؤال الصح والخطأ هنا؟",
    "options": ["صحيح", "خطأ"],
    "correct_answer": "صحيح",
    "points": 3
  },
  {
    "type": "essay",
    "question_text": "نص السؤال المقالي هنا؟",
    "options": null,
    "correct_answer": "نموذج الإجابة المتوقعة أو الكلمات الدلالية للتقييم بالتفصيل هنا لكي نستخدمها كمعيار تصحيح",
    "points": 10
  }
]`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const questionsText = response.text || "[]";
    const questions = JSON.parse(questionsText.trim());

    return res.json({
      success: true,
      data: {
        questions
      },
      message: "Questions generated successfully"
    });
  } catch (error: any) {
    console.error("AI question generation error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to generate questions",
      code: "AI_ERROR"
    });
  }
});

/**
 * 3.5.3 POST /api/ai/grade-essay
 * Accept student answer + rubric. Return score (0-100) + feedback.
 */
router.post("/grade-essay", authenticate, async (req: Request, res: Response) => {
  try {
    const { studentAnswer, rubric, questionText, maxPoints = 100 } = req.body;

    if (!studentAnswer || !rubric) {
      return res.status(400).json({
        success: false,
        error: "studentAnswer and rubric are required",
        code: "INVALID_INPUT"
      });
    }

    const client = getGeminiClient();
    const prompt = `أنت مصحح وأستاذ جامعي خبير. قم بتقييم إجابة الطالب المقالية بناءً على السؤال ومعيار التصحيح (الروبيرك) والدرجة القصوى ${maxPoints}.
    
${questionText ? `نص السؤال: "${questionText}"` : ""}
معيار التصحيح / الإجابة النموذجية: "${rubric}"
إجابة الطالب: "${studentAnswer}"
الدرجة القصوى: ${maxPoints}

أرجع التقييم حصراً كـ JSON بالتنسيق التالي:
{
  "score": 85,
  "feedback": "ملاحظات التصحيح والتقييم بالتفصيل باللغة العربية الفصحى تشرح لماذا حصل الطالب على هذه الدرجة مع نصائح للتحسين"
}`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const resultText = response.text || "{}";
    const result = JSON.parse(resultText.trim());

    // Clean score
    const score = typeof result.score === "number" ? Math.min(Math.max(result.score, 0), maxPoints) : 0;
    const feedback = result.feedback || "تم التقييم تلقائياً.";

    return res.json({
      success: true,
      data: {
        score,
        feedback,
        maxPoints
      },
      message: "Essay graded successfully"
    });
  } catch (error: any) {
    console.error("AI essay grading error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to grade essay",
      code: "AI_ERROR"
    });
  }
});

/**
 * 3.5.4 POST /api/ai/tutor-chat
 * Accept question + course context. Return AI tutor response.
 */
router.post("/tutor-chat", authenticate, async (req: Request, res: Response) => {
  try {
    const { question, courseContext } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        error: "question is required",
        code: "INVALID_INPUT"
      });
    }

    const client = getGeminiClient();
    const systemInstruction = `أنت أستاذ ومستشار أكاديمي خبير ومسؤول عن توجيه ومساعدة الطالب كمعلم خصوصي (AI Tutor) ذكي وودود للغاية.
${courseContext ? `سياق المادة العلمية/المحاضرة كالتالي:\n"${courseContext}"` : ""}

أجب دائماً باللغة العربية الفصحى وبأسلوب تربوي مشجع، مبسط، ومنظم. قدم أمثلة عملية وشروحاً وافية عند الحاجة لضمان فهم الطالب العميق.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: question,
      config: {
        systemInstruction
      }
    });

    return res.json({
      success: true,
      data: {
        reply: response.text
      },
      message: "Tutor response generated successfully"
    });
  } catch (error: any) {
    console.error("AI tutor chat error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to interact with AI Tutor",
      code: "AI_ERROR"
    });
  }
});

export default router;
