import React from 'react';
import {
  Image,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import {
  NativeAdView,
  NativeAsset,
  NativeAssetType,
  NativeMediaView,
  useNativeAd,
} from 'react-native-google-mobile-ads';
import { ACTIVE_NATIVE_AD_UNIT_ID, useAdConsent } from '../../services/adMobService';

export interface NativeAdCardProps {
  /**
   * Optional custom ad unit ID. Defaults to official Google test native ad ID.
   */
  adUnitId?: string;
  /**
   * Optional custom style override for the outer ad card container.
   */
  style?: StyleProp<ViewStyle>;
}

/**
 * Compact Native Ad Card styled to match My_Business transaction list cards.
 * Uses Google's official Android test native ad unit ID and the v17 useNativeAd hook.
 */
export const NativeAdCard: React.FC<NativeAdCardProps> = ({
  adUnitId = ACTIVE_NATIVE_AD_UNIT_ID,
  style,
}) => {
  const { canRequestAds: adsAllowed } = useAdConsent();

  const { status, nativeAd } = useNativeAd({
    adUnitId: adsAllowed ? adUnitId : null,
    autoLoad: adsAllowed,
    requestOptions: {
      requestNonPersonalizedAdsOnly: true,
    },
  });

  // Render nothing while loading, idle, no-fill, on error, or if consent is not yet permitted
  if (!adsAllowed || status !== 'loaded' || !nativeAd) {
    return null;
  }

  const hasMedia = Boolean(
    nativeAd.mediaContent &&
      (nativeAd.mediaContent.hasVideoContent ||
        (nativeAd.mediaContent.aspectRatio &&
          nativeAd.mediaContent.aspectRatio > 0)),
  );
  const hasIcon = Boolean(nativeAd.icon?.url);
  const hasAdvertiser = Boolean(nativeAd.advertiser);
  const hasBody = Boolean(nativeAd.body);
  const hasCta = Boolean(nativeAd.callToAction);

  return (
    <NativeAdView nativeAd={nativeAd} style={[styles.card, style]}>
      {/* Top Header Row: Sponsor Tag & Advertiser / Headline */}
      <View style={styles.headerRow}>
        {hasIcon && nativeAd.icon ? (
          <NativeAsset assetType={NativeAssetType.ICON}>
            <Image
              source={{ uri: nativeAd.icon.url }}
              style={styles.iconImage}
              resizeMode="cover"
            />
          </NativeAsset>
        ) : null}

        <View style={styles.headerTextCol}>
          <View style={styles.badgeRow}>
            <View style={styles.sponsoredBadge}>
              <Text style={styles.sponsoredBadgeText}>Sponsored</Text>
            </View>
            {hasAdvertiser ? (
              <NativeAsset assetType={NativeAssetType.ADVERTISER}>
                <Text style={styles.advertiserText} numberOfLines={1}>
                  {nativeAd.advertiser}
                </Text>
              </NativeAsset>
            ) : null}
          </View>

          <NativeAsset assetType={NativeAssetType.HEADLINE}>
            <Text style={styles.headlineText} numberOfLines={1}>
              {nativeAd.headline}
            </Text>
          </NativeAsset>
        </View>
      </View>

      {/* Optional Media Content (compact, responsive height) */}
      {hasMedia ? (
        <View style={styles.mediaContainer}>
          <NativeMediaView style={styles.mediaView} resizeMode="cover" />
        </View>
      ) : null}

      {/* Ad Body Description */}
      {hasBody ? (
        <NativeAsset assetType={NativeAssetType.BODY}>
          <Text style={styles.bodyText} numberOfLines={2}>
            {nativeAd.body}
          </Text>
        </NativeAsset>
      ) : null}

      {/* Footer / Call To Action */}
      {hasCta ? (
        <View style={styles.footerRow}>
          <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
            <View
              style={styles.ctaButton}
              accessibilityRole="button"
              accessibilityLabel={nativeAd.callToAction}>
              <Text style={styles.ctaButtonText}>{nativeAd.callToAction}</Text>
            </View>
          </NativeAsset>
        </View>
      ) : null}
    </NativeAdView>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconImage: {
    width: 38,
    height: 38,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#F1F5F9',
  },
  headerTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  sponsoredBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#FDE68A',
  },
  sponsoredBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.3,
  },
  advertiserText: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
    flexShrink: 1,
  },
  headlineText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  mediaContainer: {
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    marginVertical: 6,
  },
  mediaView: {
    width: '100%',
    maxHeight: 140,
    minHeight: 80,
  },
  bodyText: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 17,
    marginTop: 2,
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  ctaButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
