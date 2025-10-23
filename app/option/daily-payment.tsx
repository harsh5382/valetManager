import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Linking,
} from "react-native";
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db, auth } from "../../auth/firebase";

type Driver = {
  id?: string;
  firstName: string;
  lastName: string;
  payment: string;
  phone?: string;
  location?: string;
  createdBy?: string;
  endTime?: string;
  createdAt?: Timestamp;
};

export default function PaymentsScreen() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPayment, setTotalPayment] = useState(0);
  const [paying, setPaying] = useState(false);
  const [viewMode, setViewMode] = useState<"daily" | "monthly">("daily");

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return;

      const q = query(
        collection(db, "drivers"),
        where("createdBy", "==", user.uid)
      );
      const snapshot = await getDocs(q);

      const list: Driver[] = [];
      let total = 0;

      const now = new Date();
      const currentDateString = now.toDateString();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Driver;
        const createdAt =
          data.createdAt instanceof Timestamp
            ? data.createdAt.toDate()
            : new Date();

        // Filter based on viewMode
        if (
          (viewMode === "daily" &&
            createdAt.toDateString() === currentDateString) ||
          (viewMode === "monthly" &&
            createdAt.getMonth() === currentMonth &&
            createdAt.getFullYear() === currentYear)
        ) {
          list.push({ id: docSnap.id, ...data });
          total += Number(data.payment) || 0;
        }
      });

      setDrivers(list);
      setTotalPayment(total);
    } catch (error: unknown) {
      const err = error as Error;
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, [viewMode]);

  const hasEndTimePassed = (endTime?: string) => {
    if (!endTime) return false;
    const now = new Date();
    const match = endTime.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!match) return false;

    let hours = parseInt(match[1], 10);
    let minutes = parseInt(match[2], 10);
    const meridian = match[3]?.toUpperCase();
    if (meridian === "PM" && hours < 12) hours += 12;
    if (meridian === "AM" && hours === 12) hours = 0;

    const end = new Date();
    end.setHours(hours, minutes, 0, 0);
    return now >= end;
  };

  const handlePay = async (driver: Driver) => {
    try {
      setPaying(true);
      const upiId = driver.phone ? `${driver.phone}@upi` : "example@upi";
      const amount = driver.payment || "0";

      const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(
        `${driver.firstName} ${driver.lastName}`
      )}&am=${amount}&cu=INR&tn=${encodeURIComponent("Valet Service Payment")}`;

      const supported = await Linking.canOpenURL(upiUrl);
      if (supported) await Linking.openURL(upiUrl);
      else
        Alert.alert(
          "UPI App Not Found",
          "Please install a UPI app like Google Pay, PhonePe, or Paytm."
        );
    } catch (error: unknown) {
      const err = error as Error;
      Alert.alert("Payment Error", err.message);
    } finally {
      setPaying(false);
    }
  };

  return (
    <View className="flex-1 bg-black pt-16 px-4">
      <Text className="text-3xl font-bold text-white mb-6">Payments</Text>

      {/* Toggle Buttons */}
      <View className="flex-row mb-6">
        <TouchableOpacity
          className={`flex-1 py-2 rounded-l-full border border-gray-700 ${
            viewMode === "daily" ? "bg-blue-600" : "bg-gray-900"
          }`}
          onPress={() => setViewMode("daily")}
        >
          <Text className="text-white text-center font-semibold">Daily</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-2 rounded-r-full border border-gray-700 ${
            viewMode === "monthly" ? "bg-blue-600" : "bg-gray-900"
          }`}
          onPress={() => setViewMode("monthly")}
        >
          <Text className="text-white text-center font-semibold">Monthly</Text>
        </TouchableOpacity>
      </View>

      <Text className="text-white font-bold text-lg mb-4">
        Total Payment: ₹{totalPayment}
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="#1E90FF" />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          {drivers.map((driver, index) => {
            // Show Pay button logic
            const showPayButton =
              viewMode === "monthly" || // always show for monthly
              (driver.location &&
                driver.endTime &&
                hasEndTimePassed(driver.endTime));

            return (
              <View
                key={driver.id || index}
                className="bg-gray-900 p-4 rounded-2xl border border-gray-700 mb-4"
              >
                <View className="flex-row justify-between items-center">
                  <View>
                    <Text className="text-white font-semibold text-lg">
                      {driver.firstName} {driver.lastName}
                    </Text>
                    <Text className="text-gray-300 mt-1">
                      Location: {driver.location || "-"}
                    </Text>
                    <Text className="text-gray-400 mt-1">
                      End Time: {driver.endTime || "N/A"}
                    </Text>
                  </View>

                  <Text className="text-white font-bold text-lg">
                    ₹{driver.payment || 0}
                  </Text>
                </View>

                {showPayButton && (
                  <TouchableOpacity
                    className="bg-green-600 mt-3 py-2 rounded-full items-center"
                    onPress={() => handlePay(driver)}
                    disabled={paying}
                  >
                    {paying ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text className="text-white font-semibold text-lg">
                        Pay
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
