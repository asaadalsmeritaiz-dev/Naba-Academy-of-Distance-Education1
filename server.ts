import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { createServer as createHttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";

// Import custom middlewares and API routers
import { requestLogger } from "./lib/middleware";
import authRouter from "./app/api/auth";
import coursesRouter from "./app/api/courses";
import lecturesRouter from "./app/api/lectures";
import examsRouter from "./app/api/exams";
import forumRouter from "./app/api/forum";
import aiRouter from "./app/api/ai";
import instructorRouter from "./app/api/instructor";
import uploadRouter from "./app/api/upload";

dotenv.config();

const app = express();
app.use(express.json());
app.use(requestLogger);

// Mount the modular routers
app.use("/api/auth", authRouter);
app.use("/api/courses", coursesRouter);
app.use("/api/lectures", lecturesRouter);
app.use("/api/exams", examsRouter);
app.use("/api/forum", forumRouter);
app.use("/api/ai", aiRouter);
app.use("/api/instructor", instructorRouter);
app.use("/api/upload", uploadRouter);

const PORT = 3000;

// Lazy initialization of Gemini client to prevent crashing if the key is missing on startup
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

// 1. Health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// 2. Lecture Summarization endpoint
app.post("/api/gemini/summarize", async (req, res) => {
  try {
    const { lectureTitle, transcript } = req.body;
    if (!transcript) {
      return res.status(400).json({ error: "Transcript is required" });
    }

    const client = getGeminiClient();
    const prompt = `أنت مساعد أكاديمي ذكي لمراقب أكاديمية نبا. يرجى قراءة تفريغ المحاضرة التالي المعنون بـ "${lectureTitle}" وتوليد ملخص أكاديمي متكامل باللغة العربية الفصحى. يجب أن يتكون الملخص من ثلاث نقاط رئيسية متبوعة بقائمة نصائح سريعة للمذاكرة للامتحان الموحد. كن أكاديمياً ودقيقاً وبليغاً في صياغة العبارات:\n\n${transcript}`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ summary: response.text });
  } catch (error: any) {
    console.error("Gemini summarize error:", error);
    res.status(500).json({ error: error.message || "فشل توليد التلخيص بواسطة الذكاء الاصطناعي" });
  }
});

// 3. Side Tutor chatbot endpoint
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { lectureTitle, transcript, message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const client = getGeminiClient();
    const systemInstruction = `أنت أستاذ ومستشار أكاديمي خبير ومسؤول عن توجيه الطلاب في مادة "${lectureTitle}". تفريغ الدرس كالتالي:\n"${transcript}"\n\nأجب باللغة العربية الفصحى حصراً، باحترام شديد وتشجيع متميز، وبطريقة مفصلة ومنظمة. إذا سألك الطالب عن شفرة برمجية، اكتب نموذجاً مبسطاً مشروحاً بالتعليقات العربية.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: message,
      config: {
        systemInstruction
      }
    });

    res.json({ reply: response.text });
  } catch (error: any) {
    console.error("Gemini chat error:", error);
    res.status(500).json({ error: error.message || "فشل التفاعل مع المرشد الأكاديمي" });
  }
});

// 4. Auto Quiz Generator endpoint
app.post("/api/gemini/generate-quiz", async (req, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript) {
      return res.status(400).json({ error: "Transcript input is required" });
    }

    const client = getGeminiClient();
    const prompt = `اقرأ المادة العلمية التالية بعناية، ثم قم بصياغة اختبار ذكي مكون من ٣ أسئلة أكاديمية باللغة العربية الفصحى:\n` +
      `- السؤال الأول: اختيار من متعدد (MCQ) مع 4 خيارات وإجابة صحيحة واحدة.\n` +
      `- السؤال الثاني: صح أو خطأ (Boolean) مع خيارين وإجابة صحيحة واحدة.\n` +
      `- السؤال الثالث: سؤال مقالي إنشائي قصير (Short Answer) مع كتابة الإجابة النموذجية المتوقعة للتقييم.\n\n` +
      `المادة العلمية:\n${transcript}\n\n` +
      `أنت مجبر على إرجاع المخرجات بتنسيق JSON مطابق تماماً للمصفوفة التالية:\n` +
      `[\n` +
      `  {\n` +
      `    "id": "gq1",\n` +
      `    "type": "mcq",\n` +
      `    "text": "نص السؤال هنا",\n` +
      `    "options": ["الخيار أ", "الخيار ب", "الخيار ج", "الخيار د"],\n` +
      `    "correctAnswer": "الخيار أ (يجب أن يطابق تماماً أحد العناصر في الخيارات)",\n` +
      `    "points": 5\n` +
      `  },\n` +
      `  {\n` +
      `    "id": "gq2",\n` +
      `    "type": "boolean",\n` +
      `    "text": "نص السؤال الصح والخطأ هنا",\n` +
      `    "options": ["صحيح", "خطأ"],\n` +
      `    "correctAnswer": "صحيح",\n` +
      `    "points": 3\n` +
      `  },\n` +
      `  {\n` +
      `    "id": "gq3",\n` +
      `    "type": "short",\n` +
      `    "text": "نص السؤال الإنشائي هنا",\n` +
      `    "correctAnswer": "الإجابة النموذجية المتوقعة للتقييم بالتفصيل هنا",\n` +
      `    "points": 4\n` +
      `  }\n` +
      `]`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const quizText = response.text || "[]";
    const questions = JSON.parse(quizText.trim());
    res.json({ questions });
  } catch (error: any) {
    console.error("Gemini quiz generation error:", error);
    res.status(500).json({ error: error.message || "فشل توليد الاختبار بواسطة الذكاء الاصطناعي" });
  }
});

// Vite middleware development / production asset pipeline
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const httpServer = createHttpServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("Admin or Student connected to proctoring:", socket.id);

    socket.on("join-exam", (examId) => {
      console.log(`Socket ${socket.id} joined exam room: exam-${examId}`);
      socket.join(`exam-${examId}`);
    });

    socket.on("violation", (data) => {
      console.log("Broadcasting violation in real-time:", data);
      io.to(`exam-${data.examId}`).emit("new-violation", data);
    });

    socket.on("disconnect", () => {
      console.log("Proctoring socket disconnected:", socket.id);
    });
  });

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
