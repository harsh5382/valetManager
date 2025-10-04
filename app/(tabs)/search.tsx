import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../auth/firebase";
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

      const driverSnap = await getDocs(collection(db, "drivers"));
      const driverList: Driver[] = [];
      driverSnap.forEach((docSnap) => {
        driverList.push({ ...(docSnap.data() as Driver), id: docSnap.id });
      });
      setDrivers(driverList);

      const locationSnap = await getDocs(collection(db, "locations"));
      const locationList: Location[] = [];
      locationSnap.forEach((docSnap) => {
        locationList.push({ ...(docSnap.data() as Location), id: docSnap.id });
      });
      setLocations(locationList);
    } catch (error: any) {
      console.log(error.message);
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

      {/* Search Input */}
      <View className="flex-row items-center bg-gray-900 rounded-xl px-4 py-2 mb-6 border border-gray-700">
        <FontAwesome5 name="search" size={18} color="#888" />
        <TextInput
          className="flex-1 text-white ml-3"
          placeholder="Search drivers or locations"
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1E90FF" />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
          {/* Driver Results */}
          {filteredDrivers.map((driver) => (
            <TouchableOpacity
              key={driver.id}
              onPress={() => {
                setSelectedDriver(driver);
                setModalVisible(true);
              }}
              className="bg-gray-900 p-4 rounded-2xl border border-gray-700 mb-3 flex-row justify-between items-center"
            >
              <Text className="text-white font-semibold">
                {driver.firstName} {driver.lastName}
              </Text>
              <Text className="text-gray-400">{driver.location}</Text>
            </TouchableOpacity>
          ))}

          {/* Location Results */}
          {filteredLocations.map((location) => (
            <View
              key={location.id}
              className="bg-gray-900 p-4 rounded-2xl border border-gray-700 mb-3"
            >
              <Text className="text-white font-semibold">{location.name}</Text>
            </View>
          ))}

          {/* No Results */}
          {searchQuery.length > 0 &&
            filteredDrivers.length === 0 &&
            filteredLocations.length === 0 && (
              <Text className="text-gray-400 text-center mt-4">
                No results found
              </Text>
            )}
        </ScrollView>
      )}

      {/* Driver Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={false}>
        <View className="flex-1 bg-black pt-16 px-4">
          <TouchableOpacity
            onPress={() => setModalVisible(false)}
            className="mb-4 bg-gray-800 p-2 rounded-full self-end"
          >
            <FontAwesome5 name="times" size={20} color="#fff" />
          </TouchableOpacity>

          {selectedDriver && (
            <View className="bg-gray-900 p-4 rounded-2xl border border-gray-700">
              <Text className="text-white font-bold text-2xl mb-2">
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
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}
