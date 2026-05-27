import { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { buildConsentPayload, identity, salutation } from '@nagarsetu/shared';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

// Diaspora-aware country codes — same set as web.
const COUNTRY_CODES = [
  { dial: '+91',  label: 'India (+91)' },
  { dial: '+1',   label: 'USA / Canada (+1)' },
  { dial: '+44',  label: 'UK (+44)' },
  { dial: '+971', label: 'UAE (+971)' },
  { dial: '+254', label: 'Kenya (+254)' },
  { dial: '+81',  label: 'Japan (+81)' },
];

type Step = 'phone' | 'otp';

export function SignInScreen() {
  const [step, setStep] = useState<Step>('phone');
  const [dialIdx, setDialIdx] = useState(0);
  const [national, setNational] = useState('');
  const [otp, setOtp] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [optInWhatsapp, setOptInWhatsapp] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dialCode = COUNTRY_CODES[dialIdx].dial;
  const fullPhone = `${dialCode}${national.replace(/\D/g, '')}`;

  function cycleCountry() {
    setDialIdx((i) => (i + 1) % COUNTRY_CODES.length);
  }

  async function handleSendOtp() {
    setError(null);
    if (!termsAccepted) {
      setError('Please accept the Terms to continue.');
      return;
    }
    if (national.replace(/\D/g, '').length < 6) {
      setError('Please enter a valid phone number.');
      return;
    }
    setPending(true);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone: fullPhone,
      options: { data: buildConsentPayload(optInWhatsapp) },
    });
    setPending(false);
    if (otpError) {
      setError(otpError.message);
      return;
    }
    setStep('otp');
  }

  async function handleVerifyOtp() {
    setError(null);
    if (otp.replace(/\D/g, '').length < 4) {
      setError('Please enter the OTP code.');
      return;
    }
    setPending(true);
    const { error: verifyError } = await supabase.auth.verifyOtp({
      phone: fullPhone,
      token: otp.trim(),
      type: 'sms',
    });
    setPending(false);
    if (verifyError) {
      setError(verifyError.message);
      return;
    }
    // onAuthStateChange in useSession will flip the layout to AppTabs.
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.card}>
          <View style={styles.header}>
            <ThemedText type="small" style={styles.tagline}>
              {identity.tagline.en.toUpperCase()}
            </ThemedText>
            <ThemedText type="title" style={styles.brandName}>
              {identity.name.en}
            </ThemedText>
            <Text style={styles.brandGu}>{identity.name.gu}</Text>
          </View>

          {step === 'phone' ? (
            <View style={styles.formGroup}>
              <ThemedText type="defaultSemiBold">Mobile number</ThemedText>
              <View style={styles.phoneRow}>
                <Pressable
                  onPress={cycleCountry}
                  style={styles.countryPill}
                  accessibilityLabel="Change country code"
                >
                  <Text style={styles.countryText}>{dialCode}</Text>
                </Pressable>
                <TextInput
                  style={styles.input}
                  inputMode="numeric"
                  keyboardType="phone-pad"
                  textContentType="telephoneNumber"
                  autoComplete="tel"
                  placeholder="9876543210"
                  value={national}
                  onChangeText={setNational}
                />
              </View>
              <ThemedText type="small" style={styles.hint}>
                Tap {dialCode} to change country.
              </ThemedText>

              <View style={styles.consentGroup}>
                <View style={styles.consentRow}>
                  <Switch
                    value={termsAccepted}
                    onValueChange={setTermsAccepted}
                  />
                  <Pressable
                    style={styles.consentLabel}
                    onPress={() => setTermsAccepted((v) => !v)}
                  >
                    <Text style={styles.consentText}>
                      I accept the{' '}
                      <Text
                        style={styles.linkText}
                        onPress={() =>
                          Linking.openURL(`https://${identity.domain}/terms`)
                        }
                      >
                        Terms
                      </Text>{' '}
                      and{' '}
                      <Text
                        style={styles.linkText}
                        onPress={() =>
                          Linking.openURL(`https://${identity.domain}/privacy`)
                        }
                      >
                        Privacy Policy
                      </Text>
                      .
                    </Text>
                  </Pressable>
                </View>

                <View style={styles.consentRow}>
                  <Switch
                    value={optInWhatsapp}
                    onValueChange={setOptInWhatsapp}
                  />
                  <Pressable
                    style={styles.consentLabel}
                    onPress={() => setOptInWhatsapp((v) => !v)}
                  >
                    <Text style={styles.consentText}>
                      Send me lead alerts and the fortnightly community digest
                      on WhatsApp.
                    </Text>
                  </Pressable>
                </View>
              </View>

              {error && <Text style={styles.error}>{error}</Text>}

              <Pressable
                onPress={handleSendOtp}
                disabled={pending || !termsAccepted}
                style={({ pressed }) => [
                  styles.primaryButton,
                  (pending || !termsAccepted) && styles.primaryButtonDisabled,
                  pressed && styles.primaryButtonPressed,
                ]}
              >
                {pending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Send OTP</Text>
                )}
              </Pressable>

              <ThemedText type="small" style={styles.footnote}>
                We send a one-time code over WhatsApp.
              </ThemedText>
            </View>
          ) : (
            <View style={styles.formGroup}>
              <ThemedText type="default" style={styles.otpPrompt}>
                Enter the code sent to{' '}
                <Text style={styles.otpPhone}>{fullPhone}</Text>.
              </ThemedText>

              <TextInput
                style={styles.otpInput}
                inputMode="numeric"
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                autoComplete="sms-otp"
                maxLength={6}
                placeholder="••••••"
                value={otp}
                onChangeText={setOtp}
                autoFocus
              />

              {error && <Text style={styles.error}>{error}</Text>}

              <Pressable
                onPress={handleVerifyOtp}
                disabled={pending}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pending && styles.primaryButtonDisabled,
                  pressed && styles.primaryButtonPressed,
                ]}
              >
                {pending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    Verify & sign in
                  </Text>
                )}
              </Pressable>

              <View style={styles.otpFooter}>
                <Pressable
                  onPress={() => {
                    setStep('phone');
                    setOtp('');
                    setError(null);
                  }}
                >
                  <Text style={styles.linkText}>Change number</Text>
                </Pressable>
                <Text style={styles.salutation}>{salutation.gu}</Text>
              </View>
            </View>
          )}
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: Spacing.four,
    gap: Spacing.three,
    borderWidth: 1,
    borderColor: '#DCE6DD',
  },
  header: { alignItems: 'center', gap: Spacing.one, marginBottom: Spacing.three },
  tagline: { letterSpacing: 3 },
  brandName: { color: '#0E6B6B' },
  brandGu: { color: '#0A4F4F', fontSize: 22, fontWeight: '300' },
  formGroup: { gap: Spacing.three },
  phoneRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
  },
  countryPill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    backgroundColor: '#EAF1E7',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DCE6DD',
  },
  countryText: { color: '#0E6B6B', fontWeight: '500' },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#DCE6DD',
    borderRadius: 10,
    backgroundColor: '#FBFAF5',
  },
  hint: { color: '#5B6B6B' },
  consentGroup: {
    gap: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: '#DCE6DD',
    paddingTop: Spacing.three,
  },
  consentRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'flex-start',
  },
  consentLabel: { flex: 1 },
  consentText: { color: '#1E2A2A', lineHeight: 20 },
  linkText: { color: '#0E6B6B', textDecorationLine: 'underline' },
  primaryButton: {
    backgroundColor: '#0E6B6B',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonDisabled: { opacity: 0.5 },
  primaryButtonPressed: { backgroundColor: '#0A4F4F' },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  footnote: { color: '#5B6B6B', textAlign: 'center' },
  error: { color: '#C2492E', fontSize: 14 },
  otpPrompt: { textAlign: 'center', color: '#5B6B6B' },
  otpPhone: { color: '#1E2A2A', fontWeight: '600' },
  otpInput: {
    fontSize: 28,
    letterSpacing: 8,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#DCE6DD',
    borderRadius: 10,
    paddingVertical: 14,
    backgroundColor: '#FBFAF5',
  },
  otpFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  salutation: { color: '#5B6B6B', fontSize: 12 },
});
