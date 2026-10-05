import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="setup" />
      <Stack.Screen name="set-pin" />
      <Stack.Screen name="unlock" />
      <Stack.Screen name="pricing" />
      <Stack.Screen name="payment" />
      <Stack.Screen name="payment-success" />
      <Stack.Screen name="payment-required" />
    </Stack>
  );
}
