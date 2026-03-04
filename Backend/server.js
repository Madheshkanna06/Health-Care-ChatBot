import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";
import mongoose from "mongoose";
import connectDB from "./db.js";


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());


connectDB();


const ReminderSchema = new mongoose.Schema({
  medicine: String,
  time: String,
  notes: String,
  frequency: String,
  notificationEnabled: Boolean,
  lastTaken: String,
});

const Reminder = mongoose.model("Reminder", ReminderSchema);

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

app.post("/chat", async (req, res) => {
  try {
    const { message, category, language } = req.body;

    if (!message || !category || !language) {
      return res.status(400).json({ error: "message, category, and language are required" });
    }

    const prompt = `
You are a helpful and empathetic medical assistant.
Respond in ${language}.

Category: ${category}
User: ${message}

Provide a detailed response in strict JSON format with the following structure:
{
  "explanation": "A clear, comforting, professional, and detailed explanation of the diagnosis or advice. Explain why this might be happening.",
  "condition": "Likely condition (short title)",
  "cause": "Possible cause (short description)",
  "treatment": ["Treatment step 1", "Treatment step 2"],
  "medicines": [
    {
      "name": "Medicine Name",
      "dosage": "Dosage info",
      "timing": "When to take",
      "instructions": "How to take"
    }
  ],
  "remedies": ["Home remedy 1", "Home remedy 2"]
}

Ensure the explanation is easy to understand for a general user.
Do not include any text outside the JSON object.
`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You are a safe and helpful healthcare assistant. Always output valid JSON." },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const reply = completion.choices?.[0]?.message?.content || "{}";
    let analysis = null;

    try {
      
      const jsonMatch = reply.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        analysis = JSON.parse(reply);
      }
    } catch (e) {
      console.error("Failed to parse JSON explanation:", e);
    }

    res.json({
      raw: analysis ? analysis.explanation : reply,
      analysis: analysis,
    });
  } catch (err) {
    console.error("Groq Error:", err);
    res.status(500).json({ error: "Groq API failed" });
  }
});

app.post("/voice-intent", async (req, res) => {
  try {
    const { transcript, language } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: "transcript is required" });
    }

    const prompt = `
Analyze the following spoken transcript and determine the user's intent.
Transcript: "${transcript}"
Current Language Context: ${language}

Possible Intents:
1. CREATE_REMINDER: User wants to set a reminder for medicine or a checkup. (e.g., "remind me to take paracetamol at 8pm", "set a reminder for my heart medicine")
2. FIND_HOSPITAL: User is looking for hospitals or emergency services nearby. (e.g., "find hospitals in Chennai", "where is the nearest clinic?")
3. NAVIGATE: User wants to switch to a different screen/tab in the app. (e.g., "go to reminders", "open hospital search", "show me the chat")
4. CHAT: Regular medical inquiry or conversation. (Default)

Output a strict JSON object:
{
  "intent": "Intent name (one of the above)",
  "confidence": 0.0 to 1.0,
  "parameters": {
    "medicine": "Medicine name (if CREATE_REMINDER)",
    "time": "Time (if CREATE_REMINDER)",
    "location": "Location (if FIND_HOSPITAL)",
    "tab": "Target tab id (chat/reminders/hospitals if NAVIGATE)"
  },
  "feedback": "A short confirmation message in ${language} (e.g., 'Okay, setting a reminder for...')"
}
`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You are an intelligent healthcare intent parser. Always output valid JSON." },
        { role: "user", content: prompt },
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    res.json(JSON.parse(completion.choices?.[0]?.message?.content || "{}"));
  } catch (err) {
    console.error("Voice Intent Error:", err);
    res.status(500).json({ error: "Groq API failed for voice intent" });
  }
});

app.post("/hospitals", async (req, res) => {
  try {
    const { location } = req.body;

    if (!location) {
      return res.status(400).json({ error: "location is required" });
    }

    const prompt = `Find real, verifiable hospitals near ${location}. For each hospital, provide:
        1. Hospital name
        2. Full address
        3. Phone number
        4. Operating hours
        5. Available emergency services
        6. Key medical services offered
        7. Approximate distance from ${location}

        Format the response as a strict JSON array with the following structure for each hospital:
        [
          {
            "name": "Hospital Name",
            "address": "Full Address",
            "phone": "Phone Number",
            "hours": "Operating Hours",
            "emergency": true,
            "services": ["Service 1", "Service 2"],
            "distance": "1.2 km",
            "rating": 4.5
          }
        ]

        Include only JSON. Do not include any other text.`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You are a helpful healthcare assistant. Always output valid JSON." },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const reply = completion.choices?.[0]?.message?.content || "[]";
    let hospitalData = [];

    try {
      const jsonMatch = reply.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        hospitalData = JSON.parse(jsonMatch[0]);
      } else {
        // Groq might return an object with a key like "hospitals"
        const parsed = JSON.parse(reply);
        hospitalData = Array.isArray(parsed) ? parsed : (parsed.hospitals || []);
      }
    } catch (e) {
      console.error("Failed to parse hospital JSON:", e);
    }

    res.json(hospitalData);
  } catch (err) {
    console.error("Groq Hospital Error:", err);
    res.status(500).json({ error: "Groq API failed to fetch hospitals" });
  }
});

// Reminder Endpoints
app.get("/reminders", async (req, res) => {
  try {
    const reminders = await Reminder.find();
    res.json(reminders);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch reminders" });
  }
});

app.post("/reminders", async (req, res) => {
  try {
    const { medicine, time, notes, frequency, notificationEnabled } = req.body;
    const newReminder = new Reminder({
      medicine,
      time,
      notes,
      frequency,
      notificationEnabled,
    });
    await newReminder.save();
    res.status(201).json(newReminder);
  } catch (err) {
    res.status(500).json({ error: "Failed to create reminder" });
  }
});

app.put("/reminders/:id", async (req, res) => {
  try {
    const updatedReminder = await Reminder.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedReminder);
  } catch (err) {
    res.status(500).json({ error: "Failed to update reminder" });
  }
});

app.delete("/reminders/:id", async (req, res) => {
  try {
    await Reminder.findByIdAndDelete(req.params.id);
    res.json({ message: "Reminder deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete reminder" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Groq backend running on http://localhost:${PORT}`);
});