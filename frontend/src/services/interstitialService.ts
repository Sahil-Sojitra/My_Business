import { AdEventType, InterstitialAd } from 'react-native-google-mobile-ads';
import { ACTIVE_INTERSTITIAL_AD_UNIT_ID } from './adMobService';

/**
 * Minimum cooldown interval between interstitial ad displays.
 * Follows AdMob best practices and requirements: 5 minutes (300,000 ms).
 */
export const INTERSTITIAL_COOLDOWN_MS = 5 * 60 * 1000;

class InterstitialService {
  private adInstance: InterstitialAd | null = null;
  private isLoaded = false;
  private isLoading = false;
  private isShowing = false;
  private lastShownTimestamp = 0;
  private unsubscribers: Array<() => void> = [];
  private retryTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * Returns whether the minimum 5-minute cooldown is currently active.
   */
  public isCooldownActive(): boolean {
    if (this.lastShownTimestamp === 0) {
      return false;
    }
    return Date.now() - this.lastShownTimestamp < INTERSTITIAL_COOLDOWN_MS;
  }

  /**
   * Returns remaining cooldown time in milliseconds, or 0 if elapsed.
   */
  public getRemainingCooldownMs(): number {
    if (this.lastShownTimestamp === 0) {
      return 0;
    }
    const elapsed = Date.now() - this.lastShownTimestamp;
    return Math.max(0, INTERSTITIAL_COOLDOWN_MS - elapsed);
  }

  /**
   * Preloads an interstitial ad if not already loaded or loading.
   */
  public preload(): void {
    if (this.isLoaded || this.isLoading || this.isShowing) {
      return;
    }

    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }

    this.cleanupAdInstance();
    this.isLoading = true;

    try {
      const ad = InterstitialAd.createForAdRequest(
        ACTIVE_INTERSTITIAL_AD_UNIT_ID,
        {
          requestNonPersonalizedAdsOnly: true,
        }
      );
      this.adInstance = ad;

      const unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
        this.isLoaded = true;
        this.isLoading = false;
        if (__DEV__) {
          console.log('[AdMob Interstitial] Ad loaded and ready.');
        }
      });

      const unsubOpened = ad.addAdEventListener(AdEventType.OPENED, () => {
        // Cooldown timer updates ONLY when the interstitial is actually displayed
        this.lastShownTimestamp = Date.now();
        this.isShowing = true;
        if (__DEV__) {
          console.log('[AdMob Interstitial] Ad opened. Cooldown timer started.');
        }
      });

      const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
        if (__DEV__) {
          console.log('[AdMob Interstitial] Ad closed by user.');
        }
        this.isShowing = false;
        this.isLoaded = false;
        this.cleanupAdInstance();
        // Warm up the next ad after a short delay
        setTimeout(() => {
          this.preload();
        }, 1500);
      });

      const unsubError = ad.addAdEventListener(AdEventType.ERROR, error => {
        console.warn('[AdMob Interstitial] Ad error:', error);
        this.isLoaded = false;
        this.isLoading = false;
        this.isShowing = false;
        this.cleanupAdInstance();
        // Retry with backoff (45 seconds) to avoid tight retry loops
        this.retryTimeout = setTimeout(() => {
          this.preload();
        }, 45000);
      });

      this.unsubscribers = [unsubLoaded, unsubOpened, unsubClosed, unsubError];
      ad.load();
    } catch (error) {
      console.warn('[AdMob Interstitial] Failed to initialize ad request:', error);
      this.isLoading = false;
      this.cleanupAdInstance();
    }
  }

  /**
   * Attempts to show the interstitial ad at a completed natural break.
   * Enforces:
   * 1. Minimum 5-minute cooldown between displays.
   * 2. Full ad readiness before attempting display.
   * 3. Concurrency guard to prevent rapid double-taps.
   *
   * Returns true if the ad presentation was initiated, false otherwise.
   * Never throws and never blocks caller workflow.
   */
  public async showIfEligible(): Promise<boolean> {
    // 1. Guard against concurrent shows
    if (this.isShowing) {
      return false;
    }

    // 2. Enforce minimum 5-minute cooldown
    if (this.isCooldownActive()) {
      if (__DEV__) {
        const remainingSec = Math.ceil(this.getRemainingCooldownMs() / 1000);
        console.log(
          `[AdMob Interstitial] Cooldown active. Skipping show (${remainingSec}s remaining).`
        );
      }
      return false;
    }

    // 3. Ensure ad is fully loaded
    if (!this.isLoaded || !this.adInstance || !this.adInstance.loaded) {
      if (__DEV__) {
        console.log('[AdMob Interstitial] Ad not ready yet. Skipping show.');
      }
      // Ensure a preload is underway for future opportunities
      if (!this.isLoading) {
        this.preload();
      }
      return false;
    }

    // 4. Show the ad safely
    this.isShowing = true;
    try {
      await this.adInstance.show();
      return true;
    } catch (err) {
      console.warn('[AdMob Interstitial] Error presenting ad:', err);
      this.isShowing = false;
      this.isLoaded = false;
      this.cleanupAdInstance();
      this.preload();
      return false;
    }
  }

  private cleanupAdInstance(): void {
    this.unsubscribers.forEach(unsub => {
      try {
        unsub();
      } catch {
        // ignore
      }
    });
    this.unsubscribers = [];

    if (this.adInstance) {
      try {
        this.adInstance.destroy();
      } catch {
        // ignore
      }
      this.adInstance = null;
    }
  }
}

export const interstitialService = new InterstitialService();
