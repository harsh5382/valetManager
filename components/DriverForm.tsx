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

    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert("Error", "No user logged in. Please log in again.");
      return;
    }

    try {
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
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text className="text-3xl font-bold text-blue-400 mb-8 text-center">
            {driverData?.id ? "Edit Driver" : "Add Driver"}
          </Text>

          {/** Input fields */}
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

          {/** Date Picker */}
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

          {[
            {
              label: "Start Time",
              value: startTime,
              setter: setShowStartPicker,
              show: showStartPicker,
              onChange: onStartTimeChange,
            },
            {
              label: "End Time",
              value: endTime,
              setter: setShowEndPicker,
              show: showEndPicker,
              onChange: onEndTimeChange,
            },
          ].map((time, idx) => (
            <React.Fragment key={idx}>
              <TouchableOpacity
                className="w-full bg-gray-900 border border-gray-700 rounded-2xl p-4 mb-4"
                onPress={() => time.setter(true)}
              >
                <Text className="text-white">{time.value || time.label}</Text>
              </TouchableOpacity>
              {time.show && (
                <DateTimePicker
                  key={time.label} // optional, helps React track this child
                  value={new Date()}
                  mode="time"
                  display="spinner"
                  onChange={time.onChange}
                />
              )}
            </React.Fragment>
          ))}

          {/** Save Button */}
          <TouchableOpacity
            className="bg-blue-600 py-4 rounded-2xl items-center mb-4 shadow-lg"
            onPress={handleSaveDriver}
          >
            <Text className="text-white font-semibold text-lg">
              {driverData?.id ? "Update Driver" : "Add Driver"}
            </Text>
          </TouchableOpacity>

          {/** Cancel Button */}
          <TouchableOpacity className="items-center" onPress={onClose}>
            <Text className="text-gray-400 font-semibold">Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
