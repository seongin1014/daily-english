import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '@/src/theme';
import { signInWithApple, signInWithGoogle, signInWithEmail } from '@/src/services/firebase';
import { useAppStore } from '@/src/stores/useAppStore';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = '229206057852-dkn9p135auhqkuegeni5spvc79cl1jbv.apps.googleusercontent.com';

export default function LoginScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleEmailSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('입력 필요', '이메일과 비밀번호를 입력해주세요.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('비밀번호 오류', '비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    try {
      setLoading(true);
      await signInWithEmail(email.trim(), password);
    } catch (e: any) {
      const msg = e.code === 'auth/invalid-email' ? '올바른 이메일 형식이 아닙니다.'
        : e.code === 'auth/weak-password' ? '비밀번호가 너무 짧습니다.'
        : e.code === 'auth/wrong-password' ? '비밀번호가 올바르지 않습니다.'
        : e.code === 'auth/email-already-in-use' ? '이미 사용 중인 이메일입니다. 비밀번호를 확인해주세요.'
        : '로그인에 실패했습니다.';
      Alert.alert('로그인 실패', msg);
    } finally {
      setLoading(false);
    }
  };

  const styles = useMemo(() => createStyles(colors), [colors]);

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
    try {
      setLoading(true);

      const redirectUri = AuthSession.makeRedirectUri({ scheme: 'echoling' });

      const discovery = {
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenEndpoint: 'https://oauth2.googleapis.com/token',
      };

      const request = new AuthSession.AuthRequest({
        clientId: GOOGLE_WEB_CLIENT_ID,
        redirectUri,
        scopes: ['openid', 'profile', 'email'],
        responseType: AuthSession.ResponseType.IdToken,
        extraParams: {
          nonce: Math.random().toString(36).substring(2, 10),
        },
      });

      const result = await request.promptAsync(discovery);

      if (result.type === 'success' && result.params.id_token) {
        await signInWithGoogle(result.params.id_token);
      }
    } catch (e: any) {
      console.error('Google Sign-In error:', e);
      Alert.alert('로그인 실패', 'Google 로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Logo Area */}
        <View style={styles.logoArea}>
          <Text style={styles.appName}>EchoLing</Text>
          <Text style={styles.tagline}>일상이 영어로 돌아오다</Text>
        </View>

        {/* Description */}
        <Text style={styles.description}>
          한국어 대화를 녹음하고{'\n'}영어 표현으로 학습하세요
        </Text>

        {/* Email Login */}
        <View style={styles.emailSection}>
          <TextInput
            style={styles.emailInput}
            placeholder="이메일"
            placeholderTextColor={colors.outline}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={styles.emailInput}
            placeholder="비밀번호"
            placeholderTextColor={colors.outline}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity
            style={styles.emailBtn}
            onPress={handleEmailSignIn}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.emailBtnText}>이메일로 시작하기</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>또는</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Auth Buttons */}
        <View style={styles.buttons}>
          {Platform.OS === 'ios' && (
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
          )}

          <TouchableOpacity
            style={styles.googleBtn}
            onPress={handleGoogleSignIn}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.onSurface} />
            ) : (
              <>
                <MaterialIcons name="login" size={20} color={colors.onSurface} />
                <Text style={styles.googleBtnText}>Google로 계속하기</Text>
              </>
            )}
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

const createStyles = (colors: any) => StyleSheet.create({
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
  emailSection: { gap: 10, marginBottom: 20 },
  emailInput: { backgroundColor: colors.surfaceContainerLowest, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontFamily: 'Pretendard', fontSize: 15, color: colors.onSurface },
  emailBtn: { backgroundColor: colors.secondary, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  emailBtnText: { fontFamily: 'Pretendard-SemiBold', fontSize: 16, color: '#fff' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.outlineVariant },
  dividerText: { fontFamily: 'Pretendard', fontSize: 13, color: colors.outline },
  terms: { fontFamily: 'Pretendard', fontSize: 11, color: colors.outline, textAlign: 'center', lineHeight: 18 },
});
