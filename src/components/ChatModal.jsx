// src/components/ChatModal.jsx
import { useState, useEffect, useRef } from 'react';
import { X, Send } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';

// Servicio de chat integrado directamente
const sendMessage = async (shipmentId, senderId, senderName, message) => {
  try {
    await addDoc(collection(db, 'chats'), {
      shipmentId,
      senderId,
      senderName,
      message,
      timestamp: Timestamp.now(),
      read: false
    });
    return { success: true };
  } catch (error) {
    console.error('Error enviando mensaje:', error);
    return { success: false, error: error.message };
  }
};

const listenToMessages = (shipmentId, callback) => {
  const q = query(
    collection(db, 'chats'),
    where('shipmentId', '==', shipmentId),
    orderBy('timestamp', 'asc')
  );
  return onSnapshot(q, (snapshot) => {
    const messages = [];
    snapshot.forEach(doc => {
      messages.push({ id: doc.id, ...doc.data() });
    });
    callback(messages);
  });
};

export const ChatModal = ({ shipmentId, userData, isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !shipmentId) return;

    const unsubscribe = listenToMessages(shipmentId, (msgs) => {
      setMessages(msgs);
      scrollToBottom();
    });

    return () => unsubscribe();
  }, [isOpen, shipmentId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    setLoading(true);
    const result = await sendMessage(
      shipmentId,
      userData?.email,
      userData?.nombre || userData?.email,
      newMessage.trim()
    );
    if (result.success) {
      setNewMessage('');
    } else {
      alert('❌ Error enviando mensaje');
    }
    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div style={styles.overlay} onClick={onClose} />
      <div style={styles.modal}>
        <div style={styles.header}>
          <span style={styles.title}>💬 Chat del viaje</span>
          <button onClick={onClose} style={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        <div style={styles.messagesContainer}>
          {messages.length === 0 ? (
            <div style={styles.empty}>No hay mensajes aún</div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  ...styles.message,
                  ...(msg.senderId === userData?.email
                    ? styles.messageOwn
                    : styles.messageOther)
                }}
              >
                <div style={styles.messageSender}>{msg.senderName}</div>
                <div style={styles.messageText}>{msg.message}</div>
                <div style={styles.messageTime}>
                  {msg.timestamp?.toDate?.()?.toLocaleTimeString() || ''}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div style={styles.inputContainer}>
          <input
            type="text"
            placeholder="Escribe un mensaje..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            style={styles.input}
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !newMessage.trim()}
            style={styles.sendBtn}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 2000,
  },
  modal: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '80vh',
    background: 'white',
    borderRadius: '20px 20px 0 0',
    zIndex: 2001,
    display: 'flex',
    flexDirection: 'column',
    animation: 'slideUp 0.3s ease',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #eee',
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1a1a2e',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    color: '#888',
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 20px',
    minHeight: '200px',
    maxHeight: '50vh',
  },
  empty: {
    textAlign: 'center',
    color: '#888',
    padding: '40px 0',
  },
  message: {
    marginBottom: '12px',
    maxWidth: '80%',
    padding: '10px 14px',
    borderRadius: '16px',
    wordBreak: 'break-word',
  },
  messageOwn: {
    alignSelf: 'flex-end',
    background: '#667eea',
    color: 'white',
    marginLeft: 'auto',
    borderBottomRightRadius: '4px',
  },
  messageOther: {
    alignSelf: 'flex-start',
    background: '#f0f0f0',
    color: '#333',
    borderBottomLeftRadius: '4px',
  },
  messageSender: {
    fontSize: '11px',
    fontWeight: '600',
    marginBottom: '4px',
    opacity: 0.8,
  },
  messageText: {
    fontSize: '14px',
    lineHeight: 1.4,
  },
  messageTime: {
    fontSize: '10px',
    opacity: 0.6,
    marginTop: '4px',
    textAlign: 'right',
  },
  inputContainer: {
    display: 'flex',
    gap: '8px',
    padding: '12px 16px',
    borderTop: '1px solid #eee',
    background: '#fafafa',
    borderRadius: '0 0 20px 20px',
  },
  input: {
    flex: 1,
    padding: '10px 14px',
    border: '1px solid #ddd',
    borderRadius: '24px',
    fontSize: '14px',
    outline: 'none',
  },
  sendBtn: {
    padding: '10px 16px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s',
  },
};

// Animación
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes slideUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
`;
document.head.appendChild(styleSheet);