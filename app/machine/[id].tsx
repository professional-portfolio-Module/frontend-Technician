import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image, TextInput } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, MapPin, Cpu, Calendar, CheckCircle2, AlertTriangle, ShieldCheck, Camera, X, Info } from "lucide-react-native";
import * as ImagePicker from 'expo-image-picker';
import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import apiClient from "../../src/services/api";

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

export default function MachineProfile() {
  const { id } = useLocalSearchParams();
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

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const sessionRes = await apiClient.get("/auth/session");
        if (sessionRes.data.success && sessionRes.data.data?.user_name) {
          const username = sessionRes.data.data.user_name;
          const profileRes = await apiClient.get(`/AuthForward/auth/api/email/${username}`);
          if (profileRes.data.success && profileRes.data.data?.id) {
            setCurrentUserId(profileRes.data.data.id);
          }
        }
      } catch (err) {
        console.error("Failed to retrieve user ID for task updates:", err);
      }
    };

    fetchUserId();
    checkProximity();
    fetchMachineDetails();
  }, [id]);

  const fetchMachineDetails = async () => {
    try {
      setIsFetching(true);
      const res = await apiClient.get(`/Main/router-backend/api/equipment?search=${id}`);
      if (res.data && res.data.success && res.data.data.items.length > 0) {
        const data = res.data.data.items.find((m: any) => m.card_no === id) || res.data.data.items[0];
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

        // Fetch the pending scheduled task for this asset
        try {
          const taskRes = await apiClient.get(`/Main/router-backend/api/scheduled-tasks/pending-by-asset?card_no=${data.card_no}`);
          if (taskRes.data && taskRes.data.success && taskRes.data.data) {
            setScheduledTask(taskRes.data.data);
          } else {
            setScheduledTask(null);
          }
        } catch (taskErr) {
          console.error("Failed to fetch pending scheduled task:", taskErr);
          setScheduledTask(null);
        }
      } else {
        // Fallback to mock data if API fails to find it (for demo purposes)
        setMachine(MOCK_MACHINES[id as string] || MOCK_MACHINES["MCH-7829"]);
        setScheduledTask(null);
      }
    } catch (error) {
      console.error("Failed to fetch machine details:", error);
      // Fallback
      setMachine(MOCK_MACHINES[id as string] || MOCK_MACHINES["MCH-7829"]);
      setScheduledTask(null);
    } finally {
      setIsFetching(false);
    }
  };

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

  const handleUpdateStatus = async () => {
    if (!isNear) {
      Alert.alert("Action Restricted", "You must be near the machine to update its status.");
      return;
    }

    if (!scheduledTask) {
      Alert.alert("No Pending Task", "There are no pending scheduled maintenance tasks for this machine.");
      return;
    }

    if (!evidenceImage) {
      Alert.alert("Evidence Required", "Please upload photo evidence before completing the task.");
      return;
    }

    setUpdateLoading(true);
    try {
      // 1. Upload the image directly to Cloudinary
      const cloudinaryUrl = await uploadImageToCloudinary(evidenceImage);

      // 2. Submit the payload with the secure Cloudinary image URL
      const payload = {
        status: "completed",
        technician_remarks: remarks.trim() || "Maintenance task completed by technician.",
        attachment_url: cloudinaryUrl,
        done_by: currentUserId
      };

      const res = await apiClient.patch(`/Main/router-backend/api/scheduled-tasks/${scheduledTask.task_id}`, payload);

      if (res.data.success) {
        Alert.alert("Success", "Maintenance task completed successfully!");
        setMachine({ ...machine, status: "check completed" });
        setScheduledTask(null); // Clear the active task as it is now finished
      } else {
        Alert.alert("Error", "Failed to update task status in database.");
      }
    } catch (error) {
      console.error("Failed to update scheduled task:", error);
      Alert.alert("Upload Error", "An error occurred while uploading evidence or updating the task.");
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

        {/* Remarks/Notes Input Section */}
        {scheduledTask && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Maintenance Notes / Remarks</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.remarksInput}
                placeholder="Write observations, actions taken, or replacement parts used..."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={4}
                value={remarks}
                onChangeText={setRemarks}
              />
            </View>
          </View>
        )}

        {/* Work Evidence Upload Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Work Evidence</Text>
          {!evidenceImage ? (
            <TouchableOpacity 
              style={[styles.uploadBox, !scheduledTask && styles.disabledUploadBox]} 
              onPress={handlePickEvidence}
              disabled={!scheduledTask}
            >
              <Camera color={scheduledTask ? "#1B428A" : "#cbd5e1"} size={32} />
              <Text style={[styles.uploadText, !scheduledTask && styles.disabledUploadText]}>Add Photo Evidence</Text>
              <Text style={styles.uploadSubtext}>Mandatory for status updates</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.evidenceContainer}>
              <Image source={{ uri: evidenceImage }} style={styles.evidencePreview} />
              <TouchableOpacity 
                style={styles.removeEvidence} 
                onPress={() => setEvidenceImage(null)}
              >
                <X color="white" size={16} />
              </TouchableOpacity>
            </View>
          )}
        </View>

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

      {/* Footer Submission Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.updateBtn, 
            (!scheduledTask || !evidenceImage || updateLoading) && styles.disabledBtn
          ]} 
          onPress={handleUpdateStatus}
          disabled={!scheduledTask || !evidenceImage || updateLoading}
        >
          {updateLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <CheckCircle2 color="white" size={20} />
              <Text style={styles.updateBtnText}>
                {machine.status === "check completed" ? "Already Checked" : "Complete Maintenance Task"}
              </Text>
            </>
          )}
        </TouchableOpacity>
        <Text style={styles.restrictionNote}>Only scheduled pending tasks can be completed by Technicians</Text>
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
  updateBtn: {
    backgroundColor: "#1B428A",
    width: "100%",
    height: 60,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    elevation: 4,
    shadowColor: "#1B428A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
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
