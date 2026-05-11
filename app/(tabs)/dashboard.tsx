import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Bell, Calendar, TrendingUp, CheckCircle2, Clock, AlertCircle } from "lucide-react-native";

const { width } = Dimensions.get("window");

export default function Dashboard() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>Technician #42</Text>
          </View>
          <TouchableOpacity style={styles.notificationBtn}>
            <Bell color="#1B428A" size={22} />
          </TouchableOpacity>
        </View>

        {/* Stats Summary */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.primaryCard]}>
            <View style={styles.statIconContainer}>
              <TrendingUp color="white" size={20} />
            </View>
            <Text style={styles.statLabelLight}>Pending Jobs</Text>
            <Text style={styles.statValueLight}>12</Text>
          </View>
          <View style={[styles.statCard, styles.whiteCard]}>
            <View style={styles.statIconContainerSecondary}>
              <CheckCircle2 color="#C5A059" size={20} />
            </View>
            <Text style={styles.statLabelDark}>Completed</Text>
            <Text style={styles.statValueDark}>45</Text>
          </View>
        </View>

        {/* Active Job Card */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Job</Text>
        </View>
        
        <TouchableOpacity 
          activeOpacity={0.9}
          onPress={() => router.push("/job/active-01")}
          style={styles.activeJobCard}
        >
          <View style={styles.cardHeader}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>In Progress</Text>
            </View>
            <Text style={styles.timeText}>Started 2h ago</Text>
          </View>
          
          <Text style={styles.jobTitle}>HVAC System Repair</Text>
          <Text style={styles.jobLocation}>Building A - Floor 4, Server Room</Text>
          
          <View style={styles.cardFooter}>
            <View style={styles.deadlineIcon}>
              <Calendar color="#1B428A" size={14} />
            </View>
            <Text style={styles.deadlineText}>Deadline: Today, 4:00 PM</Text>
          </View>
        </TouchableOpacity>

        {/* Upcoming Jobs */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Upcoming Schedule</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {[1, 2].map((i) => (
          <View key={i} style={styles.upcomingCard}>
            <View style={styles.upcomingIconContainer}>
              <AlertCircle color="#C5A059" size={24} />
            </View>
            <View style={styles.flex1}>
              <Text style={styles.upcomingTitle}>Electrical Panel Check</Text>
              <Text style={styles.upcomingSubtitle}>Sector 02 • Tomorrow</Text>
            </View>
            <View style={styles.priorityBadge}>
              <Text style={styles.priorityText}>PRIORITY</Text>
            </View>
          </View>
        ))}
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
  },
  welcomeText: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: "500",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0f172a",
  },
  notificationBtn: {
    width: 48,
    height: 48,
    backgroundColor: "white",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(27, 66, 138, 0.1)",
    elevation: 2,
    shadowColor: "#1B428A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 24,
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  primaryCard: {
    backgroundColor: "#1B428A",
    shadowColor: "#1B428A",
  },
  whiteCard: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    shadowColor: "#cbd5e1",
  },
  statIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statIconContainerSecondary: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(197, 160, 89, 0.1)",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statLabelLight: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  statValueLight: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  statLabelDark: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  statValueDark: {
    color: "#1B428A",
    fontSize: 24,
    fontWeight: "bold",
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
  },
  activeJobCard: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#eff6ff",
    marginBottom: 32,
    elevation: 3,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  badge: {
    backgroundColor: "rgba(197, 160, 89, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
  },
  badgeText: {
    color: "#C5A059",
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  timeText: {
    color: "#94a3b8",
    fontSize: 12,
  },
  jobTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1B428A",
    marginBottom: 8,
  },
  jobLocation: {
    color: "#64748b",
    fontSize: 14,
    marginBottom: 24,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f8fafc",
  },
  deadlineIcon: {
    width: 32,
    height: 32,
    backgroundColor: "rgba(27, 66, 138, 0.05)",
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  deadlineText: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "500",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  viewAllText: {
    color: "#1B428A",
    fontWeight: "600",
  },
  upcomingCard: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  upcomingIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  flex1: {
    flex: 1,
  },
  upcomingTitle: {
    color: "#1e293b",
    fontWeight: "bold",
    fontSize: 16,
  },
  upcomingSubtitle: {
    color: "#64748b",
    fontSize: 12,
  },
  priorityBadge: {
    backgroundColor: "rgba(197, 160, 89, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    color: "#C5A059",
    fontSize: 10,
    fontWeight: "bold",
  },
});
