import React, { useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator, DeviceEventEmitter } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Bell, Calendar, TrendingUp, CheckCircle2, Clock, AlertCircle, MessageSquare, QrCode } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import apiClient from "../../src/services/api";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncService } from "../../src/services/syncService";

const { width } = Dimensions.get("window");

export default function Dashboard() {
  const router = useRouter();
  const { t } = useTranslation();
  const [userName, setUserName] = useState("Loading...");
  const [pendingJobsCount, setPendingJobsCount] = useState(0);
  const [completedJobsCount, setCompletedJobsCount] = useState(0);
  const [expiredJobsCount, setExpiredJobsCount] = useState(0);
  const [activeJob, setActiveJob] = useState<any>(null);
  const [upcomingJobs, setUpcomingJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadedInitially, setHasLoadedInitially] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchDashboardData = async (isBackground = false) => {
        // 1. Load from offline cache immediately to avoid waiting/spinners (Stale-While-Revalidate)
        try {
          const cachedProfileStr = await AsyncStorage.getItem('@user_profile_cache');
          let cachedRole = "";
          let cachedUid = "";
          let cachedHotelId = "";
          
          if (cachedProfileStr) {
            const profile = JSON.parse(cachedProfileStr);
            if (profile.name) {
              setUserName(profile.name);
            }
            cachedRole = profile.role?.toLowerCase() || "";
            cachedUid = profile.id || "";
            cachedHotelId = profile.hotelId || "";
          }

          const [cachedScheduled, cachedManual] = await Promise.all([
            syncService.getCachedTasks(),
            syncService.getCachedManualTasks()
          ]);

          if ((cachedScheduled.length > 0 || cachedManual.length > 0) && cachedUid) {
            let filteredScheduled = cachedScheduled;
            if (cachedRole === 'technician') {
              filteredScheduled = filteredScheduled.filter((t: any) =>
                t.assigned_technicians?.some((tech: any) => tech.user_id === cachedUid)
              );
            } else if (cachedRole === 'engineer') {
              filteredScheduled = filteredScheduled.filter((t: any) => t.priority === 'emergency');
            }

            let filteredManual = cachedManual;
            if (cachedRole === 'technician') {
              filteredManual = filteredManual.filter((t: any) => t.assigned_to === cachedUid);
            } else if (cachedRole === 'engineer') {
              filteredManual = filteredManual.filter((t: any) => t.priority === 'emergency');
            }

            const allTasks = [
              ...filteredScheduled.map(t => ({ ...t, is_manual: false })),
              ...filteredManual.map(t => ({ ...t, is_manual: true }))
            ];

            const pending = allTasks.filter(t => 
              t.status === 'pending' || 
              (t.status === 'in-progress' && (!t.done_by || t.done_by === cachedUid))
            ).length;
            const completed = allTasks.filter(t => t.status === 'completed').length;
            const expired = allTasks.filter(t => t.status === 'expired').length;

            setPendingJobsCount(pending);
            setCompletedJobsCount(completed);
            setExpiredJobsCount(expired);

            const active = allTasks.find(t => t.status === 'in-progress' && (!t.done_by || t.done_by === cachedUid));
            setActiveJob(active || null);

            const upcoming = allTasks
              .filter(t => t.status === 'pending')
              .sort((a, b) => {
                const dateA = a.due_date ? new Date(a.due_date).getTime() : Infinity;
                const dateB = b.due_date ? new Date(b.due_date).getTime() : Infinity;
                return dateA - dateB;
              })
              .slice(0, 2);
            setUpcomingJobs(upcoming);

            // Hide loading indicator immediately if we have cached data
            if (!isBackground && !hasLoadedInitially) {
              setLoading(false);
            }
          }
        } catch (e) {
          console.warn("Failed to load dashboard cache:", e);
        }

        if (!isBackground && !hasLoadedInitially && pendingJobsCount === 0 && completedJobsCount === 0) {
          setLoading(true);
        }

        try {
          // 2. Resolve user identity (check cache first, then API)
          let userData: any = null;
          const cachedProfileStr = await AsyncStorage.getItem('@user_profile_cache');
          if (cachedProfileStr) {
            userData = JSON.parse(cachedProfileStr);
            if (userData.name) {
              setUserName(userData.name);
            }
          } else {
            const sessionRes = await apiClient.get("/auth/session");
            if (!isActive) return;
            if (sessionRes.data.success && sessionRes.data.data?.user_name) {
              const username = sessionRes.data.data.user_name;
              setUserName(username);

              const profileRes = await apiClient.get(`/AuthForward/auth/api/email/${username}`);
              if (!isActive) return;
              if (profileRes.data.success && profileRes.data.data) {
                const fullProfile = profileRes.data.data;
                userData = {
                  id: fullProfile.id,
                  name: fullProfile.name,
                  email: fullProfile.email,
                  role: fullProfile.role,
                  hotelId: fullProfile.hotelId || fullProfile.hotels?.[0]?.id
                };
                await AsyncStorage.setItem('@user_profile_cache', JSON.stringify(userData));
                if (userData.name) {
                  setUserName(userData.name);
                }
              }
            }
          }

          if (userData && isActive) {
            const role = userData.role ? userData.role.toLowerCase() : "";
            const uid = userData.id;
            const hotelId = userData.hotelId;

            if (hotelId) {
              // 3. Fetch scheduled and manual tasks in parallel!
              const [tasksRes, manualRes] = await Promise.all([
                apiClient.get(`/Main/router-backend/api/scheduled-tasks?hotel_id=${hotelId}`),
                apiClient.get(`/Main/router-backend/api/manual-tasks?hotel_id=${hotelId}`)
              ]);
              if (!isActive) return;

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

              let fetchedManual: any[] = [];
              if (manualRes.data?.success && manualRes.data.data) {
                fetchedManual = manualRes.data.data;
                await syncService.cacheManualTasks(fetchedManual);
                if (role === 'technician') {
                  fetchedManual = fetchedManual.filter((t: any) => t.assigned_to === uid);
                } else if (role === 'engineer') {
                  fetchedManual = fetchedManual.filter((t: any) => t.priority === 'emergency');
                }
              }

              // Compute stats
              const allTasks = [
                ...fetchedScheduled.map(t => ({ ...t, is_manual: false })),
                ...fetchedManual.map(t => ({ ...t, is_manual: true }))
              ];

              const pending = allTasks.filter(t => 
                t.status === 'pending' || 
                (t.status === 'in-progress' && (!t.done_by || t.done_by === uid))
              ).length;
              const completed = allTasks.filter(t => t.status === 'completed').length;
              const expired = allTasks.filter(t => t.status === 'expired').length;

              setPendingJobsCount(pending);
              setCompletedJobsCount(completed);
              setExpiredJobsCount(expired);

              // Find active job (in-progress)
              const active = allTasks.find(t => t.status === 'in-progress' && (!t.done_by || t.done_by === uid));
              setActiveJob(active || null);

              // Get upcoming pending tasks
              const upcoming = allTasks
                .filter(t => t.status === 'pending')
                .sort((a, b) => {
                  const dateA = a.due_date ? new Date(a.due_date).getTime() : Infinity;
                  const dateB = b.due_date ? new Date(b.due_date).getTime() : Infinity;
                  return dateA - dateB;
                })
                .slice(0, 2);
              setUpcomingJobs(upcoming);
            }
          }
        } catch (err) {
          console.warn("Failed to load dashboard data from network:", err);
        } finally {
          if (isActive) {
            setLoading(false);
            setHasLoadedInitially(true);
          }
        }
      };

      fetchDashboardData();

      // Listen for local task update events
      const sub = DeviceEventEmitter.addListener("taskStatusChanged", () => {
        fetchDashboardData(true);
      });

      return () => {
        isActive = false;
        sub.remove();
      };
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1B428A" />
          <Text style={styles.loadingText}>Loading dashboard details...</Text>
        </View>
      ) : (
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
              <Text style={styles.statLabelLight}>Pending</Text>
              <Text style={styles.statValueLight}>{pendingJobsCount}</Text>
            </View>
            <View style={[styles.statCard, styles.whiteCard]}>
              <View style={styles.statIconContainerSecondary}>
                <CheckCircle2 color="#C5A059" size={20} />
              </View>
              <Text style={styles.statLabelDark}>Completed</Text>
              <Text style={styles.statValueDark}>{completedJobsCount}</Text>
            </View>
            <View style={[styles.statCard, styles.redCard]}>
              <View style={styles.statIconContainerAlert}>
                <AlertCircle color="#ef4444" size={20} />
              </View>
              <Text style={styles.statLabelDark}>Expired</Text>
              <Text style={styles.statValueAlert}>{expiredJobsCount}</Text>
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

          {activeJob ? (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                const cardNo = activeJob.is_manual ? activeJob.card_no : activeJob.asset_card_no;
                const param = activeJob.is_manual 
                  ? `?manual_task_id=${activeJob.manual_task_id}` 
                  : `?scheduled_task_id=${activeJob.task_id}`;
                router.push(`/machine/${cardNo}${param}`);
              }}
              style={styles.activeJobCard}
            >
              <View style={styles.cardHeader}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>In Progress</Text>
                </View>
              </View>

              <Text style={styles.jobTitle}>
                {(activeJob.is_manual ? activeJob.card_no : activeJob.asset_card_no) ? `${activeJob.is_manual ? activeJob.card_no : activeJob.asset_card_no} - ` : ""}{activeJob.is_manual ? activeJob.title : activeJob.schedule_title}
              </Text>
              <Text style={styles.jobLocation}>
                {activeJob.is_manual ? activeJob.location : activeJob.asset_location || "Location not set"}
              </Text>

              <View style={styles.cardFooter}>
                <View style={styles.deadlineIcon}>
                  <Calendar color="#1B428A" size={14} />
                </View>
                <Text style={styles.deadlineText}>
                  Due: {activeJob.due_date ? new Date(activeJob.due_date).toLocaleDateString() : "N/A"}
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.emptyActiveJobCard}>
              <Clock color="#94a3b8" size={32} style={{ marginBottom: 8 }} />
              <Text style={styles.emptyActiveJobTitle}>No Active Jobs</Text>
              <Text style={styles.emptyActiveJobText}>
                All tasks are pending or completed. Scan a machine QR code to start a job.
              </Text>
            </View>
          )}

          {/* Upcoming Jobs */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Upcoming Schedule</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/jobs")}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {upcomingJobs.length > 0 ? (
            upcomingJobs.map((task, idx) => {
              const cardNo = task.is_manual ? task.card_no : task.asset_card_no;
              const taskId = task.is_manual ? task.manual_task_id : task.task_id;
              const title = task.is_manual ? task.title : task.schedule_title;
              const location = task.is_manual ? task.location : task.asset_location || "Location not set";

              return (
                <TouchableOpacity
                  key={task.is_manual ? `m-${taskId}-${idx}` : `s-${taskId}-${idx}`}
                  style={styles.upcomingCard}
                  onPress={() => {
                    const param = task.is_manual 
                      ? `?manual_task_id=${taskId}` 
                      : `?scheduled_task_id=${taskId}`;
                    router.push(`/machine/${cardNo}${param}`);
                  }}
                >
                  <View style={styles.upcomingIconContainer}>
                    <AlertCircle color="#C5A059" size={24} />
                  </View>
                  <View style={styles.flex1}>
                    <Text style={styles.upcomingTitle} numberOfLines={1}>
                      {cardNo ? `${cardNo} - ` : ""}{title}
                    </Text>
                    <Text style={styles.upcomingSubtitle} numberOfLines={1}>
                      {location} • Due {task.due_date ? new Date(task.due_date).toLocaleDateString() : "N/A"}
                    </Text>
                  </View>
                  <View style={styles.priorityBadge}>
                    <Text style={styles.priorityText}>{task.priority.toUpperCase()}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyUpcomingCard}>
              <Text style={styles.emptyUpcomingText}>No upcoming pending schedule.</Text>
            </View>
          )}

          <View style={{ height: 40 }} />
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#64748b",
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
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 20,
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
  redCard: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#fee2e2",
    shadowColor: "#fca5a5",
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
  statIconContainerAlert: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
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
  statValueAlert: {
    color: "#ef4444",
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
  emptyActiveJobCard: {
    backgroundColor: "white",
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    marginBottom: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyActiveJobTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  emptyActiveJobText: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
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
  emptyUpcomingCard: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyUpcomingText: {
    fontSize: 13,
    color: "#94a3b8",
  },
});
