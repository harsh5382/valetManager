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
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [formNotice, setFormNotice] = useState<string | undefined>(undefined);

  // Check if endTime has passed
  const hasEndTimePassed = (driver: Driver) => {
    if (!driver.startDate || !driver.endTime) return false;

    const startDate =
      driver.startDate instanceof Timestamp
        ? driver.startDate.toDate()
        : new Date(driver.startDate);

    const now = new Date();

    const match = driver.endTime.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return false;

    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const meridian = match[3].toUpperCase();

    if (meridian === "PM" && hours < 12) hours += 12;
    if (meridian === "AM" && hours === 12) hours = 0;

    const end = new Date(startDate);
    end.setHours(hours, minutes, 0, 0);

    return now >= end;
  };

  // Deactivate expired drivers and reset their times
  const deactivateExpiredDrivers = async (driverList: Driver[]) => {
    for (const driver of driverList) {
      if (driver.id && hasEndTimePassed(driver)) {
        try {
          await updateDoc(doc(db, "drivers", driver.id), {
            location: "",
            startTime: "", // Clear times for reassignment
            endTime: "",
            updatedAt: Timestamp.now(),
          });
          console.log(`Driver ${driver.firstName} is now inactive`);
          driver.location = ""; // Update locally to reflect deactivation
          driver.startTime = "";
          driver.endTime = "";
        } catch (err: any) {
          console.log("Error deactivating driver:", err.message);
        }
      }
    }
  };

  // Update startDate only if older than today and driver is expired
  const updateDriverDateIfNeeded = async (driver: Driver) => {
    if (!driver.id || !driver.startDate) return;

    const startDate =
      driver.startDate instanceof Timestamp
        ? driver.startDate.toDate()
        : new Date(driver.startDate);
    const now = new Date();

    // Only reset date for expired drivers
    if (hasEndTimePassed(driver)) {
      if (startDate.toDateString() !== now.toDateString()) {
        try {
          await updateDoc(doc(db, "drivers", driver.id), {
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
    }
  };

  // Fetch drivers
  const fetchDrivers = async () => {
    if (!location) return;
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No user logged in");

      const q = query(
        collection(db, "drivers"),
        where("createdBy", "==", user.uid)
      );
      const snapshot = await getDocs(q);

      const list: Driver[] = [];

      for (const docSnap of snapshot.docs) {
        const rawData = docSnap.data() as Driver;

        if (rawData.deleted) continue;

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
          history: rawData.history || [],
          createdBy: rawData.createdBy || "",
          deleted: rawData.deleted || false,
        };

        await updateDriverDateIfNeeded(driver);
        list.push(driver);
      }

      // Deactivate expired drivers before filtering
      await deactivateExpiredDrivers(list);

      // Filter drivers: include unassigned, assigned to this location, or inactive (expired)
      const displayedDrivers = list.filter((d) => {
        // If driver is unassigned or assigned to this location
        if (!d.location || d.location === location) return true;
        // If driver is inactive (endTime passed), allow reassignment
        if (hasEndTimePassed(d)) return true;
        return false;
      });

      setDrivers(displayedDrivers);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, [location]);

  // Assign driver
  const assignDriver = async (driver: Driver) => {
    if (!driver.id) return;

    if (hasEndTimePassed(driver)) {
      // For drivers whose end time has passed, open form to set new times and assign
      setSelectedDriver({
        ...driver,
        startTime: "", // Clear times to force re-selection
        endTime: "",
      });
      setFormNotice("Assign new start/end time for this driver");
      setFormVisible(true);
    } else if (!driver.location) {
      // For unassigned drivers with valid times, assign directly
      try {
        await updateDoc(doc(db, "drivers", driver.id), {
          location,
          updatedAt: Timestamp.now(),
        });
        Alert.alert("Success", `${driver.firstName} assigned to ${location}`);
        fetchDrivers();
      } catch (err: any) {
        Alert.alert("Error", err.message);
      }
    } else {
      // Driver is already assigned to this location or another active location
      Alert.alert(
        "Info",
        `${driver.firstName} is already assigned to ${driver.location}. Remove them from that location first.`
      );
    }
  };

  // Remove driver from location
  const removeFromLocation = async (driver: Driver) => {
    if (!driver.id || !driver.location) return;

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
              await updateDoc(doc(db, "drivers", driver.id), {
                location: "",
                updatedAt: Timestamp.now(),
              });
              fetchDrivers();
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to remove driver");
            }
          },
        },
      ]
    );
  };

  // Edit driver
  const handleEdit = (driver: Driver) => {
    setSelectedDriver(driver);
    setFormNotice(undefined);
    setFormVisible(true);
  };

  // Delete driver: mark deleted and push current assignment to history
  const handleDelete = async (driver: Driver) => {
    if (!driver.id) return;

    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete ${driver.firstName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const driverRef = doc(db, "drivers", driver.id);
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
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to delete driver");
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
              onDelete={() => handleDelete(driver)}
              currentLocation={location}
            />
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        onPress={() => {
          setSelectedDriver(null);
          setFormNotice(undefined);
          setFormVisible(true);
        }}
        className="absolute bottom-8 right-6 bg-blue-600 w-16 h-16 rounded-full items-center justify-center shadow-lg"
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      <DriverForm
        location={location || ""}
        visible={formVisible}
        onClose={() => {
          setFormVisible(false);
          setFormNotice(undefined);
          setSelectedDriver(null);
        }}
        onSuccess={() => {
          setFormVisible(false);
          setFormNotice(undefined);
          setSelectedDriver(null);
          fetchDrivers();
        }}
        driverData={selectedDriver}
        notice={formNotice}
      />
    </View>
  );
}
