// app/login.tsx
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
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../auth/firebase";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      Alert.alert("Success", "Logged in successfully!");
      router.replace("/"); // Redirect to your main app
    } catch (error: any) {
      Alert.alert("Login Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center items-center bg-black px-6">
      <Text className="text-3xl font-bold text-blue-400 mb-8">
        Welcome Back 👋
      </Text>

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

      <View className="w-full mb-6">
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

      <TouchableOpacity
        onPress={handleLogin}
        disabled={loading}
        className="w-full bg-blue-600 rounded-xl py-3 items-center mb-4"
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white text-lg font-semibold">Login</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/signup")}>
        <Text className="text-gray-400">
          Don’t have an account?{" "}
          <Text className="text-blue-400 font-semibold">Sign up</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}
