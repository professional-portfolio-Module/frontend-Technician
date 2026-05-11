import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, MapPin, Cpu, Calendar, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react-native";
import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";

// Mock Machine Data
const MOCK_MACHINES: Record<string, any> = {
  "MCH-7829": {
    id: "MCH-7829",
    name: "Industrial Chiller Unit 04",
    type: "HVAC System",
    location: "Main Plant Room, Basement B2",
    coordinates: { latitude: 6.9271, longitude: 79.8612 }, // Example coords
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
  const [machine, setMachine] = useState(MOCK_MACHINES[id as string] || MOCK_MACHINES["MCH-7829"]);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isNear, setIsNear] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    checkProximity();
  }, []);

  const checkProximity = async () => {
    try {
      setIsVerifying(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location access is required to verify proximity to the machine.");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      
      // Calculate distance (simplified for demo)
      // In real scenario, use Haversine formula
      const dist = 0; // Assume we are at the location for demo
      
      setIsNear(true); // Forced true for demo purposes
    } catch (error) {
      console.error(error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleUpdateStatus = () => {
    if (!isNear) {
      Alert.alert("Action Restricted", "You must be near the machine to update its status.");
      return;
    }

    setUpdateLoading(true);
    // Simulate API call
    setTimeout(() => {
      setMachine({ ...machine, status: "check completed" });
      setUpdateLoading(false);
      Alert.alert("Success", "Machine status updated to 'Check Completed'");
    }, 1500);
  };

  if (isVerifying) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1B428A" />
        <Text style={styles.loadingText}>Verifying proximity...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color="#1B428A" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Machine Profile</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.mainCard}>
          <View style={styles.badgeRow}>
            <View style={[styles.statusBadge, machine.status === "check completed" ? styles.successBadge : styles.pendingBadge]}>
              <Text style={[styles.statusText, machine.status === "check completed" ? styles.successText : styles.pendingText]}>
                {machine.status.toUpperCase()}
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Specifications</Text>
          <View style={styles.specsGrid}>
            <View style={styles.specItem}>
              <Cpu color="#1B428A" size={20} />
              <View>
                <Text style={styles.specLabel}>Model</Text>
                <Text style={styles.specValue}>{machine.specs.model}</Text>
              </View>
            </View>
            <View style={styles.specItem}>
              <ShieldCheck color="#1B428A" size={20} />
              <View>
                <Text style={styles.specLabel}>Capacity</Text>
                <Text style={styles.specValue}>{machine.specs.capacity}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>History</Text>
          <View style={styles.historyCard}>
            <View style={styles.historyItem}>
              <Calendar color="#64748b" size={16} />
              <Text style={styles.historyText}>Last Service: {machine.lastService}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.updateBtn, machine.status === "check completed" && styles.disabledBtn]} 
          onPress={handleUpdateStatus}
          disabled={machine.status === "check completed" || updateLoading}
        >
          {updateLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <CheckCircle2 color="white" size={20} />
              <Text style={styles.updateBtnText}>
                {machine.status === "check completed" ? "Already Checked" : "Mark as Checked"}
              </Text>
            </>
          )}
        </TouchableOpacity>
        <Text style={styles.restrictionNote}>Only status updates are permitted for Technicians</Text>
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
    marginBottom: 32,
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
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1B428A",
    marginBottom: 16,
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
  historyCard: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  historyText: {
    color: "#64748b",
    fontSize: 14,
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
    backgroundColor: "#94a3b8",
    shadowOpacity: 0,
    elevation: 0,
  },
  updateBtnText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  restrictionNote: {
    marginTop: 12,
    fontSize: 11,
    color: "#94a3b8",
    fontStyle: "italic",
  },
});
