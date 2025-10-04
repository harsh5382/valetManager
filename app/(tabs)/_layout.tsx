import React, { useState, useEffect, useMemo } from "react";
import { View, TouchableOpacity, Animated, StyleSheet } from "react-native";
import { FontAwesome5, MaterialIcons, Ionicons } from "@expo/vector-icons";
import { Slot, useRouter, usePathname } from "expo-router";

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
    icon: <MaterialIcons name="directions-car" size={26} />,
    path: "/(tabs)/car",
  },
  {
    name: "Profile",
    icon: <FontAwesome5 name="user" size={22} />,
    path: "/(tabs)/profile",
  },
];

export default function TabsLayout() {
  const router = useRouter();
  const pathname = usePathname();

  const currentTab = useMemo(() => {
    if (pathname === "/(tabs)" || pathname === "/(tabs)/index") return "Home";
    if (pathname === "/(tabs)/search") return "Search";
    if (pathname === "/(tabs)/car") return "Car";
    if (pathname === "/(tabs)/profile") return "Profile";
    return "Home";
  }, [pathname]);

  const [activeTab, setActiveTab] = useState(currentTab);

  const animations = useMemo(() => {
    const obj: Record<string, Animated.Value> = {};
    tabs.forEach(
      (tab) =>
        (obj[tab.name] = new Animated.Value(tab.name === currentTab ? 1.2 : 1))
    );
    return obj;
  }, []);

  useEffect(() => {
    setActiveTab(currentTab);
    Object.keys(animations).forEach((key) => {
      Animated.spring(animations[key], {
        toValue: key === currentTab ? 1.2 : 1,
        useNativeDriver: true,
      }).start();
    });
  }, [currentTab]);

  const handleTabPress = (tabName: string, path: string) => {
    if (activeTab === tabName) return;
    setActiveTab(tabName);
    Animated.spring(animations[tabName], {
      toValue: 1.2,
      useNativeDriver: true,
    }).start();
    router.replace(path as any);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <Slot />
      <View style={styles.navbar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.name}
            onPress={() => handleTabPress(tab.name, tab.path)}
          >
            <Animated.View
              style={{
                transform: [{ scale: animations[tab.name] }],
                alignItems: "center",
              }}
            >
              {React.cloneElement(tab.icon, {
                color: tab.name === activeTab ? "#1E90FF" : "#777",
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
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: "#111",
    borderTopWidth: 1,
    borderTopColor: "#222",
  },
});
