import React, { useEffect, useState } from "react";
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
} from "react-native";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../auth/firebase";
import { useRouter } from "expo-router";

type LocationType = {
  id?: string;
  name: string;
};

export default function HomeScreen() {
  const [locations, setLocations] = useState<LocationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newLocation, setNewLocation] = useState("");
  const [editingLocation, setEditingLocation] = useState<LocationType | null>(
    null
  );

  const router = useRouter();

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "locations"));
      const list: LocationType[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as LocationType);
      });
      setLocations(list);
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
      if (editingLocation) {
        // Edit existing location
        await updateDoc(doc(db, "locations", editingLocation.id!), {
          name: newLocation.trim(),
        });
        setEditingLocation(null);
      } else {
        // Add new location
        await addDoc(collection(db, "locations"), { name: newLocation.trim() });
      }
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
    <View className="flex-1 bg-black px-4 pt-16">
      <Text className="text-3xl font-bold text-blue-400 mb-6">
        Locations 📍
      </Text>

      {/* Modern small add location button */}
      <TouchableOpacity
        className="bg-blue-600 px-4 py-2 rounded-full mb-6 self-start shadow-md"
        onPress={() => {
          setModalVisible(true);
          setEditingLocation(null);
          setNewLocation("");
        }}
      >
        <Text className="text-white font-semibold text-base">+ Add</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color="#1E90FF" />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
          {locations.length === 0 ? (
            <Text className="text-gray-400">No locations yet</Text>
          ) : (
            locations.map((location) => (
              <View
                key={location.id}
                className="bg-gray-900 p-4 rounded-2xl border border-gray-700 mb-4 shadow-lg flex-row justify-between items-center"
              >
                <TouchableOpacity
                  className="flex-1"
                  onPress={() => handleLocationPress(location.name)}
                >
                  <Text className="text-white font-semibold text-lg">
                    {location.name}
                  </Text>
                </TouchableOpacity>

                <View className="flex-row gap-3">
                  <TouchableOpacity
                    className="p-2 bg-gray-800 rounded-full"
                    onPress={() => {
                      setEditingLocation(location);
                      setNewLocation(location.name);
                      setModalVisible(true);
                    }}
                  >
                    <Text className="text-blue-400 font-semibold">Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="p-2 bg-gray-800 rounded-full"
                    onPress={() => handleDeleteLocation(location.id)}
                  >
                    <Text className="text-red-500 font-semibold">Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Add/Edit Location Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <View className="bg-gray-900 p-6 rounded-2xl w-4/5 border border-gray-700 shadow-lg">
            <Text className="text-white text-xl font-bold mb-4">
              {editingLocation ? "Edit Location" : "Add Location"}
            </Text>
            <TextInput
              className="border border-gray-700 rounded-xl p-3 mb-4 text-white bg-gray-800"
              placeholder="Enter location name"
              placeholderTextColor="#888"
              value={newLocation}
              onChangeText={setNewLocation}
            />
            <View className="flex-row justify-between">
              <TouchableOpacity
                className="bg-blue-600 px-4 py-2 rounded-full flex-1 mr-2 items-center"
                onPress={handleAddOrEditLocation}
              >
                <Text className="text-white font-semibold">Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-gray-700 px-4 py-2 rounded-full flex-1 ml-2 items-center"
                onPress={() => setModalVisible(false)}
              >
                <Text className="text-gray-300 font-semibold">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
