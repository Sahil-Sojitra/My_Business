import { ENABLE_PRODUCTION_ADS } from '@env';
import { useEffect, useState } from 'react';
import mobileAds, {
  AdsConsent,
  AdsConsentDebugGeography,
  AdsConsentInfo,
  AdsConsentInfoOptions,
  AdsConsentPrivacyOptionsRequirementStatus,
  AdsConsentStatus,
} from 'react-native-google-mobile-ads';

/**
 * Official Google AdMob Test Ad Unit IDs
 * @see https://developers.google.com/admob/android/test-ads#sample_ad_units
 */
export const ADMOB_TEST_BANNER_ID = 'ca-app-pub-3940256099942544/6300978111';
export const ADMOB_TEST_NATIVE_ID = 'ca-app-pub-3940256099942544/2247696110';
export const ADMOB_TEST_INTERSTITIAL_ID = 'ca-app-pub-3940256099942544/1033173712';

/**
 * App Owner Production Ad Unit IDs
 */
export const ADMOB_PROD_BANNER_ID = 'ca-app-pub-2151370452701930/9452831023';
export const ADMOB_PROD_NATIVE_ID = 'ca-app-pub-2151370452701930/9069687641';
export const ADMOB_PROD_INTERSTITIAL_ID = 'ca-app-pub-2151370452701930/6086807790';

/**
 * Validates that an ad unit ID matches Google AdMob format (ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY).
 */
export function isValidAdUnitId(id: unknown): id is string {
  if (typeof id !== 'string') {
    return false;
  }
  return /^ca-app-pub-\d{16}\/\d{10}$/.test(id.trim());
}

/**
 * Determines whether production ads should be served.
 *
 * Safety rules:
 * 1. In development (__DEV__ === true), this always returns false. Production ads are NEVER used in development.
 * 2. In release (__DEV__ === false), only returns true if ENABLE_PRODUCTION_ADS is explicitly set to 'true'.
 * 3. Default is always false (test ads).
 */
export function isProductionAdsEnabled(): boolean {
  if (__DEV__) {
    return false;
  }
  return (ENABLE_PRODUCTION_ADS ?? '').trim().toLowerCase() === 'true';
}

/**
 * Resolves the ad unit ID for the requested ad format.
 *
 * Fallback behavior:
 * - If not in production mode: returns official Google test ID.
 * - If in production mode but candidate ID is missing/invalid: emits diagnostic warning and falls back safely to test ID.
 */
export function resolveAdUnitId(
  format: 'banner' | 'native' | 'interstitial',
  overrideProdEnabled?: boolean
): string {
  const prodEnabled = overrideProdEnabled ?? isProductionAdsEnabled();

  if (!prodEnabled) {
    switch (format) {
      case 'banner':
        return ADMOB_TEST_BANNER_ID;
      case 'native':
        return ADMOB_TEST_NATIVE_ID;
      case 'interstitial':
        return ADMOB_TEST_INTERSTITIAL_ID;
    }
  }

  // Production mode is explicitly enabled: validate production ID
  let candidateId: string;
  let fallbackTestId: string;

  switch (format) {
    case 'banner':
      candidateId = ADMOB_PROD_BANNER_ID;
      fallbackTestId = ADMOB_TEST_BANNER_ID;
      break;
    case 'native':
      candidateId = ADMOB_PROD_NATIVE_ID;
      fallbackTestId = ADMOB_TEST_NATIVE_ID;
      break;
    case 'interstitial':
      candidateId = ADMOB_PROD_INTERSTITIAL_ID;
      fallbackTestId = ADMOB_TEST_INTERSTITIAL_ID;
      break;
  }

  if (isValidAdUnitId(candidateId)) {
    return candidateId;
  }

  console.warn(
    `[AdMob] Explicit production mode is enabled, but production ${format} ID is invalid ("${candidateId}"). Falling back safely to test ID.`
  );
  return fallbackTestId;
}

/**
 * Active Ad Unit IDs resolved safely based on environment and explicit configuration.
 */
export const ACTIVE_BANNER_AD_UNIT_ID = resolveAdUnitId('banner');
export const ACTIVE_NATIVE_AD_UNIT_ID = resolveAdUnitId('native');
export const ACTIVE_INTERSTITIAL_AD_UNIT_ID = resolveAdUnitId('interstitial');

/**
 * Centralized AdMob Consent State
 */
