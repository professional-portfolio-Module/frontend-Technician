import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { SafeAreaView } from "react-native-safe-area-context";
import { X, Zap, QrCode, Info } from "lucide-react-native";
import { StatusBar } from "expo-status-bar";

const { width, height } = Dimensions.get("window");
const SCAN_AREA_SIZE = width * 0.7;

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    requestPermission();
  }, []);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <View style={styles.errorIcon}>
            <Info color="#1B428A" size={40} />
          </View>
          <Text style={styles.errorTitle}>Camera Access Required</Text>
          <Text style={styles.errorText}>
            Please grant camera permissions to scan QR codes on equipment and assets.
          </Text>
          <TouchableOpacity style={styles.grantButton} onPress={requestPermission}>
            <Text style={styles.grantButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    alert(`Bar code with type ${type} and data ${data} has been scanned!`);
    // Handle scanning logic here
    setTimeout(() => setScanned(false), 2000);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={flash}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      />
      
      {/* Overlay */}
      <View style={styles.overlay}>
        <View style={styles.topSection}>
          <Text style={styles.scanTitle}>Scan Asset QR</Text>
          <Text style={styles.scanSubtitle}>Align the code within the frame</Text>
        </View>

        <View style={styles.midSection}>
          <View style={styles.unfilled} />
          <View style={styles.scanArea}>
            {/* Corners */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
            
            {/* Scanning Line Animation placeholder */}
            <View style={styles.scanningLine} />
          </View>
          <View style={styles.unfilled} />
        </View>

        <View style={styles.bottomSection}>
          <View style={styles.controls}>
            <TouchableOpacity 
              style={styles.controlBtn} 
              onPress={() => setFlash(!flash)}
            >
              <Zap color={flash ? "#C5A059" : "white"} size={24} fill={flash ? "#C5A059" : "none"} />
              <Text style={styles.controlLabel}>Flash</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.mainScanBtn}>
              <QrCode color="white" size={32} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlBtn}>
              <Info color="white" size={24} />
              <Text style={styles.controlLabel}>Help</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    backgroundColor: "white",
  },
  errorIcon: {
    width: 80,
    height: 80,
    backgroundColor: "rgba(27, 66, 138, 0.05)",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1B428A",
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  grantButton: {
    backgroundColor: "#1B428A",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 20,
    elevation: 4,
  },
  grantButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "space-between",
  },
  topSection: {
    paddingTop: 80,
    alignItems: "center",
  },
  scanTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  scanSubtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
  },
  midSection: {
    flexDirection: "row",
    height: SCAN_AREA_SIZE,
  },
  unfilled: {
    flex: 1,
  },
  scanArea: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: "#C5A059",
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 5,
    borderLeftWidth: 5,
    borderTopLeftRadius: 20,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 5,
    borderRightWidth: 5,
    borderTopRightRadius: 20,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 5,
    borderLeftWidth: 5,
    borderBottomLeftRadius: 20,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 5,
    borderRightWidth: 5,
    borderBottomRightRadius: 20,
  },
  scanningLine: {
    position: "absolute",
    top: 0,
    left: 5,
    right: 5,
    height: 2,
    backgroundColor: "rgba(197, 160, 89, 0.5)",
    shadowColor: "#C5A059",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 10,
  },
  bottomSection: {
    paddingBottom: 60,
    alignItems: "center",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 40,
  },
  controlBtn: {
    alignItems: "center",
    gap: 8,
  },
  controlLabel: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  mainScanBtn: {
    width: 80,
    height: 80,
    backgroundColor: "#1B428A",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.2)",
    elevation: 8,
    shadowColor: "#1B428A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
});
