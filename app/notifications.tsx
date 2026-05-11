import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Bell, AlertTriangle, CheckCircle2, ClipboardList, Clock } from "lucide-react-native";
import { StatusBar } from "expo-status-bar";

const MOCK_NOTIFICATIONS = [
  {
    id: "1",
    type: "urgent",
    title: "Critical Alert: Chiller 04",
    message: "Temperature exceeded threshold in Server Room B.",
    time: "5m ago",
    unread: true,
  },
  {
    id: "2",
    type: "job",
    title: "New Job Assigned",
    message: "You have been assigned to: Electrical Panel Review - Floor 2.",
    time: "1h ago",
    unread: true,
  },
  {
    id: "3",
    type: "status",
    title: "Check Completed",
    message: "Manager John Miller approved your check for HVAC Unit 01.",
    time: "Yesterday",
    unread: false,
  },
  {
    id: "4",
    type: "update",
    title: "Schedule Update",
    message: "Tomorrow's maintenance window has been moved to 10:00 AM.",
    time: "Yesterday",
    unread: false,
  }
];

export default function NotificationsScreen() {
  const router = useRouter();

  const getIcon = (type: string) => {
    switch (type) {
      case "urgent": return <AlertTriangle color="#ef4444" size={22} />;
      case "job": return <ClipboardList color="#1B428A" size={22} />;
      case "status": return <CheckCircle2 color="#10b981" size={22} />;
      default: return <Bell color="#C5A059" size={22} />;
    }
  };

  const renderItem = ({ item }: { item: typeof MOCK_NOTIFICATIONS[0] }) => (
    <TouchableOpacity style={[styles.notificationCard, item.unread && styles.unreadCard]}>
      <View style={[styles.iconContainer, styles[`${item.type}Icon` as keyof typeof styles]]}>
        {getIcon(item.type)}
      </View>
      <View style={styles.content}>
        <View style={styles.cardHeader}>
          <Text style={[styles.title, item.unread && styles.unreadTitle]}>{item.title}</Text>
          {item.unread && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
        <View style={styles.timeRow}>
          <Clock color="#94a3b8" size={12} />
          <Text style={styles.timeText}>{item.time}</Text>
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
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity>
          <Text style={styles.markAllText}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={MOCK_NOTIFICATIONS}
        keyExtractor={(item) => item.id}
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
  updateIcon: { backgroundColor: "rgba(197, 160, 89, 0.05)" },
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
