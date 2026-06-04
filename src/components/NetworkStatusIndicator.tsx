import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import NetInfo from "@react-native-community/netinfo";

export default function NetworkStatusIndicator() {
  const [isOnline, setIsOnline] = useState<boolean | null>(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      // Prioritize isInternetReachable to accurately detect real offline state on simulators/devices
      const online = state.isInternetReachable !== null
        ? state.isInternetReachable
        : (state.isConnected ?? false);
      setIsOnline(online);
    });
    return () => unsubscribe();
  }, []);

  if (isOnline === null) return null;

  return (
    <View style={[styles.pill, isOnline ? styles.onlinePill : styles.offlinePill]}>
      <View style={[styles.dot, isOnline ? styles.onlineDot : styles.offlineDot]} />
      <Text style={[styles.text, isOnline ? styles.onlineText : styles.offlineText]}>
        {isOnline ? "Online" : "Offline"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 16,
    borderWidth: 1,
  },
  onlinePill: {
    backgroundColor: "#ecfdf5",
    borderColor: "#a7f3d0",
  },
  offlinePill: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  onlineDot: {
    backgroundColor: "#10b981",
  },
  offlineDot: {
    backgroundColor: "#ef4444",
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
  },
  onlineText: {
    color: "#065f46",
  },
  offlineText: {
    color: "#991b1b",
  },
});
