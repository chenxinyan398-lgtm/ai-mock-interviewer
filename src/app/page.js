"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import InteractiveBackground from "../components/InteractiveBackground";
import "./globals.css";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Selection State
  const [role, setRole] = useState("軟體工程師");
  const [language, setLanguage] = useState("zh-TW");
  const [theme, setTheme] = useState("tech");
  
  // Interview Status & Timer
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [time, setTime] = useState(0); 
  
  // Voice State
  const [isRecording, setIsRecording] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const recognitionRef = useRef(null);
  const chatBoxRef = useRef(null);

  // Resume State
  const [resumeText, setResumeText] = useState("");
  const [resumeFileName, setResumeFileName] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // History & Summary State
  const [history, setHistory] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [interviewSummary, setInterviewSummary] = useState("");

  // Load History on Mount
  useEffect(() => {
    const saved = localStorage.getItem('interview_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch(e) {}
    }
  }, []);

  // Optimized Mouse Tracking for Dynamic Background
  const rafRef = useRef(null);
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
        document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
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

  const speakText = (text, index) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'en' ? 'en-US' : (language === 'ja' ? 'ja-JP' : (language === 'zh-CN' ? 'zh-CN' : 'zh-TW'));
      
      utterance.onstart = () => setSpeakingIndex(index);
      utterance.onend = () => setSpeakingIndex(null);
      utterance.onerror = () => setSpeakingIndex(null);

      window.speechSynthesis.speak(utterance);
    } else {
      alert("您的瀏覽器不支援語音朗讀功能。");
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
      // Pause
      setIsInterviewActive(false);
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setSpeakingIndex(null);
    } else {
      setIsInterviewActive(true);
      if (messages.length === 0) {
        const greeting = getGreetingMessage();
        setMessages([{ role: "interviewer", content: greeting }]);
        setTimeout(() => speakText(greeting, 0), 500);
      }
    }
  };

  const resetInterview = () => {
    setIsInterviewActive(false);
    setTime(0);
    setMessages([]);
    setInput("");
    setInterviewSummary("");
    setResumeText("");
    setResumeFileName("");
  };

  const endInterviewAndSummarize = async () => {
    if (messages.length === 0) return;
    setIsInterviewActive(false);
    setLoading(true);
    
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, roleContext: role, language, isSummary: true }),
      });
      const data = await response.json();
      if (response.ok) {
        setInterviewSummary(data.reply);
        setShowSummaryModal(true);
        
        // Save to history
        const newHistoryItem = {
          id: Date.now(),
          date: new Date().toLocaleString(),
          role,
          language,
          summary: data.reply,
          transcript: messages
        };
        const updatedHistory = [newHistoryItem, ...history];
        setHistory(updatedHistory);
        localStorage.setItem('interview_history', JSON.stringify(updatedHistory));
        
      } else {
        alert("產生總結失敗: " + data.error);
      }
    } catch (e) {
      alert("網路錯誤");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.type !== "application/pdf") {
      alert("請上傳 PDF 格式的履歷");
      return;
    }

    setIsUploading(true);
    setResumeFileName(file.name);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/parse-pdf", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setResumeText(data.text);
      } else {
        alert("解析失敗：" + data.error);
        setResumeFileName("");
      }
    } catch (err) {
      alert("上傳發生錯誤");
      setResumeFileName("");
    } finally {
      setIsUploading(false);
    }
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
        body: JSON.stringify({ messages: newMessages, roleContext: role, language, resumeText }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessages((prev) => [...prev, { role: "interviewer", content: data.reply }]);
        speakText(data.reply, newMessages.length);
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
    switch(roleType) {
      case '軟體工程師': return '/avatars/software.png';
      case '產品經理': return '/avatars/pm.png';
      case '極度嚴厲的技術總監': return '/avatars/director.png';
      case '行銷企劃': return '/avatars/marketing.png';
      default: return '/avatars/software.png';
    }
  };

  return (
    <div className="layout-wrapper" data-theme={theme}>
      <InteractiveBackground theme={theme} />
      
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo-area">
          <h1>🤖 Mock Interview</h1>
        </div>
        
        <div className="timer-display">
          {formatTime(time)}
        </div>

        <div className="control-group">
          <label>上傳履歷 (PDF)</label>
          <div className="upload-btn-wrapper">
            <button className="action-btn btn-outline" disabled={isInterviewActive || isUploading}>
              {isUploading ? "上傳中..." : resumeFileName ? "📄 " + resumeFileName : "📁 選擇 PDF 檔案"}
            </button>
            <input type="file" accept="application/pdf" onChange={handleFileUpload} disabled={isInterviewActive || isUploading} />
          </div>
          {resumeText && <small style={{color: '#4ade80'}}>履歷已載入，AI 將根據履歷提問</small>}
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

        <div className="control-group">
          <label>場景主題 (Theme)</label>
          <select 
            className="custom-select" 
            value={theme} 
            onChange={(e) => setTheme(e.target.value)}
          >
            <option value="tech">科技感 (Tech Cyber)</option>
            <option value="life">生活感 (Cozy Life)</option>
            <option value="corporate">公司感 (Corporate Office)</option>
            <option value="universe">宇宙感 (Deep Universe)</option>
            <option value="nature">大自然感 (Wild Nature)</option>
            <option value="ocean">大海感 (Deep Ocean)</option>
            <option value="sky">天空感 (Sky Bound)</option>
          </select>
        </div>

        <button 
          onClick={toggleInterview} 
          className={`action-btn ${isInterviewActive ? 'btn-danger' : 'btn-primary'}`}
          style={{marginTop: '20px'}}
        >
          {isInterviewActive ? '⏸️ 暫停面試' : (messages.length > 0 ? '▶️ 繼續面試' : '▶️ 開始面試')}
        </button>
        
        {messages.length > 0 && !isInterviewActive && (
          <button onClick={endInterviewAndSummarize} className="action-btn btn-success" style={{marginTop: '12px'}}>
            📝 結束並產生評分
          </button>
        )}

        {!isInterviewActive && messages.length > 0 && (
          <button onClick={resetInterview} className="action-btn btn-outline" style={{marginTop: '12px'}}>
            🔄 重新開始
          </button>
        )}

        <div className="sidebar-bottom-actions">
          <button onClick={exportChat} className="action-btn btn-outline">
            📥 匯出對話紀錄
          </button>
          <button onClick={() => setShowHistoryModal(true)} className="action-btn btn-outline">
            🗂️ 歷史紀錄
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="main-chat">
        <div className="chat-box" ref={chatBoxRef}>
          {messages.length === 0 && !isInterviewActive && (
            <div style={{textAlign: 'center', color: '#64748b', marginTop: '40px'}}>
              <h2>歡迎來到 AI 模擬面試系統</h2>
              <p>請先上傳您的履歷並在左側設定角色與語言，然後點擊「開始面試」。</p>
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <div key={idx} className={`message-row ${msg.role}`}>
              {msg.role === "interviewer" && (
                <img 
                  src={getAvatarUrl(role)} 
                  alt="Interviewer Avatar" 
                  className={`avatar ${speakingIndex === idx ? 'speaking-glow' : ''}`} 
                />
              )}
              <div className="message">
                {msg.role === "interviewer" && (
                  <button 
                    onClick={() => speakText(msg.content, idx)} 
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

      {/* Summary Modal */}
      {showSummaryModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>📊 面試評分報告</h2>
            <div className="markdown-body summary-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {interviewSummary}
              </ReactMarkdown>
            </div>
            <button onClick={() => setShowSummaryModal(false)} className="action-btn btn-primary" style={{marginTop: '20px'}}>
              關閉
            </button>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="modal-overlay">
          <div className="modal-content history-modal">
            <h2>🗂️ 歷史紀錄</h2>
            {history.length === 0 ? (
              <p style={{color: '#64748b'}}>尚無歷史紀錄。</p>
            ) : (
              <div className="history-list">
                {history.map((item) => (
                  <div key={item.id} className="history-item">
                    <div className="history-header">
                      <strong>{item.date}</strong>
                      <span className="badge">{item.role}</span>
                      <span className="badge">{item.language}</span>
                    </div>
                    <div className="history-summary markdown-body">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {item.summary ? item.summary.substring(0, 150) + "..." : "無總結內容"}
                      </ReactMarkdown>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setShowHistoryModal(false)} className="action-btn btn-primary" style={{marginTop: '20px'}}>
              關閉
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
