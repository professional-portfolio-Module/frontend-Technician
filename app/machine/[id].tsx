import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image, TextInput } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, MapPin, Cpu, Calendar, CheckCircle2, AlertTriangle, ShieldCheck, Camera, X, Info, XCircle, QrCode } from "lucide-react-native";
import * as ImagePicker from 'expo-image-picker';
import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import apiClient from "../../src/services/api";
import { syncService } from "../../src/services/syncService";

// Fallback Mock Machine Data in case API fails
const MOCK_MACHINES: Record<string, any> = {
  "MCH-7829": {
    id: "MCH-7829",
    name: "Industrial Chiller Unit 04",
    type: "HVAC System",
    location: "Main Plant Room, Basement B2",
    coordinates: { latitude: 6.9271, longitude: 79.8612 },
    lastService: "2026-04-15",
    status: "not checked yet",
    specs: {
      model: "Carrier 30XA",
      capacity: "450 kW",
      refrigerant: "R134a",
    }
  }
};

const decodeBase64 = (str: string): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let buffer = '';
  const cleaned = str.replace(/=+$/, '');
  for (let i = 0; i < cleaned.length; i += 4) {
    const encoded1 = chars.indexOf(cleaned[i]);
    const encoded2 = chars.indexOf(cleaned[i + 1] || 'A');
    const encoded3 = chars.indexOf(cleaned[i + 2] || 'A');
    const encoded4 = chars.indexOf(cleaned[i + 3] || 'A');

    const bytes = (encoded1 << 18) | (encoded2 << 12) | (encoded3 << 6) | encoded4;

    const byte1 = (bytes >> 16) & 255;
    const byte2 = (bytes >> 8) & 255;
    const byte3 = bytes & 255;

    buffer += String.fromCharCode(byte1);
    if (cleaned[i + 2]) buffer += String.fromCharCode(byte2);
    if (cleaned[i + 3]) buffer += String.fromCharCode(byte3);
  }
  return buffer;
};

