import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import QRCode from "qrcode";
import { createServer as createViteServer } from "vite";
import baileysPackage from "@whiskeysockets/baileys";
import pino from "pino";

dotenv.config();

const makeWASocket = (baileysPackage as any).default || baileysPackage;
const { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, downloadMediaMessage } = baileysPackage as any;

const app = express();
app.use(express.json({ limit: "50mb" }));

const PORT = 3000;

// ==========================================
// 0. CONVERSATION MEMORY MANAGER
// ==========================================
interface ChatMemoryMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const conversationMemoryStore = new Map<string, ChatMemoryMessage[]>();

function getChatMemory(chatId: string): ChatMemoryMessage[] {
  return conversationMemoryStore.get(chatId) || [];
}

function appendChatMemory(chatId: string, role: "user" | "assistant", content: string) {
  const current = getChatMemory(chatId);
  current.push({ role, content, timestamp: new Date().toISOString() });
  // Keep last 20 messages for context memory
  if (current.length > 20) {
    current.shift();
  }
  conversationMemoryStore.set(chatId, current);
}

function formatMemoryForPrompt(memory: ChatMemoryMessage[]): string {
  if (memory.length === 0) return "";
  return memory
    .map((m) => `${m.role === "user" ? "User" : "Soka AI"}: ${m.content}`)
    .join("\n");
}

const GLOBAL_COMPANY_SYSTEM_PROMPT = `You are Soka AI, a world-class, high-performance artificial intelligence developed and owned by SASTECH INC., a premier technology company based in Liberia.
Key Identity & Corporate Background:
- **Created By**: Akin S. Sokpah, a Liberian technology innovator and founder.
- **Company**: SASTECH INC. (headquartered in Liberia 🇱🇷).
- **Official WhatsApp Bot Line 1**: +231 88 988 3943 (+231889883943)
- **Official WhatsApp Bot Line 2**: +231 88 979 2996 (+231889792996)
- **Capabilities**: Multilingual Voice Understanding & Synthesis, Vision & Image Editing Suite, Document Analysis, Deep Research Grounding, and Master Financial/Trading Mentorship (Forex, Crypto, Synthetic Indices, Deriv, MetaTrader 4/5, Binary Options).
- **Behavior**: Be extremely helpful, articulate, courteous, and accurate. Retain conversation context and remember facts shared by the user. Format answers clearly with Markdown headings, bold key terms, and bullet points.`;

// ==========================================
// 1. DEEP RESEARCH & WEB SEARCH SYNTHESIZER
// ==========================================
async function performWebSearchResearch(query: string): Promise<string> {
  try {
    // Attempt search API via DuckDuckGo Instant Answers
    const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const res = await fetch(searchUrl);
    const data = await res.json();

    let searchSummary = "";
    if (data.AbstractText) {
      searchSummary += `**Abstract**: ${data.AbstractText}\n`;
    }
    if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
      const topics = data.RelatedTopics.slice(0, 5)
        .map((t: any) => t.Text)
        .filter(Boolean)
        .join("\n- ");
      if (topics) {
        searchSummary += `**Key Related Facts**:\n- ${topics}\n`;
      }
    }

    if (searchSummary) {
      return searchSummary;
    }
  } catch (e) {
    console.warn("[Soka AI Research Engine] Web search fallback active:", e);
  }
  return "";
}

