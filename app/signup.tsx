// app/signup.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../auth/firebase";

export default function SignupScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill out all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: username,
        });
      }

      Alert.alert("Success", "Account created successfully!");
      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert("Signup Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-black justify-center px-6"
    >
      <Text className="text-4xl font-bold text-blue-400 mb-12 text-center">
        Create Account ✨
      </Text>

      {/* Username */}
      <View className="w-full mb-4">
        <Text className="text-gray-400 mb-2 font-semibold">Username</Text>
        <TextInput
          className="w-full bg-gray-900 border border-gray-700 rounded-2xl p-4 text-white text-base"
          placeholder="Enter your username"
          placeholderTextColor="#888"
          value={username}
          onChangeText={setUsername}
        />
      </View>

      {/* Email */}
      <View className="w-full mb-4">
        <Text className="text-gray-400 mb-2 font-semibold">Email</Text>
        <TextInput
          className="w-full bg-gray-900 border border-gray-700 rounded-2xl p-4 text-white text-base"
          placeholder="Enter your email"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      {/* Password */}
      <View className="w-full mb-4">
        <Text className="text-gray-400 mb-2 font-semibold">Password</Text>
        <TextInput
          className="w-full bg-gray-900 border border-gray-700 rounded-2xl p-4 text-white text-base"
          placeholder="Enter your password"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      {/* Confirm Password */}
      <View className="w-full mb-8">
        <Text className="text-gray-400 mb-2 font-semibold">
          Confirm Password
        </Text>
        <TextInput
          className="w-full bg-gray-900 border border-gray-700 rounded-2xl p-4 text-white text-base"
          placeholder="Re-enter your password"
          placeholderTextColor="#888"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
      </View>

      {/* Sign Up Button */}
      <TouchableOpacity
        onPress={handleSignup}
        disabled={loading}
        className="w-full bg-blue-600 rounded-2xl py-4 items-center mb-6 shadow-lg"
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white text-lg font-semibold">Sign Up</Text>
        )}
      </TouchableOpacity>

      {/* Login Link */}
      <TouchableOpacity
        onPress={() => router.push("/login")}
        className="items-center"
      >
        <Text className="text-gray-400">
          Already have an account?{" "}
          <Text className="text-blue-400 font-semibold">Log in</Text>
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}
