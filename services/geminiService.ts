
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { DialogueItem, HistoricalEvent } from "../types";
import { HOST_A_NAME, HOST_B_NAME } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Decoding helpers as per instructions
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

/**
 * Generates a podcast script based on a historical event.
 */
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

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            speaker: { type: Type.STRING, description: '主持人姓名' },
            text: { type: Type.STRING, description: '對話內容' }
          },
          required: ['speaker', 'text']
        }
      }
    }
  });

  return JSON.parse(response.text);
};

/**
 * Generates audio for the entire script using multi-speaker TTS.
 */
export const generatePodcastAudio = async (
  script: DialogueItem[],
  audioContext: AudioContext
): Promise<AudioBuffer> => {
  // Format the script into a single string for the TTS model to process
  const ttsText = script.map(item => `${item.speaker}：${item.text}`).join('\n');
  
  const prompt = `請將以下對話轉換成語音：\n${ttsText}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: [
            {
              speaker: HOST_A_NAME,
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Kore' } // More mature voice
              }
            },
            {
              speaker: HOST_B_NAME,
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Puck' } // Younger, active voice
              }
            }
          ]
        }
      }
    }
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error('未能生成語音數據');
  }

  const audioData = decodeBase64(base64Audio);
  return await decodeAudioData(audioData, audioContext, 24000, 1);
};
