import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { auth, db } from "../../auth/firebase";
import { signOut, User } from "firebase/auth";
import {
  collection,
  getDocs,
  Timestamp,
  query,
  where,
} from "firebase/firestore";
import { FontAwesome5 } from "@expo/vector-icons";

type Driver = {
  id?: string;
  firstName: string;
  lastName: string;
  payment: string;
  startDate?: Timestamp;
};

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // For Daily Payment
  const [showDaily, setShowDaily] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [totalPayment, setTotalPayment] = useState(0);
  const [loadingDrivers, setLoadingDrivers] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      Alert.alert("Logged out", "You have been signed out successfully!");
      router.replace("/login");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const fetchDailyPayments = async () => {
    setLoadingDrivers(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const q = query(
        collection(db, "drivers"),
        where("startDate", ">=", Timestamp.fromDate(today))
      );
      const snapshot = await getDocs(q);
      const list: Driver[] = [];
      let total = 0;

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Driver;
        list.push({ id: docSnap.id, ...data });
        total += Number(data.payment) || 0;
      });

      setDrivers(list);
      setTotalPayment(total);
      setShowDaily(true);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoadingDrivers(false);
    }
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
        {/* Profile Picture */}
        <View className="w-24 h-24 rounded-full bg-gray-700 mb-4 items-center justify-center overflow-hidden">
          {user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} className="w-full h-full" />
          ) : (
            <FontAwesome5 name="user" size={48} color="#888" />
          )}
        </View>

        {/* User Info */}
        <Text className="text-white text-xl font-bold mb-1">
          {user?.displayName || user?.email}
        </Text>
        <Text className="text-gray-400 mb-4">{user?.email}</Text>

        {/* Account Details */}
        <View className="w-full border-t border-gray-700 pt-4 space-y-2">
          <View className="flex-row justify-between">
            <Text className="text-gray-300">UID:</Text>
            <Text className="text-gray-200">{user?.uid}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-gray-300">Created:</Text>
            <Text className="text-gray-200">{user?.metadata.creationTime}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-gray-300">Last Sign-In:</Text>
            <Text className="text-gray-200">
              {user?.metadata.lastSignInTime}
            </Text>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          onPress={handleLogout}
          className="bg-red-500 py-3 rounded-xl items-center mt-6 w-full"
        >
          <Text className="text-white font-semibold text-lg">Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Options List */}
      <View className="space-y-3 mb-4">
        <TouchableOpacity
          onPress={fetchDailyPayments}
          className="bg-gray-900 rounded-xl p-4 flex-row justify-between items-center border border-gray-700"
        >
          <Text className="text-white font-semibold text-lg">
            Daily Payment
          </Text>
          <FontAwesome5 name="coins" size={18} color="#FFD700" />
        </TouchableOpacity>
        {/* Add more options here if needed */}
      </View>

      {/* Daily Payment Section */}
      {showDaily && (
        <ScrollView className="flex-1">
          <Text className="text-white text-xl font-bold mb-4">
            Drivers Payment Today
          </Text>
          {loadingDrivers ? (
            <ActivityIndicator size="large" color="#1E90FF" />
          ) : drivers.length === 0 ? (
            <Text className="text-gray-400">No drivers today</Text>
          ) : (
            drivers.map((driver, index) => (
              <View
                key={driver.id || index}
                className="bg-gray-900 p-4 rounded-xl border border-gray-700 mb-3"
              >
                <Text className="text-white font-semibold">
                  {driver.firstName} {driver.lastName}
                </Text>
                <Text className="text-gray-300 mt-1">
                  Payment: ₹{driver.payment}
                </Text>
              </View>
            ))
          )}
          <Text className="text-white text-lg font-bold mt-4">
            Total Payment: ₹{totalPayment}
          </Text>
        </ScrollView>
      )}
    </View>
  );
}
