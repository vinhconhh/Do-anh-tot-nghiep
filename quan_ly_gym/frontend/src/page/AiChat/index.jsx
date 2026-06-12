import { useState, useEffect, useCallback, useContext, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bot, Send, Loader2, Dumbbell } from "lucide-react";
import styles from "./AiChat.module.scss";
import { AuthContext } from "../../context/AuthContext";
import { useAiApi } from "../../api/aiApi";

export default function AiChat() {
  const { user } = useContext(AuthContext) ?? {};
  const aiApi = useAiApi();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const bottomRef = useRef(null);
  
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const hist = await aiApi.getChatHistory();
        setMessages(hist);
      } catch (e) {
        console.error("AiChat Load Error:", e);
      } finally {
        setHistoryLoaded(true);
      }
    })();
  }, [aiApi]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    setMessages(prev => [...prev, { role: "user", content: text, time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) }]);
    setInput("");
    setSending(true);

    try {
      const res = await aiApi.chat(text);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: res.response,
        time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      }]);
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

  const handleAutoSend = useCallback(async (promptText) => {
    if (!promptText || sending) return;

    setMessages(prev => [...prev, { role: "user", content: promptText, time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) }]);
    setSending(true);

    try {
      const res = await aiApi.chat(promptText);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: res.response,
        time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      }]);
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
  }, [aiApi, sending]);

  useEffect(() => {
    if (location.state?.initialPrompt && historyLoaded) {
      const promptToSync = location.state.initialPrompt;
      navigate(location.pathname, { replace: true, state: {} });
      handleAutoSend(promptToSync);
    }
  }, [location.state, historyLoaded, handleAutoSend, navigate, location.pathname]);

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
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.botIcon}><Dumbbell size={22} /></div>
            <div>
              <h2 className={styles.title}>Hỏi đáp AI Gym</h2>
              <p className={styles.subtitle}>Chuyên gia tư vấn tập gym & tập tại nhà</p>
            </div>
          </div>
        </div>

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
                <pre className={styles.bubbleContent}>{msg.content}</pre>
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
