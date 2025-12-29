// force refresh deploy
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { DialogueItem, HistoricalEvent } from "../types";
import { HOST_A_NAME, HOST_B_NAME } from "../constants";

let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (!aiInstance) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing. Please check your GitHub Secrets or .env.local file.");
    }
    aiInstance = new GoogleGenAI(apiKey);
  }
  return aiInstance;
};

// Decoding helpers
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const generateScript = async (event: HistoricalEvent): Promise<DialogueItem[]> => {
  const prompt = `
    你是一位專門為台灣108課綱高中歷史學測編寫教材的專家。
    請為以下歷史事件編寫一段雙人 Podcast 對談腳本：
    事件：${event.title}
    關鍵字：${event.keywords.join('、')}
    內容：${event.description}

    兩位主持人：
    1. ${HOST_A_NAME}：資深歷史老師，博學、幽默，能深入淺出解釋歷史背後的邏輯與對學測的重要性。
    2. ${HOST_B_NAME}：好奇的高二學生，語氣活潑，會問一些學生常有的疑惑，並總結重點。

    要求：
    - 腳本長度約 8-10 個回合（來回對話）。
    - 重點放在「事件成因」、「過程關鍵轉折」以及「對後世/學測考試的重點影響」。
    - 語氣自然、像真正的廣播節目。
    - 請以 JSON 格式輸出。
  `;

  // 使用穩定的 Flash 模型，並將 apiClient 選項放在第二個參數
  const model = getAI().getGenerativeModel(
    { model: "gemini-1.5-flash" },
    // @ts-ignore
    { apiClient: 'fetch' }
  );

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            speaker: { type: Type.STRING },
            text: { type: Type.STRING }
          },
          required: ["speaker", "text"]
        }
      }
    }
  });

  return JSON.parse(result.response.text());
};

export const generatePodcastAudio = async (
  script: DialogueItem[],
  audioContext: AudioContext
): Promise<AudioBuffer> => {
  const ttsText = script.map(item => `${item.speaker}：${item.text}`).join('\n');
  const prompt = `請將以下對話轉換成語音：\n${ttsText}`;

  // 使用支援語音輸出的 Flash 模型，並將 apiClient 選項放在第二個參數
  const model = getAI().getGenerativeModel(
    { model: "gemini-1.5-flash" },
    // @ts-ignore
    { apiClient: 'fetch' }
  );

  const response = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: "Puck" }
        }
      }
    }
  });

  const base64Audio = response.response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error('未能生成語音數據');
  }

  const audioData = decodeBase64(base64Audio);
  return await decodeAudioData(audioData, audioContext, 24000, 1);
};