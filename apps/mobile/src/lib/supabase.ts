import "react-native-url-polyfill/auto";
import * as SecureStore from "expo-secure-store";
import { createClient } from "@supabase/supabase-js";
import { readSupabasePublicEnvExpo } from "@nagarsetu/shared/env";

// SecureStore has a ~2KB per-item limit on iOS. Supabase sessions are usually
// well under that; if a JWT ever grows past it in production we'll need to
// chunk values or fall back to AsyncStorage with encryption. Tracked for
// follow-up if it ever errors at runtime.
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

const { url, anonKey } = readSupabasePublicEnvExpo();

export const supabase = createClient(url, anonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
