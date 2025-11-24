import { GoogleGenAI } from "@google/genai";

// Initialize AI client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const explainWord = async (word) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `英単語 "${word}" について、日本語で簡潔に解説してください。
      以下の内容を含めてください：
      1. 基本的な意味。
      2. 簡単な例文一つ（和訳付き）。
      3. ニュアンスや覚え方のヒント。
      プレーンテキストで出力してください。`,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text || "解説が見つかりませんでした。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "解説の取得に失敗しました。APIキーを確認してください。";
  }
};