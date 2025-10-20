import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Alert } from "react-native";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db, auth } from "../../auth/firebase";

type Driver = {
  id?: string;
  firstName: string;
  lastName: string;
  payment: string;
  location?: string;
  createdBy?: string;
};

export default function DailyPaymentScreen() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPayment, setTotalPayment] = useState(0);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return setDrivers([]);

      // ✅ Only fetch drivers created by the logged-in user
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
              drivers.map((driver, index) => (
                <View
                  key={driver.id || index}
                  className="bg-gray-900 p-4 rounded-2xl border border-gray-700 flex-row justify-between items-center mb-4"
                >
                  <View>
                    <Text className="text-white font-semibold text-lg">
                      {driver.firstName} {driver.lastName}
                    </Text>
                    <Text className="text-gray-300 mt-1">
                      Location: {driver.location || "-"}
                    </Text>
                  </View>
                  <Text className="text-white font-bold text-lg">
                    ₹{driver.payment || 0}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>
        </>
      )}
    </View>
  );
}
