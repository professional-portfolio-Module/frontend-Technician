import apiClient from "./api";
import forge from "node-forge";

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const E2EE_SALT = "BROWNS_HOTELS_E2EE_SALT_2026";

interface RatchetSession {
  sendingChainKey: Uint8Array;
  receivingChainKey: Uint8Array;
}

// In-memory cache of active sessions
const activeSessions: Record<string, RatchetSession> = {};

function forgePBKDF2(password: string, salt: string, iterations: number, keySizeInBytes: number): Uint8Array {
  const derived = forge.pkcs5.pbkdf2(
    password,
    salt,
    iterations,
    keySizeInBytes,
    forge.md.sha256.create()
  );
  return new Uint8Array(forge.util.binary.raw.decode(derived));
}

function forgeHMAC(key: Uint8Array, message: string): Uint8Array {
  const hmac = forge.hmac.create();
  hmac.start('sha256', forge.util.createBuffer(forge.util.binary.raw.encode(key)));
  hmac.update(message);
  return new Uint8Array(forge.util.binary.raw.decode(hmac.digest().getBytes()));
}

function deriveInitialKeys(senderId: string, receiverId: string): RatchetSession {
  const sortedIds = [senderId, receiverId].sort().join(":");
  const passwordString = `${sortedIds}:${E2EE_SALT}`;
  
  const rawBaseBytes = forgePBKDF2(passwordString, E2EE_SALT, 1000, 64);
  const sendBytes = rawBaseBytes.slice(0, 32);
  const recvBytes = rawBaseBytes.slice(32, 64);
  
  const isInitiator = senderId < receiverId;
  const sendingChainKey = isInitiator ? sendBytes : recvBytes;
  const receivingChainKey = isInitiator ? recvBytes : sendBytes;
  
  return { sendingChainKey, receivingChainKey };
}

function kdfStep(chainKey: Uint8Array): { nextChainKey: Uint8Array; messageKey: Uint8Array } {
  const nextChainKey = forgeHMAC(chainKey, "chain-key-step");
  const messageKeyFull = forgeHMAC(chainKey, "message-key-step");
  const messageKey = messageKeyFull.slice(0, 32);
  return { nextChainKey, messageKey };
}

function encryptWithKey(text: string, messageKey: Uint8Array): string {
  const ivBytes = forge.random.getBytesSync(12);
  const iv = new Uint8Array(forge.util.binary.raw.decode(ivBytes));
  
  const cipher = forge.cipher.createCipher('AES-GCM', forge.util.binary.raw.encode(messageKey));
  cipher.start({
    iv: ivBytes,
    tagLength: 128 // 16 bytes
  });
  cipher.update(forge.util.createBuffer(text, 'utf8'));
  cipher.finish();
  const ciphertext = cipher.output.getBytes();
  const tag = cipher.mode.tag.getBytes();
  const combined = ciphertext + tag;
  
  const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, "0")).join("");
  const ciphertextBase64 = forge.util.encode64(combined);
  
  return `e2ee:${ivHex}:${ciphertextBase64}`;
}

function decryptWithKey(envelope: string, messageKey: Uint8Array): string {
  if (!envelope.startsWith("e2ee:")) {
    return envelope;
  }
  
  try {
    const parts = envelope.split(":");
    if (parts.length !== 3) return envelope;
    
    const ivHex = parts[1];
    const ciphertextBase64 = parts[2];
    
    const ivBytes = forge.util.binary.raw.encode(
      new Uint8Array(ivHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))
    );
    const combined = new Uint8Array(forge.util.binary.raw.decode(forge.util.decode64(ciphertextBase64)));
    
    if (combined.length <= 16) return envelope;
    
    const ciphertextBytes = combined.slice(0, combined.length - 16);
    const tagBytes = combined.slice(combined.length - 16);
    
    const decipher = forge.cipher.createDecipher('AES-GCM', forge.util.binary.raw.encode(messageKey));
    decipher.start({
      iv: ivBytes,
      tagLength: 128,
      tag: forge.util.createBuffer(tagBytes)
    });
    decipher.update(forge.util.createBuffer(ciphertextBytes));
    const success = decipher.finish();
    if (!success) {
      return "🔑 [Decryption Error: Key mismatch or tampered data]";
    }
    return forge.util.decodeUtf8(decipher.output.getBytes());
  } catch (err) {
    console.error("Decryption failed:", err);
    return "🔑 [Decryption Error: Key mismatch or tampered data]";
  }
}

export function getSafetyNumber(senderId: string, receiverId: string): string {
  const sortedIds = [senderId, receiverId].sort().join(":");
  const passwordString = `${sortedIds}:${E2EE_SALT}`;
  
  const md = forge.md.sha256.create();
  md.update(passwordString);
  const hashBytes = new Uint8Array(forge.util.binary.raw.decode(md.digest().getBytes()));
  
  let numberString = "";
  for (let i = 0; i < hashBytes.length; i += 2) {
    const val = (hashBytes[i] << 8) | (hashBytes[i+1] || 0);
    numberString += (val % 100000).toString().padStart(5, "0") + " ";
  }
  
  return numberString.trim().split(" ").slice(0, 5).join(" ");
}

export const messageService = {
  async getChatHistory(senderId: string, otherUserId: string): Promise<Message[]> {
    try {
      const response = await apiClient.get(
        `/Main/router-backend/api/messages/history/${otherUserId}`,
        { params: { sender_id: senderId } }
      );
      if (response.data && response.data.success) {
        const rawHistory: Message[] = response.data.data;
        
        let session = deriveInitialKeys(senderId, otherUserId);
        
        const decryptedHistory = [];
        for (const msg of rawHistory) {
          if (!msg.message.startsWith("e2ee:")) {
            decryptedHistory.push(msg);
            continue;
          }
          
          if (msg.sender_id === senderId) {
            const { nextChainKey, messageKey } = kdfStep(session.sendingChainKey);
            session.sendingChainKey = nextChainKey;
            
            const decryptedText = decryptWithKey(msg.message, messageKey);
            decryptedHistory.push({ ...msg, message: decryptedText });
          } else {
            const { nextChainKey, messageKey } = kdfStep(session.receivingChainKey);
            session.receivingChainKey = nextChainKey;
            
            const decryptedText = decryptWithKey(msg.message, messageKey);
            decryptedHistory.push({ ...msg, message: decryptedText });
          }
        }
        
        activeSessions[otherUserId] = session;
        return decryptedHistory;
      }
      return [];
    } catch (error) {
      console.error("Failed to fetch chat history:", error);
      return [];
    }
  },

  async sendMessage(senderId: string, receiverId: string, message: string): Promise<Message | null> {
    try {
      let session = activeSessions[receiverId];
      if (!session) {
        session = deriveInitialKeys(senderId, receiverId);
        activeSessions[receiverId] = session;
      }
      
      const { nextChainKey, messageKey } = kdfStep(session.sendingChainKey);
      session.sendingChainKey = nextChainKey;
      
      const encrypted = encryptWithKey(message, messageKey);
      const response = await apiClient.post("/Main/router-backend/api/messages", {
        sender_id: senderId,
        receiver_id: receiverId,
        message: encrypted,
      });
      
      if (response.data && response.data.success) {
        const msg = response.data.data;
        return {
          ...msg,
          message
        };
      }
      return null;
    } catch (error) {
      console.error("Failed to send message:", error);
      return null;
    }
  }
};

export default messageService;
