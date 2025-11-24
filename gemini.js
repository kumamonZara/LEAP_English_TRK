
let ai = null;

// Helper to safely get the API key in a browser environment
const getApiKey = () => {
  try {
    if (typeof process !== 'undefined' && process && process.env && process.env.API_KEY) {
      return process.env.API_KEY;
    }
  } catch (e) {
    // Ignore
  }
  return '';
};

export const explainWord = async (word) => {
  try {
    // Dynamic import to avoid top-level failures
    const { GoogleGenAI } = await import("@google/genai");
    
    if (!ai) {
      const apiKey = getApiKey();
      if (!apiKey) {
         console.warn("API Key not found");
         return "解説機能を利用するにはAPIキーの設定が必要です。(process.env.API_KEY)";
      }
      try {
        ai = new GoogleGenAI({ apiKey });
      } catch (initErr) {
        console.warn("AI Init failed:", initErr);
        return "AIサービスの初期化に失敗しました。";
      }
    }

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
    return "解説の取得に失敗しました。詳細: " + error.message;
  }
};