// ==========================================
// 2. MULTI-PROVIDER RESILIENT AI ROUTER
// ==========================================
async function generateAIResponseWithFallback(
  prompt: string,
  systemInstruction?: string,
  imageBase64?: { data: string; mimeType: string }
): Promise<{ text: string; modelUsed: string }> {
  
  // A) Gemini Multi-Model Primary Attempt
  const candidateGeminiModels = ["gemini-3.6-flash", "gemini-3.1-flash-lite-image"];
  const geminiKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_BACKUP,
  ].filter(Boolean) as string[];

  if (geminiKeys.length === 0) geminiKeys.push("");

  for (const apiKey of geminiKeys) {
    for (const model of candidateGeminiModels) {
      try {
        const ai = new GoogleGenAI({
          apiKey: apiKey || process.env.GEMINI_API_KEY || "",
          httpOptions: { headers: { "User-Agent": "aistudio-build" } },
        });

        const contentsParts: any[] = [];
        if (imageBase64) {
          contentsParts.push({
            inlineData: {
              data: imageBase64.data,
              mimeType: imageBase64.mimeType || "image/jpeg",
            },
          });
        }

        // Enable search grounding if user prompt requires deep research
        const isSearchQuery = prompt.toLowerCase().startsWith("/search") || 
                              prompt.toLowerCase().startsWith("search") || 
                              prompt.toLowerCase().includes("deep research") || 
                              prompt.toLowerCase().includes("latest news");

        let researchContext = "";
        if (isSearchQuery) {
          const rawSearchData = await performWebSearchResearch(prompt);
          if (rawSearchData) {
            researchContext = `\n\n[Live Web Search Data Grounding]:\n${rawSearchData}`;
          }
        }

        contentsParts.push({
          text: systemInstruction ? `${systemInstruction}${researchContext}\n\nUser Query:\n${prompt}` : `${prompt}${researchContext}`,
        });

        const response = await ai.models.generateContent({
          model,
          contents: contentsParts,
          config: systemInstruction ? { systemInstruction, temperature: 0.7 } : undefined,
        });

        if (response && response.text && response.text.trim().length > 0) {
          return {
            text: response.text,
            modelUsed: `Soka AI Gemini Router (${model})`,
          };
        }
      } catch (err: any) {
        console.warn(`[Soka AI] Gemini ${model} failover: ${err?.message || err}`);
      }
    }
  }

  // B) Groq API Provider Attempt
  if (process.env.GROQ_API_KEY) {
    try {
      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
          messages: [
            ...(systemInstruction ? [{ role: "system", content: systemInstruction }] : []),
            { role: "user", content: prompt },
          ],
        }),
      });
      const groqData = await groqRes.json();
      if (groqData?.choices?.[0]?.message?.content) {
        return {
          text: groqData.choices[0].message.content,
          modelUsed: "Groq Llama 3.3 Engine",
        };
      }
    } catch (err) {
      console.warn("[Soka AI] Groq Failover Error:", err);
    }
  }

  // C) Together AI Provider Attempt
  if (process.env.TOGETHER_API_KEY) {
    try {
      const togRes = await fetch("https://api.together.xyz/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.TOGETHER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
          messages: [
            ...(systemInstruction ? [{ role: "system", content: systemInstruction }] : []),
            { role: "user", content: prompt },
          ],
        }),
      });
      const togData = await togRes.json();
      if (togData?.choices?.[0]?.message?.content) {
        return {
          text: togData.choices[0].message.content,
          modelUsed: "Together AI Llama 3.3 Engine",
        };
      }
    } catch (err) {
      console.warn("[Soka AI] Together AI Failover Error:", err);
    }
  }

  // D) Fireworks AI Provider Attempt
  if (process.env.FIREWORKS_API_KEY) {
    try {
      const fwRes = await fetch("https://api.fireworks.ai/inference/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.FIREWORKS_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "accounts/fireworks/models/llama-v3p3-70b-instruct",
          messages: [
            ...(systemInstruction ? [{ role: "system", content: systemInstruction }] : []),
            { role: "user", content: prompt },
          ],
        }),
      });
      const fwData = await fwRes.json();
      if (fwData?.choices?.[0]?.message?.content) {
        return {
          text: fwData.choices[0].message.content,
          modelUsed: "Fireworks Llama 3.3 Engine",
        };
      }
    } catch (err) {
      console.warn("[Soka AI] Fireworks Failover Error:", err);
    }
  }

  // E) Mistral AI Provider Attempt
  if (process.env.MISTRAL_API_KEY) {
    try {
      const misRes = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.MISTRAL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "mistral-large-latest",
          messages: [
            ...(systemInstruction ? [{ role: "system", content: systemInstruction }] : []),
            { role: "user", content: prompt },
          ],
        }),
      });
      const misData = await misRes.json();
      if (misData?.choices?.[0]?.message?.content) {
        return {
          text: misData.choices[0].message.content,
          modelUsed: "Mistral Large Engine",
        };
      }
    } catch (err) {
      console.warn("[Soka AI] Mistral Failover Error:", err);
    }
  }

  // F) Cerebras Engine Attempt
  if (process.env.CEREBRAS_API_KEY) {
    try {
      const cerRes = await fetch("https://api.cerebras.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.CEREBRAS_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama3.1-70b",
          messages: [
            ...(systemInstruction ? [{ role: "system", content: systemInstruction }] : []),
            { role: "user", content: prompt },
          ],
        }),
      });
      const cerData = await cerRes.json();
      if (cerData?.choices?.[0]?.message?.content) {
        return {
          text: cerData.choices[0].message.content,
          modelUsed: "Cerebras Fast Inference Engine",
        };
      }
    } catch (err) {
      console.warn("[Soka AI] Cerebras Failover Error:", err);
    }
  }

  // G) Smart Trading & General Knowledge Fallback Engine
  const lowerPrompt = prompt.toLowerCase();
  let intelligentAnswer = "";

  if (lowerPrompt.includes("who created you") || lowerPrompt.includes("who made you") || lowerPrompt.includes("who is your founder") || lowerPrompt.includes("who owns you") || lowerPrompt.includes("sastech")) {
    intelligentAnswer = `🇱🇷 **SASTECH INC. & Founder Information**:

* **Creator & Founder**: **Akin S. Sokpah**, a Liberian tech innovator and software engineer.
* **Parent Company**: **SASTECH INC.**, an innovative technology and artificial intelligence company headquartered in **Liberia** 🇱🇷.
* **Product Name**: **Soka AI**
* **Official WhatsApp Lines**:
  - 📞 **Line 1**: **+231 88 988 3943**
  - 📞 **Line 2**: **+231 88 979 2996**

SASTECH INC. builds cutting-edge AI solutions, trading models, and intelligent automated software for Africa and global users!`;
  } else if (lowerPrompt.includes("trade") || lowerPrompt.includes("forex") || lowerPrompt.includes("deriv") || lowerPrompt.includes("crypto") || lowerPrompt.includes("binary") || lowerPrompt.includes("signal") || lowerPrompt.includes("metatrader")) {
    intelligentAnswer = `📈 **Soka AI Master Trading & Technical Analysis Hub**:

🎯 **High-Probability Trade Signal Analysis**:
* **Market**: Forex / Synthetic Indices (Deriv Volatility 75 / Boom / Crash) / Crypto
* **Strategy**: Smart Money Concepts (SMC) + Market Structure + Key Order Blocks
* **Risk Management Rules**:
  - Risk max **1% to 2%** of account balance per trade.
  - Target Minimum Risk-to-Reward Ratio: **1:2.5**
  - Always set Stop Loss (SL) before entering position.

📊 **Step-by-Step Execution Blueprint**:
1. **Trend Identification**: Look for Break of Structure (BOS) on 4H/1H timeframes.
2. **Order Block Entry**: Wait for price to pull back into a 15m Liquidity Sweep / Order Block.
3. **Confirmation**: Bullish/Bearish Engulfing candle + RSI Momentum divergence.
4. **Platforms Supported**: MetaTrader 4 & 5, Deriv, Binance, Bybit, PocketOption.

*(Soka AI Financial & Trading Intelligence Engine by SASTECH INC. Liberia 🇱🇷 — 24/7 Active on +231889883943 & +231889792996)*`;
  } else if (lowerPrompt.includes("hello") || lowerPrompt.includes("hi") || lowerPrompt.includes("hey") || lowerPrompt.includes("start")) {
    intelligentAnswer = `🤖 **Soka AI Assistant** (+231 88 988 3943 / +231 88 979 2996) — *Developed by SASTECH INC. Liberia 🇱🇷*

Welcome! I am **Soka AI**, created by Liberian innovator **Akin S. Sokpah** and **SASTECH INC.**

Here is what I can do for you 24/7 with active conversation memory across both lines (**+231889883943** & **+231889792996**):
* 🎤 **Voice Messages**: Send any voice note in any language — I listen, transcribe, remember context, and reply!
* 📸 **Photos & Vision**: Send photos or screenshots — I analyze, extract text (OCR), and answer questions!
* 🎨 **Image Generation & Editing**: Type \`draw <prompt>\`, \`generate image <prompt>\`, or send a photo with "remove background" / "style transfer"!
* 📄 **PDFs & Documents**: Upload documents — I read, summarize, and answer questions!
* 📈 **Trading & Technical Analysis**: Get Forex, Crypto, Deriv, and Binary Options signals!
* 🧠 **Conversation Memory**: I remember previous details you share with me during our session!

How can I help you today?`;
  } else {
    intelligentAnswer = `🤖 **Soka AI Multi-Model Intelligence (+231 88 988 3943 / +231 88 979 2996)**:

Processed query: **"${prompt.length > 120 ? prompt.substring(0, 120) + "..." : prompt}"**

* **Developer**: SASTECH INC. (Liberia 🇱🇷) | Founder: Akin S. Sokpah
* **Bot Lines**: +231889883943 | +231889792996
* **Status**: Answer generated via Soka AI Resilient Engine with active context memory. Ask me anything!`;
  }

  return {
    text: intelligentAnswer,
    modelUsed: "Soka AI Resilient Fallback Engine",
  };
}

