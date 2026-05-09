import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { 
  ChevronLeft, 
  MapPin, 
  Clock, 
  Info, 
  CheckCircle2, 
  Camera, 
  MessageSquare 
} from "lucide-react-native";
import { StatusBar } from "expo-status-bar";

export default function JobDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState("In Progress");

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ChevronLeft color="#0f172a" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Details</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.badgeRow}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{status}</Text>
            </View>
            <Text style={styles.jobId}>ID: {id}</Text>
          </View>

          <Text style={styles.mainTitle}>HVAC System Repair & Maintenance</Text>
          
          <View style={styles.infoRow}>
            <MapPin color="#64748b" size={18} />
            <Text style={styles.infoText}>Building A, Floor 4, Server Room</Text>
          </View>

          <View style={styles.infoRow}>
            <Clock color="#64748b" size={18} />
            <Text style={styles.infoText}>Expected completion: 4:00 PM</Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>
            Routine maintenance and emergency repair of the main server room cooling system. 
            Unit is showing error code E-102. Please check the refrigerant levels and compressor state.
          </Text>

          <Text style={styles.sectionTitle}>Updates & Notes</Text>
          <TextInput
            multiline
            placeholder="Add a progress update..."
            style={styles.input}
          />

          <TouchableOpacity style={styles.cameraButton}>
            <Camera color="#0066FF" size={24} />
            <Text style={styles.cameraText}>Add Photo Evidence</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.completeButton}
          onPress={() => setStatus("Completed")}
        >
          <CheckCircle2 color="white" size={20} />
          <Text style={styles.completeButtonText}>Mark as Completed</Text>
        </TouchableOpacity>
      </View>
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statusBadge: {
    backgroundColor: "#eff6ff",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
  },
  statusText: {
    color: "#3b82f6",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  jobId: {
    color: "#94a3b8",
    fontSize: 12,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 20,
    lineHeight: 34,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 10,
  },
  infoText: {
    color: "#475569",
    fontSize: 15,
  },
  divider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 12,
  },
  descriptionText: {
    color: "#64748b",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 16,
    height: 120,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    fontSize: 16,
    marginBottom: 20,
  },
  cameraButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#0066FF",
    backgroundColor: "#f0f7ff",
  },
  cameraText: {
    color: "#0066FF",
    fontWeight: "bold",
    fontSize: 16,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  completeButton: {
    backgroundColor: "#10B981",
    height: 60,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    elevation: 3,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  completeButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
