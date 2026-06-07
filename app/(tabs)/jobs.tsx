import React, { useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, RefreshControl, DeviceEventEmitter } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Search, Filter, Clock, MapPin, ChevronRight, AlertTriangle, CheckCircle2, Info, Calendar, CloudLightning } from "lucide-react-native";
import apiClient from "../../src/services/api";
import { syncService } from "../../src/services/syncService";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function JobsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hasLoadedInitially, setHasLoadedInitially] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSegment, setActiveSegment] = useState<"scheduled" | "manual">("scheduled");
  const [scheduledTasks, setScheduledTasks] = useState<any[]>([]);
  const [manualTasks, setManualTasks] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [userRole, setUserRole] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const fetchTasks = async (showLoadingIndicator = true) => {
    if (showLoadingIndicator && !hasLoadedInitially) setLoading(true);

    // Sync offline queue if we have internet
    try {
      const syncResult = await syncService.syncOfflineMutations();
      if (syncResult.syncedCount > 0) {
        console.log(`Synced ${syncResult.syncedCount} offline task completions.`);
      }
    } catch (e) {
      console.warn("Offline sync attempt skipped/failed (offline)");
    }

    // Check queue length
    const queueLen = await syncService.getQueueLength();
    setPendingSyncCount(queueLen);

    try {
      // 1. Fetch user session and profile to get role and hotelId
      const sessionRes = await apiClient.get("/auth/session");
      if (sessionRes.data.success && sessionRes.data.data?.user_name) {
        const username = sessionRes.data.data.user_name;
        const profileRes = await apiClient.get(`/AuthForward/auth/api/email/${username}`);
        if (profileRes.data.success && profileRes.data.data) {
          const userData = profileRes.data.data;
          const role = userData.role ? userData.role.toLowerCase() : "";
          const uid = userData.id;
          const hotelId = userData.hotelId || userData.hotels?.[0]?.id;

          setUserRole(role);
          setUserId(uid);

          if (hotelId) {
            // Fetch and cache hotel coordinates for offline proximity check
            try {
              apiClient.get(`/Main/router-backend/api/hotels/${hotelId}`).then(async (hotelRes) => {
                if (hotelRes.data.success && hotelRes.data.data) {
                  const hData = hotelRes.data.data;
                  if (hData.latitude && hData.longitude) {
                    await AsyncStorage.setItem('cachedHotelCoordinates', JSON.stringify({
                      hotelId,
                      latitude: hData.latitude,
                      longitude: hData.longitude
                    }));
                  }
                }
              }).catch((err) => {
                console.warn("Async fetch of hotel coordinates failed:", err);
              });
            } catch (hErr) {
              console.warn("Failed to pre-cache hotel coordinates:", hErr);
            }

            // Fetch Scheduled Tasks
            const tasksRes = await apiClient.get(`/Main/router-backend/api/scheduled-tasks?hotel_id=${hotelId}`);
            let fetchedScheduled: any[] = [];
            if (tasksRes.data?.success && tasksRes.data.data) {
              fetchedScheduled = tasksRes.data.data;
              await syncService.cacheTasks(fetchedScheduled);

              if (role === 'technician') {
                fetchedScheduled = fetchedScheduled.filter((t: any) =>
                  t.assigned_technicians?.some((tech: any) => tech.user_id === uid)
                );
              } else if (role === 'engineer') {
                fetchedScheduled = fetchedScheduled.filter((t: any) => t.priority === 'emergency');
              }
            }
            setScheduledTasks(fetchedScheduled);

            // Fetch Manual Tasks
            const manualRes = await apiClient.get(`/Main/router-backend/api/manual-tasks?hotel_id=${hotelId}`);
            let fetchedManual: any[] = [];
            if (manualRes.data?.success && manualRes.data.data) {
              fetchedManual = manualRes.data.data;

              if (role === 'technician') {
                fetchedManual = fetchedManual.filter((t: any) => t.assigned_to === uid);
              } else if (role === 'engineer') {
                fetchedManual = fetchedManual.filter((t: any) => t.priority === 'emergency');
              }
            }
            setManualTasks(fetchedManual);
          }
        }
      }
    } catch (err) {
      console.warn("Failed to load tasks from API, loading from offline cache instead:", err);
      // Fallback: load tasks from cache
      const cachedTasks = await syncService.getCachedTasks();
      if (cachedTasks && cachedTasks.length > 0) {
        let allTasks = cachedTasks;
        const cachedRole = userRole || "technician";
        const cachedUid = userId || "";
        if (cachedRole === 'technician' && cachedUid) {
          allTasks = allTasks.filter((t: any) =>
            t.assigned_technicians?.some((tech: any) => tech.user_id === cachedUid)
          );
        } else if (cachedRole === 'engineer') {
          allTasks = allTasks.filter((t: any) => t.priority === 'emergency');
        }
        setScheduledTasks(allTasks);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setHasLoadedInitially(true);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTasks(true);

      // Listen for local task update events
      const sub = DeviceEventEmitter.addListener("taskStatusChanged", () => {
        fetchTasks(false);
      });

      return () => {
        sub.remove();
      };
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks(false);
  };

  // Determine tasks to show based on active segment
  const tasks = activeSegment === "scheduled" ? scheduledTasks : manualTasks;

  // Filter tasks by status and search query
  const filteredTasks = tasks.filter((task) => {
    // 1. Status Filter
    if (selectedStatus !== "all") {
      if (task.status !== selectedStatus) return false;
    }

    // 2. Search Query Filter
    const query = searchQuery.toLowerCase();
    const title = ((activeSegment === "scheduled" ? task.schedule_title : task.title) || "").toLowerCase();
    const desc = ((activeSegment === "scheduled" ? task.asset_description : task.description) || "").toLowerCase();
    const cardNo = ((activeSegment === "scheduled" ? task.asset_card_no : task.card_no) || "").toLowerCase();
    const loc = ((activeSegment === "scheduled" ? task.asset_location : task.location) || "").toLowerCase();
    return title.includes(query) || desc.includes(query) || cardNo.includes(query) || loc.includes(query);
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "pending":
        return { bg: "rgba(100, 116, 139, 0.1)", text: "#64748b" };
      case "in-progress":
        return { bg: "rgba(59, 130, 246, 0.1)", text: "#3b82f6" };
      case "under_review":
        return { bg: "rgba(245, 158, 11, 0.1)", text: "#f59e0b" };
      case "completed":
        return { bg: "rgba(16, 185, 129, 0.1)", text: "#10b981" };
      case "rejected":
        return { bg: "rgba(239, 68, 68, 0.1)", text: "#ef4444" };
      case "expired":
        return { bg: "rgba(220, 38, 38, 0.15)", text: "#dc2626" };
      default:
        return { bg: "rgba(100, 116, 139, 0.1)", text: "#64748b" };
    }
  };

  const getPriorityStyle = (priority: string) => {
    if (priority === "emergency") {
      return { bg: "rgba(239, 68, 68, 0.1)", text: "#ef4444" };
    }
    return { bg: "rgba(27, 66, 138, 0.1)", text: "#1B428A" };
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Schedule</Text>
        <TouchableOpacity style={styles.filterBtn} onPress={() => fetchTasks(true)}>
          <Filter color="#1B428A" size={20} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Search color="#C5A059" size={20} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by title, description, or card no..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Segment Switcher */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segmentButton, activeSegment === "scheduled" && styles.activeSegmentButton]}
          onPress={() => {
            setActiveSegment("scheduled");
            setSelectedStatus("all");
          }}
        >
          <Text style={[styles.segmentButtonText, activeSegment === "scheduled" && styles.activeSegmentButtonText]}>
            Scheduled ({scheduledTasks.filter(t => t.status !== 'expired').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentButton, activeSegment === "manual" && styles.activeSegmentButton]}
          onPress={() => {
            setActiveSegment("manual");
            setSelectedStatus("all");
          }}
        >
          <Text style={[styles.segmentButtonText, activeSegment === "manual" && styles.activeSegmentButtonText]}>
            Manual ({manualTasks.filter(t => t.status !== 'expired').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Status Filter Scroll */}
      <View style={styles.statusFilterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statusFilterScroll}
        >
          {[
            { label: "All", value: "all" },
            { label: "Pending", value: "pending" },
            { label: "In Progress", value: "in-progress" },
            { label: "Under Review", value: "under_review" },
            { label: "Completed", value: "completed" },
            { label: "Expired", value: "expired" },
          ].map((status) => {
            const isActive = selectedStatus === status.value;
            return (
              <TouchableOpacity
                key={status.value}
                style={[
                  styles.statusFilterPill,
                  isActive && styles.activeStatusFilterPill
                ]}
                onPress={() => setSelectedStatus(status.value)}
              >
                <Text
                  style={[
                    styles.statusFilterText,
                    isActive && styles.activeStatusFilterText
                  ]}
                >
                  {status.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {pendingSyncCount > 0 && (
        <View style={styles.syncBanner}>
          <CloudLightning color="#854d0e" size={16} />
          <Text style={styles.syncBannerText}>
            {pendingSyncCount} updates pending online sync
          </Text>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1B428A" />
          <Text style={styles.loadingText}>Fetching tasks...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#1B428A"]} />
          }
        >
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => {
              const statusStyle = getStatusStyle(task.status);
              const priorityStyle = getPriorityStyle(task.priority);
              const taskId = activeSegment === "scheduled" ? task.task_id : task.manual_task_id;
              const cardNo = activeSegment === "scheduled" ? task.asset_card_no : task.card_no;
              const title = activeSegment === "scheduled" ? task.schedule_title : task.title;
              const assetDesc = activeSegment === "scheduled" ? (task.asset_description || "Unknown Asset") : (task.asset_description || task.title);
              const location = activeSegment === "scheduled" ? (task.asset_location || "Location not set") : (task.location || "Location not set");

              return (
                <TouchableOpacity
                  key={taskId}
                  style={styles.jobCard}
                  onPress={() => {
                    if (activeSegment === "scheduled") {
                      router.push(`/machine/${cardNo}?scheduled_task_id=${taskId}`);
                    } else {
                      router.push(`/machine/${cardNo}?manual_task_id=${taskId}`);
                    }
                  }}
                >
                  <View style={styles.jobInfo}>
                    <View style={styles.titleRow}>
                      <Text style={styles.jobTitle} numberOfLines={1}>
                        {cardNo ? `${cardNo} - ` : ""}{title}
                      </Text>
                      <View style={[styles.priorityBadge, { backgroundColor: priorityStyle.bg }]}>
                        <Text style={[styles.priorityText, { color: priorityStyle.text }]}>{task.priority}</Text>
                      </View>
                    </View>

                    <Text style={styles.assetDesc} numberOfLines={1}>
                      {assetDesc}
                    </Text>

                    <View style={styles.detailRow}>
                      <MapPin color="#C5A059" size={14} />
                      <Text style={styles.detailText}>{location}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Calendar color="#C5A059" size={14} />
                      <Text style={styles.detailText}>
                        Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : "N/A"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardRight}>
                    <View style={[styles.statusBadge, { backgroundColor: task.was_expired && task.status === 'completed' ? 'rgba(217, 119, 6, 0.12)' : statusStyle.bg }]}>
                      <Text style={[styles.statusText, { color: task.was_expired && task.status === 'completed' ? '#d97706' : statusStyle.text }]}>
                        {task.was_expired && task.status === 'completed' ? 'completed late' : task.status.replace("_", " ")}
                      </Text>
                    </View>
                    <ChevronRight color="#cbd5e1" size={20} />
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.noTaskBox}>
              <Info color="#64748b" size={32} style={styles.noTaskIcon} />
              <Text style={styles.noTaskTitle}>No Maintenance Tasks Found</Text>
              <Text style={styles.noTaskText}>
                {userRole === "engineer"
                  ? "There are no pending emergency tasks for review at this hotel."
                  : "You do not have any active or pending maintenance tasks assigned to you."}
              </Text>
            </View>
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
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
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1B428A",
  },
  filterBtn: {
    width: 44,
    height: 44,
    backgroundColor: "white",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(27, 66, 138, 0.1)",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    marginHorizontal: 24,
    paddingHorizontal: 16,
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(27, 66, 138, 0.1)",
    marginBottom: 24,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#1e293b",
    height: "100%",
  },
  scroll: {
    paddingHorizontal: 24,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 12,
    color: "#64748b",
    fontSize: 16,
  },
  jobCard: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#1B428A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  jobInfo: {
    flex: 1,
    paddingRight: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1B428A",
    maxWidth: "65%",
  },
  assetDesc: {
    fontSize: 14,
    color: "#475569",
    marginBottom: 8,
    fontWeight: "500",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  detailText: {
    color: "#64748b",
    fontSize: 13,
  },
  cardRight: {
    alignItems: "flex-end",
    gap: 12,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  noTaskBox: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    padding: 32,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginTop: 20,
    textAlign: "center",
  },
  noTaskIcon: {
    color: "#94a3b8",
    marginBottom: 16,
  },
  noTaskTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 8,
  },
  noTaskText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
  },
  syncBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef9c3",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: "#fef08a",
  },
  syncBannerText: {
    color: "#854d0e",
    fontSize: 13,
    fontWeight: "600",
  },
  segmentContainer: {
    flexDirection: "row",
    backgroundColor: "#e2e8f0",
    padding: 4,
    borderRadius: 12,
    marginHorizontal: 24,
    marginBottom: 16,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  activeSegmentButton: {
    backgroundColor: "white",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  segmentButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
  },
  activeSegmentButtonText: {
    color: "#1B428A",
  },
  statusFilterContainer: {
    marginBottom: 16,
  },
  statusFilterScroll: {
    paddingHorizontal: 24,
    gap: 8,
  },
  statusFilterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  activeStatusFilterPill: {
    backgroundColor: "#1B428A",
    borderColor: "#1B428A",
  },
  statusFilterText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
  },
  activeStatusFilterText: {
    color: "white",
  },
});