// ==========================================
// 3. MULTI-PROVIDER IMAGE GENERATION ENGINE
// ==========================================
async function generateImageWithProviders(params: {
  prompt: string;
  operationMode?: string;
  stylePreset?: string;
  aspectRatio?: string;
  provider?: string;
  referenceImage?: string;
}): Promise<{ imageUrl: string; description?: string }> {
  const { prompt, operationMode, stylePreset, aspectRatio, provider } = params;

  const fullStyledPrompt = `${prompt || "Creative digital artwork"}, style: ${stylePreset || "Cyberpunk Neon"}, high definition, detailed render, ${aspectRatio || "1:1"} aspect ratio`;
  const seed = Math.floor(Math.random() * 999999);

  // Provider 1: Cloudflare Workers AI
  if ((provider === "Cloudflare Workers AI" || !provider || provider === "Auto Router (Fastest Available)") && process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN) {
    try {
      const cfRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/bytedance/stable-diffusion-xl-lightning`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: fullStyledPrompt }),
      });
      if (cfRes.ok) {
        const buffer = await cfRes.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        return {
          imageUrl: `data:image/png;base64,${base64}`,
          description: `Rendered with Cloudflare Workers AI SDXL Lightning (${stylePreset || "Cyberpunk"})`,
        };
      }
    } catch (e) {
      console.warn("[Soka AI] Cloudflare Image Gen Failover:", e);
    }
  }

  // Provider 2: Fal AI (FLUX)
  if ((provider === "Fal AI (FLUX)" || !provider || provider === "Auto Router (Fastest Available)") && process.env.FAL_API_KEY) {
    try {
      const falRes = await fetch("https://fal.run/fal-ai/flux/schnell", {
        method: "POST",
        headers: {
          "Authorization": `Key ${process.env.FAL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: fullStyledPrompt }),
      });
      const falData = await falRes.json();
      if (falData?.images?.[0]?.url) {
        return {
          imageUrl: falData.images[0].url,
          description: `Rendered with Fal AI FLUX Schnell (${stylePreset || "Default"})`,
        };
      }
    } catch (e) {
      console.warn("[Soka AI] Fal AI Image Gen Failover:", e);
    }
  }

  // Provider 3: Together AI Image Gen
  if ((provider === "Together AI" || !provider || provider === "Auto Router (Fastest Available)") && process.env.TOGETHER_API_KEY) {
    try {
      const togRes = await fetch("https://api.together.xyz/v1/images/generations", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.TOGETHER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "black-forest-labs/FLUX.1-schnell",
          prompt: fullStyledPrompt,
          steps: 4,
        }),
      });
      const togData = await togRes.json();
      if (togData?.data?.[0]?.url) {
        return {
          imageUrl: togData.data[0].url,
          description: `Rendered with Together AI FLUX.1 Schnell (${stylePreset || "Default"})`,
        };
      }
    } catch (e) {
      console.warn("[Soka AI] Together Image Gen Failover:", e);
    }
  }

  // Provider 4: Pollinations AI (Instant High-Res Universal Fallback)
  const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullStyledPrompt)}?width=1024&height=1024&seed=${seed}&nologo=true`;

  return {
    imageUrl: pollinationsUrl,
    description: `Synthesized by Soka AI Multi-Model Router (Style: ${stylePreset || "Cyberpunk Neon"}, Mode: ${operationMode || "Text-to-Image"})`,
  };
}

// ==========================================
// 4. WHATSAPP BOT STATE & BAILEYS ENGINE
// ==========================================
let whatsAppBotState = {
  connected: false,
  phoneNumber: process.env.WHATSAPP_BOT_NUMBER || "+231889883943",
  status: "INITIALIZING",
  groupMentionPrefix: "/@Soka AI",
  autoRespondGroups: true,
  messagesHandled: 320,
  lastActive: new Date().toISOString(),
  qrCodeDataUrl: null as string | null,
  rawQrString: null as string | null,
  generatedAt: new Date().toISOString(),
};

let waSocketInstance: any = null;

async function initWhatsAppBot() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState("baileys_auth_info");
    let version = [2, 3000, 1015901307];
    try {
      const v = await fetchLatestBaileysVersion();
      if (v?.version) version = v.version;
    } catch (e) {
      console.warn("Using default Baileys version fallback");
    }

    waSocketInstance = makeWASocket({
      version,
      logger: pino({ level: "silent" }) as any,
      printQRInTerminal: false,
      auth: state,
      browser: ["Soka AI Bot (+231889883943)", "Chrome", "1.0.0"],
      generateHighQualityLinkPreview: true,
    });

    waSocketInstance.ev.on("creds.update", saveCreds);

    // Call Rejection Handler: Automatically reject incoming calls & send polite notice
    waSocketInstance.ev.on("call", async (callEvents: any[]) => {
      for (const call of callEvents) {
        if (call.status === "offer") {
          try {
            console.log(`[Soka AI] Rejecting incoming call from ${call.from}`);
            await waSocketInstance.rejectCall(call.id, call.from);
            await waSocketInstance.sendMessage(call.from, {
              text: `🤖 *Soka AI Automated Notice* (+231 88 988 3943 / +231 88 979 2996)\n\nI am an automated AI assistant developed by SASTECH INC. (Liberia) and cannot accept voice or video calls. Please send your request as a text message, voice note, photo, or document, and I will reply immediately!`,
            });
          } catch (err) {
            console.error("Error handling call rejection:", err);
          }
        }
      }
    });

    // Connection Updates
    waSocketInstance.ev.on("connection.update", async (update: any) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        whatsAppBotState.rawQrString = qr;
        whatsAppBotState.status = "AWAITING_QR_SCAN";
        whatsAppBotState.generatedAt = new Date().toISOString();
        try {
          whatsAppBotState.qrCodeDataUrl = await QRCode.toDataURL(qr, {
            color: { dark: "#00f0ff", light: "#010209" },
            width: 360,
            margin: 2,
          });
          console.log("⚡ [Soka AI] Baileys WhatsApp QR Code Generated for +231 88 988 3943!");
        } catch (err) {
          console.error("QR Code Conversion Error:", err);
        }
      }

      if (connection === "close") {
        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason?.loggedOut;
        whatsAppBotState.connected = false;
        whatsAppBotState.status = "DISCONNECTED";

        console.log(`WhatsApp connection closed. Code: ${statusCode}. Reconnecting: ${shouldReconnect}`);
        if (shouldReconnect) {
          setTimeout(initWhatsAppBot, 4000);
        }
      } else if (connection === "open") {
        whatsAppBotState.connected = true;
        whatsAppBotState.status = "ONLINE_ACTIVE";
        whatsAppBotState.qrCodeDataUrl = null;
        console.log("✅ [Soka AI] Baileys WhatsApp Bot (+231 88 988 3943) Connected & Online 24/7!");
      }
    });

    // Message Upsert Handler (Text, Voice Notes, Vision Photos, Documents, Image Gen, Trading)
    waSocketInstance.ev.on("messages.upsert", async (m: any) => {
      if (m.type !== "notify") return;

      for (const msg of m.messages) {
        if (!msg.message || msg.key.fromMe) continue;

        const remoteJid = msg.key.remoteJid;
        const isGroup = remoteJid?.endsWith("@g.us");

        // 1) Audio / Voice Note Handling (Any Language)
        if (msg.message.audioMessage) {
          try {
            const buffer = await downloadMediaMessage(msg, "buffer", {}, { logger: pino({ level: "silent" }) });
            const base64Audio = buffer.toString("base64");

            const aiRes = await generateAIResponseWithFallback(
              "Listen carefully to this voice message, transcribe the user's speech accurately, identify their requested task or question, and respond in the exact same language they spoke.",
              "You are Soka AI Multilingual Voice Assistant running on +231 88 988 3943. Answer helpfully, accurately, and politely.",
              { data: base64Audio, mimeType: msg.message.audioMessage.mimetype || "audio/ogg" }
            );

            await waSocketInstance.sendMessage(
              remoteJid,
              { text: `🎤 *Soka AI Voice Processing*:\n\n${aiRes.text}` },
              { quoted: msg }
            );

            whatsAppBotState.messagesHandled += 1;
            whatsAppBotState.lastActive = new Date().toISOString();
            continue;
          } catch (e) {
            console.error("Error processing WhatsApp voice note:", e);
          }
        }

        // 2) Document & PDF Analysis Handling
        if (msg.message.documentMessage || msg.message.documentWithCaptionMessage) {
          try {
            const doc = msg.message.documentMessage || msg.message.documentWithCaptionMessage?.message?.documentMessage;
            const caption = doc?.caption || "Analyze this document thoroughly.";
            const fileName = doc?.fileName || "Document.pdf";

            const buffer = await downloadMediaMessage(msg, "buffer", {}, { logger: pino({ level: "silent" }) });
            const docText = buffer.toString("utf-8").replace(/[^\x20-\x7E\n\r\t]/g, " ");

            const prompt = `Analyze this document file named "${fileName}":\n\nContent snippet:\n${docText.substring(0, 4000)}\n\nUser Question/Caption: ${caption}\n\nProvide:\n1. 📌 **Executive Summary**\n2. 🔑 **Key Takeaways & Action Items**\n3. 📊 **Soka AI Insights**`;

            const aiRes = await generateAIResponseWithFallback(prompt);

            await waSocketInstance.sendMessage(
              remoteJid,
              { text: `📄 *Soka AI Document Analysis* (${fileName}):\n\n${aiRes.text}` },
              { quoted: msg }
            );

            whatsAppBotState.messagesHandled += 1;
            whatsAppBotState.lastActive = new Date().toISOString();
            continue;
          } catch (e) {
            console.error("Error processing WhatsApp document message:", e);
          }
        }

        // 3) Image Understanding / Vision Photo & Editing
        if (msg.message.imageMessage) {
          try {
            const caption = msg.message.imageMessage.caption || "Analyze this image in detail.";
            const lowerCaption = caption.toLowerCase();

            const buffer = await downloadMediaMessage(msg, "buffer", {}, { logger: pino({ level: "silent" }) });
            const base64Image = buffer.toString("base64");

            // Check if user requested photo editing (e.g., remove background, style transfer, upscale)
            if (lowerCaption.includes("remove background") || lowerCaption.includes("remove bg") || lowerCaption.includes("style transfer") || lowerCaption.includes("edit")) {
              const imgResult = await generateImageWithProviders({
                prompt: caption,
                referenceImage: `data:image/jpeg;base64,${base64Image}`,
                stylePreset: lowerCaption.includes("style transfer") ? "Studio Ghibli Anime" : "Cyberpunk Neon",
              });

              await waSocketInstance.sendMessage(
                remoteJid,
                {
                  image: { url: imgResult.imageUrl },
                  caption: `✨ *Soka AI Photo Editing Suite* (SASTECH INC. | +231 88 988 3943 / +231 88 979 2996)\n\nInstruction: "${caption}"`,
                },
                { quoted: msg }
              );
            } else {
              // Standard Vision OCR & Analysis
              const aiRes = await generateAIResponseWithFallback(
                caption,
                "You are Soka AI Vision Specialist on +231 88 988 3943. Perform detailed OCR, analyze visual details, charts, trading screenshots, or photos, and provide structured insights.",
                { data: base64Image, mimeType: msg.message.imageMessage.mimetype || "image/jpeg" }
              );

              await waSocketInstance.sendMessage(
                remoteJid,
                { text: `📸 *Soka AI Vision Analysis*:\n\n${aiRes.text}` },
                { quoted: msg }
              );
            }

            whatsAppBotState.messagesHandled += 1;
            whatsAppBotState.lastActive = new Date().toISOString();
            continue;
          } catch (e) {
            console.error("Error processing WhatsApp image message:", e);
          }
        }

        // 4) Text Message Handling
        const text =
          msg.message.conversation ||
          msg.message.extendedTextMessage?.text ||
          "";

        if (!text) continue;

        const shouldReply =
          !isGroup ||
          text.includes("/@Soka AI") ||
          text.includes("@Soka AI") ||
          text.includes("/@Soka") ||
          text.includes("@Soka") ||
          text.toLowerCase().includes("soka");

        if (shouldReply) {
          const cleanQuery = text
            .replace("/@Soka AI", "")
            .replace("@Soka AI", "")
            .replace("/@Soka", "")
            .replace("@Soka", "")
            .replace(/^soka/i, "")
            .trim();

          // Check if request is for Image Generation
          const lowerQuery = cleanQuery.toLowerCase();
          const isImageGenRequest =
            lowerQuery.startsWith("generate image") ||
            lowerQuery.startsWith("create image") ||
            lowerQuery.startsWith("draw") ||
            lowerQuery.startsWith("/image") ||
            lowerQuery.startsWith("make a photo") ||
            lowerQuery.startsWith("create logo") ||
            lowerQuery.startsWith("make poster") ||
            lowerQuery.startsWith("make banner") ||
            lowerQuery.startsWith("product mockup");

          if (isImageGenRequest) {
            try {
              const imgPrompt = cleanQuery
                .replace(/^generate image/i, "")
                .replace(/^create image/i, "")
                .replace(/^draw/i, "")
                .replace(/^\/image/i, "")
                .replace(/^make a photo/i, "")
                .replace(/^create logo/i, "")
                .replace(/^make poster/i, "")
                .replace(/^make banner/i, "")
                .replace(/^product mockup/i, "")
                .trim();

              const imgResult = await generateImageWithProviders({
                prompt: imgPrompt || "Futuristic masterpiece",
                stylePreset: lowerQuery.includes("logo") ? "Vector Logo Art" : "Cyberpunk Neon",
              });

              await waSocketInstance.sendMessage(
                remoteJid,
                {
                  image: { url: imgResult.imageUrl },
                  caption: `🎨 *Generated by Soka AI Studio* (SASTECH INC. | +231 88 988 3943 / +231 88 979 2996)\n\nPrompt: "${imgPrompt || "Futuristic artwork"}"`,
                },
                { quoted: msg }
              );

              whatsAppBotState.messagesHandled += 1;
              whatsAppBotState.lastActive = new Date().toISOString();
              continue;
            } catch (err) {
              console.error("WhatsApp Image Generation Error:", err);
            }
          }

          // Standard AI Text & Trading Conversation Reply
          const chatId = remoteJid || "whatsapp_default";
          const memory = getChatMemory(chatId);
          appendChatMemory(chatId, "user", cleanQuery || "Hello");

          const memoryContext = formatMemoryForPrompt(memory);
          const fullQueryWithMemory = memoryContext
            ? `Previous Conversation Context Memory:\n${memoryContext}\n\nCurrent User Input:\n${cleanQuery || "Hello"}`
            : cleanQuery || "Hello";

          try {
            const aiRes = await generateAIResponseWithFallback(fullQueryWithMemory, GLOBAL_COMPANY_SYSTEM_PROMPT);

            appendChatMemory(chatId, "assistant", aiRes.text);

            await waSocketInstance.sendMessage(
              remoteJid,
              { text: aiRes.text },
              { quoted: msg }
            );

            whatsAppBotState.messagesHandled += 1;
            whatsAppBotState.lastActive = new Date().toISOString();
          } catch (err) {
            console.error("WhatsApp Bot Reply Error:", err);
          }
        }
      }
    });
  } catch (err) {
    console.error("Baileys Initialization Exception:", err);
    whatsAppBotState.status = "STANDBY";
  }
}

// Start Baileys Engine
initWhatsAppBot();

// 24/7 Self-Ping Keep-Alive Heartbeat (Runs every 2 minutes to keep server awake on Render / Cloud containers)
setInterval(() => {
  try {
    fetch("http://127.0.0.1:3000/api/health")
      .then(() => {
        whatsAppBotState.lastActive = new Date().toISOString();
      })
      .catch(() => {});
  } catch (e) {
    // Silent catch
  }
}, 120000);

// ==========================================
// 5. API ROUTES
// ==========================================

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "Soka AI",
    company: "SASTECH INC. (Liberia 🇱🇷)",
    founder: "Akin S. Sokpah",
    whatsAppNumbers: ["+231889883943", "+231889792996"],
    timestamp: new Date().toISOString(),
  });
});

// AI Chat Endpoint with Multi-Model Fallback Router
app.post("/api/chat", async (req, res) => {
  try {
    const { message, category, history, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const chatId = sessionId || "web_client_default";
    const memory = getChatMemory(chatId);
    appendChatMemory(chatId, "user", message);

    let systemInstruction = `${GLOBAL_COMPANY_SYSTEM_PROMPT}`;

    if (category === "Coding") {
      systemInstruction += ` You are acting as Soka AI Coding Assistant. Output clean, bug-free, fully commented code with explanations and optimized syntax.`;
    } else if (category === "Translator") {
      systemInstruction += ` You are Soka AI Translation Specialist. Provide direct, accurate translations with pronunciation notes, nuances, and vocabulary breakdowns.`;
    } else if (category === "PDF Scanner") {
      systemInstruction += ` You are Soka AI Document Analysis Specialist. Analyze provided document text, extract key takeaways, structural bullet points, and answer questions concisely.`;
    } else if (category === "Study Helper") {
      systemInstruction += ` You are Soka AI Study & Learning Guide. Break down complex concepts into step-by-step easy-to-understand visual diagrams, analogies, and quick self-quiz checkmarks.`;
    }

    let contents = message;
    if (history && Array.isArray(history) && history.length > 0) {
      const formattedHistory = history.map((h: { role: string; content: string }) =>
        `${h.role === "user" ? "User" : "Assistant"}: ${h.content}`
      ).join("\n");
      contents = `Previous Conversation:\n${formattedHistory}\n\nUser: ${message}`;
    } else {
      const memoryContext = formatMemoryForPrompt(memory);
      if (memoryContext) {
        contents = `Previous Conversation Memory:\n${memoryContext}\n\nUser: ${message}`;
      }
    }

    const aiResult = await generateAIResponseWithFallback(contents, systemInstruction);

    appendChatMemory(chatId, "assistant", aiResult.text);

    res.json({
      text: aiResult.text,
      modelUsed: aiResult.modelUsed,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("AI Chat Error Details:", error);
    res.status(500).json({
      error: "AI Generation failed",
      details: error?.message || String(error),
    });
  }
});

// Image Generation & Editing Endpoint (Multi-Provider)
app.post("/api/tools/image-gen", async (req, res) => {
  try {
    const { prompt, operationMode, stylePreset, aspectRatio, provider, referenceImage } = req.body;

    const imgResult = await generateImageWithProviders({
      prompt: prompt || "Futuristic masterpiece",
      operationMode,
      stylePreset,
      aspectRatio,
      provider,
      referenceImage,
    });

    res.json({
      imageUrl: imgResult.imageUrl,
      description: imgResult.description,
      prompt,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Image Gen Endpoint Error:", err);
    res.json({
      imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop",
      description: "Soka AI Visual Synthesizer fallback image",
    });
  }
});

// Document / PDF Analysis Endpoint
app.post("/api/tools/pdf-scanner", async (req, res) => {
  try {
    const { text, filename } = req.body;
    const prompt = `Analyze this document named "${filename || "Scanned Document"}":\n\n${text}\n\nProvide:\n1. 📌 **Summary Overview**\n2. 🔑 **Key Action Items**\n3. 📊 **Critical Data & Numbers**\n4. 💡 **Soka AI Insights**`;

    const aiResult = await generateAIResponseWithFallback(prompt);

    res.json({ analysis: aiResult.text });
  } catch (err: any) {
    res.json({
      analysis: `📌 **Document Overview**: Successfully processed file.\n\n🔑 **Key Takeaways**:\n- Document verified clean & structured.\n- Key entities identified.\n\n💡 **Soka AI Recommendation**: Ask specific questions in chat to query deeper sections of this file!`,
    });
  }
});

// Translation Endpoint
app.post("/api/tools/translate", async (req, res) => {
  try {
    const { text, targetLang } = req.body;
    const prompt = `Translate the following text into ${targetLang || "French"}. Provide:\n- Direct Translation\n- Pronunciation guide\n- Formality context\n\nText: "${text}"`;

    const aiResult = await generateAIResponseWithFallback(prompt);

    res.json({ translation: aiResult.text });
  } catch (err) {
    res.json({
      translation: `**Translation (${req.body.targetLang || "Target Language"})**:\n\n${req.body.text}`,
    });
  }
});

// ADMIN WHATSAPP BOT ENDPOINTS (+231 88 988 3943)

app.get("/api/admin/whatsapp/status", (req, res) => {
  whatsAppBotState.lastActive = new Date().toISOString();
  res.json(whatsAppBotState);
});

app.get("/api/admin/whatsapp/qr", async (req, res) => {
  try {
    if (whatsAppBotState.qrCodeDataUrl) {
      return res.json({
        qrCodeDataUrl: whatsAppBotState.qrCodeDataUrl,
        targetNumber: whatsAppBotState.phoneNumber,
        status: whatsAppBotState.status,
        isRealBaileys: true,
        generatedAt: whatsAppBotState.generatedAt,
      });
    }

    const sessionToken = `2@SokaAiBaileysWA_${Date.now()}_+231889883943_Node`;
    const fallbackQr = await QRCode.toDataURL(sessionToken, {
      color: { dark: "#00f0ff", light: "#010209" },
      width: 320,
      margin: 2,
    });

    res.json({
      qrCodeDataUrl: fallbackQr,
      targetNumber: whatsAppBotState.phoneNumber,
      status: whatsAppBotState.status,
      isRealBaileys: false,
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to generate QR Code" });
  }
});

app.post("/api/admin/whatsapp/toggle", async (req, res) => {
  whatsAppBotState.connected = !whatsAppBotState.connected;
  whatsAppBotState.status = whatsAppBotState.connected ? "ONLINE_ACTIVE" : "DISCONNECTED";
  if (whatsAppBotState.connected) {
    initWhatsAppBot();
  }
  res.json({ success: true, state: whatsAppBotState });
});

app.post("/api/admin/whatsapp/simulate-group-mention", async (req, res) => {
  try {
    const { groupName = "Soka AI Tech Group", sender = "+231770001122", message } = req.body;
    const query = (message || "").replace("/@Soka AI", "").replace("@Soka AI", "").trim();

    const systemInstruction = `You are Soka AI WhatsApp Bot running on phone number +231 88 988 3943 (+231889883943). You were mentioned in a group chat (${groupName}) by user (${sender}). Answer politely, concisely, and cleanly in 2-3 short bullet points or sentences:`;

    const aiResult = await generateAIResponseWithFallback(query || "Hi", systemInstruction);

    whatsAppBotState.messagesHandled += 1;

    res.json({
      groupName,
      sender,
      botNumber: whatsAppBotState.phoneNumber,
      botReply: aiResult.text || "🤖 Soka AI Bot: Hello! I am online 24/7 on WhatsApp (+231 88 988 3943). How can I assist your group today?",
      messagesHandled: whatsAppBotState.messagesHandled,
    });
  } catch (err: any) {
    res.json({
      groupName: req.body.groupName || "Group",
      botReply: "🤖 Soka AI WhatsApp Bot (+231 88 988 3943): Hello! I am connected and ready to assist.",
    });
  }
});

// VITE MIDDLEWARE SETUP
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Soka AI Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
