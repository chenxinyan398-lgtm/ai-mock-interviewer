"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./globals.css";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("軟體工程師");
  
  // Timer State
  const [time, setTime] = useState(0); 
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  // Voice State
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);
  
  const chatBoxRef = useRef(null);

  useEffect(() => {
    if (typeof window !== "undefined" && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'zh-TW';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + (prev ? " " : "") + transcript);
        setIsRecording(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  useEffect(() => {
    let interval;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  useEffect(() => {
    setMessages([
      { role: "interviewer", content: `您好！我是您的 AI 面試官（目前職位：**${role}**）。我們即將開始面試，請先簡單自我介紹一下。` }
    ]);
    setTime(0);
    setIsTimerRunning(false);
  }, [role]);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("您的瀏覽器不支援語音辨識功能，請使用 Google Chrome 瀏覽器。");
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-TW';
      window.speechSynthesis.speak(utterance);
    } else {
      alert("您的瀏覽器不支援語音朗讀功能。");
    }
  };

  const exportChat = () => {
    const textContent = messages.map(msg => 
      `${msg.role === 'interviewer' ? '面試官' : '候選人'}:\n${msg.content}\n`
    ).join('\n---\n');
    
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-transcript-${role}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    if (!isTimerRunning) setIsTimerRunning(true);

    const userMessage = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, roleContext: role }),
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
      <div className="header">
        <span>🤖 AI 模擬面試</span>
        <button onClick={exportChat} className="icon-btn" title="匯出對話紀錄">📥 匯出紀錄</button>
      </div>
      
      <div className="controls-bar">
        <div>
          <label>切換面試官角色：</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="軟體工程師">軟體工程師 (技術類)</option>
            <option value="產品經理">產品經理 (PM類)</option>
            <option value="極度嚴厲的技術總監">嚴厲的技術總監 (高壓)</option>
            <option value="行銷企劃">行銷企劃 (創意類)</option>
          </select>
        </div>
        <div className="timer" title="面試時間">
          ⏱️ {formatTime(time)}
        </div>
      </div>

      <div className="chat-box" ref={chatBoxRef}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            {msg.role === "interviewer" && (
              <button 
                onClick={() => speakText(msg.content)} 
                className="speaker-btn" 
                title="語音朗讀"
              >
                🔊
              </button>
            )}
            <div className="markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {msg.content}
              </ReactMarkdown>
            </div>
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
        <button 
          onClick={toggleRecording} 
          className={`voice-btn ${isRecording ? 'recording' : ''}`}
          title="語音輸入"
        >
          🎙️
        </button>
        <button onClick={sendMessage} disabled={loading} className="send-btn">
          送出
        </button>
      </div>
    </div>
  );
}