export interface AdConsentState {
  isConsentGathered: boolean;
  canRequestAds: boolean;
  privacyOptionsRequired: boolean;
  consentStatus: AdsConsentStatus | null;
}

export interface UmpDebugConfig {
  debugGeography?: AdsConsentDebugGeography;
  testDeviceIdentifiers?: string[];
}

let devDebugConfig: UmpDebugConfig | null = null;

let currentConsentState: AdConsentState = {
  isConsentGathered: false,
  canRequestAds: false,
  privacyOptionsRequired: false,
  consentStatus: null,
};

type ConsentListener = (state: AdConsentState) => void;
const consentListeners = new Set<ConsentListener>();

function notifyConsentListeners(): void {
  const stateCopy = { ...currentConsentState };
  Array.from(consentListeners).forEach(listener => {
    try {
      listener(stateCopy);
    } catch (err) {
      console.warn('[AdMob Consent] Error in consent listener:', err);
    }
  });
}

function setConsentState(newState: AdConsentState): void {
  currentConsentState = { ...newState };
  notifyConsentListeners();
}

/**
 * Synchronous snapshot of the current consent state.
 */
export function getConsentState(): AdConsentState {
  return { ...currentConsentState };
}

/**
 * Returns true if UMP permits requesting ads at this moment.
 */
export function canRequestAds(): boolean {
  return currentConsentState.canRequestAds;
}

/**
 * Returns true if UMP reports that privacy-options entry point is required.
 */
export function isPrivacyOptionsRequired(): boolean {
  return currentConsentState.privacyOptionsRequired;
}

/**
 * Subscribes to consent state changes. Immediately invokes listener with current snapshot.
 */
export function subscribeToConsentState(listener: ConsentListener): () => void {
  consentListeners.add(listener);
  try {
    listener(getConsentState());
  } catch (err) {
    console.warn('[AdMob Consent] Error in initial consent listener invocation:', err);
  }
  return () => {
    consentListeners.delete(listener);
  };
}

/**
 * React hook that provides reactive access to centralized consent state.
 * Enables ad components to react when consent status transitions.
 */
export function useAdConsent(): AdConsentState {
  const [state, setState] = useState<AdConsentState>(getConsentState());

  useEffect(() => {
    const unsubscribe = subscribeToConsentState(setState);
    return unsubscribe;
  }, []);

  return state;
}

/**
 * Configure development-only UMP debug options (e.g. EEA geography simulation, test devices).
 * This is strictly a NO-OP in production / release builds (__DEV__ === false).
 */
export function setDevUmpDebugConfig(config: UmpDebugConfig | null): void {
  if (!__DEV__) {
    console.warn('[AdMob Consent] setDevUmpDebugConfig is ignored in release builds.');
    return;
  }
  devDebugConfig = config;
}

/**
 * Resets local consent state on the device. DEV-only convenience method for QA testing.
 */
export function resetConsentForTesting(): void {
  if (!__DEV__) {
    console.warn('[AdMob Consent] resetConsentForTesting is disabled in release builds.');
    return;
  }
  try {
    AdsConsent.reset();
    setConsentState({
      isConsentGathered: false,
      canRequestAds: false,
      privacyOptionsRequired: false,
      consentStatus: null,
    });
    console.log('[AdMob Consent] Local consent state reset.');
  } catch (err: unknown) {
    console.warn('[AdMob Consent] Failed to reset consent:', err);
  }
}

let isSdkInitialized = false;
let initPromise: Promise<void> | null = null;

async function executeConsentGather(): Promise<void> {
  let consentInfo: AdsConsentInfo | null = null;
  try {
    const options: AdsConsentInfoOptions = {};
    if (__DEV__ && devDebugConfig) {
      if (devDebugConfig.debugGeography !== undefined) {
        options.debugGeography = devDebugConfig.debugGeography;
      }
      if (
        devDebugConfig.testDeviceIdentifiers &&
        devDebugConfig.testDeviceIdentifiers.length > 0
      ) {
        options.testDeviceIdentifiers = devDebugConfig.testDeviceIdentifiers;
      }
    }
    // Requests info update and displays consent form if required
    consentInfo = await AdsConsent.gatherConsent(options);
  } catch (gatherError: unknown) {
    console.warn('[AdMob Consent] gatherConsent failed or was dismissed:', gatherError);
    // Fallback: Query current cached UMP consent info
    try {
      consentInfo = await AdsConsent.getConsentInfo();
    } catch (infoError: unknown) {
      console.warn('[AdMob Consent] getConsentInfo also failed:', infoError);
    }
  }

  const canRequest = consentInfo?.canRequestAds === true;
  const isPrivacyRequired =
    consentInfo?.privacyOptionsRequirementStatus ===
    AdsConsentPrivacyOptionsRequirementStatus.REQUIRED;
  const status = consentInfo?.status ?? null;

  setConsentState({
    isConsentGathered: true,
    canRequestAds: canRequest,
    privacyOptionsRequired: isPrivacyRequired,
    consentStatus: status,
  });
}

