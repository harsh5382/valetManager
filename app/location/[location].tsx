// app/location/[location].tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../auth/firebase";
import { useLocalSearchParams } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";
import DriverForm from "../../components/DriverForm";
import { Driver } from "../../types/types";

export default function LocationDetail() {
  const { location } = useLocalSearchParams<{ location: string }>();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | undefined>(
    undefined
  );

const fetchDrivers = async () => {
  if (!location) return;
  setLoading(true);
  try {
    const q = query(collection(db, "drivers"));
    const snapshot = await getDocs(q);
    const list: Driver[] = [];
    snapshot.forEach((docSnap) => {
      const rawData = docSnap.data();
      const data: Driver = {
        id: docSnap.id,
        firstName: rawData.firstName || "",
        lastName: rawData.lastName || "",
        phone: rawData.phone || "",
        location: rawData.location || "", // default empty string
        startTime: rawData.startTime || "",
        endTime: rawData.endTime || "",
        payment: rawData.payment || "",
        startDate: rawData.startDate || undefined,
      };
      if (data.location === location || data.location === "") {
        list.push(data);
      }
    });
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
    try {
      if (!driver.id) return;
      await updateDoc(doc(db, "drivers", driver.id), {
        location,
      });
      Alert.alert("Success", `${driver.firstName} assigned to ${location}`);
      fetchDrivers();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
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
      <Text className="text-3xl font-bold text-blue-400 mb-6">{location}</Text>

      <ScrollView className="mb-4">
        {loading ? (
          <ActivityIndicator size="large" color="#1E90FF" />
        ) : (
          <View className="flex-col">
            {drivers.length === 0 ? (
              <Text className="text-gray-400">No drivers available</Text>
            ) : (
              drivers.map((driver, index) => (
                <View
                  key={driver.id || index}
                  className={`bg-gray-900 p-4 rounded-2xl border border-gray-700 mb-4`}
                >
                  <View className="flex-row justify-between items-start">
                    {/* Driver Info */}
                    <View className="flex-1 pr-4">
                      <Text className="text-white font-bold text-lg">
                        {driver.firstName} {driver.lastName}
                      </Text>
                      <Text className="text-gray-300 mt-1">
                        Phone: {driver.phone}
                      </Text>
                      <Text className="text-gray-300 mt-1">
                        Start: {driver.startTime} | End: {driver.endTime}
                      </Text>
                      <Text className="text-gray-300 mt-1">
                        Payment: ₹{driver.payment}
                      </Text>
                      <Text className="text-gray-300 mt-1">
                        Date: {driver.startDate?.toDate().toDateString() || "-"}
                      </Text>
                      {!driver.location && (
                        <TouchableOpacity
                          className="mt-2 bg-green-600 py-2 px-3 rounded-xl items-center"
                          onPress={() => assignDriver(driver)}
                        >
                          <Text className="text-white font-semibold">
                            Select for this Location
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    <View className="flex-row items-center gap-3">
                      <TouchableOpacity
                        className="p-3 bg-gray-800 rounded-full"
                        onPress={() => handleEdit(driver)}
                      >
                        <FontAwesome5 name="edit" size={18} color="#1E90FF" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        className="p-3 bg-gray-800 rounded-full"
                        onPress={() => handleDelete(driver.id)}
                      >
                        <FontAwesome5 name="trash" size={18} color="#FF4C4C" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Driver Form */}
      <DriverForm
        location={selectedDriver?.location || location || ""}
        visible={formVisible}
        onClose={() => setFormVisible(false)}
        onSuccess={() => {
          setFormVisible(false);
          fetchDrivers();
        }}
        driverData={
          selectedDriver
            ? { ...selectedDriver, location: selectedDriver.location || "" }
            : undefined
        }
      />
    </View>
  );
}
