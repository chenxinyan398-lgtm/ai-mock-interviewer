import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { messages } = await request.json();

    // 取得您的 API Key (需設定在 .env.local 檔案中: NVIDIA_API_KEY)
    const apiKey = process.env.NVIDIA_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "伺服器未設定 NVIDIA_API_KEY 環境變數" },
        { status: 500 }
      );
    }

    // 將前端傳來的使用者歷史對話，轉換為 Nvidia API 接受的格式
    // 同時加入一條 System Prompt (設定面試官的人設)
    const formattedMessages = [
      {
        role: "system",
        content: "你是一位科技公司的資深軟體工程師，正在面試一位候選人。請根據他的回答進行專業的追問。語氣要專業但友善，一次只問一個問題，不要一口氣問太多。"
      },
      ...messages.map(msg => ({
        role: msg.role === "interviewer" ? "assistant" : "user",
        content: msg.content
      }))
    ];

    // 呼叫 Nvidia 開放 API (以 Llama 3 8B 為例，您可以依照文件替換模型名稱)
    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "meta/llama-3.1-8b-instruct",
        messages: formattedMessages,
        temperature: 0.5,
        max_tokens: 512
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Nvidia API Error:", data);
      return NextResponse.json({ error: "Nvidia API 發生錯誤" }, { status: response.status });
    }

    // 擷取 AI 的回覆文字
    const replyText = data.choices[0].message.content;

    // 回傳給前端
    return NextResponse.json({ reply: replyText });
    
  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: "伺服器內部錯誤" }, { status: 500 });
  }
}
