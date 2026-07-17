"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./globals.css";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Selection State
  const [role, setRole] = useState("軟體工程師");
  const [language, setLanguage] = useState("zh-TW");
  
  // Interview Status & Timer
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [time, setTime] = useState(0); 
  
  // Voice State
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);
  
  const chatBoxRef = useRef(null);

  // Mouse Tracking for Dynamic Background
  useEffect(() => {
    const handleMouseMove = (e) => {
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined" && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
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

  // Update Recognition Language based on state
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language === 'en' ? 'en-US' : (language === 'ja' ? 'ja-JP' : (language === 'zh-CN' ? 'zh-CN' : 'zh-TW'));
    }
  }, [language]);

  // Timer logic
  useEffect(() => {
    let interval;
    if (isInterviewActive) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isInterviewActive]);

  // Auto-scroll
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
      utterance.lang = language === 'en' ? 'en-US' : (language === 'ja' ? 'ja-JP' : (language === 'zh-CN' ? 'zh-CN' : 'zh-TW'));
      window.speechSynthesis.speak(utterance);
    }
  };

  const exportChat = () => {
    if (messages.length === 0) return;
    const textContent = messages.map(msg => 
      `${msg.role === 'interviewer' ? '面試官' : '候選人'}:\n${msg.content}\n`
    ).join('\n---\n');
    
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-transcript.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const getGreetingMessage = () => {
    switch(language) {
      case 'en': return `Hello! I am your AI Interviewer (Role: **${role}**). We are about to start the interview. Please briefly introduce yourself.`;
      case 'ja': return `こんにちは！私はあなたのAI面接官（役職：**${role}**）です。面接を始めましょう。まずは簡単に自己紹介をお願いします。`;
      case 'zh-CN': return `您好！我是您的 AI 面试官（当前职位：**${role}**）。我们即将开始面试，请先简单自我介绍一下。`;
      default: return `您好！我是您的 AI 面試官（目前職位：**${role}**）。我們即將開始面試，請先簡單自我介紹一下。`;
    }
  };

  const toggleInterview = () => {
    if (isInterviewActive) {
      setIsInterviewActive(false);
    } else {
      setIsInterviewActive(true);
      if (messages.length === 0) {
        setMessages([{ role: "interviewer", content: getGreetingMessage() }]);
      }
    }
  };

  const resetInterview = () => {
    setIsInterviewActive(false);
    setTime(0);
    setMessages([]);
    setInput("");
  };

  const sendMessage = async () => {
    if (!input.trim() || !isInterviewActive) return;

    const userMessage = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, roleContext: role, language: language }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessages((prev) => [...prev, { role: "interviewer", content: data.reply }]);
      } else {
        setMessages((prev) => [...prev, { role: "interviewer", content: "System Error: " + data.error }]);
      }
    } catch (error) {
      setMessages((prev) => [...prev, { role: "interviewer", content: "Network Error." }]);
    } finally {
      setLoading(false);
    }
  };

  const getAvatarUrl = (roleType) => {
    const seed = encodeURIComponent(roleType);
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
  };

  return (
    <div className="layout-wrapper">
      <div className="interactive-bg"></div>
      
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo-area">
          <h1>🤖 Mock Interview</h1>
        </div>
        
        <div className="timer-display">
          {formatTime(time)}
        </div>

        <div className="control-group">
          <label>面試角色 (Role)</label>
          <select 
            className="custom-select" 
            value={role} 
            onChange={(e) => setRole(e.target.value)}
            disabled={isInterviewActive && messages.length > 0}
          >
            <option value="軟體工程師">軟體工程師</option>
            <option value="產品經理">產品經理</option>
            <option value="資料科學家">資料科學家</option>
            <option value="行銷企劃">行銷企劃</option>
            <option value="極度嚴厲的技術總監">嚴厲的技術總監</option>
          </select>
        </div>

        <div className="control-group">
          <label>面試語言 (Language)</label>
          <select 
            className="custom-select" 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            disabled={isInterviewActive && messages.length > 0}
          >
            <option value="zh-TW">繁體中文</option>
            <option value="zh-CN">簡體中文</option>
            <option value="en">English</option>
            <option value="ja">日本語</option>
          </select>
        </div>

        <button 
          onClick={toggleInterview} 
          className={`action-btn ${isInterviewActive ? 'btn-danger' : 'btn-primary'}`}
          style={{marginTop: '20px'}}
        >
          {isInterviewActive ? '⏸️ 暫停/結束面試' : '▶️ 開始面試'}
        </button>
        
        {!isInterviewActive && messages.length > 0 && (
          <button onClick={resetInterview} className="action-btn btn-outline" style={{marginTop: '12px'}}>
            🔄 重新開始
          </button>
        )}

        <button onClick={exportChat} className="action-btn btn-outline">
          📥 匯出對話紀錄
        </button>
      </aside>

      {/* Main Chat Area */}
      <main className="main-chat">
        <div className="chat-box" ref={chatBoxRef}>
          {messages.length === 0 && !isInterviewActive && (
            <div style={{textAlign: 'center', color: '#64748b', marginTop: '40px'}}>
              <h2>歡迎來到 AI 模擬面試系統</h2>
              <p>請先在左側設定角色與語言，然後點擊「開始面試」。</p>
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <div key={idx} className={`message-row ${msg.role}`}>
              {msg.role === "interviewer" && (
                <img src={getAvatarUrl(role)} alt="Interviewer Avatar" className="avatar" />
              )}
              <div className="message">
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
              {msg.role === "user" && (
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=Candidate`} alt="Candidate Avatar" className="avatar" />
              )}
            </div>
          ))}
          {loading && (
            <div className="message-row interviewer">
              <img src={getAvatarUrl(role)} alt="Interviewer Avatar" className="avatar" />
              <div className="loading">面試官正在思考...</div>
            </div>
          )}
        </div>

        <div className="input-container">
          <div className="input-box">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder={isInterviewActive ? "輸入您的回答..." : "請先點擊「開始面試」"}
              disabled={!isInterviewActive || loading}
            />
            <button 
              onClick={toggleRecording} 
              className={`voice-btn ${isRecording ? 'recording' : ''}`}
              title="語音輸入"
              disabled={!isInterviewActive || loading}
            >
              🎙️
            </button>
            <button 
              onClick={sendMessage} 
              disabled={!isInterviewActive || loading || !input.trim()} 
              className="send-btn"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="white"/>
              </svg>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
