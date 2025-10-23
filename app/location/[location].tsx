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
  const [formNotice, setFormNotice] = useState<string | undefined>(undefined);

  // Check if endTime has passed
  const hasEndTimePassed = (endTime?: string) => {
    if (!endTime) return false;
    const now = new Date();
    const match = endTime.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!match) return false;

    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const meridian = match[3]?.toUpperCase();

    if (meridian === "PM" && hours < 12) hours += 12;
    if (meridian === "AM" && hours === 12) hours = 0;

    const end = new Date();
    end.setHours(hours, minutes, 0, 0);

    return now >= end;
  };

  // Deactivate expired drivers
  const deactivateExpiredDrivers = async (driverList: Driver[]) => {
    for (const driver of driverList) {
      if (driver.id && driver.location && hasEndTimePassed(driver.endTime)) {
        const driverId = driver.id; // Safe for TypeScript
        try {
          await updateDoc(doc(db, "drivers", driverId), {
            location: "",
            updatedAt: Timestamp.now(),
          });
          console.log(`Driver ${driver.firstName} is now inactive`);
        } catch (err: any) {
          console.log("Error deactivating driver:", err.message);
        }
      }
    }
  };

  // Update startDate if older than today
  const updateDriverDateIfNeeded = async (driver: Driver) => {
    if (!driver.id || !driver.startDate) return;
    const startDate =
      driver.startDate instanceof Timestamp
        ? driver.startDate.toDate()
        : new Date(driver.startDate);
    const now = new Date();

    if (startDate.toDateString() !== now.toDateString()) {
      const driverId = driver.id; // Safe for TypeScript
      try {
        await updateDoc(doc(db, "drivers", driverId), {
          startDate: Timestamp.fromDate(new Date(now.setHours(0, 0, 0, 0))),
        });
        console.log(`Driver ${driver.firstName} date updated to today`);
      } catch (err: any) {
        console.log(
          `Failed to update driver ${driver.firstName}:`,
          err.message
        );
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
        };

        await updateDriverDateIfNeeded(driver);
        list.push(driver);
      }

      await deactivateExpiredDrivers(list);

      // Refresh after deactivation
      const refreshedSnapshot = await getDocs(q);
      const refreshedList: Driver[] = [];
      refreshedSnapshot.forEach((docSnap) => {
        const rawData = docSnap.data();
        refreshedList.push({
          id: docSnap.id,
          firstName: rawData.firstName || "",
          lastName: rawData.lastName || "",
          phone: rawData.phone || "",
          location: rawData.location || "",
          startTime: rawData.startTime || "",
          endTime: rawData.endTime || "",
          payment: rawData.payment || "",
          startDate: rawData.startDate || undefined,
        });
      });

      setDrivers(refreshedList);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, [location]);

  // Assign driver (handle inactive driver notice)
  const assignDriver = async (driver: Driver) => {
    if (!driver.id) return;

    const driverId = driver.id;

    if (!driver.location) {
      // Inactive driver → open form with notice
      setSelectedDriver(driver);
      setFormNotice("Assign new start/end time for this driver");
      setFormVisible(true);
    } else {
      try {
        await updateDoc(doc(db, "drivers", driverId), {
          location,
          updatedAt: Timestamp.now(),
        });
        Alert.alert("Success", `${driver.firstName} assigned to ${location}`);
        fetchDrivers();
      } catch (error: any) {
        Alert.alert("Error", error.message);
      }
    }
  };

  const removeFromLocation = async (driver: Driver) => {
    if (!driver.id) return;
    const driverId = driver.id;
    const driverName = driver.firstName;

    Alert.alert("Remove Driver", `Remove ${driverName} from this location?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await updateDoc(doc(db, "drivers", driverId), {
              location: "",
              updatedAt: Timestamp.now(),
            });
            fetchDrivers();
          } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to remove driver");
          }
        },
      },
    ]);
  };

  const handleEdit = (driver: Driver) => {
    setSelectedDriver(driver);
    setFormNotice(undefined);
    setFormVisible(true);
  };

  const handleDelete = async (driverId?: string) => {
    if (!driverId) return;
    const id = driverId;
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
              await deleteDoc(doc(db, "drivers", id));
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
          setFormNotice(undefined);
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
        onClose={() => {
          setFormVisible(false);
          setFormNotice(undefined);
        }}
        onSuccess={() => {
          setFormVisible(false);
          setFormNotice(undefined);
          fetchDrivers();
        }}
        driverData={selectedDriver}
        notice={formNotice}
      />
    </View>
  );
}
