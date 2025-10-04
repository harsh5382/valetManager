// app/profile/daily-payment.tsx
import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Alert } from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../auth/firebase";
import { FontAwesome5 } from "@expo/vector-icons";

type Driver = {
  id?: string;
  firstName: string;
  lastName: string;
  payment: string; // assuming payment is stored as string
  location?: string;
};

export default function DailyPaymentScreen() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPayment, setTotalPayment] = useState(0);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "drivers"));
      const list: Driver[] = [];
      let total = 0;

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Driver;
        list.push({ id: docSnap.id, ...data });

        // accumulate total payment
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

  return (
    <View className="flex-1 bg-black pt-16 px-4">
      <Text className="text-3xl font-bold text-blue-400 mb-6">
        Daily Payment
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="#1E90FF" />
      ) : (
        <>
          <Text className="text-white font-bold text-lg mb-4">
            Total Payment: ₹{totalPayment}
          </Text>

          <ScrollView>
            {drivers.map((driver, index) => (
              <View
                key={driver.id || index}
                className="bg-gray-900 p-4 rounded-xl border border-gray-700 flex-row justify-between items-center"
                style={{ marginBottom: 12 }}
              >
                <View>
                  <Text className="text-white font-semibold">
                    {driver.firstName} {driver.lastName}
                  </Text>
                  <Text className="text-gray-300 mt-1">
                    Location: {driver.location || "-"}
                  </Text>
                </View>
                <Text className="text-white font-bold">
                  ₹{driver.payment || 0}
                </Text>
              </View>
            ))}
          </ScrollView>
        </>
      )}
    </View>
  );
}
