import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db, auth } from "../../auth/firebase"; 
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
  createdBy?: string;
};

export default function CalendarScreen() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [modalVisible, setModalVisible] = useState(false);
  const [driversForSelectedDate, setDriversForSelectedDate] = useState<
    Driver[]
  >([]);
  const [markedDates, setMarkedDates] = useState<Record<string, any>>({});

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser; // ✅ get logged-in user
      if (!user) {
        Alert.alert("Error", "No user logged in");
        setLoading(false);
        return;
      }

      // ✅ Query only this user's drivers
      const q = query(
        collection(db, "drivers"),
        where("createdBy", "==", user.uid)
      );
      const querySnapshot = await getDocs(q);

      const list: Driver[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data() as Driver;
        list.push({ id: docSnap.id, ...data });
      });

      setDrivers(list);

      // Prepare marked dates
      const marks: Record<string, any> = {};
      list.forEach((driver) => {
        if (driver.startDate) {
          const date =
            driver.startDate instanceof Timestamp
              ? driver.startDate.toDate().toISOString().split("T")[0]
              : new Date(driver.startDate).toISOString().split("T")[0];

          marks[date] = {
            marked: true,
            dotColor: "#1E90FF",
            activeOpacity: 0.8,
          };
        }
      });
      setMarkedDates(marks);
    } catch (error: any) {
      console.log("Error fetching drivers:", error.message);
      Alert.alert("Error", error.message);
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
      const driverDate =
        driver.startDate instanceof Timestamp
          ? driver.startDate.toDate().toISOString().split("T")[0]
          : new Date(driver.startDate).toISOString().split("T")[0];
      return driverDate === date;
    });

    setDriversForSelectedDate(filteredDrivers);
    setModalVisible(true);
  };

  return (
    <View className="flex-1 bg-black pt-12 px-4">
      <Text className="text-3xl font-bold text-white mb-4">Calendar</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#1E90FF" className="mt-10" />
      ) : (
        <Calendar
          onDayPress={(day) => handleDateSelect(day.dateString)}
          markedDates={{
            ...markedDates,
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
      )}

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={false}>
        <View className="flex-1 bg-black pt-10 px-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white font-bold text-2xl">
              Drivers for {selectedDate}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <FontAwesome5 name="times" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {driversForSelectedDate.length === 0 ? (
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
                  <Text className="text-gray-300 mt-1">📞 {driver.phone}</Text>
                  <Text className="text-gray-300 mt-1">
                    📍 Location: {driver.location || "-"}
                  </Text>
                  <Text className="text-gray-300 mt-1">
                    🗓️ Date:{" "}
                    {driver.startDate instanceof Timestamp
                      ? driver.startDate.toDate().toDateString()
                      : new Date(driver.startDate).toDateString()}
                  </Text>
                  <Text className="text-gray-300 mt-1">
                    ⏰ Start: {driver.startTime || "-"} | End:{" "}
                    {driver.endTime || "-"}
                  </Text>
                  <Text className="text-gray-300 mt-1">
                    💰 Payment: ₹{driver.payment || "0"}
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
