import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { colors } from '@/src/theme/colors';
import { signInWithApple, signInWithGoogle } from '@/src/services/firebase';

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);

  const handleAppleSignIn = async () => {
    try {
      setLoading(true);
      const nonce = Math.random().toString(36).substring(2, 10);
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        nonce
      );

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (credential.identityToken) {
        await signInWithApple(credential.identityToken, nonce);
      }
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('로그인 실패', 'Apple 로그인에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    // TODO: Implement with expo-auth-session + Google OAuth
    // Requires web client ID from Firebase Console
    Alert.alert('준비 중', 'Google 로그인은 Firebase Console 설정 후 활성화됩니다.');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Logo Area */}
        <View style={styles.logoArea}>
          <Text style={styles.appName}>Daily English</Text>
          <Text style={styles.tagline}>우리의 일상을 영어로</Text>
        </View>

        {/* Description */}
        <Text style={styles.description}>
          한국어 대화를 녹음하고{'\n'}영어 표현으로 학습하세요
        </Text>

        {/* Auth Buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.appleBtn}
            onPress={handleAppleSignIn}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialIcons name="apple" size={22} color="#fff" />
                <Text style={styles.appleBtnText}>Apple로 계속하기</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.googleBtn}
            onPress={handleGoogleSignIn}
            activeOpacity={0.8}
            disabled={loading}
          >
            <MaterialIcons name="login" size={20} color={colors.onSurface} />
            <Text style={styles.googleBtnText}>Google로 계속하기</Text>
          </TouchableOpacity>
        </View>

        {/* Terms */}
        <Text style={styles.terms}>
          계속하면 서비스 이용약관 및 개인정보 처리방침에{'\n'}동의하는 것으로 간주됩니다.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  logoArea: { alignItems: 'center', marginBottom: 32 },
  appName: { fontFamily: 'Manrope-ExtraBold', fontSize: 36, color: colors.primary, letterSpacing: -1 },
  tagline: { fontFamily: 'Pretendard-Medium', fontSize: 14, color: colors.onSurfaceVariant, marginTop: 8, letterSpacing: 1 },
  description: { fontFamily: 'Pretendard', fontSize: 18, color: colors.onSurface, textAlign: 'center', lineHeight: 28, marginBottom: 48 },
  buttons: { gap: 12, marginBottom: 32 },
  appleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#000', paddingVertical: 16, borderRadius: 12 },
  appleBtnText: { fontFamily: 'Pretendard-SemiBold', fontSize: 16, color: '#fff' },
  googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: colors.surfaceContainerLowest, paddingVertical: 16, borderRadius: 12 },
  googleBtnText: { fontFamily: 'Pretendard-SemiBold', fontSize: 16, color: colors.onSurface },
  terms: { fontFamily: 'Pretendard', fontSize: 11, color: colors.outline, textAlign: 'center', lineHeight: 18 },
});
