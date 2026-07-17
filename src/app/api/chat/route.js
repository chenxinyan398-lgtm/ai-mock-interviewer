import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { messages, roleContext, language } = await request.json();

    const apiKey = process.env.NVIDIA_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "伺服器未設定 NVIDIA_API_KEY 環境變數" }, { status: 500 });
    }

    const defaultRole = "資深軟體工程師";
    const currentRole = roleContext || defaultRole;
    
    // 語言對應表，確保 Prompt 指示精確
    const langMap = {
      'zh-TW': '繁體中文 (Traditional Chinese)',
      'zh-CN': '簡體中文 (Simplified Chinese)',
      'en': '英文 (English)',
      'ja': '日文 (Japanese)'
    };
    
    const targetLang = langMap[language] || langMap['zh-TW'];
    
    const systemPrompt = `你現在是一位頂尖科技公司的「${currentRole}」面試官。
請根據候選人的回答進行專業的追問。
請嚴格遵守以下規則：
1. **語言限制：你必須完全使用「${targetLang}」來進行提問與回覆。絕對不可以使用其他語言。**
2. 語氣要符合該職位的專業度，如果是嚴厲的面試官請給予高壓的提問。
3. 一次只問一個問題，不要一口氣問太多。
4. 適時針對候選人的回答給予簡短的回饋。
5. 您可以使用 Markdown 語法來美化您的回覆，例如重點粗體或列點。`;

    const formattedMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map(msg => ({
        role: msg.role === "interviewer" ? "assistant" : "user",
        content: msg.content
      }))
    ];

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

    const replyText = data.choices[0].message.content;

    return NextResponse.json({ reply: replyText });
    
  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: "伺服器內部錯誤" }, { status: 500 });
  }
}
