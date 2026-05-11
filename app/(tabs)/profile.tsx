import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { User, Settings, LogOut, Shield, HelpCircle, ChevronRight, LucideIcon } from "lucide-react-native";

interface ProfileItemProps {
  icon: LucideIcon;
  title: string;
  color?: string;
  isLast?: boolean;
}

const ProfileItem = ({ icon: Icon, title, color = "#64748b", isLast = false }: ProfileItemProps) => (
  <TouchableOpacity style={[styles.itemContainer, !isLast && styles.itemBorder]}>
    <View style={styles.itemLeft}>
      <View style={styles.iconContainer}>
        <Icon color={color} size={20} />
      </View>
      <Text style={styles.itemTitle}>{title}</Text>
    </View>
    <ChevronRight color="#cbd5e1" size={20} />
  </TouchableOpacity>
);

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.settingsBtn}>
            <Settings color="#1B428A" size={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&h=400&fit=crop" }}
              style={styles.avatar}
            />
            <View style={styles.statusDot} />
          </View>
          <Text style={styles.name}>Nimash Manawadu</Text>
          <Text style={styles.role}>Senior HVAC Technician</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>4.9</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>156</Text>
              <Text style={styles.statLabel}>Jobs</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>2y</Text>
              <Text style={styles.statLabel}>Exp</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <View style={styles.itemsCard}>
            <ProfileItem icon={User} title="Personal Information" color="#1B428A" />
            <ProfileItem icon={Shield} title="Security & Password" color="#C5A059" />
            <ProfileItem icon={HelpCircle} title="Help & Support" color="#1B428A" isLast={true} />
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn}>
          <LogOut color="#ef4444" size={20} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
        
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
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1B428A",
  },
  settingsBtn: {
    width: 44,
    height: 44,
    backgroundColor: "white",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(27, 66, 138, 0.1)",
  },
  profileCard: {
    backgroundColor: "white",
    marginHorizontal: 24,
    padding: 24,
    borderRadius: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    elevation: 3,
    shadowColor: "#cbd5e1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    marginBottom: 32,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: "rgba(197, 160, 89, 0.2)",
  },
  statusDot: {
    position: "absolute",
    bottom: 5,
    right: 5,
    width: 20,
    height: 20,
    backgroundColor: "#10B981",
    borderRadius: 10,
    borderWidth: 3,
    borderColor: "white",
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1B428A",
    marginBottom: 4,
  },
  role: {
    fontSize: 14,
    color: "#C5A059",
    fontWeight: "600",
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#f8fafc",
    width: "100%",
    justifyContent: "center",
  },
  stat: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1B428A",
  },
  statLabel: {
    fontSize: 12,
    color: "#94a3b8",
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#f1f5f9",
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1B428A",
    marginBottom: 16,
  },
  itemsCard: {
    backgroundColor: "white",
    borderRadius: 24,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#334155",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginHorizontal: 24,
    height: 60,
    backgroundColor: "#fff1f2",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#fee2e2",
    marginBottom: 20,
  },
  logoutText: {
    color: "#ef4444",
    fontSize: 16,
    fontWeight: "bold",
  },
});
