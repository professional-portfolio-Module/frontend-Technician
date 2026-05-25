import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Bell, Calendar, TrendingUp, CheckCircle2, Clock, AlertCircle, MessageSquare, QrCode, HelpCircle, ArrowRight } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import apiClient from "../../src/services/api";

const { width } = Dimensions.get("window");

export default function Dashboard() {
  const router = useRouter();
  const { t } = useTranslation();
  const [userName, setUserName] = useState("Loading...");

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await apiClient.get("/auth/session");
        if (response.data.success && response.data.data?.user_name) {
          setUserName(response.data.data.user_name);
        } else {
          setUserName("Technician");
        }
      } catch (error) {
        console.error("Failed to fetch session:", error);
        setUserName("Technician");
      }
    };
    fetchSession();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>{t("welcome")},</Text>
            <Text style={styles.userName}>{userName}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.headerBtn}
              onPress={() => router.push("/chat")}
            >
              <MessageSquare color="#1B428A" size={22} />
              <View style={styles.unreadBadge} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerBtn}
              onPress={() => router.push("/notifications")}
            >
              <Bell color="#1B428A" size={22} />
            </TouchableOpacity>
          </View>
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

        {/* Quick Scan Section */}
        <TouchableOpacity 
          style={styles.scanHeroCard}
          onPress={() => router.push("/(tabs)/scan")}
          activeOpacity={0.9}
        >
          <View style={styles.scanHeroContent}>
            <View style={styles.scanIconLarge}>
              <QrCode color="white" size={32} />
            </View>
            <View>
              <Text style={styles.scanHeroTitle}>Scan Machine</Text>
              <Text style={styles.scanHeroSubtitle}>Instantly access machine profile</Text>
            </View>
          </View>
          <View style={styles.scanHeroBadge}>
            <Text style={styles.scanHeroBadgeText}>READY</Text>
          </View>
        </TouchableOpacity>

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
  headerActions: {
    flexDirection: "row",
    gap: 12,
  },
  headerBtn: {
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
    position: "relative",
  },
  unreadBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 10,
    height: 10,
    backgroundColor: "#ef4444",
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "white",
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
  scanHeroCard: {
    backgroundColor: "white",
    borderRadius: 28,
    padding: 20,
    marginBottom: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#C5A059",
    elevation: 8,
    shadowColor: "#C5A059",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  scanHeroContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  scanIconLarge: {
    width: 60,
    height: 60,
    backgroundColor: "#C5A059",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  scanHeroTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1B428A",
  },
  scanHeroSubtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  scanHeroBadge: {
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scanHeroBadgeText: {
    color: "#10b981",
    fontSize: 10,
    fontWeight: "bold",
  },
  guideCard: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  guideHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  guideTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dismissText: {
    fontSize: 12,
    color: "#94a3b8",
  },
  stepsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stepItem: {
    alignItems: "center",
    gap: 8,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  stepCircleActive: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#10b981",
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#64748b",
  },
  stepText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#94a3b8",
  },
});
