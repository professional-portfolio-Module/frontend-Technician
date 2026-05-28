import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ViewStyle, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Bell, AlertTriangle, CheckCircle2, ClipboardList, Clock } from "lucide-react-native";
import { StatusBar } from "expo-status-bar";
import apiClient from "../src/services/api";

const formatRelativeTime = (dateStr: string) => {
  if (!dateStr) return "";
  try {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    
    // Fallback for future dates or slight clock drift
    if (diffMs < 0) return "Just now";
    
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch (e) {
    return "";
  }
};

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      // 1. Get session to find username/email
      const sessionRes = await apiClient.get("/auth/session");
      if (sessionRes.data.success && sessionRes.data.data?.user_name) {
        const username = sessionRes.data.data.user_name;
        // 2. Get user profile to get UUID id
        const profileRes = await apiClient.get(`/AuthForward/auth/api/email/${username}`);
        if (profileRes.data.success && profileRes.data.data?.id) {
          const uid = profileRes.data.data.id;
          setUserId(uid);
          // 3. Fetch notifications from backend proxied through BFF
          const notificationsRes = await apiClient.get(`/Main/router-backend/api/notifications?userId=${uid}`);
          if (notificationsRes.data.success) {
            setNotifications(notificationsRes.data.data);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const getUiType = (type: string) => {
    switch (type) {
      case "task_assigned": return "job";
      case "task_completed": return "status";
      case "maintenance_due":
      case "task_expired": return "urgent";
      default: return "system";
    }
  };

  const getIcon = (type: string) => {
    const uiType = getUiType(type);
    switch (uiType) {
      case "urgent": return <AlertTriangle color="#ef4444" size={22} />;
      case "job": return <ClipboardList color="#1B428A" size={22} />;
      case "status": return <CheckCircle2 color="#10b981" size={22} />;
      default: return <Bell color="#C5A059" size={22} />;
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      // Optimistically update local UI state
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
      // API call to backend
      await apiClient.patch(`/Main/router-backend/api/notifications/${id}/read`);
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    if (!userId) return;
    try {
      // Optimistically update local UI state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      // API call to backend
      await apiClient.patch(`/Main/router-backend/api/notifications/read-all`, { userId });
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const uiType = getUiType(item.notification_type);
    const isUnread = !item.read;

    return (
      <TouchableOpacity 
        style={[styles.notificationCard, isUnread && styles.unreadCard]}
        onPress={() => isUnread && handleMarkAsRead(item.id)}
      >
        <View style={[styles.iconContainer, styles[`${uiType}Icon` as keyof typeof styles] as ViewStyle]}>
          {getIcon(item.notification_type)}
        </View>
        <View style={styles.content}>
          <View style={styles.cardHeader}>
            <Text style={[styles.title, isUnread && styles.unreadTitle]}>{item.title}</Text>
            {isUnread && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.message} numberOfLines={2}>{item.content}</Text>
          <View style={styles.timeRow}>
            <Clock color="#94a3b8" size={12} />
            <Text style={styles.timeText}>{formatRelativeTime(item.created_at)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color="#1B428A" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={handleMarkAllRead}>
          <Text style={styles.markAllText}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1B428A" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Bell color="#cbd5e1" size={60} />
              <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1B428A",
  },
  markAllText: {
    color: "#C5A059",
    fontSize: 12,
    fontWeight: "600",
  },
  listContent: {
    padding: 16,
  },
  notificationCard: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    gap: 16,
  },
  unreadCard: {
    borderColor: "rgba(27, 66, 138, 0.1)",
    backgroundColor: "#f0f7ff",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  urgentIcon: { backgroundColor: "#fef2f2" },
  jobIcon: { backgroundColor: "#f0f7ff" },
  statusIcon: { backgroundColor: "#f0fdf4" },
  systemIcon: { backgroundColor: "rgba(197, 160, 89, 0.05)" },
  content: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
    flex: 1,
  },
  unreadTitle: {
    color: "#1B428A",
  },
  unreadDot: {
    width: 8,
    height: 8,
    backgroundColor: "#1B428A",
    borderRadius: 4,
    marginLeft: 8,
    marginTop: 6,
  },
  message: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 18,
    marginBottom: 8,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timeText: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#94a3b8",
  },
});
