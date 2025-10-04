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
import { FontAwesome5 } from "@expo/vector-icons";

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch current user on mount and listen to changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Set currentUser immediately in case the component mounts after login
    if (!user && auth.currentUser) {
      setUser(auth.currentUser);
      setLoading(false);
    }

    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null); // reset user state
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
      <Text className="text-3xl font-bold text-blue-400 mb-6">Profile 👤</Text>

      {/* Profile Card */}
      <View className="bg-gray-900 rounded-2xl p-6 items-center border border-gray-700 mb-6">
        <View className="w-24 h-24 rounded-full bg-gray-700 mb-4 items-center justify-center overflow-hidden">
          {user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} className="w-full h-full" />
          ) : (
            <FontAwesome5 name="user" size={48} color="#888" />
          )}
        </View>

        <Text className="text-white text-xl font-bold mb-1">
          {user?.displayName || user?.email}
        </Text>
        <Text className="text-gray-400 mb-4">{user?.email}</Text>
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        onPress={handleLogout}
        className="bg-red-500 py-3 rounded-xl items-center mb-6 w-full"
      >
        <Text className="text-white font-semibold text-lg">Logout</Text>
      </TouchableOpacity>

      {/* Options List */}
      <View className="mb-4">
        <TouchableOpacity
          onPress={() => router.push("/option/daily-payment")}
          className="bg-gray-900 rounded-xl p-4 flex-row justify-between items-center border border-gray-700 mb-3"
        >
          <Text className="text-white font-semibold text-lg">
            Daily Payment
          </Text>
          <FontAwesome5 name="angle-right" size={18} color="#888" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {}}
          className="bg-gray-900 rounded-xl p-4 flex-row justify-between items-center border border-gray-700 mb-3"
        >
          <Text className="text-white font-semibold text-lg">
            Generate Bill
          </Text>
          <FontAwesome5 name="file-invoice-dollar" size={18} color="#1E90FF" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/option/CalendarScreen")}
          className="bg-gray-900 rounded-xl p-4 flex-row justify-between items-center mb-3 border border-gray-700"
        >
          <Text className="text-white font-semibold text-lg">Calendar</Text>
          <FontAwesome5 name="calendar-alt" size={18} color="#1E90FF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
