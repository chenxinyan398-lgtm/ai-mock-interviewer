"use client";

import { useState, useEffect } from "react";
import "./globals.css";

export default function Home() {
  const [messages, setMessages] = useState([
    { role: "interviewer", content: "您好！我是您的 AI 面試官。請先簡單自我介紹一下。" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState("正在載入面試小提示...");

  // 第二個 API 串接練習：使用公開 API 取得一句隨機名言或建議
  useEffect(() => {
    fetch("https://api.adviceslip.com/advice")
      .then((res) => res.json())
      .then((data) => setAdvice("面試小提示：" + data.slip.advice))
      .catch(() => setAdvice("保持自信，展現最真實的自己！"));
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      // 呼叫自己的後端 API (這樣就不會把 Nvidia API Key 放在前端)
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessages((prev) => [...prev, { role: "interviewer", content: data.reply }]);
      } else {
        setMessages((prev) => [...prev, { role: "interviewer", content: "抱歉，系統發生錯誤：" + data.error }]);
      }
    } catch (error) {
      setMessages((prev) => [...prev, { role: "interviewer", content: "網路連線異常，請稍後再試。" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="header">AI 模擬面試官</div>
      
      {/* 這是第二個 API 的展示區塊 */}
      <div className="advice-bar">{advice}</div>

      <div className="chat-box">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
        {loading && <div className="loading">面試官正在思考...</div>}
      </div>

      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="輸入您的回答..."
          disabled={loading}
        />
        <button onClick={sendMessage} disabled={loading}>
          送出
        </button>
      </div>
    </div>
  );
}
