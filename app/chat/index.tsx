import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, CheckCheck, MessageSquare } from "lucide-react-native";
import { StatusBar } from "expo-status-bar";
import apiClient from "../../src/services/api";

interface ChatContact {
  id: string;
  name: string;
  role: string;
  email: string;
  online: boolean;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
}

export default function ChatList() {
  const router = useRouter();
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChats = async () => {
      try {
        setLoading(true);
        // 1. Get current logged-in user session
        const sessionRes = await apiClient.get("/auth/session");
        if (sessionRes.data.success && sessionRes.data.data?.user_name) {
          const username = sessionRes.data.data.user_name;
          const profileRes = await apiClient.get(`/AuthForward/auth/api/email/${username}`);
          if (profileRes.data.success && profileRes.data.data) {
            const user = profileRes.data.data;
            
            // 2. Fetch users in same hotel
            const hotelId = user.hotelId || user.hotels?.[0]?.id;
            const usersRes = await apiClient.get("/Main/router-backend/api/users", {
              params: { hotel_id: hotelId }
            });
            
            if (usersRes.data && usersRes.data.success) {
              const allUsers = usersRes.data.data;
              // Filter out current user and map to contact structure
              const mappedContacts = allUsers
                .filter((u: any) => u.id !== user.id)
                .map((u: any) => ({
                  id: u.id,
                  name: u.name,
                  role: u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1).toLowerCase() : "Staff",
                  email: u.email,
                  online: u.is_active || false,
                  avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random`,
                  lastMessage: "Tap to view conversation safety numbers and chat",
                  time: "",
                  unread: 0
                }));
              setContacts(mappedContacts);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load contacts:", err);
      } finally {
        setLoading(false);
      }
    };
    loadChats();
  }, []);

  const renderItem = ({ item }: { item: ChatContact }) => (
    <TouchableOpacity 
      style={styles.chatCard}
      onPress={() => router.push(`/chat/${item.id}`)}
    >
      <View style={styles.avatarContainer}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        {item.online && <View style={styles.onlineDot} />}
      </View>
      
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatName}>{item.name}</Text>
          <Text style={styles.chatTime}>{item.time}</Text>
        </View>
        
        <Text style={styles.chatRole}>{item.role}</Text>
        
        <View style={styles.lastMsgRow}>
          <Text style={styles.lastMessage} numberOfLines={1}>{item.lastMessage}</Text>
          {item.unread > 0 ? (
            <View style={styles.unreadCount}>
              <Text style={styles.unreadText}>{item.unread}</Text>
            </View>
          ) : (
            <CheckCheck color="#94a3b8" size={16} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color="#1B428A" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={{ width: 44 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1B428A" />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      ) : contacts.length === 0 ? (
        <View style={styles.centerContainer}>
          <MessageSquare color="#cbd5e1" size={64} style={{ marginBottom: 16 }} />
          <Text style={styles.emptyText}>No contacts found in your hotel</Text>
        </View>
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1B428A",
  },
  listContent: {
    padding: 16,
  },
  chatCard: {
    flexDirection: "row",
    paddingVertical: 12,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
  },
  onlineDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    backgroundColor: "#10b981",
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "white",
  },
  chatInfo: {
    flex: 1,
    justifyContent: "center",
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  chatName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
  },
  chatTime: {
    fontSize: 12,
    color: "#94a3b8",
  },
  chatRole: {
    fontSize: 12,
    color: "#C5A059",
    fontWeight: "600",
    marginBottom: 4,
  },
  lastMsgRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    color: "#64748b",
    marginRight: 8,
  },
  unreadCount: {
    backgroundColor: "#1B428A",
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  unreadText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
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
  emptyText: {
    fontSize: 16,
    color: "#94a3b8",
    textAlign: "center",
  },
});
