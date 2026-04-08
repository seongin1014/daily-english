import Purchases, { type CustomerInfo, type PurchasesPackage } from 'react-native-purchases';
import { Platform } from 'react-native';

// TODO: Replace with your RevenueCat API keys
const REVENUECAT_IOS_KEY = 'YOUR_REVENUECAT_IOS_KEY';
const REVENUECAT_ANDROID_KEY = 'YOUR_REVENUECAT_ANDROID_KEY';

let isConfigured = false;

export async function configureRevenueCat(firebaseUid: string): Promise<void> {
  if (isConfigured) return;

  Purchases.configure({
    apiKey: Platform.OS === 'ios' ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY,
  });

  // Link RevenueCat user to Firebase UID
  await Purchases.logIn(firebaseUid);
  isConfigured = true;
}

export async function checkSubscription(): Promise<'free' | 'pro'> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const isProActive = customerInfo.entitlements.active['pro'] !== undefined;
    return isProActive ? 'pro' : 'free';
  } catch {
    return 'free';
  }
}

export async function getOfferings(): Promise<PurchasesPackage[]> {
  try {
    const offerings = await Purchases.getOfferings();
    if (offerings.current) {
      return offerings.current.availablePackages;
    }
    return [];
  } catch {
    return [];
  }
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<boolean> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return customerInfo.entitlements.active['pro'] !== undefined;
  } catch (e: any) {
    if (e.userCancelled) return false;
    throw e;
  }
}

export async function restorePurchases(): Promise<'free' | 'pro'> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return customerInfo.entitlements.active['pro'] !== undefined ? 'pro' : 'free';
  } catch {
    return 'free';
  }
}
