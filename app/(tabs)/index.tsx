import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import { BlurView } from "expo-blur";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { db, auth } from "../../auth/firebase";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

type LocationType = {
  id?: string;
  name: string;
  uid?: string;
};

export default function HomeScreen() {
  const [locations, setLocations] = useState<LocationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newLocation, setNewLocation] = useState("");
  const [editingLocation, setEditingLocation] = useState<LocationType | null>(
    null
  );
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  // Fetch only locations created by the current user
  const fetchLocations = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, "locations"),
        where("uid", "==", auth.currentUser.uid)
      );
      const snapshot = await getDocs(q);
      const list: LocationType[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as LocationType);
      });
      setLocations(list);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleAddOrEditLocation = async () => {
    if (!newLocation.trim()) {
      Alert.alert("Error", "Location name cannot be empty");
      return;
    }

    try {
      if (!auth.currentUser) {
        Alert.alert("Error", "You must be logged in!");
        return;
      }

      if (editingLocation) {
        await updateDoc(doc(db, "locations", editingLocation.id!), {
          name: newLocation.trim(),
        });
      } else {
        await addDoc(collection(db, "locations"), {
          name: newLocation.trim(),
          uid: auth.currentUser.uid, // <-- save current user's UID
        });
      }

      setEditingLocation(null);
      setNewLocation("");
      setModalVisible(false);
      fetchLocations();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const handleDeleteLocation = (locationId?: string) => {
    if (!locationId) return;
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this location?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "locations", locationId));
              fetchLocations();
            } catch (error: any) {
              Alert.alert("Error", error.message);
            }
          },
        },
      ]
    );
  };

  const handleLocationPress = (location: string) => {
    router.push({
      pathname: "/location/[location]",
      params: { location },
    });
  };

  return (
    <View className="flex-1 bg-black pt-16 relative">
      {/* Header */}
      <View className="px-5 mb-4 flex-row justify-between items-center">
        <Text className="text-3xl font-bold text-white tracking-tight">
          Locations
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1E90FF" />
      ) : (
        <Animated.ScrollView
          style={{ opacity: fadeAnim }}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        >
          {locations.length === 0 ? (
            <Text className="text-gray-400 text-center mt-10">
              No locations yet
            </Text>
          ) : (
            locations.map((location) => (
              <BlurView
                key={location.id}
                intensity={50}
                tint="dark"
                className="rounded-3xl mb-4 overflow-hidden border border-gray-800"
              >
                <TouchableOpacity
                  onPress={() => handleLocationPress(location.name)}
                  className="flex-row justify-between items-center px-5 py-4"
                >
                  <Text className="text-white font-semibold text-lg">
                    {location.name}
                  </Text>

                  <View className="flex-row gap-4">
                    <TouchableOpacity
                      onPress={() => {
                        setEditingLocation(location);
                        setNewLocation(location.name);
                        setModalVisible(true);
                      }}
                    >
                      <Ionicons name="pencil" size={20} color="#60A5FA" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteLocation(location.id)}
                    >
                      <Ionicons name="trash" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </BlurView>
            ))
          )}
        </Animated.ScrollView>
      )}

      {/* Floating Add Button */}
      <TouchableOpacity
        className="bg-blue-600 w-16 h-16 rounded-full items-center justify-center shadow-lg absolute right-9"
        style={{
          bottom: Platform.OS === "ios" ? 100 : 110,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 6,
          zIndex: 9999,
        }}
        onPress={() => {
          setModalVisible(true);
          setEditingLocation(null);
          setNewLocation("");
        }}
      >
        <Text className="text-white text-4xl font-bold">+</Text>
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.6)",
          }}
        >
          <BlurView
            intensity={80}
            tint="dark"
            className="p-6 rounded-3xl w-4/5 border border-gray-700"
          >
            <Text className="text-white text-xl font-bold mb-4 text-center">
              {editingLocation ? "Edit Location" : "Add New Location"}
            </Text>
            <TextInput
              className="border border-gray-700 rounded-xl p-3 mb-4 text-white bg-gray-800"
              placeholder="Enter location name"
              placeholderTextColor="#888"
              value={newLocation}
              onChangeText={setNewLocation}
            />
            <View className="flex-row justify-between mt-2">
              <TouchableOpacity
                className="bg-blue-600 px-5 py-2 rounded-full flex-1 mr-2 items-center"
                onPress={handleAddOrEditLocation}
              >
                <Text className="text-white font-semibold">Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-gray-700 px-5 py-2 rounded-full flex-1 ml-2 items-center"
                onPress={() => setModalVisible(false)}
              >
                <Text className="text-gray-300 font-semibold">Cancel</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
