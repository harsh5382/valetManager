// app/signup.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../auth/firebase";

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill out all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      await createUserWithEmailAndPassword(auth, email, password);
      Alert.alert("Success", "Account created successfully!");
      router.replace("/"); // redirect to main app
    } catch (error: any) {
      Alert.alert("Signup Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center items-center bg-black px-6">
      <Text className="text-3xl font-bold text-blue-400 mb-8">
        Create Account ✨
      </Text>

      {/* Email */}
      <View className="w-full mb-4">
        <Text className="text-gray-300 mb-2 font-semibold">Email</Text>
        <TextInput
          className="w-full border border-gray-600 rounded-xl p-3 text-base text-white"
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
        <Text className="text-gray-300 mb-2 font-semibold">Password</Text>
        <TextInput
          className="w-full border border-gray-600 rounded-xl p-3 text-base text-white"
          placeholder="Enter your password"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      {/* Confirm Password */}
      <View className="w-full mb-6">
        <Text className="text-gray-300 mb-2 font-semibold">
          Confirm Password
        </Text>
        <TextInput
          className="w-full border border-gray-600 rounded-xl p-3 text-base text-white"
          placeholder="Re-enter your password"
          placeholderTextColor="#888"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
      </View>

      <TouchableOpacity
        onPress={handleSignup}
        disabled={loading}
        className="w-full bg-blue-600 rounded-xl py-3 items-center mb-4"
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white text-lg font-semibold">Sign Up</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/login")}>
        <Text className="text-gray-400">
          Already have an account?{" "}
          <Text className="text-blue-400 font-semibold">Log in</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}
