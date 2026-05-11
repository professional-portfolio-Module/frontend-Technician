import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Search, CheckCheck } from "lucide-react-native";
import { StatusBar } from "expo-status-bar";

const MOCK_CHATS = [
  {
    id: "1",
    name: "John Miller",
    role: "Maintenance Manager",
    lastMessage: "Please check the chiller unit in Basement 2.",
    time: "10:24 AM",
    unread: 2,
    online: true,
    avatar: "https://i.pravatar.cc/150?u=john",
  },
  {
    id: "2",
    name: "Sarah Chen",
    role: "Chief Engineer",
    lastMessage: "The weekly report looks good. Proceed with Floor 4.",
    time: "Yesterday",
    unread: 0,
    online: false,
    avatar: "https://i.pravatar.cc/150?u=sarah",
  },
  {
    id: "3",
    name: "Front Desk - Main",
    role: "Reception",
    lastMessage: "Room 402 reported a leak in the bathroom.",
    time: "Yesterday",
    unread: 0,
    online: true,
    avatar: "https://i.pravatar.cc/150?u=desk",
  }
];

export default function ChatList() {
  const router = useRouter();

  const renderItem = ({ item }: { item: typeof MOCK_CHATS[0] }) => (
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
          <Text style={[styles.chatTime, item.unread > 0 && styles.unreadTime]}>{item.time}</Text>
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
        <TouchableOpacity style={styles.searchBtn}>
          <Search color="#1B428A" size={22} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={MOCK_CHATS}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
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
  searchBtn: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
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
  unreadTime: {
    color: "#1B428A",
    fontWeight: "bold",
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
});
