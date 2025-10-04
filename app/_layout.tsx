import React, { useState } from "react";
import { View, TouchableOpacity, Animated, StyleSheet } from "react-native";
import { FontAwesome5, MaterialIcons, Ionicons } from "@expo/vector-icons";
import { Stack, Slot, useRouter } from "expo-router";
import "../types/global.css"
const tabs = [
  {
    name: "Home",
    icon: <FontAwesome5 name="home" size={24} />,
    path: "/(tabs)",
  },
  {
    name: "Search",
    icon: <Ionicons name="search" size={24} />,
    path: "/(tabs)/search",
  },
  {
    name: "Car",
    icon: <MaterialIcons name="directions-car" size={24} />,
    path: "/(tabs)/car",
  },
  {
    name: "Profile",
    icon: <FontAwesome5 name="user" size={24} />,
    path: "/(tabs)/profile",
  },
];

export default function Layout() {
  const [activeTab, setActiveTab] = useState("Home");
  const router = useRouter();

  const animations = tabs.reduce(
    (acc, tab) => {
      acc[tab.name] = new Animated.Value(tab.name === activeTab ? 1.2 : 1);
      return acc;
    },
    {} as Record<string, Animated.Value>
  );

  const handleTabPress = (tabName: string, path: string) => {
    setActiveTab(tabName);

    // Animate the icon
    Object.keys(animations).forEach((key) => {
      Animated.spring(animations[key], {
        toValue: key === tabName ? 1.2 : 1,
        useNativeDriver: true,
      }).start();
    });

    // Navigate to the screen
    router.replace(
      path as "/(tabs)" | "/(tabs)/search" | "/(tabs)/car" | "/(tabs)/profile"
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Slot />
      </Stack>

      {/* Bottom Navbar */}
      <View style={styles.navbar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.name}
            onPress={() => handleTabPress(tab.name, tab.path)}
            activeOpacity={0.8}
          >
            <Animated.View
              style={{
                transform: [{ scale: animations[tab.name] }],
                alignItems: "center",
              }}
            >
              {React.cloneElement(tab.icon, {
                color: tab.name === activeTab ? "#1E90FF" : "#888",
              })}
            </Animated.View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navbar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    backgroundColor: "#111",
    borderTopWidth: 1,
    borderTopColor: "#222",
  },
});
