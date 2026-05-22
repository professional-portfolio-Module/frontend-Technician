import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Mail, ArrowLeft, Send, Lock, KeyRound } from "lucide-react-native";
import { StatusBar } from "expo-status-bar";
import apiClient from "../../src/services/api";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const showAlert = (title: string, message: string, onSuccess?: () => void) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
      if (onSuccess) onSuccess();
    } else {
      const { Alert } = require('react-native');
      Alert.alert(title, message, onSuccess ? [{ text: "OK", onPress: onSuccess }] : undefined);
    }
  };

  const handleSendOtp = async () => {
    if (!email.trim()) {
      showAlert("Error", "Please enter your email address");
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await apiClient.post("/auth/forgot-password", {
        usernameOrEmail: email.trim()
      });
      if (response.data.success || response.status === 200) {
        setIsSent(true);
        showAlert("OTP Sent", "Please check your email for the OTP.");
      } else {
        showAlert("Error", response.data.message || "Failed to send OTP");
      }
    } catch (error: any) {
      console.error(error);
      showAlert("Error", error.response?.data?.message || "Failed to connect to the server");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otp || !newPassword || !confirmPassword) {
      showAlert("Error", "Please fill in all fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert("Error", "Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.post("/auth/reset-forgotten-password", {
        usernameOrEmail: email.trim(),
        otp: otp,
        newPassword: newPassword,
        confirmPassword: confirmPassword
      });

      if (response.data.success || response.status === 200) {
        showAlert("Success", "Your password has been successfully reset!", () => {
          router.replace("/auth/login");
        });
      } else {
        showAlert("Error", response.data.message || "Failed to reset password");
      }
    } catch (error: any) {
      console.error(error);
      showAlert("Error", error.response?.data?.message || error.response?.data || "Failed to reset password");
    } finally {
      setIsLoading(false);
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
          <ArrowLeft color="#1B428A" size={28} />
        </TouchableOpacity>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          {!isSent ? (
            <>
              <View style={styles.header}>
                <Text style={styles.title}>Reset Password</Text>
                <Text style={styles.subtitle}>Enter your email address and we'll send you an OTP to reset your password.</Text>
              </View>

              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email Address</Text>
                  <View style={styles.inputWrapper}>
                    <Mail color="#94a3b8" size={20} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="name@brownshotels.com"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.resetButton, !email.trim() && styles.disabledBtn]}
                  onPress={handleSendOtp}
                  disabled={isLoading || !email.trim()}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Text style={styles.resetButtonText}>Send OTP</Text>
                      <Send color="white" size={20} />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.header}>
                <Text style={styles.title}>Enter Details</Text>
                <Text style={styles.subtitle}>We've sent an OTP to {email}. Enter it below to create a new password.</Text>
              </View>

              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>OTP Code</Text>
                  <View style={styles.inputWrapper}>
                    <KeyRound color="#94a3b8" size={20} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="123456"
                      value={otp}
                      onChangeText={setOtp}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>New Password</Text>
                  <View style={styles.inputWrapper}>
                    <Lock color="#94a3b8" size={20} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <View style={styles.inputWrapper}>
                    <Lock color="#94a3b8" size={20} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry
                    />
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.loginButton}
                  onPress={handleResetPassword}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.loginButtonText}>Reset Password</Text>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.resendBtn}
                  onPress={() => {
                    setIsSent(false);
                    setOtp("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                >
                  <Text style={styles.resendText}>Didn't receive the email? Try again</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
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
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 10,
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
    gap: 20,
    paddingBottom: 40,
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
  },
  resetButton: {
    backgroundColor: "#1B428A",
    height: 60,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
    elevation: 4,
    shadowColor: "#1B428A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  disabledBtn: {
    backgroundColor: "#94a3b8",
    elevation: 0,
    shadowOpacity: 0,
  },
  resetButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  loginButton: {
    backgroundColor: "#1B428A",
    width: "100%",
    height: 60,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#1B428A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    marginTop: 10,
  },
  loginButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  resendBtn: {
    marginTop: 15,
    alignItems: "center",
  },
  resendText: {
    color: "#C5A059",
    fontSize: 14,
    fontWeight: "bold",
  },
});