async function initMobileAdsSdk(): Promise<void> {
  if (isSdkInitialized) {
    return;
  }
  try {
    const adapterStatuses = await mobileAds().initialize();
    isSdkInitialized = true;
    if (__DEV__) {
      console.log(
        '[AdMob] SDK initialized in DEVELOPMENT mode (__DEV__ = true). Google test ad units enforced:',
        adapterStatuses
      );
    } else if (isProductionAdsEnabled()) {
      console.log(
        '[AdMob] SDK initialized in RELEASE mode with explicit PRODUCTION ads ENABLED.'
      );
    } else {
      console.log(
        '[AdMob] SDK initialized in RELEASE mode with PRODUCTION ads DISABLED (default). Test ad units active.'
      );
    }

    // Warm up the first interstitial ad after SDK is ready and consent is granted
    const { interstitialService } = await import('./interstitialService');
    interstitialService.preload();
  } catch (error: unknown) {
    console.warn('[AdMob] Failed to initialize Google Mobile Ads SDK:', error);
  }
}

/**
 * Initializes the Google Mobile Ads SDK exactly once at application startup.
 * Strictly gathers UMP consent before initializing the SDK and preloading ads.
 * Suppresses and logs failures so the app never crashes if offline or blocked.
 */
export async function initializeAdMobOnce(): Promise<void> {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      // Step 1: Run UMP consent workflow
      await executeConsentGather();

      // Step 2: Initialize SDK and preload interstitial ONLY if UMP permits ads
      if (currentConsentState.canRequestAds) {
        await initMobileAdsSdk();
      } else {
        if (__DEV__) {
          console.log(
            '[AdMob Consent] canRequestAds is false. Mobile Ads SDK initialization and interstitial preload deferred.'
          );
        }
      }
    } catch (error: unknown) {
      console.warn('[AdMob] Failed in initializeAdMobOnce workflow:', error);
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

/**
 * Queries UMP for the latest consent state, updates centralized state and notifies listeners.
 * If consent is now permitted and SDK was not yet initialized, initializes the SDK.
 */
export async function refreshConsentState(): Promise<AdConsentState> {
  try {
    const consentInfo = await AdsConsent.getConsentInfo();
    const canRequest = consentInfo?.canRequestAds === true;
    const isPrivacyRequired =
      consentInfo?.privacyOptionsRequirementStatus ===
      AdsConsentPrivacyOptionsRequirementStatus.REQUIRED;
    const status = consentInfo?.status ?? null;

    const newState: AdConsentState = {
      isConsentGathered: true,
      canRequestAds: canRequest,
      privacyOptionsRequired: isPrivacyRequired,
      consentStatus: status,
    };

    setConsentState(newState);

    if (canRequest) {
      if (!isSdkInitialized) {
        await initMobileAdsSdk();
      } else {
        const { interstitialService } = await import('./interstitialService');
        interstitialService.preload();
      }
    }

    return newState;
  } catch (err: unknown) {
    console.warn('[AdMob Consent] refreshConsentState failed:', err);
    return getConsentState();
  }
}

/**
 * Opens Google UMP privacy options form so users can review or change consent.
 * Refreshes consent state after the form closes.
 */
export async function showPrivacyOptionsForm(): Promise<AdsConsentInfo> {
  try {
    const result = await AdsConsent.showPrivacyOptionsForm();
    return result;
  } finally {
    await refreshConsentState();
  }
}

export {
  AdsConsentDebugGeography,
  AdsConsentPrivacyOptionsRequirementStatus,
  AdsConsentStatus,
};
export type { AdsConsentInfo, AdsConsentInfoOptions };
export { interstitialService } from './interstitialService';


