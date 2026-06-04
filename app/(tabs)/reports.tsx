import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Send, FileText } from "lucide-react-native";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect } from "expo-router";
import apiClient from "../../src/services/api";
import { reportService, ReportItem } from "../../src/services/reportService";

export default function ReportsScreen() {
  const [reportText, setReportText] = useState("");
  const [isCritical, setIsCritical] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [hasLoadedInitially, setHasLoadedInitially] = useState(false);
  
  const [userId, setUserId] = useState<string | null>(null);
  const [hotelId, setHotelId] = useState<string | null>(null);
  const [history, setHistory] = useState<ReportItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchSessionAndHistory = async () => {
        try {
          if (!hasLoadedInitially) {
            setLoadingHistory(true);
          }
          const sessionRes = await apiClient.get("/auth/session");
          if (!isActive) return;

          if (sessionRes.data.success && sessionRes.data.data?.user_name) {
            const username = sessionRes.data.data.user_name;
            const profileRes = await apiClient.get(`/AuthForward/auth/api/email/${username}`);
            if (!isActive) return;

            if (profileRes.data.success && profileRes.data.data) {
              const userData = profileRes.data.data;
              const uid = userData.id;
              const hid = userData.hotelId || userData.hotels?.[0]?.id;

              setUserId(uid);
              setHotelId(hid);

              if (hid && uid) {
                const reports = await reportService.getRecentReports(hid, uid);
                if (!isActive) return;
                setHistory(reports);
              }
            }
          }
        } catch (err) {
          console.error("Failed to load weekly reports history:", err);
        } finally {
          if (isActive) {
            setLoadingHistory(false);
            setHasLoadedInitially(true);
          }
        }
      };

      fetchSessionAndHistory();

      return () => {
        isActive = false;
      };
    }, [])
  );

  const handleSubmit = async () => {
    if (!reportText.trim()) {
      Alert.alert("Error", "Please provide report details.");
      return;
    }

    if (!hotelId || !userId) {
      Alert.alert("Error", "User session not loaded yet. Please try again.");
      return;
    }

    setIsSubmitting(true);
    try {
      const recipient = isCritical ? "Engineer" : "Manager";
      const newReport = await reportService.submitReport({
        hotel_id: hotelId,
        technician_id: userId,
        report_text: reportText.trim(),
        is_critical: isCritical,
      });

      setHistory((prev) => [newReport, ...prev]);
      setReportText("");
      setIsCritical(false);

      Alert.alert(
        "Report Sent",
        `Your weekly report has been routed to the ${recipient}.`
      );
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to submit report");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Weekly Reports</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <FileText color="#1B428A" size={24} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Reporting Guidelines</Text>
            <Text style={styles.infoText}>Summarize maintenance activities. Critical issues are auto-routed to the duty engineer.</Text>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Summary of Activities</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Describe work completed, issues found, and pending tasks..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={6}
              value={reportText}
              onChangeText={setReportText}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleLabelGroup}>
              <Text style={styles.toggleLabel}>Mark as Critical</Text>
              <Text style={styles.toggleSublabel}>Escalate directly to engineering team</Text>
            </View>
            <TouchableOpacity 
              style={[styles.toggle, isCritical && styles.toggleActive]} 
              onPress={() => setIsCritical(!isCritical)}
            >
              <View style={[styles.toggleCircle, isCritical && styles.toggleCircleActive]} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.submitBtn, isSubmitting && styles.disabledBtn]} 
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text style={styles.submitBtnText}>Submit Report</Text>
              <Send color="white" size={20} />
            </>
          )}
        </TouchableOpacity>

        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Recent Submissions</Text>
          <View style={styles.historyCard}>
            {loadingHistory ? (
              <ActivityIndicator color="#1B428A" style={{ margin: 20 }} />
            ) : history.length === 0 ? (
              <View style={styles.historyItem}>
                <View style={styles.historyStatus}>
                  <FileText color="#94a3b8" size={16} />
                </View>
                <View style={styles.historyDetails}>
                  <Text style={styles.historyDate}>No submissions yet</Text>
                  <Text style={styles.historySummary}>Your submitted reports will appear here.</Text>
                </View>
              </View>
            ) : (
              history.map((item, index) => {
                const dateObj = new Date(item.created_at);
                const displayDate = dateObj.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                });

                return (
                  <View key={item.id} style={[styles.historyItem, index < history.length - 1 && styles.borderBottom]}>
                    <View style={[styles.historyStatus, item.is_critical && styles.criticalStatus]}>
                      <FileText color={item.is_critical ? "#ef4444" : "#1B428A"} size={16} />
                    </View>
                    <View style={styles.historyDetails}>
                      <View style={styles.historyHeaderRow}>
                        <Text style={styles.historyDate}>{displayDate}</Text>
                        {item.is_critical && <Text style={styles.criticalBadge}>Critical</Text>}
                      </View>
                      <Text style={styles.historySummary} numberOfLines={3}>{item.report_text}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>
        
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
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1B428A",
  },
  content: {
    flex: 1,
    padding: 24,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "rgba(27, 66, 138, 0.05)",
    padding: 20,
    borderRadius: 24,
    gap: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "rgba(27, 66, 138, 0.1)",
  },
  infoIcon: {
    width: 48,
    height: 48,
    backgroundColor: "white",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1B428A",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 18,
  },
  formSection: {
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 12,
    marginLeft: 4,
  },
  inputWrapper: {
    backgroundColor: "white",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    marginBottom: 24,
  },
  input: {
    fontSize: 16,
    color: "#1e293b",
    minHeight: 120,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  toggleLabelGroup: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },
  toggleSublabel: {
    fontSize: 12,
    color: "#94a3b8",
  },
  toggle: {
    width: 52,
    height: 32,
    backgroundColor: "#e2e8f0",
    borderRadius: 100,
    padding: 4,
    justifyContent: "center",
  },
  toggleActive: {
    backgroundColor: "#ef4444",
  },
  toggleCircle: {
    width: 24,
    height: 24,
    backgroundColor: "white",
    borderRadius: 100,
  },
  toggleCircleActive: {
    alignSelf: "flex-end",
  },
  submitBtn: {
    backgroundColor: "#1B428A",
    height: 64,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    elevation: 4,
    shadowColor: "#1B428A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    marginBottom: 40,
  },
  disabledBtn: {
    backgroundColor: "#94a3b8",
  },
  submitBtnText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  historySection: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1B428A",
    marginBottom: 16,
  },
  historyCard: {
    backgroundColor: "white",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    paddingHorizontal: 16,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    gap: 16,
  },
  historyStatus: {
    width: 32,
    height: 32,
    backgroundColor: "#f0fdf4",
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  historyDetails: {
    flex: 1,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1e293b",
  },
  historySummary: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  criticalStatus: {
    backgroundColor: "#fef2f2",
  },
  historyHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  criticalBadge: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#ef4444",
    backgroundColor: "#fef2f2",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden",
  },
});
