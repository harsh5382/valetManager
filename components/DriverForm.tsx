// components/DriverForm.tsx
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
} from "react-native";
import {
  collection,
  addDoc,
  Timestamp,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../auth/firebase";
import DateTimePicker from "@react-native-community/datetimepicker";

type Driver = {
  id?: string;
  firstName: string;
  lastName: string;
  phone: string;
  location: string;
  startTime: string;
  endTime: string;
  payment: string;
  startDate?: Timestamp; // new field
};

type DriverFormProps = {
  location: string;
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  driverData?: Driver | null; // Optional for editing
};

export default function DriverForm({
  location,
  visible,
  onClose,
  onSuccess,
  driverData,
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

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    setFirstName(driverData?.firstName || "");
    setLastName(driverData?.lastName || "");
    setPhone(driverData?.phone || "");
    setStartTime(driverData?.startTime || "");
    setEndTime(driverData?.endTime || "");
    setPayment(driverData?.payment || "");
    setStartDate(driverData?.startDate?.toDate() || new Date());
  }, [driverData]);

  const handleSaveDriver = async () => {
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

    try {
      if (driverData?.id) {
        // Edit mode
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
        // Add mode
        await addDoc(collection(db, "drivers"), {
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
    }
  };

  const onStartTimeChange = (event: any, selectedTime?: Date) => {
    setShowStartPicker(false);
    if (selectedTime) {
      setStartTime(
        selectedTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    }
  };

  const onEndTimeChange = (event: any, selectedTime?: Date) => {
    setShowEndPicker(false);
    if (selectedTime) {
      setEndTime(
        selectedTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    }
  };

  const onDateChange = (event: any, selected?: Date) => {
    setShowDatePicker(false);
    if (selected) setStartDate(selected);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: "#000" }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ padding: 20 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text className="text-3xl font-bold text-blue-400 mb-6">
            {driverData?.id ? "Edit Driver" : "Add Driver"}
          </Text>

          <TextInput
            className="w-full border border-gray-700 rounded-xl p-3 text-white mb-4 bg-gray-800"
            placeholder="First Name"
            placeholderTextColor="#888"
            value={firstName}
            onChangeText={setFirstName}
          />
          <TextInput
            className="w-full border border-gray-700 rounded-xl p-3 text-white mb-4 bg-gray-800"
            placeholder="Last Name"
            placeholderTextColor="#888"
            value={lastName}
            onChangeText={setLastName}
          />
          <TextInput
            className="w-full border border-gray-700 rounded-xl p-3 text-white mb-4 bg-gray-800"
            placeholder="Phone"
            placeholderTextColor="#888"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          {/* Start Date Picker */}
          <TouchableOpacity
            className="w-full border border-gray-700 rounded-xl p-3 mb-4 bg-gray-800 justify-center"
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

          <TouchableOpacity
            className="w-full border border-gray-700 rounded-xl p-3 mb-4 bg-gray-800 justify-center"
            onPress={() => setShowStartPicker(true)}
          >
            <Text className="text-white">
              {startTime || "Select Start Time"}
            </Text>
          </TouchableOpacity>
          {showStartPicker && (
            <DateTimePicker
              value={new Date()}
              mode="time"
              display="spinner"
              onChange={onStartTimeChange}
            />
          )}

          <TouchableOpacity
            className="w-full border border-gray-700 rounded-xl p-3 mb-4 bg-gray-800 justify-center"
            onPress={() => setShowEndPicker(true)}
          >
            <Text className="text-white">{endTime || "Select End Time"}</Text>
          </TouchableOpacity>
          {showEndPicker && (
            <DateTimePicker
              value={new Date()}
              mode="time"
              display="spinner"
              onChange={onEndTimeChange}
            />
          )}

          <TextInput
            className="w-full border border-gray-700 rounded-xl p-3 mb-4 text-white bg-gray-800"
            placeholder="Payment"
            placeholderTextColor="#888"
            value={payment}
            onChangeText={setPayment}
            keyboardType="numeric"
          />

          <TouchableOpacity
            className="bg-blue-600 py-3 rounded-xl items-center mb-3"
            onPress={handleSaveDriver}
          >
            <Text className="text-white font-semibold text-lg">
              {driverData?.id ? "Update Driver" : "Add Driver"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity className="items-center" onPress={onClose}>
            <Text className="text-gray-400 font-semibold">Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
