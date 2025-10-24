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
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db, auth } from "../../auth/firebase";
import { FontAwesome6 } from "@expo/vector-icons";

type Driver = {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  location: string;
  startTime?: string;
  endTime?: string;
  payment?: string;
  startDate?: Date;
  deleted?: boolean;
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

      // Fetch all drivers for the user
      const driverQuery = query(
        collection(db, "drivers"),
        where("createdBy", "==", user.uid)
      );
      const driverSnap = await getDocs(driverQuery);
      const driverList: Driver[] = [];
      driverSnap.forEach((docSnap) => {
        const data = docSnap.data() as Driver;

        // Skip deleted drivers
        if (data.deleted) return;

        driverList.push({
          id: docSnap.id,
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          phone: data.phone || "",
          location: data.location || "",
          startTime: data.startTime || "",
          endTime: data.endTime || "",
          payment: data.payment || "",
          startDate:
            data.startDate instanceof Timestamp
              ? data.startDate.toDate()
              : data.startDate
                ? new Date(data.startDate)
                : undefined,
          deleted: data.deleted || false,
        });
      });
      setDrivers(driverList);

      // Fetch locations for the user
      const locationQuery = query(
        collection(db, "locations"),
        where("createdBy", "==", user.uid)
      );
      const locationSnap = await getDocs(locationQuery);
      const locationList: Location[] = [];
      locationSnap.forEach((docSnap) => {
        const data = docSnap.data() as Location;
        locationList.push({
          id: docSnap.id,
          name: data.name || "",
        });
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

  // Filter drivers & locations by search query
  const filteredDrivers = drivers.filter((d) =>
    `${d.firstName || ""} ${d.lastName || ""}`
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
        <FontAwesome6 name="magnifying-glass" size={18} color="#888" />
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
              <FontAwesome6 name="chevron-right" size={18} color="#888" />
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
        <View className="flex-1 justify-center items-center bg-black/50 backdrop-blur-md px-6">
          <View className="bg-gray-900 p-8 rounded-2xl border border-gray-700 w-full max-w-xl min-h-[320px]">
            {selectedDriver && (
              <View className="space-y-6">
                <View className="flex-row justify-between items-center border-b border-gray-700 pb-2">
                  <Text className="text-white font-bold text-2xl">
                    {selectedDriver.firstName} {selectedDriver.lastName}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    className="p-2"
                  >
                    <FontAwesome6 name="xmark" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
                <View className="space-y-3">
                  <View className="flex-row justify-between pt-5">
                    <Text className="text-gray-300 font-semibold text-base ">
                      Phone:
                    </Text>
                    <Text className="text-gray-300 text-right text-base">
                      {selectedDriver.phone || "-"}
                    </Text>
                  </View>
                  <View className="flex-row justify-between pt-5">
                    <Text className="text-gray-300 font-semibold text-base">
                      Location:
                    </Text>
                    <Text className="text-gray-300 text-right text-base">
                      {selectedDriver.location || "-"}
                    </Text>
                  </View>
                  <View className="flex-row justify-between pt-5">
                    <Text className="text-gray-300 font-semibold text-base">
                      Shift:
                    </Text>
                    <Text className="text-gray-300 text-right text-base">
                      {selectedDriver.startTime || "-"} -{" "}
                      {selectedDriver.endTime || "-"}
                    </Text>
                  </View>
                  <View className="flex-row justify-between pt-5">
                    <Text className="text-gray-300 font-semibold text-base">
                      Payment:
                    </Text>
                    <Text className="text-gray-300 text-right text-base">
                      ₹{selectedDriver.payment || "0"}
                    </Text>
                  </View>
                  <View className="flex-row justify-between pt-5">
                    <Text className="text-gray-300 font-semibold text-base">
                      Date:
                    </Text>
                    <Text className="text-gray-300 text-right text-base">
                      {selectedDriver.startDate
                        ? selectedDriver.startDate.toDateString()
                        : "-"}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
