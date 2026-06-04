import { Tabs } from "expo-router";
import { LayoutDashboard, ClipboardList, User, QrCode, FileText } from "lucide-react-native";
import { View } from "react-native";
import NetworkStatusIndicator from "../../src/components/NetworkStatusIndicator";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#1B428A",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
          marginBottom: 10,
        },
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: "#f1f5f9",
          height: 100,
          paddingBottom: 35,
          paddingTop: 10,
          backgroundColor: "#FFFFFF",
        },
        headerStyle: {
          backgroundColor: "#FFFFFF",
        },
        headerTitleStyle: {
          fontWeight: "700",
          fontSize: 18,
          color: "#1B428A",
        },
        headerRight: () => <NetworkStatusIndicator />,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <LayoutDashboard color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: "Scan",
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              backgroundColor: "#C5A059",
              width: 54,
              height: 54,
              borderRadius: 18,
              justifyContent: "center",
              alignItems: "center",
              marginTop: -30,
              borderWidth: 4,
              borderColor: "#FFFFFF",
              elevation: 8,
              shadowColor: "#C5A059",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}>
              <QrCode color="white" size={26} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: "Jobs",
          tabBarIcon: ({ color }) => <ClipboardList color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: "Reports",
          tabBarIcon: ({ color }) => <FileText color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <User color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
