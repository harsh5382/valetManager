// app/login.tsx
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
      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert("Login Failed", error.message);
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
        Welcome Back 👋
      </Text>

      {/* Email Input */}
      <View className="w-full mb-5">
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

      {/* Password Input */}
      <View className="w-full mb-8">
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

      {/* Login Button */}
      <TouchableOpacity
        onPress={handleLogin}
        disabled={loading}
        className="w-full bg-blue-600 rounded-2xl py-4 items-center mb-6 shadow-lg"
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white text-lg font-semibold">Login</Text>
        )}
      </TouchableOpacity>

      {/* Sign Up Link */}
      <TouchableOpacity
        onPress={() => router.push("/signup")}
        className="items-center"
      >
        <Text className="text-gray-400">
          Don’t have an account?{" "}
          <Text className="text-blue-400 font-semibold">Sign up</Text>
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}
