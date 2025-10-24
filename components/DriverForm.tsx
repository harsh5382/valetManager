import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
} from "react-native";
import {
  collection,
  addDoc,
  Timestamp,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db, auth } from "../auth/firebase";
import DateTimePicker from "@react-native-community/datetimepicker";

type Driver = {
  id?: string;
  firstName: string;
  lastName: string;
  phone: string;
  location?: string;
  startTime: string;
  endTime: string;
  payment: string;
  startDate?: Timestamp;
};

type DriverFormProps = {
  location: string;
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  driverData?: Driver | null;
  notice?: string;
};

export default function DriverForm({
  location,
  visible,
  onClose,
  onSuccess,
  driverData,
  notice,
}: DriverFormProps) {
  const [firstName, setFirstName] = useState(driverData?.firstName || "");
  const [lastName, setLastName] = useState(driverData?.lastName || "");
  const [phone, setPhone] = useState(driverData?.phone || "");
  const [startTime, setStartTime] = useState(driverData?.startTime || "");
  const [endTime, setEndTime] = useState(driverData?.endTime || "");
  const [payment, setPayment] = useState(driverData?.payment || "");
  const [startDate, setStartDate] = useState<Date>(
    driverData?.startDate?.toDate() || new Date()
  );

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  // State for custom time pickers
  const [startHour, setStartHour] = useState<number | null>(null);
  const [startMinute, setStartMinute] = useState<number | null>(null);
  const [startPeriod, setStartPeriod] = useState<"AM" | "PM">("AM");
  const [endHour, setEndHour] = useState<number | null>(null);
  const [endMinute, setEndMinute] = useState<number | null>(null);
  const [endPeriod, setEndPeriod] = useState<"AM" | "PM">("AM");

  useEffect(() => {
    setFirstName(driverData?.firstName || "");
    setLastName(driverData?.lastName || "");
    setPhone(driverData?.phone || "");
    setPayment(driverData?.payment || "");
    setStartDate(driverData?.startDate?.toDate() || new Date());

    // Parse existing startTime and endTime
    if (driverData?.startTime) {
      const [time, period] = driverData.startTime.split(" ");
      const [hour, minute] = time.split(":").map(Number);
      setStartHour(hour);
      setStartMinute(minute);
      setStartPeriod(period as "AM" | "PM");
    } else {
      setStartHour(null);
      setStartMinute(null);
      setStartPeriod("AM");
    }

    if (driverData?.endTime) {
      const [time, period] = driverData.endTime.split(" ");
      const [hour, minute] = time.split(":").map(Number);
      setEndHour(hour);
      setEndMinute(minute);
      setEndPeriod(period as "AM" | "PM");
    } else {
      setEndHour(null);
      setEndMinute(null);
      setEndPeriod("AM");
    }
  }, [driverData]);

  // Generate valid hours and minutes based on constraints
  const getValidHours = (isStart: boolean) => {
    const now = new Date();
    const isToday = startDate.toDateString() === now.toDateString();
    const hours = Array.from({ length: 12 }, (_, i) => (i === 0 ? 12 : i));

    if (isStart && isToday) {
      return hours.filter((h) => {
        const adjustedHour = startPeriod === "PM" && h !== 12 ? h + 12 : h;
        return adjustedHour >= now.getHours();
      });
    }
    return hours;
  };

  const getValidMinutes = (isStart: boolean, selectedHour: number | null) => {
    const now = new Date();
    const isToday = startDate.toDateString() === now.toDateString();
    const minutes = Array.from({ length: 60 }, (_, i) => i);

    if (isStart && isToday && selectedHour !== null) {
      const adjustedHour =
        startPeriod === "PM" && selectedHour !== 12
          ? selectedHour + 12
          : selectedHour;
      if (adjustedHour === now.getHours()) {
        return minutes.filter((m) => m >= now.getMinutes());
      }
    }
    return minutes;
  };

  const getValidEndHours = () => {
    if (!startHour || !startMinute)
      return Array.from({ length: 12 }, (_, i) => (i === 0 ? 12 : i));

    const startDateTime = new Date(startDate);
    const adjustedStartHour =
      startPeriod === "PM" && startHour !== 12 ? startHour + 12 : startHour;
    startDateTime.setHours(adjustedStartHour, startMinute, 0, 0);

    return Array.from({ length: 12 }, (_, i) => (i === 0 ? 12 : i)).filter(
      (h) => {
        const adjustedEndHour = endPeriod === "PM" && h !== 12 ? h + 12 : h;
        const endDateTime = new Date(startDate);
        endDateTime.setHours(adjustedEndHour, 0, 0, 0);
        return endDateTime >= startDateTime;
      }
    );
  };

  const getValidEndMinutes = (selectedEndHour: number | null) => {
    if (!startHour || !startMinute || !selectedEndHour)
      return Array.from({ length: 60 }, (_, i) => i);

    const startDateTime = new Date(startDate);
    const adjustedStartHour =
      startPeriod === "PM" && startHour !== 12 ? startHour + 12 : startHour;
    startDateTime.setHours(adjustedStartHour, startMinute, 0, 0);

    const adjustedEndHour =
      endPeriod === "PM" && selectedEndHour !== 12
        ? selectedEndHour + 12
        : selectedEndHour;
    const endDateTime = new Date(startDate);
    endDateTime.setHours(adjustedEndHour, 0, 0, 0);

    if (endDateTime.getTime() === startDateTime.getTime()) {
      return Array.from({ length: 60 }, (_, i) => i).filter(
        (m) => m >= startMinute
      );
    }
    return Array.from({ length: 60 }, (_, i) => i);
  };

  // Update startTime and endTime when values change
  useEffect(() => {
    if (startHour !== null && startMinute !== null) {
      const formattedHour = startHour.toString().padStart(2, "0");
      const formattedMinute = startMinute.toString().padStart(2, "0");
      setStartTime(`${formattedHour}:${formattedMinute} ${startPeriod}`);
    }
  }, [startHour, startMinute, startPeriod]);

  useEffect(() => {
    if (endHour !== null && endMinute !== null) {
      const formattedHour = endHour.toString().padStart(2, "0");
      const formattedMinute = endMinute.toString().padStart(2, "0");
      setEndTime(`${formattedHour}:${formattedMinute} ${endPeriod}`);
    }
  }, [endHour, endMinute, endPeriod]);

  const handleSaveDriver = async () => {
    if (saving) return;
    if (
      !firstName ||
      !lastName ||
      !phone ||
      !startTime ||
      !endTime ||
      !payment
    ) {
      Alert.alert("Error", "Please fill out all fields");
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert("Error", "No user logged in. Please log in again.");
      return;
    }

    try {
      setSaving(true);

      if (driverData?.id) {
        await updateDoc(doc(db, "drivers", driverData.id), {
          firstName,
          lastName,
          phone,
          startTime,
          endTime,
          payment,
          startDate: Timestamp.fromDate(startDate),
          updatedAt: Timestamp.now(),
        });
        Alert.alert("Success", "Driver updated successfully!");
      } else {
        await addDoc(collection(db, "drivers"), {
          createdBy: currentUser.uid,
          firstName,
          lastName,
          phone,
          location,
          startTime,
          endTime,
          payment,
          startDate: Timestamp.fromDate(startDate),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        Alert.alert("Success", "Driver added successfully!");
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setSaving(false);
    }
  };

  const onDateChange = (event: any, selected?: Date) => {
    setShowDatePicker(false);
    if (selected) {
      setStartDate(selected);
      // Reset time pickers if date changes to enforce constraints
      setStartHour(null);
      setStartMinute(null);
      setStartPeriod("AM");
      setEndHour(null);
      setEndMinute(null);
      setEndPeriod("AM");
      setStartTime("");
      setEndTime("");
    }
  };

  const TimePicker = ({
    label,
    isStart,
    hour,
    setHour,
    minute,
    setMinute,
    period,
    setPeriod,
    show,
    setShow,
  }: {
    label: string;
    isStart: boolean;
    hour: number | null;
    setHour: (h: number) => void;
    minute: number | null;
    setMinute: (m: number) => void;
    period: "AM" | "PM";
    setPeriod: (p: "AM" | "PM") => void;
    show: boolean;
    setShow: (show: boolean) => void;
  }) => {
    const validHours = isStart ? getValidHours(isStart) : getValidEndHours();
    const validMinutes = isStart
      ? getValidMinutes(isStart, hour)
      : getValidEndMinutes(hour);

    return (
      <>
        <TouchableOpacity
          className="w-full bg-gray-900 border border-gray-700 rounded-2xl p-4 mb-4"
          onPress={() => setShow(true)}
        >
          <Text className="text-white">
            {hour !== null && minute !== null
              ? `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")} ${period}`
              : label}
          </Text>
        </TouchableOpacity>
        <Modal
          visible={show}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShow(false)}
        >
          <View className="flex-1 justify-center items-center bg-black/50 backdrop-blur-md">
            <View className="bg-gray-900 p-6 rounded-2xl border border-gray-700 w-11/12 max-w-md">
              <Text className="text-white text-lg font-semibold mb-4 text-center">
                Select {label}
              </Text>
              <View className="flex-row justify-between items-center">
                {/* Hours Picker */}
                <ScrollView
                  className="h-40 w-1/4 bg-gray-800 rounded-xl border border-gray-600 mx-2"
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{
                    alignItems: "center",
                    paddingVertical: 16,
                  }}
                >
                  {validHours.map((h) => (
                    <TouchableOpacity
                      key={h}
                      className={`py-2 w-full items-center ${h === hour ? "bg-blue-600" : ""}`}
                      onPress={() => setHour(h)}
                    >
                      <Text className="text-white text-base">
                        {h.toString().padStart(2, "0")}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {/* Minutes Picker */}
                <ScrollView
                  className="h-40 w-1/4 bg-gray-800 rounded-xl border border-gray-600 mx-2"
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{
                    alignItems: "center",
                    paddingVertical: 16,
                  }}
                >
                  {validMinutes.map((m) => (
                    <TouchableOpacity
                      key={m}
                      className={`py-2 w-full items-center ${m === minute ? "bg-blue-600" : ""}`}
                      onPress={() => setMinute(m)}
                    >
                      <Text className="text-white text-base">
                        {m.toString().padStart(2, "0")}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {/* AM/PM Picker */}
                <View className="w-1/6 mx-2">
                  {["AM", "PM"].map((p) => (
                    <TouchableOpacity
                      key={p}
                      className={`py-4 mb-2 rounded-xl border border-gray-600 items-center ${p === period ? "bg-blue-600" : "bg-gray-800"}`}
                      onPress={() => setPeriod(p as "AM" | "PM")}
                    >
                      <Text className="text-white text-base">{p}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <TouchableOpacity
                className="bg-blue-600 py-3 rounded-2xl items-center mt-4"
                onPress={() => setShow(false)}
              >
                <Text className="text-white font-semibold">Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: "#000" }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text className="text-3xl font-bold text-white mb-4 text-center">
            {driverData?.id ? "Edit Driver" : "Add Driver"}
          </Text>

          {notice && (
            <Text className="text-yellow-400 text-center mb-4">{notice}</Text>
          )}

          {[
            {
              value: firstName,
              setter: setFirstName,
              placeholder: "First Name",
            },
            { value: lastName, setter: setLastName, placeholder: "Last Name" },
            {
              value: phone,
              setter: setPhone,
              placeholder: "Phone",
              keyboard: "phone-pad",
            },
            {
              value: payment,
              setter: setPayment,
              placeholder: "Payment",
              keyboard: "numeric",
            },
          ].map((input, index) => (
            <TextInput
              key={index}
              className="w-full bg-gray-900 border border-gray-700 rounded-2xl p-4 mb-4 text-white text-base"
              placeholder={input.placeholder}
              placeholderTextColor="#888"
              value={input.value}
              onChangeText={input.setter}
              keyboardType={input.keyboard as any}
            />
          ))}

          <TouchableOpacity
            className="w-full bg-gray-900 border border-gray-700 rounded-2xl p-4 mb-4"
            onPress={() => setShowDatePicker(true)}
          >
            <Text className="text-white">{startDate.toDateString()}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="spinner"
              onChange={onDateChange}
            />
          )}

          <TimePicker
            label="Start Time"
            isStart={true}
            hour={startHour}
            setHour={setStartHour}
            minute={startMinute}
            setMinute={setStartMinute}
            period={startPeriod}
            setPeriod={setStartPeriod}
            show={showStartTimePicker}
            setShow={setShowStartTimePicker}
          />

          <TimePicker
            label="End Time"
            isStart={false}
            hour={endHour}
            setHour={setEndHour}
            minute={endMinute}
            setMinute={setEndMinute}
            period={endPeriod}
            setPeriod={setEndPeriod}
            show={showEndTimePicker}
            setShow={setShowEndTimePicker}
          />

          <TouchableOpacity
            className="bg-blue-600 py-4 rounded-2xl items-center mb-4 shadow-lg flex-row justify-center"
            onPress={handleSaveDriver}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-lg">
                {driverData?.id ? "Update Driver" : "Add Driver"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="items-center"
            onPress={onClose}
            disabled={saving}
          >
            <Text className="text-gray-400 font-semibold">Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
