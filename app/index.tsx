import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowRight, Hotel, ShieldCheck, Clock } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";

const { width } = Dimensions.get("window");

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={["#1B428A", "#0D2145"]}
        style={styles.gradient}
      />
      
      <SafeAreaView style={styles.content}>
        <View style={styles.headerSection}>
          <View style={styles.logoContainer}>
            <Hotel color="#C5A059" size={40} />
          </View>
          <Text style={styles.title}>Browns</Text>
          <Text style={styles.subtitle}>HOTELS & RESORTS</Text>
        </View>

        <View style={styles.featuresContainer}>
          <View style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <ShieldCheck color="white" size={24} />
            </View>
            <View>
              <Text style={styles.featureTitle}>Maintenance Excellence</Text>
              <Text style={styles.featureDesc}>Elite tools for elite hospitality</Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Clock color="white" size={24} />
            </View>
            <View>
              <Text style={styles.featureTitle}>Efficient Workflow</Text>
              <Text style={styles.featureDesc}>Fast tracking for guest satisfaction</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => router.push("/auth/login")}
          >
            <Text style={styles.buttonText}>Get Started</Text>
            <ArrowRight color="#1B428A" size={20} />
          </TouchableOpacity>
          <Text style={styles.versionText}>POWERED BY BROWNS HOTELS & RESORTS</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    paddingHorizontal: 35,
    justifyContent: "space-between",
  },
  headerSection: {
    marginTop: 80,
    alignItems: "center",
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(197, 160, 89, 0.3)",
  },
  title: {
    fontSize: 48,
    fontWeight: "bold",
    color: "white",
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: "#C5A059",
    fontWeight: "700",
    letterSpacing: 4,
    marginTop: -5,
  },
  featuresContainer: {
    gap: 35,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },
  featureIcon: {
    width: 52,
    height: 52,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  featureDesc: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.5)",
  },
  footer: {
    marginBottom: 50,
    alignItems: "center",
  },
  button: {
    backgroundColor: "white",
    width: "100%",
    height: 68,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  buttonText: {
    color: "#1B428A",
    fontSize: 19,
    fontWeight: "bold",
  },
  versionText: {
    marginTop: 25,
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.3)",
    letterSpacing: 1,
    fontWeight: "bold",
  },
});
