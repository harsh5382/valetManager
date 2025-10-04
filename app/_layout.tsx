import React, { useState, useEffect, useMemo, JSX } from "react";
import { View, TouchableOpacity, Animated, StyleSheet } from "react-native";
import { FontAwesome5, MaterialIcons, Ionicons } from "@expo/vector-icons";
import { Stack, Slot, useRouter, usePathname } from "expo-router";
import "../types/global.css";

const tabs: {
  name: string;
  icon: JSX.Element;
  path: "/(tabs)" | "/(tabs)/search" | "/(tabs)/car" | "/(tabs)/profile";
}[] = [
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

  // Only show navbar for tab routes
  const tabPaths = [
    "/(tabs)",
    "/(tabs)/index",
    "/(tabs)/search",
    "/(tabs)/car",
    "/(tabs)/profile",
  ];
  const showNavbar = tabPaths.includes(pathname);

  // Determine active tab based on current route
  const currentTab = useMemo(() => {
    if (pathname === "/(tabs)" || pathname === "/(tabs)/index") return "Home";
    if (pathname === "/(tabs)/search") return "Search";
    if (pathname === "/(tabs)/car") return "Car";
    if (pathname === "/(tabs)/profile") return "Profile";
    return "Home";
  }, [pathname]);

  const [activeTab, setActiveTab] = useState(currentTab);

  // Animated scale for icons
  const animations = useMemo(() => {
    const obj: Record<string, Animated.Value> = {};
    tabs.forEach(
      (tab) =>
        (obj[tab.name] = new Animated.Value(tab.name === currentTab ? 1.2 : 1))
    );
    return obj;
  }, []);

  // Animate tab when route changes (not just press)
  useEffect(() => {
    setActiveTab(currentTab);
    Object.keys(animations).forEach((key) => {
      Animated.spring(animations[key], {
        toValue: key === currentTab ? 1.2 : 1,
        useNativeDriver: true,
      }).start();
    });
  }, [currentTab]);

const handleTabPress = (
  tabName: string,
  path: "/(tabs)" | "/(tabs)/search" | "/(tabs)/car" | "/(tabs)/profile"
) => {
  if (activeTab === tabName) return; // avoid redundant navigation
  setActiveTab(tabName);

  Animated.spring(animations[tabName], {
    toValue: 1.2,
    useNativeDriver: true,
  }).start();

  router.replace(path); // now TypeScript is happy
};


  return (
    <View style={styles.container}>
      <Stack screenOptions={{ headerShown: false }}>
        <Slot />
      </Stack>

      {showNavbar && (
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
                  color: tab.name === activeTab ? "#1E90FF" : "#777",
                })}
              </Animated.View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
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
