import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import { db } from "../../auth/firebase";
import { FontAwesome5 } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
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
  startDate?: any; // new field from Firestore (Timestamp)
};

export default function CarScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | undefined>(
    undefined
  );
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "drivers"));
      const list: Driver[] = [];
      querySnapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Driver);
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

  const handleEdit = (driver: Driver) => {
    setSelectedDriver(driver);
    setModalVisible(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-black px-4 py-6">
      <Text className="text-3xl font-bold text-blue-400 mb-4">Drivers 🚗</Text>

      <TouchableOpacity
        className="bg-blue-600 py-3 rounded-xl mb-6 flex-row justify-center items-center"
        onPress={() => {
          setSelectedDriver(undefined);
          setModalVisible(true);
        }}
      >
        <FontAwesome5 name="plus" size={20} color="#fff" />
        <Text className="text-white font-semibold text-lg ml-2">
          Add Driver
        </Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color="#1E90FF" />
      ) : (
        <ScrollView>
          {drivers.map((driver, index) => (
            <View
              key={driver.id || index}
              className="bg-gray-900 p-4 rounded-xl border border-gray-700 mb-4"
            >
              <View className="flex-row justify-between items-start">
                {/* Driver Info */}
                <View className="flex-1 mr-4">
                  <Text className="text-white font-semibold text-lg">
                    {driver.firstName} {driver.lastName}
                  </Text>
                  <Text className="text-gray-300 mt-1">
                    Phone: {driver.phone}
                  </Text>
                  <Text className="text-gray-300 mt-1">
                    Location: {driver.location}
                  </Text>
                  <Text className="text-gray-300 mt-1">
                    Date: {driver.startDate?.toDate().toDateString() || "N/A"}
                  </Text>
                  <Text className="text-gray-300 mt-1">
                    Start: {driver.startTime} | End: {driver.endTime}
                  </Text>
                  <Text className="text-gray-300 mt-1">
                    Payment: {driver.payment}
                  </Text>
                </View>

                {/* Buttons in a row */}
                <View className="flex-row items-center gap-3">
                  <TouchableOpacity
                    className="p-3 bg-gray-800 rounded-full"
                    onPress={() => handleEdit(driver)}
                  >
                    <FontAwesome5 name="edit" size={20} color="#1E90FF" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="p-3 bg-gray-800 rounded-full"
                    onPress={() => handleDelete(driver.id)}
                  >
                    <FontAwesome5 name="trash" size={20} color="#FF4C4C" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* DriverForm modal */}
      <DriverForm
        location={selectedDriver?.location ?? ""} // empty string = unassigned
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={fetchDrivers}
        driverData={selectedDriver ?? undefined}
      />
    </SafeAreaView>
  );
}
