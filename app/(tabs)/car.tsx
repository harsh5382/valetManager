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

type Driver = {
  id?: string;
  firstName: string;
  lastName: string;
  phone: string;
  location: string;
  startTime: string;
  endTime: string;
  payment: string;
  startDate?: any;
  createdBy?: string;
};

export default function CarScreen() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | undefined>(
    undefined
  );
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  // Animated values for each driver card
  const animatedHeights = useRef<Record<string, Animated.Value>>({}).current;

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
      snapshot.forEach((docSnap) =>
        list.push({ id: docSnap.id, ...docSnap.data() } as Driver)
      );

      // Initialize animated values for new drivers
      list.forEach((driver) => {
        if (!animatedHeights[driver.id!]) {
          animatedHeights[driver.id!] = new Animated.Value(0);
        }
      });

      setDrivers(list);
    } catch (error: any) {
      console.log(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  // Expand/collapse animation
  const toggleCard = (driverId?: string) => {
    if (!driverId) return;

    const toValue = expandedCard === driverId ? 0 : 1;

    Animated.timing(animatedHeights[driverId], {
      toValue,
      duration: 250,
      useNativeDriver: false,
    }).start();

    setExpandedCard((prev) => (prev === driverId ? null : driverId));
  };

  const handleRemoveFromLocation = (driver: Driver) => {
    if (!driver.id) return;

    Alert.alert(
      "Confirm Remove",
      `Remove ${driver.firstName} from this location?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await updateDoc(doc(db, "drivers", driver.id!), {
                location: "",
                updatedAt: Timestamp.now(),
              });
              fetchDrivers();
            } catch (error: any) {
              Alert.alert("Error", error.message);
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
                    onPress={() => toggleCard(driver.id)}
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
                        onPress={() => handleRemoveFromLocation(driver)}
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
                        {driver.startDate?.toDate().toDateString() || "N/A"}
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
          setSelectedDriver(undefined);
          setModalVisible(true);
        }}
      >
        <Text className="text-white text-4xl font-bold">+</Text>
      </TouchableOpacity>

      <DriverForm
        location={selectedDriver?.location ?? ""}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={fetchDrivers}
        driverData={selectedDriver ?? undefined}
      />
    </View>
  );
}
