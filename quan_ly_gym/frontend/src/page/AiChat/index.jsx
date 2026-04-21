import { useState, useEffect, useCallback, useContext, useRef } from "react";
import { Bot, Send, Loader2, Dumbbell, Trash2 } from "lucide-react";
import styles from "./AiChat.module.scss";
import { AuthContext } from "../../context/AuthContext";
import { authedRequestJson } from "../../api/client";

export default function AiChat() {
  const { token, logout } = useContext(AuthContext) ?? {};
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [remaining, setRemaining] = useState(null);
  const bottomRef = useRef(null);

  const aj = useCallback(
    async (path, opt = {}) => {
      try {
        return await authedRequestJson(path, token, opt);
      } catch (e) {
        if (e?.status === 401) logout?.();
        throw e;
      }
    },
    [token, logout]
  );

  // Load history + quota on mount
  useEffect(() => {
    (async () => {
      try {
        const [hist, quota] = await Promise.all([
          aj("/api/ai/chat-history"),
          aj("/api/ai/quota"),
        ]);
        setMessages(hist);
        setRemaining(quota.remaining);
      } catch (e) { console.error(e); }
    })();
  }, [aj]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    // Add user message immediately
    setMessages(prev => [...prev, { role: "user", content: text, time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) }]);
    setInput("");
    setSending(true);

    try {
      const res = await aj("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text }),
      });
      setMessages(prev => [...prev, {
        role: "assistant",
        content: res.response,
        time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      }]);
      setRemaining(res.remainingQuota);
    } catch (e) {
      const errMsg = e.data?.detail || e.message || "Lỗi không xác định";
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `❌ ${errMsg}`,
        time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      }]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <div className={styles.tab} />
      <div className={styles.page}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.botIcon}><Dumbbell size={22} /></div>
            <div>
              <h2 className={styles.title}>Hỏi đáp AI Gym</h2>
              <p className={styles.subtitle}>Chuyên gia tư vấn tập gym & tập tại nhà</p>
            </div>
          </div>
          <div className={styles.quotaBadge}>
            <Bot size={14} /> {remaining !== null ? `${remaining} lượt còn lại` : "..."}
          </div>
        </div>

        {/* Chat area */}
        <div className={styles.chatArea}>
          {messages.length === 0 && (
            <div className={styles.welcome}>
              <div className={styles.welcomeIcon}><Dumbbell size={48} /></div>
              <h3>Xin chào! 💪</h3>
              <p>Tôi là chuyên gia tư vấn tập gym và tập luyện tại nhà.</p>
              <p>Hãy hỏi tôi về bài tập, lịch tập, dinh dưỡng, giảm mỡ, tăng cơ...</p>
              <div className={styles.suggestions}>
                {[
                  "Làm thế nào để giảm mỡ bụng?",
                  "Cho tôi lịch tập 4 buổi/tuần",
                  "Bài tập tại nhà cho người mới",
                  "Nên ăn gì trước khi tập gym?",
                ].map(s => (
                  <button key={s} className={styles.suggestBtn} onClick={() => { setInput(s); }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`${styles.message} ${styles[msg.role]}`}>
              {msg.role === "assistant" && (
                <div className={styles.avatar}><Dumbbell size={16} /></div>
              )}
              <div className={styles.bubble}>
                <div className={styles.bubbleContent}>{msg.content}</div>
                <div className={styles.bubbleTime}>{msg.time}</div>
              </div>
            </div>
          ))}

          {sending && (
            <div className={`${styles.message} ${styles.assistant}`}>
              <div className={styles.avatar}><Dumbbell size={16} /></div>
              <div className={styles.bubble}>
                <div className={styles.typing}>
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className={styles.inputBar}>
          <textarea
            className={styles.inputField}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Hỏi về tập gym, tập tại nhà, dinh dưỡng..."
            rows={1}
            disabled={sending}
          />
          <button
            className={styles.sendBtn}
            onClick={handleSend}
            disabled={!input.trim() || sending}
          >
            {sending ? <Loader2 size={18} className={styles.spinner} /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </>
  );
}
