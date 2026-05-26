import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Mail, Lock, User, Phone, ChevronLeft, ArrowRight, Building } from "lucide-react-native";
import { StatusBar } from "expo-status-bar";
import { Picker } from "@react-native-picker/picker";
import apiClient from "../../src/services/api";

interface Hotel {
  id: string;
  name: string;
  city: string;
}

export default function RegisterScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  const [password, setPassword] = useState("");
  const [hotelId, setHotelId] = useState("");
  const [loading, setLoading] = useState(false);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [hotelsLoading, setHotelsLoading] = useState(true);

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const res = await apiClient.get("/Main/router-backend/api/hotels");
        if (res.data?.success && res.data.data) {
          setHotels(res.data.data);
          if (res.data.data.length > 0) {
            setHotelId(res.data.data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch hotels:", err);
      } finally {
        setHotelsLoading(false);
      }
    };
    fetchHotels();
  }, []);

  const showAlert = (title: string, message: string, onSuccess?: () => void) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
      if (onSuccess) onSuccess();
    } else {
      Alert.alert(title, message, onSuccess ? [{ text: "OK", onPress: onSuccess }] : undefined);
    }
  };

  const handleRegister = async () => {
    if (!fullName || !email || !mobileNo || !password || !hotelId) {
      showAlert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post("/AuthForward/auth/sign-up", {
        userName: fullName,
        userEmail: email,
        userMobileNo: mobileNo,
        userPassword: password,
        hotelId: hotelId,
      });

      if (response.data.success) {
        showAlert("Success", "Account created successfully! Please check your email for the OTP.", () => router.push({ pathname: "/auth/verify-otp", params: { email: email } }));
      } else {
        showAlert("Registration Failed", response.data.message || "Something went wrong");
      }
    } catch (error: any) {
      console.error("API Error: ", error);
      showAlert("Error", error.response?.data?.message || error.message || "Failed to connect to the server");
    } finally {
      setLoading(false);
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
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join the Browns Hotels maintenance team</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <User color="#94a3b8" size={20} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="John Doe"
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Official Email</Text>
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

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Mobile Number</Text>
                <View style={styles.inputWrapper}>
                  <Phone color="#94a3b8" size={20} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="0771234567"
                    value={mobileNo}
                    onChangeText={setMobileNo}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Assigned Hotel</Text>
                <View style={[styles.inputWrapper, { paddingHorizontal: 0, overflow: 'hidden' }]}>
                  <Building color="#94a3b8" size={20} style={[styles.inputIcon, { marginLeft: 16 }]} />
                  <Picker
                    selectedValue={hotelId}
                    onValueChange={(itemValue) => setHotelId(itemValue)}
                    style={{ flex: 1, backgroundColor: 'transparent' }}
                    enabled={!hotelsLoading}
                  >
                    {hotelsLoading ? (
                      <Picker.Item label="Loading hotels..." value="" />
                    ) : hotels.length === 0 ? (
                      <Picker.Item label="No hotels available" value="" />
                    ) : (
                      hotels.map((hotel) => (
                        <Picker.Item key={hotel.id} label={`${hotel.name} - ${hotel.city || 'N/A'}`} value={hotel.id} />
                      ))
                    )}
                  </Picker>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Create Password</Text>
                <View style={styles.inputWrapper}>
                  <Lock color="#94a3b8" size={20} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.registerButton, loading && { opacity: 0.7 }]}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Text style={styles.registerButtonText}>Register Now</Text>
                    <ArrowRight color="white" size={20} />
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/auth/login")}>
                <Text style={styles.linkText}>Sign In</Text>
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
  },
  registerButton: {
    backgroundColor: "#C5A059",
    height: 60,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginTop: 15,
    elevation: 4,
    shadowColor: "#C5A059",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  registerButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 30,
  },
  footerText: {
    color: "#64748b",
    fontSize: 15,
  },
  linkText: {
    color: "#1B428A",
    fontSize: 15,
    fontWeight: "bold",
  },
});
