import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Send, Phone, MoreVertical, Paperclip, Image as ImageIcon, FileText, Camera } from "lucide-react-native";
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { StatusBar } from "expo-status-bar";

const MOCK_MESSAGES = [
  { id: "1", text: "Hello! Did you check the chiller unit yet?", sender: "other", time: "10:15 AM" },
  { id: "2", text: "I'm heading there now. Just finished the HVAC on Floor 4.", sender: "me", time: "10:20 AM" },
  { id: "3", text: "Great. Please check the pressure valves specifically.", sender: "other", time: "10:24 AM" },
];

export default function ChatDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [inputText, setInputText] = useState("");

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    
    const newMessage = {
      id: Date.now().toString(),
      text: inputText,
      sender: "me",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInputText("");
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
      const newMessage = {
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
      const newMessage = {
        id: Date.now().toString(),
        text: "",
        file: {
          name: result.assets[0].name,
          size: result.assets[0].size,
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
              source={{ uri: "https://i.pravatar.cc/150?u=john" }} 
              style={styles.headerAvatar} 
            />
            <View>
              <Text style={styles.headerName}>John Miller</Text>
              <Text style={styles.headerStatus}>Online</Text>
            </View>
          </View>
          
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerIcon}>
              <Phone color="#1B428A" size={20} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIcon}>
              <MoreVertical color="#1B428A" size={20} />
            </TouchableOpacity>
          </View>
        </View>

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
            style={[styles.sendBtn, !inputText.trim() && styles.disabledSend]} 
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Send color="white" size={20} />
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
});
