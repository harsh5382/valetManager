import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { auth } from "../../auth/firebase";
import { signOut, User } from "firebase/auth";
import { Ionicons } from "@expo/vector-icons"; // changed to Ionicons for consistent theme
import { BlurView } from "expo-blur";

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    if (!user && auth.currentUser) {
      setUser(auth.currentUser);
      setLoading(false);
    }

    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    router.replace("/login");
  };

  if (loading) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#1E90FF" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black px-4 pt-16">
      <Text className="text-3xl font-bold text-white mb-6">Profile</Text>

      {/* Profile Card */}
      <BlurView
        intensity={80}
        tint="dark"
        className="rounded-3xl p-6 items-center mb-6 border border-gray-700"
      >
        <View className="w-24 h-24 rounded-full bg-gray-700 mb-4 items-center justify-center overflow-hidden">
          {user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} className="w-full h-full" />
          ) : (
            <Ionicons name="person-circle-outline" size={48} color="#888" />
          )}
        </View>

        <Text className="text-white text-xl font-bold mb-1">
          {user?.displayName || user?.email}
        </Text>
        <Text className="text-gray-400">{user?.email}</Text>
      </BlurView>

      {/* Logout Button */}
      <TouchableOpacity
        onPress={handleLogout}
        className="bg-red-500 py-3 rounded-3xl items-center mb-6 w-full"
      >
        <Text className="text-white font-semibold text-lg">Logout</Text>
      </TouchableOpacity>

      {/* Options List */}
      <View>
        <BlurView
          intensity={70}
          tint="dark"
          className="rounded-2xl overflow-hidden border border-gray-700 mb-4"
        >
          <TouchableOpacity
            onPress={() => router.push("/option/daily-payment")}
            className="p-4 flex-row justify-between items-center"
          >
            <Text className="text-white font-semibold text-lg">
              Daily Payment
            </Text>
            <Ionicons name="cash-outline" size={20} color="#60A5FA" />
          </TouchableOpacity>
        </BlurView>

        <BlurView
          intensity={70}
          tint="dark"
          className="rounded-2xl overflow-hidden border border-gray-700 mb-4"
        >
          <TouchableOpacity
            onPress={() => {}}
            className="p-4 flex-row justify-between items-center"
          >
            <Text className="text-white font-semibold text-lg">
              Generate Bill
            </Text>
            <Ionicons name="document-text-outline" size={20} color="#60A5FA" />
          </TouchableOpacity>
        </BlurView>

        <BlurView
          intensity={70}
          tint="dark"
          className="rounded-2xl overflow-hidden border border-gray-700"
        >
          <TouchableOpacity
            onPress={() => router.push("/option/CalendarScreen")}
            className="p-4 flex-row justify-between items-center"
          >
            <Text className="text-white font-semibold text-lg">Calendar</Text>
            <Ionicons name="calendar-outline" size={20} color="#60A5FA" />
          </TouchableOpacity>
        </BlurView>
      </View>
    </View>
  );
}
