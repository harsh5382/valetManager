import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
} from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../auth/firebase";
import { Calendar } from "react-native-calendars";
import { FontAwesome5 } from "@expo/vector-icons";

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
};

export default function CalendarScreen() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [modalVisible, setModalVisible] = useState(false);
  const [driversForSelectedDate, setDriversForSelectedDate] = useState<
    Driver[]
  >([]);

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

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    const filteredDrivers = drivers.filter((driver) => {
      if (!driver.startDate) return false;
      const driverDate = driver.startDate.toDate().toISOString().split("T")[0];
      return driverDate === date;
    });
    setDriversForSelectedDate(filteredDrivers);
    setModalVisible(true);
  };

  return (
    <View className="flex-1 bg-black pt-16 px-4">
      <Text className="text-3xl font-bold text-blue-400 mb-4">Calendar 📅</Text>

      <Calendar
        onDayPress={(day) => handleDateSelect(day.dateString)}
        markedDates={{
          [selectedDate]: { selected: true, selectedColor: "#1E90FF" },
        }}
        theme={{
          backgroundColor: "#000",
          calendarBackground: "#000",
          textSectionTitleColor: "#fff",
          dayTextColor: "#fff",
          todayTextColor: "#1E90FF",
          monthTextColor: "#1E90FF",
          arrowColor: "#1E90FF",
          textDayFontWeight: "600",
          textMonthFontWeight: "bold",
        }}
        style={{ marginBottom: 16 }}
      />

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={false}>
        <View className="flex-1 bg-black pt-5 px-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white font-bold text-2xl">
              Drivers for {selectedDate}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <FontAwesome5 name="times" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#1E90FF" className="mt-4" />
          ) : driversForSelectedDate.length === 0 ? (
            <Text className="text-gray-400 mt-4">No drivers for this date</Text>
          ) : (
            <ScrollView contentContainerStyle={{ paddingVertical: 10 }}>
              {driversForSelectedDate.map((driver, index) => (
                <View
                  key={driver.id || index}
                  className="bg-gray-900 p-4 rounded-2xl border border-gray-700 mb-4"
                >
                  <Text className="text-white font-bold text-lg">
                    {driver.firstName} {driver.lastName}
                  </Text>
                  <Text className="text-gray-300 mt-1">
                    Phone: {driver.phone}
                  </Text>
                  <Text className="text-gray-300 mt-1">
                    Location: {driver.location || "-"}
                  </Text>
                  <Text className="text-gray-300 mt-1">
                    Date: {driver.startDate?.toDate().toDateString() || "-"}
                  </Text>
                  <Text className="text-gray-300 mt-1">
                    Start: {driver.startTime} | End: {driver.endTime}
                  </Text>
                  <Text className="text-gray-300 mt-1">
                    Payment: ₹{driver.payment}
                  </Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}
