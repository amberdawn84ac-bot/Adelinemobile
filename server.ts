import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Server-side Gemini API endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.json({
          reply: "Hello! I am Adeline, your AI Mentor. (Note: GEMINI_API_KEY is not configured in .env yet, so I'm replying in offline fallback mode. Add your key to enable full AI responses!)",
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      const systemInstruction = `You are Adeline, a warm, encouraging, intelligent AI Mentor and guide for a student learning software, career skills, scripture/wisdom, and personal growth. Keep responses friendly, thoughtful, clear, and supportive.`;

      const contents = [
        { role: 'user', parts: [{ text: systemInstruction }] },
        ...(history || []).map((msg: any) => ({
          role: msg.isFromUser ? 'user' : 'model',
          parts: [{ text: msg.text }]
        })),
        { role: 'user', parts: [{ text: message }] }
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
      });

      const reply = response.text || "I'm here with you! Let's keep exploring.";
      res.json({ reply });
    } catch (err: any) {
      console.error("Gemini API Error:", err);
      res.status(500).json({ reply: "I ran into a temporary hiccup connecting to my AI brain. Let's try again!" });
    }
  });

  // Daily Scripture endpoint
  app.get("/api/scripture/daily", (req, res) => {
    const scriptures = [
      { reference: "Proverbs 3:5-6", text: "Trust in the LORD with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight." },
      { reference: "Philippians 4:13", text: "I can do all this through him who gives me strength." },
      { reference: "Joshua 1:9", text: "Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the LORD your God will be with you wherever you go." },
      { reference: "Psalm 119:105", text: "Your word is a lamp for my feet, a light on my path." },
    ];
    const todayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % scriptures.length;
    res.json(scriptures[todayIndex]);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
