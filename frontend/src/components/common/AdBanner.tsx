import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  BannerAd,
  BannerAdSize,
} from 'react-native-google-mobile-ads';
import { ACTIVE_BANNER_AD_UNIT_ID, useAdConsent } from '../../services/adMobService';

export interface AdBannerProps {
  /**
   * Optional custom Ad Unit ID. Defaults to official Google test banner ID.
   */
  adUnitId?: string;
  /**
   * Optional custom banner size. Defaults to ANCHORED_ADAPTIVE_BANNER.
   */
  size?: BannerAdSize;
}

export const AdBanner: React.FC<AdBannerProps> = ({
  adUnitId = ACTIVE_BANNER_AD_UNIT_ID,
  size = BannerAdSize.ANCHORED_ADAPTIVE_BANNER,
}) => {
  const { canRequestAds: adsAllowed } = useAdConsent();
  const [loadFailed, setLoadFailed] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // If consent is not yet granted or ad failed to load, do not request or render the banner
  if (!adsAllowed || loadFailed) {
    return null;
  }

  return (
    <View style={[styles.container, !isLoaded && styles.hidden]}>
      <BannerAd
        unitId={adUnitId}
        size={size}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdLoaded={() => {
          setIsLoaded(true);
        }}
        onAdFailedToLoad={error => {
          if (__DEV__) {
            console.warn('[AdMob Banner] Failed to load ad:', error?.message || error);
          }
          setLoadFailed(true);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
    width: '100%',
    overflow: 'hidden',
  },
  hidden: {
    height: 0,
    marginVertical: 0,
    opacity: 0,
  },
});