export default function MachineProfile() {
  const { id, fromScan, manual_task_id } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const [machine, setMachine] = useState<any>(null);
  const [scheduledTask, setScheduledTask] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isFetching, setIsFetching] = useState(true);
  const [isNear, setIsNear] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [evidenceImage, setEvidenceImage] = useState<string | null>(null);
  const [remarks, setRemarks] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAssignedTech, setIsAssignedTech] = useState<boolean>(true);

  useEffect(() => {
    const initialize = async () => {
      try {
        setIsFetching(true);
        // 1. Fetch user ID and Role
        let role = "";
        let userId = "";
        try {
          const sessionRes = await apiClient.get("/auth/session");
          if (sessionRes.data.success && sessionRes.data.data?.user_name) {
            const username = sessionRes.data.data.user_name;
            const profileRes = await apiClient.get(`/AuthForward/auth/api/email/${username}`);
            if (profileRes.data.success && profileRes.data.data?.id) {
              userId = profileRes.data.data.id;
              role = profileRes.data.data.role ? profileRes.data.data.role.toLowerCase() : "";
              setCurrentUserId(userId);
              setUserRole(role);
            }
          }
        } catch (err) {
          console.warn("Failed to retrieve online session details, using local defaults:", err);
          userId = currentUserId || "offline-tech-id";
          role = userRole || "technician";
          setCurrentUserId(userId);
          setUserRole(role);
        }

        let cardNo = id as string;

        // Check if the QR code data encodes offline machine metadata
        if (cardNo.startsWith("offline_asset:")) {
          try {
            const base64Data = cardNo.substring("offline_asset:".length);
            const decodedJson = decodeBase64(base64Data);
            const parsed = JSON.parse(decodedJson);
            
            cardNo = parsed.card_no;
            setMachine({
              id: parsed.card_no,
              name: parsed.name || "Offline Asset",
              type: parsed.type || "Asset",
              location: parsed.location || "Location not set",
              coordinates: { latitude: 0, longitude: 0 },
              lastService: "Offline QR Scan",
              status: parsed.status || "not checked yet",
              dbId: parsed.card_no,
              specs: {
                model: parsed.model || "N/A",
                capacity: "N/A",
                refrigerant: "N/A"
              }
            });

            // Find scheduled task locally from cached tasks
            const cachedTasks = await syncService.getCachedTasks();
            const localTask = cachedTasks.find(t => t.asset_card_no === cardNo && t.status !== 'completed');
            if (localTask) {
              setScheduledTask(localTask);
              if (role === 'technician') {
                const hasAssignments = localTask.assigned_technicians && localTask.assigned_technicians.length > 0;
                const isAssigned = !hasAssignments || localTask.assigned_technicians.some((tech: any) => tech.user_id === userId);
                setIsAssignedTech(isAssigned);
                
                // Auto transition and queue scanner done_by ID offline only if fromScan is true
                if (isAssigned && localTask.status === 'pending' && fromScan === 'true') {
                  localTask.status = 'in-progress';
                  localTask.done_by = userId;
                  await syncService.queueMutation(localTask.task_id, {
                    status: 'in-progress',
                    done_by: userId
                  });
                }
              }
            } else {
              setScheduledTask(null);
            }
            setIsFetching(false);
            return;
          } catch (e) {
            console.error("Failed to parse offline asset QR metadata:", e);
          }
        }

        // 2. Fetch machine details
        try {
          const res = await apiClient.get(`/Main/router-backend/api/equipment?search=${id}`);
          if (res.data && res.data.success && res.data.data.items.length > 0) {
            const data = res.data.data.items.find((m: any) => m.card_no === id) || res.data.data.items[0];
            cardNo = data.card_no;
            setMachine({
              id: data.card_no,
              name: data.description || "Unknown Asset",
              type: data.category_name || "Unknown Category",
              location: data.location || "Location not set",
              coordinates: { latitude: 0, longitude: 0 },
              lastService: data.installation_date ? new Date(data.installation_date).toLocaleDateString() : "Unknown",
              status: data.status || "not checked yet",
              dbId: data.id,
              specs: {
                model: data.category_code || "N/A",
                capacity: "N/A",
                refrigerant: "N/A"
              }
            });
          } else {
            setMachine(MOCK_MACHINES[id as string] || MOCK_MACHINES["MCH-7829"]);
          }

          // 3. Fetch the pending task for this asset
          try {
            if (manual_task_id) {
              const taskRes = await apiClient.get('/Main/router-backend/api/manual-tasks');
              if (taskRes.data && taskRes.data.success && taskRes.data.data) {
                const foundTask = taskRes.data.data.find((t: any) => t.manual_task_id === manual_task_id);
                if (foundTask) {
                  const normalizedTask = {
                    ...foundTask,
                    task_id: foundTask.manual_task_id,
                    schedule_title: foundTask.title,
                    asset_card_no: foundTask.card_no,
                    asset_description: foundTask.asset_description || foundTask.title,
                    is_manual: true
                  };

                  if (role === 'technician') {
                    const isAssigned = foundTask.assigned_to === userId;
                    setIsAssignedTech(isAssigned);

                    if (isAssigned && foundTask.status === 'pending' && fromScan === 'true') {
                      try {
                        await apiClient.put(`/Main/router-backend/api/manual-tasks/${foundTask.manual_task_id}`, {
                          status: 'in-progress',
                        });
                        normalizedTask.status = 'in-progress';
                      } catch (e) {
                        console.error("Auto transition to in-progress failed:", e);
                      }
                    }
                  } else if (role === 'engineer') {
                    setIsAssignedTech(true);
                    if (foundTask.priority === 'emergency' && foundTask.status === 'in-progress') {
                      try {
                        await apiClient.put(`/Main/router-backend/api/manual-tasks/${foundTask.manual_task_id}`, {
                          status: 'under_review',
                        });
                        normalizedTask.status = 'under_review';
                      } catch (e) {
                        console.error("Auto transition to under_review failed:", e);
                      }
                    }
                  }

                  setScheduledTask(normalizedTask);
                } else {
                  setScheduledTask(null);
                }
              } else {
                setScheduledTask(null);
              }
            } else {
              const taskRes = await apiClient.get(`/Main/router-backend/api/scheduled-tasks/pending-by-asset?card_no=${cardNo}`);
              if (taskRes.data && taskRes.data.success && taskRes.data.data) {
                let taskData = taskRes.data.data;
                
                // Check technician assignments
                if (role === 'technician') {
                  const hasAssignments = taskData.assigned_technicians && taskData.assigned_technicians.length > 0;
                  const isAssigned = !hasAssignments || taskData.assigned_technicians.some((tech: any) => tech.user_id === userId);
                  setIsAssignedTech(isAssigned);

                  // Auto transition and record scanner done_by ID only if fromScan is true
                  if (isAssigned && taskData.status === 'pending' && fromScan === 'true') {
                    try {
                      await apiClient.patch(`/Main/router-backend/api/scheduled-tasks/${taskData.task_id}`, {
                        status: 'in-progress',
                        done_by: userId
                      });
                      taskData.status = 'in-progress';
                      taskData.done_by = userId;
                    } catch (e) {
                      console.error("Auto transition to in-progress failed:", e);
                    }
                  }
                } else if (role === 'engineer' && taskData.priority === 'emergency' && taskData.status === 'in-progress') {
                  try {
                    // Auto transition and record reviewer checked_by ID
                    await apiClient.patch(`/Main/router-backend/api/scheduled-tasks/${taskData.task_id}`, {
                      status: 'under_review',
                      checked_by: userId
                    });
                    taskData.status = 'under_review';
                    taskData.checked_by = userId;
                  } catch (e) {
                    console.error("Auto transition to under_review failed:", e);
                  }
                }
                
                setScheduledTask(taskData);
              } else {
                setScheduledTask(null);
              }
            }
          } catch (taskErr) {
            console.error("Failed to fetch pending task from API:", taskErr);
            // Local fallback
            const cachedTasks = await syncService.getCachedTasks();
            const localTask = cachedTasks.find(t => t.asset_card_no === cardNo && t.status !== 'completed');
            setScheduledTask(localTask || null);
          }
        } catch (error) {
          console.warn("Failed to fetch machine details from API, fallback to local cache:", error);
          const cachedTasks = await syncService.getCachedTasks();
          const localTask = cachedTasks.find(t => t.asset_card_no === cardNo && t.status !== 'completed');
          if (localTask) {
            setMachine({
              id: localTask.asset_card_no,
              name: localTask.asset_description || "Cached Asset",
              type: "Asset",
              location: localTask.asset_location || "Location not set",
              coordinates: { latitude: 0, longitude: 0 },
              lastService: "Offline Cache",
              status: localTask.status || "not checked yet",
              dbId: localTask.asset_card_no,
              specs: {
                model: "Cached",
                capacity: "N/A",
                refrigerant: "N/A"
              }
            });
            setScheduledTask(localTask);
          } else {
            setMachine(MOCK_MACHINES[id as string] || MOCK_MACHINES["MCH-7829"]);
            setScheduledTask(null);
          }
        }
      } catch (err) {
        console.error("Fatal initialization error:", err);
      } finally {
        setIsFetching(false);
      }
    };

    checkProximity();
    initialize();
  }, [id]);

  const checkProximity = async () => {
    try {
      setIsVerifying(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location access is required to verify proximity to the machine.");
        return;
      }

      await Location.getCurrentPositionAsync({});
      setIsNear(true); // Forced true for simulator purposes
    } catch (error) {
      console.error(error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePickEvidence = async () => {
    if (!scheduledTask) {
      Alert.alert("No Task Available", "You can only capture work evidence if there is an active scheduled maintenance task.");
      return;
    }
    Alert.alert(
      "Photo Evidence",
      "Take a photo or choose from gallery to verify the check.",
      [
        { text: "Take Photo", onPress: () => launchCamera() },
        { text: "Choose from Gallery", onPress: () => launchLibrary() },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const launchCamera = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) setEvidenceImage(result.assets[0].uri);
  };

  const launchLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) setEvidenceImage(result.assets[0].uri);
  };

  const uploadImageToCloudinary = async (localUri: string): Promise<string> => {
    const cloudName = "dg1surpxu";
    const uploadPreset = "avvtqcth";

    const formData = new FormData();
    const filename = localUri.split('/').pop() || "evidence.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;

    formData.append("file", { uri: localUri, name: filename, type } as any);
    formData.append("upload_preset", uploadPreset);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cloudinary upload failed: ${errorText}`);
    }

    const result = await response.json();
    return result.secure_url;
  };

  const handleStartTask = async () => {
    if (!scheduledTask) return;
    setUpdateLoading(true);
    const payload = {
      status: "in-progress",
      done_by: currentUserId
    };

    const isManual = scheduledTask.is_manual;

    try {
      try {
        const res = isManual
          ? await apiClient.put(`/Main/router-backend/api/manual-tasks/${scheduledTask.task_id}`, payload)
          : await apiClient.patch(`/Main/router-backend/api/scheduled-tasks/${scheduledTask.task_id}`, payload);
        if (res.data.success) {
          Alert.alert("Success", "Task started! Status is now 'in-progress'.");
          setScheduledTask({ ...scheduledTask, status: "in-progress", done_by: currentUserId });
        } else {
          Alert.alert("Error", "Failed to start the task.");
        }
      } catch (err) {
        console.warn("API update failed, queueing start task offline:", err);
        await syncService.queueMutation(scheduledTask.task_id, payload, isManual);
        Alert.alert("Offline Sync Queued", "Task started offline. Status will update to 'in-progress' when network is restored.");
        setScheduledTask({ ...scheduledTask, status: "in-progress", done_by: currentUserId });
      }
    } catch (error) {
      console.error("Failed to start task:", error);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleUpdateStatus = async (targetStatus: string) => {
    if (!isNear) {
      Alert.alert("Action Restricted", "You must be near the machine to update its status.");
      return;
    }

    if (!scheduledTask) {
      Alert.alert("No Pending Task", "There are no pending maintenance tasks for this machine.");
      return;
    }

    if (userRole === "technician" && !evidenceImage) {
      Alert.alert("Evidence Required", "Please upload photo evidence before completing the task.");
      return;
    }

    setUpdateLoading(true);
    const isManual = scheduledTask.is_manual;
    try {
      let cloudinaryUrl = null;
      if (evidenceImage) {
        cloudinaryUrl = await uploadImageToCloudinary(evidenceImage);
      }

      const payload: any = {
        status: targetStatus
      };

      if (userRole === "technician") {
        if (isManual) {
          payload.tech_remarks = remarks.trim() || "Maintenance task completed by technician.";
        } else {
          payload.technician_remarks = remarks.trim() || "Maintenance task completed by technician.";
        }
        payload.attachment_url = cloudinaryUrl || scheduledTask.attachment_url;
        payload.done_by = currentUserId;
      } else if (userRole === "engineer") {
        if (isManual) {
          payload.eng_remarks = remarks.trim() || "Reviewed and resolved by engineer.";
        } else {
          payload.engineer_remarks = remarks.trim() || "Reviewed and resolved by engineer.";
        }
        payload.checked_by = currentUserId;
        if (cloudinaryUrl) {
          payload.attachment_url = cloudinaryUrl;
        }
      }

      try {
        const res = isManual
          ? await apiClient.put(`/Main/router-backend/api/manual-tasks/${scheduledTask.task_id}`, payload)
          : await apiClient.patch(`/Main/router-backend/api/scheduled-tasks/${scheduledTask.task_id}`, payload);

        if (res.data.success) {
          Alert.alert("Success", `Maintenance task status successfully updated to '${targetStatus}'!`);
          setMachine({ ...machine, status: targetStatus === "completed" ? "check completed" : targetStatus });
          setScheduledTask(null); // Clear active task
        } else {
          Alert.alert("Error", "Failed to update task status in database.");
        }
      } catch (err) {
        console.warn("API update failed, queueing mutation offline:", err);
        await syncService.queueMutation(scheduledTask.task_id, payload, isManual);
        Alert.alert("Offline Sync Queued", "You are currently offline. Your checklist updates have been saved locally and will sync when a network connection is restored.");
        setMachine({ ...machine, status: targetStatus === "completed" ? "check completed" : targetStatus });
        setScheduledTask(null);
      }
    } catch (error) {
      console.error("Failed to update task:", error);
      Alert.alert("Error", "An unexpected error occurred while completing the task.");
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleEscalateStatus = async () => {
    if (!isNear) {
      Alert.alert("Action Restricted", "You must be near the machine to escalate its status.");
      return;
    }

    if (!scheduledTask) {
      Alert.alert("No Pending Task", "There are no pending maintenance tasks for this machine.");
      return;
    }

    if (!evidenceImage) {
      Alert.alert("Evidence Required", "Please upload photo evidence showing the issue before escalating.");
      return;
    }

    setUpdateLoading(true);
    const isManual = scheduledTask.is_manual;
    try {
      const cloudinaryUrl = await uploadImageToCloudinary(evidenceImage);

      const payload: any = {
        priority: "emergency",
        status: "in-progress", // Keeps status as in-progress (technician check initiated)
        attachment_url: cloudinaryUrl,
        done_by: currentUserId
      };

      if (isManual) {
        payload.tech_remarks = remarks.trim() || "Technician unable to complete task. Escalated to Emergency.";
      } else {
        payload.technician_remarks = remarks.trim() || "Technician unable to complete task. Escalated to Emergency.";
      }

      try {
        const res = isManual
          ? await apiClient.put(`/Main/router-backend/api/manual-tasks/${scheduledTask.task_id}`, payload)
          : await apiClient.patch(`/Main/router-backend/api/scheduled-tasks/${scheduledTask.task_id}`, payload);

        if (res.data.success) {
          Alert.alert("Escalated", "Task successfully escalated to Emergency! Engineers have been notified.");
          setMachine({ ...machine, status: "escalated" });
          setScheduledTask(null);
        } else {
          Alert.alert("Error", "Failed to escalate task.");
        }
      } catch (err) {
        console.warn("API escalation failed, queueing mutation offline:", err);
        await syncService.queueMutation(scheduledTask.task_id, payload, isManual);
        Alert.alert("Offline Sync Queued", "You are currently offline. Your emergency escalation request has been saved locally and will sync when a network connection is restored.");
        setMachine({ ...machine, status: "escalated" });
        setScheduledTask(null);
      }
    } catch (error) {
      console.error("Failed to escalate task:", error);
      Alert.alert("Error", "An unexpected error occurred while escalating the task.");
    } finally {
      setUpdateLoading(false);
    }
  };

  if (isVerifying || isFetching || !machine) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1B428A" />
        <Text style={styles.loadingText}>
          {isFetching ? "Fetching asset details..." : "Verifying proximity..."}
        </Text>
      </View>
    );
  }

  const isEmergency = scheduledTask?.priority === "emergency";
  const showTechRemarksForEngineer = userRole === "engineer" && scheduledTask?.technician_remarks;
  const isPendingTask = userRole === "technician" && scheduledTask && scheduledTask.status === "pending";

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color="#1B428A" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("machine_profile")}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Machine Main Card */}
        <View style={styles.mainCard}>
          <View style={styles.badgeRow}>
            <View style={[styles.statusBadge, machine.status === "check completed" ? styles.successBadge : styles.pendingBadge]}>
              <Text style={[styles.statusText, machine.status === "check completed" ? styles.successText : styles.pendingText]}>
                {machine.status === "check completed" ? t("check_completed").toUpperCase() : t("not_checked").toUpperCase()}
              </Text>
            </View>
            <View style={styles.idBadge}>
              <Text style={styles.idText}>{machine.id}</Text>
            </View>
          </View>

          <Text style={styles.machineName}>{machine.name}</Text>
          <View style={styles.locationRow}>
            <MapPin color="#C5A059" size={16} />
            <Text style={styles.locationText}>{machine.location}</Text>
          </View>

          {!isNear && (
            <View style={styles.warningBox}>
              <AlertTriangle color="#ef4444" size={20} />
              <Text style={styles.warningText}>Proximity check failed. Please move closer to the machine.</Text>
            </View>
          )}
          {!isAssignedTech && (
            <View style={[styles.warningBox, { marginTop: 12 }]}>
              <AlertTriangle color="#ef4444" size={20} />
              <Text style={styles.warningText}>You are not assigned to this maintenance task. Only assigned technicians can perform this check.</Text>
            </View>
          )}
          {isPendingTask && (
            <View style={[styles.warningBox, { marginTop: 12, backgroundColor: "#eff6ff", borderColor: "#3b82f6" }]}>
              <Info color="#2563eb" size={20} />
              <Text style={[styles.warningText, { color: "#1d4ed8" }]}>
                If you are starting the maintenance, please change the pending status to 'in-progress' using the button below. Note: Photo evidence is mandatory to complete this task.
              </Text>
            </View>
          )}
        </View>

        {/* Pending Scheduled Task Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scheduled Maintenance Task</Text>
          {scheduledTask ? (
            <View style={[styles.taskCard, isEmergency && styles.emergencyTaskCard]}>
              <View style={styles.taskHeaderRow}>
                <Text style={styles.taskTitle}>{scheduledTask.schedule_title}</Text>
                <View style={[styles.priorityBadge, isEmergency ? styles.emergencyBadge : styles.normalBadge]}>
                  <Text style={[styles.priorityText, isEmergency ? styles.emergencyText : styles.normalText]}>
                    {scheduledTask.priority.toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text style={styles.taskDetailsText}>
                {scheduledTask.additional_details || "No additional task instructions provided."}
              </Text>

              <View style={styles.taskMetaRow}>
                <Calendar color="#64748b" size={14} />
                <Text style={styles.taskMetaText}>
                  Due Date: {scheduledTask.due_date ? new Date(scheduledTask.due_date).toLocaleDateString() : "N/A"}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.noTaskBox}>
              <Info color="#64748b" size={20} />
              <Text style={styles.noTaskText}>
                No pending scheduled tasks found for this machine. You cannot submit maintenance reports without an active task.
              </Text>
            </View>
          )}
        </View>

        {/* Display Technician Notes to Engineer */}
        {showTechRemarksForEngineer && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Technician's Findings</Text>
            <View style={styles.techRemarksCard}>
              <Text style={styles.techRemarksText}>{scheduledTask.technician_remarks}</Text>
              {scheduledTask.attachment_url && (
                <View style={styles.techAttachmentContainer}>
                  <Text style={styles.techAttachmentLabel}>Photo Evidence Attached:</Text>
                  <Image source={{ uri: scheduledTask.attachment_url }} style={styles.techAttachmentPreview} />
                </View>
              )}
            </View>
          </View>
        )}

        {/* Remarks/Notes Input Section */}
        {scheduledTask && isAssignedTech && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {userRole === "engineer" ? "Engineer Remarks & Actions" : "Maintenance Notes / Remarks"}
            </Text>
            <View style={[styles.inputWrapper, isPendingTask && { opacity: 0.5 }]}>
              <TextInput
                style={styles.remarksInput}
                placeholder={
                  isPendingTask
                    ? "Locked: Change status to in-progress to start..."
                    : userRole === "engineer"
                      ? "Write actions taken to resolve the emergency, parts replaced, or diagnostic results..."
                      : "Write observations, actions taken, or replacement parts used..."
                }
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={4}
                value={remarks}
                onChangeText={setRemarks}
                editable={!isPendingTask}
              />
            </View>
          </View>
        )}

        {/* Work Evidence Upload Section (Only mandatory for technician completed or optional for engineer) */}
        {scheduledTask && isAssignedTech && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Work Evidence</Text>
            {!evidenceImage ? (
              <TouchableOpacity 
                style={[styles.uploadBox, (!scheduledTask || isPendingTask) && styles.disabledUploadBox]} 
                onPress={handlePickEvidence}
                disabled={!scheduledTask || isPendingTask}
              >
                <Camera color={(scheduledTask && !isPendingTask) ? "#1B428A" : "#cbd5e1"} size={32} />
                <Text style={[styles.uploadText, (!scheduledTask || isPendingTask) && styles.disabledUploadText]}>Add Photo Evidence</Text>
                <Text style={styles.uploadSubtext}>Mandatory for status updates</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.evidenceContainer}>
                <Image source={{ uri: evidenceImage }} style={styles.evidencePreview} />
                <TouchableOpacity 
                  style={styles.removeEvidence} 
                  onPress={() => setEvidenceImage(null)}
                  disabled={isPendingTask}
                >
                  <X color="white" size={16} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Specifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Specifications</Text>
          <View style={styles.specsGrid}>
            <View style={styles.specItem}>
              <Cpu color="#1B428A" size={20} />
              <View>
                <Text style={styles.specLabel}>Model/Category</Text>
                <Text style={styles.specValue}>{machine.specs.model}</Text>
              </View>
            </View>
            <View style={styles.specItem}>
              <ShieldCheck color="#1B428A" size={20} />
              <View>
                <Text style={styles.specLabel}>Last Service</Text>
                <Text style={styles.specValue}>{machine.lastService}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Footer Submission Buttons */}
      <View style={styles.footer}>
        {scheduledTask ? (
          !isAssignedTech ? (
            <View style={[styles.updateBtn, styles.disabledBtn]}>
              <AlertTriangle color="white" size={20} />
              <Text style={styles.updateBtnText}>Not Assigned to You</Text>
            </View>
          ) : isPendingTask ? (
            <TouchableOpacity 
              style={[styles.updateBtn, updateLoading && styles.disabledBtn]} 
              onPress={handleStartTask}
              disabled={updateLoading}
            >
              {updateLoading ? <ActivityIndicator color="white" /> : (
                <>
                  <CheckCircle2 color="white" size={20} />
                  <Text style={styles.updateBtnText}>Start Maintenance (In-Progress)</Text>
                </>
              )}
            </TouchableOpacity>
          ) : userRole === "engineer" ? (
            <View style={styles.actionButtonContainer}>
              <TouchableOpacity 
                style={[styles.actionBtn, styles.successBtn, updateLoading && styles.disabledBtn]} 
                onPress={() => handleUpdateStatus("completed")}
                disabled={updateLoading}
              >
                {updateLoading ? <ActivityIndicator color="white" /> : (
                  <>
                    <CheckCircle2 color="white" size={18} />
                    <Text style={styles.actionBtnText}>Resolve & Complete</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionBtn, styles.dangerBtn, updateLoading && styles.disabledBtn]} 
                onPress={() => handleUpdateStatus("rejected")}
                disabled={updateLoading}
              >
                {updateLoading ? <ActivityIndicator color="white" /> : (
                  <>
                    <XCircle color="white" size={18} />
                    <Text style={styles.actionBtnText}>Mark as Rejected</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.actionButtonContainer}>
              <TouchableOpacity 
                style={[
                  styles.actionBtn, 
                  styles.successBtn, 
                  (!evidenceImage || updateLoading) && styles.disabledBtn
                ]} 
                onPress={() => handleUpdateStatus("completed")}
                disabled={!evidenceImage || updateLoading}
              >
                {updateLoading ? <ActivityIndicator color="white" /> : (
                  <>
                    <CheckCircle2 color="white" size={18} />
                    <Text style={styles.actionBtnText}>Complete Task</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.actionBtn, 
                  styles.dangerBtn, 
                  (!evidenceImage || updateLoading) && styles.disabledBtn
                ]} 
                onPress={handleEscalateStatus}
                disabled={!evidenceImage || updateLoading}
              >
                {updateLoading ? <ActivityIndicator color="white" /> : (
                  <>
                    <AlertTriangle color="white" size={18} />
                    <Text style={styles.actionBtnText}>Escalate to Emergency</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )
        ) : (
          <View style={[styles.updateBtn, styles.disabledBtn]}>
            <CheckCircle2 color="white" size={20} />
            <Text style={styles.updateBtnText}>No Active Task</Text>
          </View>
        )}
        <Text style={styles.restrictionNote}>
          {userRole === "engineer" 
            ? "Engineer role: Can review and resolve/reject emergency escalations."
            : "Technician role: Can complete or escalate tasks."}
        </Text>
      </View>
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
    backgroundColor: "white",
  },
  loadingText: {
    marginTop: 16,
    color: "#64748b",
    fontSize: 16,
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
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1B428A",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  mainCard: {
    backgroundColor: "white",
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    elevation: 4,
    shadowColor: "#1B428A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    marginBottom: 24,
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  pendingBadge: {
    backgroundColor: "rgba(197, 160, 89, 0.1)",
  },
  successBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  pendingText: {
    color: "#C5A059",
  },
  successText: {
    color: "#10b981",
  },
  idBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  idText: {
    fontSize: 10,
    color: "#64748b",
    fontWeight: "bold",
  },
  machineName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1B428A",
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  locationText: {
    color: "#64748b",
    fontSize: 14,
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    padding: 16,
    borderRadius: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "#fee2e2",
  },
  warningText: {
    color: "#ef4444",
    fontSize: 13,
    flex: 1,
    fontWeight: "500",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1B428A",
    marginBottom: 12,
  },
  taskCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  emergencyTaskCard: {
    borderColor: "#fee2e2",
    backgroundColor: "#fff5f5",
  },
  taskHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  normalBadge: {
    backgroundColor: "#f1f5f9",
  },
  emergencyBadge: {
    backgroundColor: "#fef2f2",
  },
  priorityText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  normalText: {
    color: "#64748b",
  },
  emergencyText: {
    color: "#ef4444",
  },
  taskDetailsText: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
    marginBottom: 14,
  },
  taskMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  taskMetaText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  noTaskBox: {
    backgroundColor: "#f1f5f9",
    padding: 16,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  noTaskText: {
    color: "#64748b",
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  techRemarksCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  techRemarksText: {
    fontSize: 14,
    color: "#334155",
    lineHeight: 20,
    fontStyle: "italic",
    marginBottom: 12,
  },
  techAttachmentContainer: {
    marginTop: 8,
  },
  techAttachmentLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: 6,
  },
  techAttachmentPreview: {
    width: "100%",
    height: 150,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
  },
  inputWrapper: {
    backgroundColor: "white",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  remarksInput: {
    height: 90,
    color: "#1e293b",
    fontSize: 14,
    textAlignVertical: "top",
  },
  uploadBox: {
    height: 140,
    backgroundColor: "white",
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  disabledUploadBox: {
    backgroundColor: "#f8fafc",
    borderColor: "#cbd5e1",
    borderStyle: "solid",
  },
  uploadText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1B428A",
  },
  disabledUploadText: {
    color: "#cbd5e1",
  },
  uploadSubtext: {
    fontSize: 11,
    color: "#94a3b8",
  },
  evidenceContainer: {
    position: "relative",
    width: "100%",
    height: 200,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  evidencePreview: {
    width: "100%",
    height: "100%",
  },
  removeEvidence: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  specsGrid: {
    flexDirection: "row",
    gap: 16,
  },
  specItem: {
    flex: 1,
    backgroundColor: "white",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  specLabel: {
    fontSize: 12,
    color: "#94a3b8",
  },
  specValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1e293b",
  },
  footer: {
    padding: 24,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    alignItems: "center",
  },
  actionButtonContainer: {
    width: "100%",
    gap: 12,
  },
  actionBtn: {
    width: "100%",
    height: 56,
    borderRadius: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  successBtn: {
    backgroundColor: "#10b981",
  },
  dangerBtn: {
    backgroundColor: "#ef4444",
  },
  actionBtnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  updateBtn: {
    backgroundColor: "#1B428A",
    width: "100%",
    height: 60,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  disabledBtn: {
    backgroundColor: "#cbd5e1",
    shadowOpacity: 0,
    elevation: 0,
  },
  updateBtnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  restrictionNote: {
    marginTop: 10,
    fontSize: 11,
    color: "#94a3b8",
    fontStyle: "italic",
  },
});
