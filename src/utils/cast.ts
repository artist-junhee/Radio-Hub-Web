import { Station, CastState } from '../types';

declare global {
  interface Window {
    __onGCastApiAvailable?: (isAvailable: boolean) => void;
    cast?: any;
    chrome?: any;
  }
}

type CastStateChangeCallback = (state: CastState, deviceName?: string) => void;

class CastManager {
  private isSdkLoaded = false;
  private castContext: any = null;
  private remotePlayer: any = null;
  private remotePlayerController: any = null;
  private currentSession: any = null;
  private stateChangeListeners: Set<CastStateChangeCallback> = new Set();
  private currentState: CastState = 'unavailable';
  private currentDeviceName: string = '';

  constructor() {
    this.init();
  }

  public init() {
    if (typeof window === 'undefined') return;

    // Check if already available
    if (window.cast && window.cast.framework) {
      this.setupCastFramework();
    } else {
      window.__onGCastApiAvailable = (isAvailable: boolean) => {
        if (isAvailable) {
          this.setupCastFramework();
        } else {
          this.updateState('unavailable');
        }
      };
    }
  }

  private setupCastFramework() {
    try {
      const framework = window.cast?.framework;
      const chromeCast = window.chrome?.cast;

      if (!framework || !chromeCast) {
        this.updateState('unavailable');
        return;
      }

      this.castContext = framework.CastContext.getInstance();
      this.castContext.setOptions({
        receiverApplicationId: chromeCast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
        autoJoinPolicy: chromeCast.AutoJoinPolicy.ORIGIN_SCOPED,
      });

      this.remotePlayer = new framework.RemotePlayer();
      this.remotePlayerController = new framework.RemotePlayerController(this.remotePlayer);

      this.castContext.addEventListener(
        framework.CastContextEventType.SESSION_STATE_CHANGED,
        (event: any) => {
          this.handleSessionStateChange(event);
        }
      );

      this.isSdkLoaded = true;
      this.updateState('available');
    } catch (e) {
      console.warn('Cast framework setup error:', e);
      this.updateState('unavailable');
    }
  }

  private handleSessionStateChange(event: any) {
    const framework = window.cast?.framework;
    if (!framework) return;

    switch (event.sessionState) {
      case framework.SessionState.SESSION_STARTING:
        this.updateState('connecting');
        break;
      case framework.SessionState.SESSION_STARTED:
      case framework.SessionState.SESSION_RESUMED: {
        this.currentSession = this.castContext.getCurrentSession();
        const friendlyName = this.currentSession?.getCastDevice()?.friendlyName || 'Chromecast';
        this.currentDeviceName = friendlyName;
        this.updateState('connected', friendlyName);
        break;
      }
      case framework.SessionState.SESSION_ENDED:
        this.currentSession = null;
        this.currentDeviceName = '';
        this.updateState('available');
        break;
      case framework.SessionState.SESSION_START_FAILED:
        this.updateState('error');
        setTimeout(() => this.updateState('available'), 3000);
        break;
      default:
        break;
    }
  }

  public subscribe(callback: CastStateChangeCallback): () => void {
    this.stateChangeListeners.add(callback);
    callback(this.currentState, this.currentDeviceName);
    return () => {
      this.stateChangeListeners.delete(callback);
    };
  }

  private updateState(state: CastState, deviceName = this.currentDeviceName) {
    this.currentState = state;
    this.currentDeviceName = deviceName;
    this.stateChangeListeners.forEach((cb) => cb(state, deviceName));
  }

  public getState(): CastState {
    return this.currentState;
  }

  public getDeviceName(): string {
    return this.currentDeviceName;
  }

  public requestSession(): Promise<boolean> {
    if (!this.castContext) {
      return Promise.reject(new Error('Cast not supported'));
    }

    return this.castContext
      .requestSession()
      .then(() => true)
      .catch((err: any) => {
        if (err !== 'cancel') {
          console.warn('Cast session error:', err);
        }
        return false;
      });
  }

  public endCurrentSession(stopCasting = true) {
    if (this.castContext) {
      try {
        this.castContext.endCurrentSession(stopCasting);
      } catch (err) {
        console.warn('Error ending cast session:', err);
      }
    }
  }

  public async castStation(station: Station): Promise<boolean> {
    if (!this.castContext) return false;

    let session = this.castContext.getCurrentSession();
    if (!session) {
      const ok = await this.requestSession();
      if (!ok) return false;
      session = this.castContext.getCurrentSession();
    }

    if (!session) return false;

    const chromeCast = window.chrome?.cast;
    if (!chromeCast) return false;

    try {
      // Determine stream mime-type
      let contentType = 'audio/mpeg';
      const url = station.url.toLowerCase();
      if (url.includes('.m3u8') || url.includes('format=m3u8') || url.includes('ch=')) {
        contentType = 'application/x-mpegURL';
      } else if (url.includes('.aac') || url.includes('.aacp')) {
        contentType = 'audio/aac';
      } else if (url.includes('.ogg') || url.includes('.opus')) {
        contentType = 'audio/ogg';
      } else if (url.includes('.wav')) {
        contentType = 'audio/wav';
      }

      const mediaInfo = new chromeCast.media.MediaInfo(station.url, contentType);
      mediaInfo.streamType = chromeCast.media.StreamType.LIVE;

      const metadata = new chromeCast.media.MusicTrackMediaMetadata();
      metadata.title = station.name;
      metadata.artist = 'RADIO HUB';
      metadata.albumName = station.category;
      
      const appIcon = window.location.origin + '/icon-512.png';
      metadata.images = [new chromeCast.Image(appIcon)];
      mediaInfo.metadata = metadata;

      const request = new chromeCast.media.LoadRequest(mediaInfo);
      request.autoplay = true;

      await session.loadMedia(request);
      return true;
    } catch (e) {
      console.error('Failed to load media on Chromecast:', e);
      return false;
    }
  }
}

export const castManager = new CastManager();
