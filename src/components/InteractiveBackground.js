"use client";

import { useEffect, useRef } from "react";

export default function InteractiveBackground({ theme }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    let animationFrameId;
    let particles = [];
    let width = window.innerWidth;
    let height = window.innerHeight;
    let mouse = { x: width / 2, y: height / 2 };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      initParticles();
    };

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    const initParticles = () => {
      particles = [];
      const particleCount = theme === 'universe' ? 400 : theme === 'nature' ? 150 : theme === 'tech' ? 120 : theme === 'ocean' ? 80 : 50;
      for (let i = 0; i < particleCount; i++) {
        particles.push(createParticle());
      }
    };

    const createParticle = () => {
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.5,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        life: Math.random() * 100, // 用於閃爍或搖擺的週期
        baseOpacity: Math.random() * 0.5 + 0.3, // 星星的基礎亮度
        colorPhase: Math.random() * Math.PI * 2, // 閃爍相位
      };
    };

    // --- 主題渲染邏輯 ---
    
    const drawUniverse = () => {
      // 1. 深邃宇宙底色 (帶有極為幽暗的藍紫色)
      const spaceGrad = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width);
      spaceGrad.addColorStop(0, "#080812");
      spaceGrad.addColorStop(1, "#010103");
      ctx.fillStyle = spaceGrad;
      ctx.fillRect(0, 0, width, height);

      const bhRadius = 250; // 黑洞影響範圍

      // 2. 實體星星與引力邏輯
      particles.forEach((p) => {
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // 星星閃爍邏輯 (Twinkling)
        let opacity = p.baseOpacity + Math.sin(p.life * 0.05 + p.colorPhase) * 0.4;
        opacity = Math.max(0.1, Math.min(1, opacity));
        
        if (dist < bhRadius * 1.5) {
          // 被黑洞吸入：產生麵條化 (Spaghettification) 拉扯效果
          const pull = (bhRadius * 1.5 - dist) * 0.001;
          p.x += dx * pull;
          p.y += dy * pull;
          
          // 畫出被吸入的光軌 (Streak)
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - dx * 0.1, p.y - dy * 0.1);
          ctx.strokeStyle = `rgba(255, 200, 100, ${opacity})`;
          ctx.lineWidth = p.size;
          ctx.stroke();
        } else {
          // 正常漂浮的點狀星星
          p.x += p.vx * 0.1;
          p.y += p.vy * 0.1;
          ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        
        p.life += 1;

        // 重生邏輯
        if (dist < 20 || p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
          Object.assign(p, createParticle());
          if (Math.random() > 0.5) {
            p.x = Math.random() < 0.5 ? 0 : width;
            p.y = Math.random() * height;
          } else {
            p.x = Math.random() * width;
            p.y = Math.random() < 0.5 ? 0 : height;
          }
        }
      });

      // 3. 擬真黑洞 (Accretion Disk + Event Horizon)
      const gradient = ctx.createRadialGradient(mouse.x, mouse.y, 10, mouse.x, mouse.y, bhRadius);
      gradient.addColorStop(0, "rgba(0, 0, 0, 1)"); // 事件視界 (絕對黑)
      gradient.addColorStop(0.12, "rgba(0, 0, 0, 1)"); 
      gradient.addColorStop(0.15, "rgba(255, 200, 100, 0.9)"); // 吸積盤超高溫內緣
      gradient.addColorStop(0.3, "rgba(100, 30, 80, 0.5)"); // 紫紅色扭曲光暈
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)"); // 融入宇宙
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, bhRadius, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawOcean = () => {
      // 擬真深海背景 (上淺下深)
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, "#073b4c");
      bgGrad.addColorStop(1, "#01101a");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 實體擬真氣泡 (帶有高光邊緣)
      particles.forEach((p) => {
        p.y -= (p.vy * 0.5 + 1) * (p.size * 0.4); // 大氣泡上升較快
        p.x += Math.sin(p.life * 0.05) * 0.8; // 有機率的搖擺
        p.life += 1;

        if (p.y < -50) {
          Object.assign(p, createParticle());
          p.y = height + 50;
          p.size = Math.random() * 3 + 1.5;
        }

        // 繪製有立體感的透明氣泡
        const bubGrad = ctx.createRadialGradient(p.x - p.size*0.5, p.y - p.size*0.5, 0, p.x, p.y, p.size * 2);
        bubGrad.addColorStop(0, "rgba(255, 255, 255, 0.8)"); // 左上角高光
        bubGrad.addColorStop(0.2, "rgba(255, 255, 255, 0.05)"); // 透明內部
        bubGrad.addColorStop(0.9, "rgba(255, 255, 255, 0.02)");
        bubGrad.addColorStop(1, "rgba(255, 255, 255, 0.4)"); // 邊緣折射
        
        ctx.fillStyle = bubGrad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
        ctx.fill();
      });

      // 體積光 (Volumetric Light Rays) 從滑鼠射向水底
      const lightGrad = ctx.createRadialGradient(mouse.x, -200, 0, mouse.x, height, height);
      lightGrad.addColorStop(0, "rgba(56, 189, 248, 0.15)");
      lightGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = lightGrad;
      
      ctx.beginPath();
      ctx.moveTo(mouse.x - 200, -200);
      ctx.lineTo(mouse.x + 200, -200);
      ctx.lineTo(mouse.x + 1000, height);
      ctx.lineTo(mouse.x - 1000, height);
      ctx.fill();
    };

    const drawTech = () => {
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "#38bdf8";
      ctx.strokeStyle = "rgba(56, 189, 248, 0.3)";
      ctx.lineWidth = 1;

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();

        // 節點連線
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = dx * dx + dy * dy;

          if (dist < 12000) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }

        // 滑鼠雷射連線
        const mdx = p.x - mouse.x;
        const mdy = p.y - mouse.y;
        if (mdx * mdx + mdy * mdy < 40000) {
          ctx.strokeStyle = "rgba(236, 72, 153, 0.8)"; // 粉紅色雷射
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
          ctx.strokeStyle = "rgba(56, 189, 248, 0.3)"; // 恢復預設藍色
        }
      });
    };

    const drawNature = () => {
      ctx.fillStyle = "#022c15"; // 深幽的森林底色
      ctx.fillRect(0, 0, width, height);

      // 擬真螢火蟲 (有生命週期與有機移動)
      particles.forEach((p) => {
        // 隨機有機飛行路徑
        p.vx += (Math.random() - 0.5) * 0.1;
        p.vy += (Math.random() - 0.5) * 0.1;
        // 限制最高速
        p.vx = Math.max(-1, Math.min(1, p.vx));
        p.vy = Math.max(-1, Math.min(1, p.vy));
        
        p.x += p.vx;
        p.y += p.vy;
        p.life += 0.03; // 呼吸燈頻率

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // 平滑的排斥力 (避免瞬間彈開)
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 250) {
          p.vx += dx * 0.0005;
          p.vy += dy * 0.0005;
        }

        // 呼吸燈特效 (Pulse)
        const pulse = Math.abs(Math.sin(p.life));
        
        if (pulse > 0.1) { // 只有發亮時才渲染，節省效能且更真實
          const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 8 * pulse);
          glow.addColorStop(0, `rgba(163, 230, 53, ${pulse})`); // 螢光黃綠色核心
          glow.addColorStop(0.3, `rgba(132, 204, 22, ${pulse * 0.5})`); // 擴散光暈
          glow.addColorStop(1, "rgba(132, 204, 22, 0)");
          
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 8 * pulse, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // 溫暖的環境陽光灑落
      const sunGrad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 800);
      sunGrad.addColorStop(0, "rgba(253, 224, 71, 0.15)");
      sunGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 800, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawDefault = () => {
      // 適用於 Sky, Life, Corporate 的柔和光斑
      let baseColor = "#e0f2fe"; // Sky
      let glowColor = "rgba(255, 255, 255, 0.8)";
      
      if (theme === 'life') {
        baseColor = "#faf8f5";
        glowColor = "rgba(251, 146, 60, 0.2)";
      } else if (theme === 'corporate') {
        baseColor = "#e2e8f0";
        glowColor = "rgba(59, 130, 246, 0.15)";
      }

      ctx.fillStyle = baseColor;
      ctx.fillRect(0, 0, width, height);

      // 環境漂浮光斑
      particles.forEach((p) => {
        p.x += p.vx * 0.2;
        p.y += p.vy * 0.2;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.fillStyle = glowColor.replace(/0\.\d+\)$/, '0.05)'); // 降低透明度
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 15, 0, Math.PI * 2);
        ctx.fill();
      });

      // 滑鼠強光圈
      const gradient = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 800);
      gradient.addColorStop(0, glowColor);
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      
      switch (theme) {
        case 'universe': drawUniverse(); break;
        case 'ocean': drawOcean(); break;
        case 'tech': drawTech(); break;
        case 'nature': drawNature(); break;
        default: drawDefault(); break;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    // 初始化並啟動
    initParticles();
    render();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: -1,
        pointerEvents: "none",
      }}
    />
  );
}
