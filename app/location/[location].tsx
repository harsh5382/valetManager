import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { db, auth } from "../../auth/firebase";
import DriverForm from "../../components/DriverForm";
import DriverCard from "../../components/DriverCard";
import { Driver } from "../../types/types";

export default function LocationDetail() {
  const { location } = useLocalSearchParams<{ location: string }>();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | undefined>(
    undefined
  );

  // Utility: Update startDate if older than today
const updateDriverDateIfNeeded = async (driver: Driver) => {
  if (!driver.id || !driver.startDate) return;

  const startDate =
    driver.startDate instanceof Timestamp
      ? driver.startDate.toDate()
      : new Date(driver.startDate);

  const now = new Date();

  if (startDate.toDateString() !== now.toDateString()) {
    try {
      const driverRef = doc(db, "drivers", driver.id);
      await updateDoc(driverRef, {
        startDate: Timestamp.fromDate(new Date(now.setHours(0, 0, 0, 0))),
      });
      console.log(`Driver ${driver.firstName} date updated to today`);
    } catch (err: any) {
      console.log(`Failed to update driver ${driver.firstName}:`, err.message);
    }
  }
};

  // Fetch drivers from Firestore
  const fetchDrivers = async () => {
    if (!location) return;
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "No user logged in");
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, "drivers"),
        where("createdBy", "==", user.uid)
      );
      const snapshot = await getDocs(q);
      const list: Driver[] = [];

      for (const docSnap of snapshot.docs) {
        const rawData = docSnap.data();
        const data: Driver = {
          id: docSnap.id,
          firstName: rawData.firstName || "",
          lastName: rawData.lastName || "",
          phone: rawData.phone || "",
          location: rawData.location || "",
          startTime: rawData.startTime || "",
          endTime: rawData.endTime || "",
          payment: rawData.payment || "",
          startDate: rawData.startDate || undefined,
        };

        // Check if startDate needs to be updated
        await updateDriverDateIfNeeded(data);

        if (data.location === location || data.location === "") {
          list.push(data);
        }
      }

      setDrivers(list);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, [location]);

  const assignDriver = async (driver: Driver) => {
    if (!driver.id) return;
    try {
      await updateDoc(doc(db, "drivers", driver.id), {
        location,
        updatedAt: Timestamp.now(),
      });
      Alert.alert("Success", `${driver.firstName} assigned to ${location}`);
      fetchDrivers();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const removeFromLocation = async (driver: Driver) => {
    if (!driver.id) return;
    Alert.alert(
      "Remove Driver",
      `Remove ${driver.firstName} from this location?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              const driverRef = doc(db, "drivers", driver.id!);
              await updateDoc(driverRef, {
                location: "",
                updatedAt: Timestamp.now(),
              });
              fetchDrivers();
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to remove driver");
            }
          },
        },
      ]
    );
  };

  const handleEdit = (driver: Driver) => {
    setSelectedDriver(driver);
    setFormVisible(true);
  };

  const handleDelete = async (driverId?: string) => {
    if (!driverId) return;
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this driver?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "drivers", driverId));
              fetchDrivers();
            } catch (error: any) {
              Alert.alert("Error", error.message);
            }
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-black pt-16 px-4">
      {/* Location Header */}
      <Text className="text-3xl font-bold text-white mb-6">{location}</Text>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {loading ? (
          <ActivityIndicator size="large" color="#1E90FF" />
        ) : drivers.length === 0 ? (
          <Text className="text-gray-400 text-center mt-10">
            No drivers available
          </Text>
        ) : (
          drivers.map((driver) => (
            <DriverCard
              key={driver.id}
              driver={driver}
              onEdit={handleEdit}
              onRemove={removeFromLocation}
              onAssign={assignDriver}
              onDelete={handleDelete}
              currentLocation={location}
            />
          ))
        )}
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        onPress={() => {
          setSelectedDriver(undefined);
          setFormVisible(true);
        }}
        className="absolute bottom-8 right-6 bg-blue-600 w-16 h-16 rounded-full items-center justify-center shadow-lg"
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      {/* Driver Form Modal */}
      <DriverForm
        location={location || ""}
        visible={formVisible}
        onClose={() => setFormVisible(false)}
        onSuccess={() => {
          setFormVisible(false);
          fetchDrivers();
        }}
        driverData={selectedDriver}
      />
    </View>
  );
}
