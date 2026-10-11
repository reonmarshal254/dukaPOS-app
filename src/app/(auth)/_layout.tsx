import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="setup" />
      <Stack.Screen name="set-pin" />
      <Stack.Screen name="unlock" />
      {/* PRICING_REMOVED: Payment flow screens hidden from navigation but preserved in codebase */}
      {/* Uncomment below to restore pricing functionality in the future */}
      {/*
      <Stack.Screen name="pricing" />
      <Stack.Screen name="payment" />
      <Stack.Screen name="payment-success" />
      <Stack.Screen name="payment-required" />
      */}
    </Stack>
  );
}
