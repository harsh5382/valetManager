import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Animated,
  Alert,
} from "react-native";
import { BlurView } from "expo-blur";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { db, auth } from "../../auth/firebase";
import { Ionicons } from "@expo/vector-icons";
import DriverForm from "../../components/DriverForm";
import { Driver } from "../../types/types";

export default function CarScreen() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const animatedHeights = useRef<Record<string, Animated.Value>>({}).current;

  // Fetch drivers from Firestore
  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return setDrivers([]);

      const q = query(
        collection(db, "drivers"),
        where("createdBy", "==", user.uid)
      );
      const snapshot = await getDocs(q);

      const list: Driver[] = [];
      snapshot.forEach((docSnap) => {
        const rawData = docSnap.data();
        const driver: Driver = {
          id: docSnap.id,
          firstName: rawData.firstName || "",
          lastName: rawData.lastName || "",
          phone: rawData.phone || "",
          location: rawData.location || "",
          startTime: rawData.startTime || "",
          endTime: rawData.endTime || "",
          payment: rawData.payment || "",
          startDate: rawData.startDate || undefined,
          createdBy: rawData.createdBy || "",
          history: rawData.history || [],
          deleted: rawData.deleted || false,
        };

        // Skip deleted drivers
        if (!driver.deleted) list.push(driver);

        if (driver.id && !animatedHeights[driver.id])
          animatedHeights[driver.id] = new Animated.Value(0);
      });

      setDrivers(list);
    } catch (error: any) {
      console.log("Fetch drivers error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const toggleCard = (driverId: string) => {
    const toValue = expandedCard === driverId ? 0 : 1;
    Animated.timing(animatedHeights[driverId], {
      toValue,
      duration: 250,
      useNativeDriver: false,
    }).start();
    setExpandedCard(expandedCard === driverId ? null : driverId);
  };

  // DELETE driver logic
  const handleDeleteDriver = (driver: Driver) => {
    if (!driver.id) return;

    Alert.alert(
      "Delete Driver",
      `Are you sure you want to delete ${driver.firstName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const driverRef = doc(db, "drivers", driver.id);

              // Push current assignment to history before deleting
              const historyEntry = driver.location
                ? {
                    location: driver.location,
                    startTime: driver.startTime || "",
                    endTime: driver.endTime || "",
                    payment: driver.payment || "",
                    startDate: driver.startDate || Timestamp.now(),
                  }
                : null;

              await updateDoc(driverRef, {
                deleted: true,
                location: "",
                history: historyEntry
                  ? [...(driver.history || []), historyEntry]
                  : driver.history || [],
                updatedAt: Timestamp.now(),
              });

              fetchDrivers();
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to delete driver");
            }
          },
        },
      ]
    );
  };

  const handleEdit = (driver: Driver) => {
    setSelectedDriver(driver);
    setModalVisible(true);
  };

  return (
    <View className="flex-1 bg-black pt-16">
      <Text className="text-white text-3xl font-bold px-5 mb-6">Drivers</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#1E90FF" />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 150 }}>
          {drivers.length === 0 ? (
            <Text className="text-gray-400 text-center mt-10">
              No drivers yet.
            </Text>
          ) : (
            drivers.map((driver) => {
              const isExpanded = expandedCard === driver.id;
              const heightAnim =
                animatedHeights[driver.id!] || new Animated.Value(0);

              return (
                <BlurView
                  key={driver.id}
                  intensity={50}
                  tint="dark"
                  className="rounded-3xl mb-4 overflow-hidden border border-gray-800"
                >
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => toggleCard(driver.id!)}
                    className="px-5 py-3 flex-row justify-between items-center"
                  >
                    <Text className="text-white font-semibold text-lg">
                      {driver.firstName} {driver.lastName}
                    </Text>
                    <View className="flex-row gap-4">
                      <TouchableOpacity onPress={() => handleEdit(driver)}>
                        <Ionicons name="pencil" size={20} color="#60A5FA" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteDriver(driver)}
                      >
                        <Ionicons name="trash" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>

                  <Animated.View
                    style={{
                      height: heightAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 140],
                      }),
                      overflow: "hidden",
                    }}
                  >
                    <View className="px-5 pb-4 space-y-1">
                      <Text className="text-gray-300">
                        Phone: {driver.phone}
                      </Text>
                      <Text className="text-gray-300">
                        Location: {driver.location || "Unassigned"}
                      </Text>
                      <Text className="text-gray-300">
                        Date:{" "}
                        {driver.startDate?.toDate?.()?.toDateString() || "N/A"}
                      </Text>
                      <Text className="text-gray-300">
                        Start: {driver.startTime} | End: {driver.endTime}
                      </Text>
                      <Text className="text-gray-300">
                        Payment: {driver.payment}
                      </Text>
                    </View>
                  </Animated.View>
                </BlurView>
              );
            })
          )}
        </ScrollView>
      )}

      <TouchableOpacity
        className="bg-blue-600 w-16 h-16 rounded-full items-center justify-center absolute right-9"
        style={{
          bottom: Platform.OS === "ios" ? 100 : 110,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 6,
          zIndex: 9999,
        }}
        onPress={() => {
          setSelectedDriver(null);
          setModalVisible(true);
        }}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      <DriverForm
        location={selectedDriver?.location || ""}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={fetchDrivers}
        driverData={selectedDriver ?? null}
      />
    </View>
  );
}
