// DriverCard.tsx
import React, { useRef, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { Driver } from "../types/types";

type Props = {
  driver: Driver;
  onEdit: (driver: Driver) => void;
  onRemove: (driver: Driver) => void;
  onAssign?: (driver: Driver) => void;
  onDelete: (driverId?: string) => void;
  currentLocation?: string;
};

export default function DriverCard({
  driver,
  onEdit,
  onRemove,
  onAssign,
  onDelete,
  currentLocation,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const animatedHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: expanded ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [expanded]);

  return (
    <BlurView
      intensity={50}
      tint="dark"
      className="rounded-3xl mb-4 overflow-hidden border border-gray-800"
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setExpanded((prev) => !prev)}
        className="px-5 py-4 flex-row justify-between items-center"
      >
        <Text className="text-white font-semibold text-lg">
          {driver.firstName} {driver.lastName}
        </Text>
        <View className="flex-row gap-4">
          <TouchableOpacity onPress={() => onEdit(driver)}>
            <Ionicons name="pencil" size={20} color="#60A5FA" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onRemove(driver)}>
            <Ionicons name="trash" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {expanded && (
        <Animated.View style={{ opacity: animatedHeight }}>
          <View className="px-5 pb-4 space-y-1">
            <Text className="text-gray-300">Phone: {driver.phone}</Text>
            <Text className="text-gray-300">
              Start: {driver.startTime} | End: {driver.endTime}
            </Text>
            <Text className="text-gray-300">Payment: ₹{driver.payment}</Text>
            <Text className="text-gray-300">
              Date: {driver.startDate?.toDate().toDateString() || "-"}
            </Text>

            {!driver.location && onAssign && (
              <TouchableOpacity
                className="mt-2 bg-green-600 py-2 rounded-xl items-center"
                onPress={() => onAssign(driver)}
              >
                <Text className="text-white font-semibold">
                  Assign to this Location
                </Text>
              </TouchableOpacity>
            )}

            {driver.location === currentLocation && onAssign && (
              <TouchableOpacity
                className="mt-2 bg-red-600 py-2 rounded-xl items-center"
                onPress={() => onRemove(driver)}
              >
                <Text className="text-white font-semibold">Remove</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              className="mt-2 bg-gray-700 py-2 rounded-xl items-center"
              onPress={() => onDelete(driver.id)}
            >
              <Text className="text-red-400 font-semibold">Delete Driver</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </BlurView>
  );
}
