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
import { collection, getDocs, query, where } from "firebase/firestore";
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
};

export default function DailyPaymentScreen() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPayment, setTotalPayment] = useState(0);
  const [paying, setPaying] = useState(false);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return setDrivers([]);

      const q = query(
        collection(db, "drivers"),
        where("createdBy", "==", user.uid)
      );

      const snapshot = await getDocs(q);
      const list: Driver[] = [];
      let total = 0;

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Driver;
        list.push({ id: docSnap.id, ...data });

        const paymentNumber = Number(data.payment) || 0;
        total += paymentNumber;
      });

      setDrivers(list);
      setTotalPayment(total);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  // ✅ Helper: check if driver end time has passed
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

  // ✅ Open UPI payment intent
  const handlePay = async (driver: Driver) => {
    try {
      setPaying(true);

      const upiId = driver.phone ? `${driver.phone}@upi` : "example@upi"; // fallback
      const amount = driver.payment || "0";

      const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(
        `${driver.firstName} ${driver.lastName}`
      )}&am=${amount}&cu=INR&tn=${encodeURIComponent("Valet Service Payment")}`;

      const supported = await Linking.canOpenURL(upiUrl);
      if (supported) {
        await Linking.openURL(upiUrl);
      } else {
        Alert.alert(
          "UPI App Not Found",
          "Please install a UPI app like Google Pay, PhonePe, or Paytm to proceed."
        );
      }
    } catch (error: any) {
      Alert.alert("Payment Error", error.message);
    } finally {
      setPaying(false);
    }
  };

  return (
    <View className="flex-1 bg-black pt-16 px-4">
      <Text className="text-3xl font-bold text-white mb-6">Daily Payment</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#1E90FF" />
      ) : (
        <>
          <Text className="text-white font-bold text-lg mb-4">
            Total Payment: ₹{totalPayment}
          </Text>

          <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
            {drivers.length === 0 ? (
              <Text className="text-gray-400 text-center mt-10">
                No driver payments yet
              </Text>
            ) : (
              drivers.map((driver, index) => {
                const showPayButton =
                  driver.location &&
                  driver.endTime &&
                  hasEndTimePassed(driver.endTime);

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
              })
            )}
          </ScrollView>
        </>
      )}
    </View>
  );
}
