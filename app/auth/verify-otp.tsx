import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Lock, ChevronLeft, ArrowRight } from "lucide-react-native";
import { StatusBar } from "expo-status-bar";
import apiClient from "../../src/services/api";

export default function VerifyOtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = params.email as string || "";
  
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const showAlert = (title: string, message: string, onSuccess?: () => void) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
      if (onSuccess) onSuccess();
    } else {
      // Need to import Alert dynamically or conditionally to avoid web issues
      const { Alert } = require('react-native');
      Alert.alert(title, message, onSuccess ? [{ text: "OK", onPress: onSuccess }] : undefined);
    }
  };

  const handleVerify = async () => {
    if (!otp) {
      showAlert("Error", "Please enter the OTP");
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post("/AuthForward/auth/verify-otp", {
        usernameOrEmail: email,
        otp: otp,
      });

      if (response.data.success) {
        showAlert("Success", "Email verified! Your account is now pending admin approval.", () => router.push("/auth/login"));
      } else {
        showAlert("Verification Failed", response.data.message || "Invalid OTP");
      }
    } catch (error: any) {
      showAlert("Error", error.response?.data?.message || "Failed to connect to the server");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      const response = await apiClient.post("/AuthForward/auth/resend-otp", {
        usernameOrEmail: email,
      });

      if (response.data.success) {
        showAlert("Success", "A new OTP has been sent to your email.");
      } else {
        showAlert("Failed", response.data.message || "Failed to resend OTP");
      }
    } catch (error: any) {
      showAlert("Error", error.response?.data?.message || "Failed to connect to the server");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex1}
      >
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ChevronLeft color="#1B428A" size={28} />
        </TouchableOpacity>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Verify Email</Text>
              <Text style={styles.subtitle}>We sent an OTP to {email}. Please enter it below.</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>One-Time Password (OTP)</Text>
                <View style={styles.inputWrapper}>
                  <Lock color="#94a3b8" size={20} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="123456"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
              </View>

              <TouchableOpacity 
                style={styles.resendPass}
                onPress={handleResend}
                disabled={resendLoading}
              >
                {resendLoading ? (
                  <ActivityIndicator color="#C5A059" size="small" />
                ) : (
                  <Text style={styles.resendText}>Resend OTP</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.verifyButton, loading && { opacity: 0.7 }]}
                onPress={handleVerify}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Text style={styles.verifyButtonText}>Verify & Complete</Text>
                    <ArrowRight color="white" size={20} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  flex1: {
    flex: 1,
  },
  backButton: {
    padding: 20,
    marginTop: 10,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1B428A",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
    lineHeight: 24,
  },
  form: {
    gap: 18,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1e293b",
    letterSpacing: 2,
  },
  resendPass: {
    alignSelf: "flex-end",
  },
  resendText: {
    color: "#C5A059",
    fontSize: 14,
    fontWeight: "600",
  },
  verifyButton: {
    backgroundColor: "#1B428A",
    height: 60,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginTop: 15,
    elevation: 4,
    shadowColor: "#1B428A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  verifyButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
