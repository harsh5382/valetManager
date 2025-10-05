import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Platform,
} from "react-native";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db, auth } from "../../auth/firebase";
import { FontAwesome5 } from "@expo/vector-icons";

type Driver = {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  location: string;
  startTime?: string;
  endTime?: string;
  payment?: string;
  startDate?: any;
};

type Location = {
  id: string;
  name: string;
};

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) return setLoading(false);

      const driverQuery = query(
        collection(db, "drivers"),
        where("createdBy", "==", user.uid)
      );
      const driverSnap = await getDocs(driverQuery);
      const driverList: Driver[] = [];
      driverSnap.forEach((docSnap) => {
        driverList.push({ ...(docSnap.data() as Driver), id: docSnap.id });
      });
      setDrivers(driverList);

      const locationQuery = query(
        collection(db, "locations"),
        where("createdBy", "==", user.uid)
      );
      const locationSnap = await getDocs(locationQuery);
      const locationList: Location[] = [];
      locationSnap.forEach((docSnap) => {
        locationList.push({ ...(docSnap.data() as Location), id: docSnap.id });
      });
      setLocations(locationList);
    } catch (error: any) {
      console.log("Error fetching data:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredDrivers = drivers.filter((d) =>
    `${d.firstName} ${d.lastName}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );
  const filteredLocations = locations.filter((l) =>
    l.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View className="flex-1 bg-black px-4 pt-16">
      <Text className="text-white text-3xl font-bold mb-6">Search</Text>

      {/* Search Bar */}
      <View className="flex-row items-center bg-gray-900 rounded-xl px-4 py-3 mb-6 border border-gray-700">
        <FontAwesome5 name="search" size={18} color="#888" />
        <TextInput
          className="flex-1 text-white ml-3 text-base"
          placeholder="Search drivers or locations"
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1E90FF" />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Driver Cards */}
          {filteredDrivers.map((driver) => (
            <TouchableOpacity
              key={driver.id}
              onPress={() => {
                setSelectedDriver(driver);
                setModalVisible(true);
              }}
              className="bg-gray-900 p-5 rounded-2xl border border-gray-700 mb-4 shadow-md flex-row justify-between items-center"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.4,
                shadowRadius: 4,
                elevation: 5,
              }}
            >
              <View>
                <Text className="text-white font-bold text-lg">
                  {driver.firstName} {driver.lastName}
                </Text>
                <Text className="text-gray-400 mt-1">
                  Phone: {driver.phone || "-"}
                </Text>
                <Text className="text-gray-400 mt-1">
                  Location: {driver.location || "-"}
                </Text>
              </View>
              <FontAwesome5 name="chevron-right" size={18} color="#888" />
            </TouchableOpacity>
          ))}

          {/* Location Cards */}
          {filteredLocations.map((location) => (
            <View
              key={location.id}
              className="bg-gray-900 p-5 rounded-2xl border border-gray-700 mb-4 shadow-md"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.4,
                shadowRadius: 4,
                elevation: 5,
              }}
            >
              <Text className="text-white font-semibold text-lg">
                {location.name}
              </Text>
            </View>
          ))}

          {/* No Results */}
          {searchQuery.length > 0 &&
            filteredDrivers.length === 0 &&
            filteredLocations.length === 0 && (
              <Text className="text-gray-400 text-center mt-6 text-lg">
                No results found
              </Text>
            )}
        </ScrollView>
      )}

      {/* Driver Details Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View className="flex-1 justify-center items-center bg-black bg-opacity-90 px-4">
          <View className="bg-gray-900 p-6 rounded-2xl border border-gray-700 w-full">
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              className="self-end mb-3 p-2 rounded-full bg-gray-800"
            >
              <FontAwesome5 name="times" size={20} color="#fff" />
            </TouchableOpacity>

            {selectedDriver && (
              <>
                <Text className="text-white font-bold text-2xl mb-3">
                  {selectedDriver.firstName} {selectedDriver.lastName}
                </Text>
                <Text className="text-gray-300 mt-1">
                  Phone: {selectedDriver.phone || "-"}
                </Text>
                <Text className="text-gray-300 mt-1">
                  Location: {selectedDriver.location || "-"}
                </Text>
                <Text className="text-gray-300 mt-1">
                  Start: {selectedDriver.startTime || "-"} | End:{" "}
                  {selectedDriver.endTime || "-"}
                </Text>
                <Text className="text-gray-300 mt-1">
                  Payment: ₹{selectedDriver.payment || 0}
                </Text>
                <Text className="text-gray-300 mt-1">
                  Date:{" "}
                  {selectedDriver.startDate
                    ? selectedDriver.startDate.toDate().toDateString()
                    : "-"}
                </Text>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
