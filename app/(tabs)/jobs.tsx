import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, Filter, Clock, MapPin, ChevronRight } from "lucide-react-native";

export default function JobsScreen() {
  const jobs = [
    { id: "1", title: "HVAC System Repair", location: "Building A, Floor 4", time: "Today, 4:00 PM", priority: "High" },
    { id: "2", title: "Electrical Panel Check", location: "Sector 02", time: "Tomorrow, 10:00 AM", priority: "Medium" },
    { id: "3", title: "Water Leak Inspection", location: "Basement B2", time: "Monday, 2:00 PM", priority: "Low" },
    { id: "4", title: "CCTV Maintenance", location: "Parking Lot", time: "Monday, 5:00 PM", priority: "Medium" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Schedule</Text>
        <TouchableOpacity style={styles.filterBtn}>
          <Filter color="#1B428A" size={20} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Search color="#C5A059" size={20} />
        <Text style={styles.searchText}>Search for jobs or locations...</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {jobs.map((job) => (
          <TouchableOpacity key={job.id} style={styles.jobCard}>
            <View style={styles.jobInfo}>
              <Text style={styles.jobTitle}>{job.title}</Text>
              <View style={styles.detailRow}>
                <MapPin color="#C5A059" size={14} />
                <Text style={styles.detailText}>{job.location}</Text>
              </View>
              <View style={styles.detailRow}>
                <Clock color="#C5A059" size={14} />
                <Text style={styles.detailText}>{job.time}</Text>
              </View>
            </View>
            <View style={styles.cardRight}>
              <View style={[
                styles.priorityBadge, 
                job.priority === "High" ? styles.highPriority : 
                job.priority === "Medium" ? styles.medPriority : styles.lowPriority
              ]}>
                <Text style={[
                  styles.priorityText,
                  job.priority === "High" ? styles.highPriorityText : 
                  job.priority === "Medium" ? styles.medPriorityText : styles.lowPriorityText
                ]}>{job.priority}</Text>
              </View>
              <ChevronRight color="#cbd5e1" size={20} />
            </View>
          </TouchableOpacity>
        ))}
        <View style={{ height: 100 }} />
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
  searchText: {
    color: "#94a3b8",
    fontSize: 15,
  },
  scroll: {
    paddingHorizontal: 24,
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
  },
  jobInfo: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#1B428A",
    marginBottom: 8,
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  highPriority: { backgroundColor: "rgba(239, 68, 68, 0.1)" },
  medPriority: { backgroundColor: "rgba(197, 160, 89, 0.1)" },
  lowPriority: { backgroundColor: "rgba(27, 66, 138, 0.1)" },
  priorityText: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  highPriorityText: { color: "#ef4444" },
  medPriorityText: { color: "#C5A059" },
  lowPriorityText: { color: "#1B428A" },
});
