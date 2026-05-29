import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Send, Phone, Paperclip, Shield, FileText } from "lucide-react-native";
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { StatusBar } from "expo-status-bar";
import apiClient from "../../src/services/api";
import { messageService, getSafetyNumber } from "../../src/services/messageService";

interface UIEventMessage {
  id: string;
  text: string;
  sender: "me" | "other";
  time: string;
  image?: string;
  file?: {
    name: string;
    size: number;
    uri: string;
  };
}

export default function ChatDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [messages, setMessages] = useState<UIEventMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [safetyNumber, setSafetyNumberVal] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load user info and initialize chat
  useEffect(() => {
    let active = true;
    let pollInterval: NodeJS.Timeout;

    const initializeChat = async () => {
      try {
        setLoading(true);
        // 1. Get current logged-in user
        const sessionRes = await apiClient.get("/auth/session");
        if (!active) return;
        if (sessionRes.data.success && sessionRes.data.data?.user_name) {
          const username = sessionRes.data.data.user_name;
          const profileRes = await apiClient.get(`/AuthForward/auth/api/email/${username}`);
          if (!active) return;
          if (profileRes.data.success && profileRes.data.data) {
            const currentU = profileRes.data.data;
            setCurrentUser(currentU);

            // 2. Fetch other user details
            const otherUserRes = await apiClient.get(`/Main/router-backend/api/users/${id}`);
            if (!active) return;
            if (otherUserRes.data && otherUserRes.data.success) {
              const otherU = otherUserRes.data.data;
              setOtherUser(otherU);

              // 3. Compute safety numbers
              const fingerPrint = await getSafetyNumber(currentU.id, otherU.id);
              setSafetyNumberVal(fingerPrint);

              // 4. Fetch initial chat history
              const history = await messageService.getChatHistory(currentU.id, otherU.id);
              if (!active) return;
              
              const mapped = history.map((msg: any) => ({
                id: msg.id,
                text: msg.message,
                sender: (msg.sender_id === currentU.id ? "me" : "other") as "me" | "other",
                time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              }));
              setMessages(mapped);

              // 5. Setup polling to fetch new messages every 3 seconds
              pollInterval = setInterval(async () => {
                const updatedHistory = await messageService.getChatHistory(currentU.id, otherU.id);
                if (active) {
                  const newMapped = updatedHistory.map((msg: any) => ({
                    id: msg.id,
                    text: msg.message,
                    sender: (msg.sender_id === currentU.id ? "me" : "other") as "me" | "other",
                    time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  }));
                  setMessages(newMapped);
                }
              }, 3000);
            }
          }
        }
      } catch (err) {
        console.error("Failed to initialize chat:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    initializeChat();

    return () => {
      active = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [id]);

  const handleSend = async () => {
    if (!inputText.trim() || !currentUser || !otherUser || sending) return;
    
    const textToSend = inputText;
    setInputText("");
    setSending(true);

    try {
      const sentMsg = await messageService.sendMessage(currentUser.id, otherUser.id, textToSend);
      if (sentMsg) {
        const localMsg: UIEventMessage = {
          id: sentMsg.id || Date.now().toString(),
          text: textToSend,
          sender: "me",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, localMsg]);
      } else {
        Alert.alert("Error", "Failed to send encrypted message.");
      }
    } catch (err) {
      console.error("Error sending message:", err);
      Alert.alert("Error", "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const showSafetyNumbers = () => {
    if (!otherUser || !safetyNumber) return;
    Alert.alert(
      "Safety Numbers (E2EE)",
      `To verify the end-to-end encryption with ${otherUser.name}, compare these numbers with their device:\n\n${safetyNumber}\n\nIf they match, your conversation is 100% secure.`,
      [{ text: "OK" }]
    );
  };

  const handleAttachMenu = () => {
    Alert.alert(
      "Share Attachment",
      "Choose the type of file you want to send",
      [
        { text: "Photo & Video", onPress: handlePhotoPick },
        { text: "Document (PDF, Docs)", onPress: handleDocumentPick },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const handlePhotoPick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const newMessage: UIEventMessage = {
        id: Date.now().toString(),
        text: "",
        image: result.assets[0].uri,
        sender: "me",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, newMessage]);
    }
  };

  const handleDocumentPick = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "*/*",
      copyToCacheDirectory: true,
    });

    if (!result.canceled) {
      const newMessage: UIEventMessage = {
        id: Date.now().toString(),
        text: "",
        file: {
          name: result.assets[0].name,
          size: result.assets[0].size || 0,
          uri: result.assets[0].uri,
        },
        sender: "me",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, newMessage]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <ChevronLeft color="#1B428A" size={28} />
            </TouchableOpacity>
            <Image 
              source={{ uri: otherUser ? `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.name)}&background=random` : "https://i.pravatar.cc/150?u=john" }} 
              style={styles.headerAvatar} 
            />
            <View>
              <Text style={styles.headerName}>{otherUser ? otherUser.name : "Loading..."}</Text>
              <Text style={styles.headerStatus}>{otherUser?.is_active ? "Online" : "Offline"}</Text>
            </View>
          </View>
          
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerIcon} onPress={showSafetyNumbers}>
              <Shield color="#C5A059" size={22} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIcon}>
              <Phone color="#1B428A" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#1B428A" />
            <Text style={styles.loadingText}>Fetching secure messages...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            onContentSizeChange={scrollToBottom}
            renderItem={({ item }) => (
              <View style={[styles.messageBubble, item.sender === "me" ? styles.myMessage : styles.otherMessage]}>
                {item.image && (
                  <Image source={{ uri: item.image }} style={styles.messageImage} />
                )}
                {item.file && (
                  <View style={styles.fileBubble}>
                    <View style={styles.fileIconBox}>
                      <FileText color="#1B428A" size={24} />
                    </View>
                    <View style={styles.fileInfo}>
                      <Text style={[styles.fileName, item.sender === "me" ? styles.myText : styles.otherText]} numberOfLines={1}>
                        {item.file.name}
                      </Text>
                      <Text style={styles.fileSize}>{(item.file.size / 1024).toFixed(1)} KB</Text>
                    </View>
                  </View>
                )}
                {item.text !== "" && (
                  <Text style={[styles.messageText, item.sender === "me" ? styles.myText : styles.otherText]}>
                    {item.text}
                  </Text>
                )}
                <Text style={styles.messageTime}>{item.time}</Text>
              </View>
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        <View style={styles.inputArea}>
          <TouchableOpacity style={styles.attachBtn} onPress={handleAttachMenu}>
            <Paperclip color="#94a3b8" size={22} />
          </TouchableOpacity>
          
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          
          <TouchableOpacity 
            style={[styles.sendBtn, (!inputText.trim() || sending) && styles.disabledSend]} 
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
          >
            {sending ? <ActivityIndicator color="white" size="small" /> : <Send color="white" size={20} />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn: {
    width: 32,
    height: 44,
    justifyContent: "center",
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#f1f5f9",
  },
  headerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
  },
  headerStatus: {
    fontSize: 12,
    color: "#10b981",
    fontWeight: "600",
  },
  headerRight: {
    flexDirection: "row",
    gap: 8,
  },
  headerIcon: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 20,
    gap: 16,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 16,
    borderRadius: 20,
    position: "relative",
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#1B428A",
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: "flex-start",
    backgroundColor: "white",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myText: {
    color: "white",
  },
  otherText: {
    color: "#1e293b",
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginBottom: 8,
  },
  fileBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
    minWidth: 180,
  },
  fileIconBox: {
    width: 44,
    height: 44,
    backgroundColor: "white",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: "bold",
  },
  fileSize: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
  },
  messageTime: {
    fontSize: 10,
    color: "rgba(148, 163, 184, 0.7)",
    marginTop: 4,
    alignSelf: "flex-end",
  },
  inputArea: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    gap: 12,
  },
  attachBtn: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 15,
    color: "#1e293b",
  },
  sendBtn: {
    width: 48,
    height: 48,
    backgroundColor: "#1B428A",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#1B428A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  disabledSend: {
    backgroundColor: "#94a3b8",
    elevation: 0,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748b",
  },
});
