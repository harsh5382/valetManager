import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Platform,
} from "react-native";
import { FontAwesome5, MaterialIcons, Ionicons } from "@expo/vector-icons";
import { Slot, useRouter, usePathname } from "expo-router";
import { BlurView } from "expo-blur";

const tabs = [
  {
    name: "Home",
    icon: <FontAwesome5 name="home" size={22} />,
    path: "/(tabs)",
  },
  {
    name: "Search",
    icon: <Ionicons name="search" size={22} />,
    path: "/(tabs)/search",
  },
  {
    name: "Car",
    icon: <MaterialIcons name="directions-car" size={24} />,
    path: "/(tabs)/car",
  },
  {
    name: "Profile",
    icon: <FontAwesome5 name="user" size={20} />,
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
        (obj[tab.name] = new Animated.Value(tab.name === currentTab ? 1.15 : 1))
    );
    return obj;
  }, []);

  useEffect(() => {
    setActiveTab(currentTab);
    Object.keys(animations).forEach((key) => {
      Animated.spring(animations[key], {
        toValue: key === currentTab ? 1.15 : 1,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }).start();
    });
  }, [currentTab]);

  const handleTabPress = (tabName: string, path: string) => {
    if (activeTab === tabName) return;
    setActiveTab(tabName);
    Animated.spring(animations[tabName], {
      toValue: 1.15,
      useNativeDriver: true,
    }).start();
    router.replace(path as any);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <Slot />

      {/* Floating Glass Navbar */}
      <BlurView intensity={80} tint="dark" style={styles.navbarContainer}>
        <View style={styles.navbar}>
          {tabs.map((tab) => {
            const isActive = tab.name === activeTab;
            return (
              <TouchableOpacity
                key={tab.name}
                onPress={() => handleTabPress(tab.name, tab.path)}
                activeOpacity={0.8}
              >
                <Animated.View
                  style={[
                    styles.iconContainer,
                    isActive && styles.activeIconContainer,
                    { transform: [{ scale: animations[tab.name] }] },
                  ]}
                >
                  {React.cloneElement(tab.icon, {
                    color: isActive ? "#fff" : "#888",
                  })}
                </Animated.View>
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  navbarContainer: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 30 : 20,
    left: 20,
    right: 20,
    borderRadius: 30,
    overflow: "hidden",
  },
  navbar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "rgba(20,20,20,0.6)",
    paddingVertical: 12,
    borderRadius: 30,
    shadowColor: "#00AFFF",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
  },
  iconContainer: {
    padding: 12,
    borderRadius: 25,
  },
  activeIconContainer: {
    backgroundColor: "rgba(0,150,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(0,150,255,0.4)",
  },
});
