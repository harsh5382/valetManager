import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db, auth } from "../../auth/firebase";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
type Driver = {
  id?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  location?: string;
  payment?: string | number;
  startDate?: any; // Firestore Timestamp
  createdBy?: string;
};

export default function GenerateBillScreen() {
  const [loading, setLoading] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [mode, setMode] = useState<"month" | "today" | "driver" | null>(null);

  // For "driver" mode
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Summary state (calculated locally from fetched drivers)
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    // Fetch only drivers created by current user
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return setDrivers([]);

      const q = query(
        collection(db, "drivers"),
        where("createdBy", "==", user.uid)
      );
      const snap = await getDocs(q);
      const list: Driver[] = [];
      snap.forEach((ds) => list.push({ id: ds.id, ...(ds.data() as any) }));
      setDrivers(list);
    } catch (err: any) {
      console.log("Fetch drivers error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const openMode = (m: "month" | "today" | "driver") => {
    setMode(m);
    setSummary(null);
    setModalVisible(true);

    // compute summary after small delay (simulate loading state)
    setTimeout(() => computeSummary(m), 150);
  };

  const computeSummary = (m: "month" | "today" | "driver") => {
    const now = new Date();

    if (m === "today") {
      const todayStr = now.toISOString().split("T")[0];
      const todays = drivers.filter((d) => {
        if (!d.startDate) return false;
        const driverDate = d.startDate.toDate
          ? d.startDate.toDate().toISOString().split("T")[0]
          : new Date(d.startDate).toISOString().split("T")[0];
        return driverDate === todayStr;
      });

      const total = todays.reduce(
        (acc, cur) => acc + (Number(cur.payment) || 0),
        0
      );
      setSummary({ items: todays, total });
      return;
    }

    if (m === "month") {
      // whole month for current month
      const year = now.getFullYear();
      const month = now.getMonth(); // 0-index

      const monthItems = drivers.filter((d) => {
        if (!d.startDate) return false;
        const dt = d.startDate.toDate
          ? d.startDate.toDate()
          : new Date(d.startDate);
        return dt.getFullYear() === year && dt.getMonth() === month;
      });

      // group by driver
      const map: Record<
        string,
        { driver: Driver; days: number; total: number }
      > = {};
      monthItems.forEach((it) => {
        const key = `${it.firstName}-${it.lastName}-${it.id}`;
        if (!map[key]) map[key] = { driver: it, days: 0, total: 0 };
        map[key].days += 1;
        map[key].total += Number(it.payment) || 0;
      });

      const list = Object.values(map);
      const total = list.reduce((acc, cur) => acc + cur.total, 0);
      setSummary({ grouped: list, total });
      return;
    }

    if (m === "driver") {
      if (!selectedDriverId) {
        setSummary({ items: [] });
        return;
      }

      // compute driver-specific days and monthly summary (current month)
      const driverRecords = drivers.filter((d) => d.id === selectedDriverId);

      // For "how many days they worked" we can count unique dates in their records
      const dates = new Set<string>();
      let total = 0;
      driverRecords.forEach((r) => {
        if (!r.startDate) return;
        const dt = r.startDate.toDate
          ? r.startDate.toDate()
          : new Date(r.startDate);
        const dateKey = dt.toISOString().split("T")[0];
        dates.add(dateKey);
        total += Number(r.payment) || 0;
      });

      setSummary({
        driver: driverRecords[0],
        daysWorked: dates.size,
        total,
        records: driverRecords,
      });
      return;
    }
  };

  const filteredDrivers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return drivers;
    return drivers.filter((d) =>
      `${d.firstName} ${d.lastName}`.toLowerCase().includes(q)
    );
  }, [drivers, searchQuery]);

  return (
    <View className="flex-1 bg-black pt-16 px-4">
      <Text className="text-3xl font-bold text-white mb-6">Generate Bill</Text>

      <BlurView
        intensity={70}
        tint="dark"
        className="rounded-3xl p-4 mb-4 border border-gray-700"
      >
        <Text className="text-white font-semibold mb-2">Choose an option</Text>

        <View className="flex-row justify-between">
          <TouchableOpacity
            onPress={() => openMode("month")}
            className="flex-1 mr-2 p-4 rounded-2xl items-center"
            style={{ backgroundColor: "rgba(30,144,255,0.06)" }}
          >
            <Ionicons name="calendar-outline" size={22} color="#1E90FF" />
            <Text className="text-white mt-2 font-semibold">Whole Month</Text>
            <Text className="text-gray-400 text-xs mt-1">
              All drivers - this month
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => openMode("today")}
            className="flex-1 ml-2 p-4 rounded-2xl items-center"
            style={{ backgroundColor: "rgba(30,144,255,0.06)" }}
          >
            <Ionicons name="today-outline" size={22} color="#1E90FF" />
            <Text className="text-white mt-2 font-semibold">Today's Bill</Text>
            <Text className="text-gray-400 text-xs mt-1">
              Only today's records
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => openMode("driver")}
          className="mt-4 p-4 rounded-2xl flex-row items-center justify-between"
          style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
        >
          <View>
            <Text className="text-white font-semibold">Specific Driver</Text>
            <Text className="text-gray-400 text-sm">
              Search and select a driver
            </Text>
          </View>
          <FontAwesome5 name="user" size={20} color="#1E90FF" />
        </TouchableOpacity>
      </BlurView>

      <Text className="text-gray-400 mb-2">
        Tip: PDF generation will include a header, table of records, totals, and
        your business info.
      </Text>

      {/* Modal: shows results for chosen mode and actions */}
      <Modal visible={modalVisible} animationType="slide" transparent={false}>
        <View className="flex-1 bg-black px-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white text-2xl font-bold">
              {mode === "month"
                ? "Whole Month"
                : mode === "today"
                  ? "Today's Bill"
                  : "Specific Driver"}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setModalVisible(false);
                setSelectedDriverId(null);
                setSearchQuery("");
              }}
            >
              <FontAwesome5 name="times" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {loading || !summary ? (
            <ActivityIndicator size="large" color="#1E90FF" />
          ) : (
            <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
              {/* Today mode */}
              {mode === "today" && (
                <View>
                  <Text className="text-gray-300 mb-2">
                    Total for today: ₹{summary.total || 0}
                  </Text>

                  {summary.items && summary.items.length === 0 && (
                    <Text className="text-gray-400">No records for today</Text>
                  )}

                  {summary.items &&
                    summary.items.map((it: Driver) => (
                      <View
                        key={it.id}
                        className="bg-gray-900 p-4 rounded-2xl mb-3 border border-gray-700"
                      >
                        <Text className="text-white font-semibold">
                          {it.firstName} {it.lastName}
                        </Text>
                        <Text className="text-gray-300 mt-1">
                          Location: {it.location || "-"}
                        </Text>
                        <Text className="text-gray-300 mt-1">
                          Payment: ₹{it.payment || 0}
                        </Text>
                      </View>
                    ))}

                  <TouchableOpacity
                    disabled={true}
                    className="mt-4 bg-blue-600 p-3 rounded-2xl items-center"
                  >
                    <Text className="text-white font-semibold">
                      Generate PDF (placeholder)
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Month mode */}
              {mode === "month" && (
                <View>
                  <Text className="text-gray-300 mb-2">
                    Total payout this month: ₹{summary.total || 0}
                  </Text>

                  {summary.grouped && summary.grouped.length === 0 && (
                    <Text className="text-gray-400">
                      No records for this month
                    </Text>
                  )}

                  {summary.grouped &&
                    summary.grouped.map((g: any, idx: number) => (
                      <View
                        key={idx}
                        className="bg-gray-900 p-4 rounded-2xl mb-3 border border-gray-700"
                      >
                        <Text className="text-white font-semibold">
                          {g.driver.firstName} {g.driver.lastName}
                        </Text>
                        <Text className="text-gray-300 mt-1">
                          Days: {g.days} | Total: ₹{g.total}
                        </Text>
                      </View>
                    ))}

                  <TouchableOpacity
                    disabled={true}
                    className="mt-4 bg-blue-600 p-3 rounded-2xl items-center"
                  >
                    <Text className="text-white font-semibold">
                      Generate Month PDF (placeholder)
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Driver mode */}
              {mode === "driver" && (
                <View>
                  <TextInput
                    placeholder="Search driver"
                    placeholderTextColor="#888"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    className="bg-gray-900 p-3 rounded-xl text-white mb-3 border border-gray-700"
                  />

                  <ScrollView style={{ maxHeight: 220 }}>
                    {filteredDrivers.map((d) => (
                      <TouchableOpacity
                        key={d.id}
                        onPress={() => {
                          setSelectedDriverId(d.id!);
                          computeSummary("driver");
                        }}
                        className="p-3 rounded-xl mb-2"
                        style={{
                          backgroundColor:
                            selectedDriverId === d.id
                              ? "rgba(30,144,255,0.08)"
                              : "transparent",
                        }}
                      >
                        <Text className="text-white">
                          {d.firstName} {d.lastName}
                        </Text>
                        <Text className="text-gray-400 text-sm">
                          {d.phone || "-"}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {selectedDriverId && summary && (
                    <View className="mt-4">
                      <Text className="text-gray-300">
                        Days worked: {summary.daysWorked}
                      </Text>
                      <Text className="text-gray-300">
                        Total earned: ₹{summary.total}
                      </Text>

                      <TouchableOpacity
                        disabled={true}
                        className="mt-4 bg-blue-600 p-3 rounded-2xl items-center"
                      >
                        <Text className="text-white font-semibold">
                          Generate Driver Monthly PDF (placeholder)
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        disabled={true}
                        className="mt-3 bg-gray-700 p-3 rounded-2xl items-center"
                      >
                        <Text className="text-gray-300">
                          Generate Driver Date-range PDF (placeholder)
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}
