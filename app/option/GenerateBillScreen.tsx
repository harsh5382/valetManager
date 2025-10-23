import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { BlurView } from "expo-blur";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db, auth } from "../../auth/firebase";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Print from "expo-print";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

type Driver = {
  id?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  location?: string;
  payment?: string | number;
  startDate?: any;
  createdBy?: string;
};

export default function GenerateBillScreen() {
  const [loading, setLoading] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [mode, setMode] = useState<"month" | "today" | "driver" | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [summary, setSummary] = useState<any>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
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
      const year = now.getFullYear();
      const month = now.getMonth();
      const monthItems = drivers.filter((d) => {
        if (!d.startDate) return false;
        const dt = d.startDate.toDate
          ? d.startDate.toDate()
          : new Date(d.startDate);
        return dt.getFullYear() === year && dt.getMonth() === month;
      });

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

      const driverRecords = drivers.filter((d) => d.id === selectedDriverId);
      const dates = new Set<string>();
      let total = 0;
      driverRecords.forEach((r) => {
        if (!r.startDate) return;
        const dt = r.startDate.toDate
          ? r.startDate.toDate()
          : new Date(r.startDate);
        dates.add(dt.toISOString().split("T")[0]);
        total += Number(r.payment) || 0;
      });
      setSummary({
        driver: driverRecords[0],
        daysWorked: dates.size,
        total,
        records: driverRecords,
      });
    }
  };

  const filteredDrivers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return drivers;
    return drivers.filter((d) =>
      `${d.firstName} ${d.lastName}`.toLowerCase().includes(q)
    );
  }, [drivers, searchQuery]);

  // Generate PDF using HTML
  const generatePDF = async (html: string) => {
    try {
      setPdfLoading(true); // start loader
      const { uri } = await Print.printToFileAsync({ html });

      // Move to permanent file
      const fileUri = FileSystem.documentDirectory + "bill.pdf";
      await FileSystem.moveAsync({
        from: uri,
        to: fileUri,
      });

      // Share
      await Sharing.shareAsync(fileUri);
    } catch (err) {
      console.log("PDF generation error:", err);
      Alert.alert("Error", "Failed to generate PDF.");
    } finally {
      setPdfLoading(false); // stop loader
    }
  };

  const generateTodayPDF = () => {
    if (!summary?.items || summary.items.length === 0) {
      Alert.alert("No records", "No records for today.");
      return;
    }

    let html = `<h1>Today's Bill</h1><p>Total: ₹${summary.total}</p><table border="1" style="border-collapse:collapse;width:100%"><tr><th>Name</th><th>Location</th><th>Payment</th></tr>`;
    summary.items.forEach((d: Driver) => {
      html += `<tr><td>${d.firstName} ${d.lastName}</td><td>${d.location || "-"}</td><td>₹${d.payment}</td></tr>`;
    });
    html += `</table>`;
    generatePDF(html);
  };

  const generateMonthPDF = () => {
    if (!summary?.grouped || summary.grouped.length === 0) {
      Alert.alert("No records", "No records for this month.");
      return;
    }

    let html = `<h1>Month Bill</h1><p>Total: ₹${summary.total}</p><table border="1" style="border-collapse:collapse;width:100%"><tr><th>Name</th><th>Days</th><th>Total</th></tr>`;
    summary.grouped.forEach((g: any) => {
      html += `<tr><td>${g.driver.firstName} ${g.driver.lastName}</td><td>${g.days}</td><td>₹${g.total}</td></tr>`;
    });
    html += `</table>`;
    generatePDF(html);
  };

  const generateDriverPDF = () => {
    if (!summary?.records || summary.records.length === 0) {
      Alert.alert("No records", "No records for this driver.");
      return;
    }

    let html = `<h1>Driver: ${summary.driver.firstName} ${summary.driver.lastName}</h1>`;
    html += `<p>Days Worked: ${summary.daysWorked}</p><p>Total: ₹${summary.total}</p>`;
    html += `<table border="1" style="border-collapse:collapse;width:100%"><tr><th>Date</th><th>Location</th><th>Payment</th></tr>`;
    summary.records.forEach((r: Driver) => {
      const dt = r.startDate.toDate
        ? r.startDate.toDate()
        : new Date(r.startDate);
      html += `<tr><td>${dt.toDateString()}</td><td>${r.location || "-"}</td><td>₹${r.payment}</td></tr>`;
    });
    html += `</table>`;
    generatePDF(html);
  };

  return (
    <SafeAreaView className="flex-1 bg-black px-4 pt-16">
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
            <Text className="text-white mt-16 font-semibold">Today's Bill</Text>
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

      {/* Modal for results */}
      <Modal visible={modalVisible} animationType="slide" transparent={false}>
        <SafeAreaView className="flex-1 bg-black  px-4 pt-16">
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
              {mode === "today" && (
                <>
                  <Text className="text-gray-300 mb-2">
                    Total for today: ₹{summary.total || 0}
                  </Text>
                  {summary.items.length === 0 && (
                    <Text className="text-gray-400">No records for today</Text>
                  )}
                  {summary.items.map((it: Driver) => (
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
                    onPress={generateTodayPDF}
                    className="mt-4 bg-blue-600 p-3 rounded-2xl items-center"
                    disabled={pdfLoading} // prevent multiple clicks
                  >
                    {pdfLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text className="text-white font-semibold">
                        Generate PDF
                      </Text>
                    )}
                  </TouchableOpacity>
                </>
              )}

              {mode === "month" && (
                <>
                  <Text className="text-gray-300 mb-2">
                    Total payout this month: ₹{summary.total || 0}
                  </Text>
                  {summary.grouped.map((g: any, idx: number) => (
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
                    onPress={generateMonthPDF}
                    className="mt-4 bg-blue-600 p-3 rounded-2xl items-center"
                    disabled={pdfLoading} // prevent multiple clicks
                  >
                    {pdfLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text className="text-white font-semibold">
                        Generate PDF
                      </Text>
                    )}
                  </TouchableOpacity>
                </>
              )}

              {mode === "driver" && (
                <>
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
                        onPress={generateDriverPDF}
                        className="mt-4 bg-blue-600 p-3 rounded-2xl items-center"
                        disabled={pdfLoading} // prevent multiple clicks
                      >
                        {pdfLoading ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text className="text-white font-semibold">
                            Generate PDF
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
