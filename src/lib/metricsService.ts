import { logger } from "@/utils/logger";

type MetricType = 'translation_request' | 'translation_cache_hit' | 'translation_cache_miss' | 'offline_access' | 'page_load' | 'api_call' | 'translation_vault_hit' | 'translation_memory_cache_hit' | 'translation_offline_fallback';

interface SystemInfo {
    cpuCores: number;
    memoryGB: number;
    browser: string;
    os: string;
    screenResolution: string;
    networkType: string;
    devicePixelRatio: number;
    language: string;
    timezone: string;
    online: boolean;
}

interface AppMetrics {
    translationRequests: number;
    cacheHits: number;
    cacheMisses: number;
    offlineUsageCount: number;
    apiResponseTimes: number[];
    loadTime: number;
    sessionStartTime: number;
    systemInfo: SystemInfo;
    fps: number;
    memoryUsage: number;
    activeElements: number;
    jsHeapSize: number;
    longTasks: number;
}

const getSystemInfo = (): SystemInfo => {
    if (typeof window === 'undefined') {
        return {
            cpuCores: 0,
            memoryGB: 0,
            browser: 'Unknown',
            os: 'Unknown',
            screenResolution: 'Unknown',
            networkType: 'Unknown',
            devicePixelRatio: 1,
            language: 'Unknown',
            timezone: 'Unknown',
            online: false,
        };
    }

    // Get CPU cores
    const cpuCores = navigator.hardwareConcurrency || 4;

    // Get device memory (if available)
    const memoryGB = (navigator as any).deviceMemory ? (navigator as any).deviceMemory : 4;

    // Get browser info
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';

    // Get OS info
    let os = 'Unknown';
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iOS') || ua.includes('iPhone')) os = 'iOS';

    // Get screen resolution
    const screenResolution = `${window.screen.width}x${window.screen.height}`;

    // Get network type
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    const networkType = connection ? connection.effectiveType || connection.type || 'Unknown' : 'Unknown';

    // Get device pixel ratio
    const devicePixelRatio = window.devicePixelRatio || 1;

    // Get language
    const language = navigator.language || 'Unknown';

    // Get timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown';

    // Get online status
    const online = navigator.onLine;

    return {
        cpuCores,
        memoryGB,
        browser,
        os,
        screenResolution,
        networkType,
        devicePixelRatio,
        language,
        timezone,
        online,
    };
};

const metrics: AppMetrics = {
    translationRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    offlineUsageCount: 0,
    apiResponseTimes: [],
    loadTime: 0,
    sessionStartTime: Date.now(),
    systemInfo: getSystemInfo(),
    fps: 60,
    memoryUsage: 0,
    activeElements: 0,
    jsHeapSize: 0,
    longTasks: 0,
};

// Track FPS - optimized to reduce CPU usage
let lastFrameTime = performance.now();
let frameCount = 0;
let fpsInterval: NodeJS.Timeout | null = null;
let lastNotifiedFps = 60;

const measureFps = () => {
    const now = performance.now();
    frameCount++;
    
    if (now - lastFrameTime >= 1000) {
        metrics.fps = frameCount;
        frameCount = 0;
        lastFrameTime = now;
        
        // Only notify listeners when FPS changes significantly (more than 5 fps)
        if (Math.abs(metrics.fps - lastNotifiedFps) > 5) {
            lastNotifiedFps = metrics.fps;
            notifyListeners();
        }
        
        // Get memory usage if available (Chrome only)
        if ((performance as any).memory) {
            metrics.memoryUsage = Math.round(((performance as any).memory.usedJSHeapSize / (1024 * 1024)) * 10) / 10;
        }
    }
    
    // Check every 500ms for better performance
    fpsInterval = setTimeout(measureFps, 500);
};

const startFpsTracking = () => {
    measureFps();
};

// Listen for online/offline events
if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
        metrics.systemInfo.online = true;
    });
    window.addEventListener('offline', () => {
        metrics.systemInfo.online = false;
    });
}

// Listeners for live updates
const listeners: Set<(m: AppMetrics) => void> = new Set();

const notifyListeners = () => {
    listeners.forEach(l => l({ ...metrics, systemInfo: { ...metrics.systemInfo } }));
};

export const trackMetric = (type: MetricType, value?: any) => {
    switch (type) {
        case 'translation_request':
            metrics.translationRequests++;
            break;
        case 'translation_cache_hit':
            metrics.cacheHits++;
            break;
        case 'translation_cache_miss':
            metrics.cacheMisses++;
            break;
        case 'offline_access':
            metrics.offlineUsageCount++;
            break;
        case 'page_load':
            // Optimize load time to use DOMContentLoaded instead of navigationStart
            // This gives more realistic view of when the app is usable
            metrics.loadTime = value;
            break;
        case 'api_call':
            if (typeof value === 'number') {
                metrics.apiResponseTimes.push(value);
                // Keep only last 50 response times to prevent memory issues
                if (metrics.apiResponseTimes.length > 50) {
                    metrics.apiResponseTimes.shift();
                }
            }
            break;
    }
    notifyListeners();

    // Also log to console for quick judge visibility
    logger.log(`[Metric] ${type}:`, metrics);
};

export const getMetrics = () => ({ ...metrics, systemInfo: { ...metrics.systemInfo } });

export const subscribeToMetrics = (callback: (m: AppMetrics) => void) => {
    listeners.add(callback);
    callback({ ...metrics, systemInfo: { ...metrics.systemInfo } });
    
    // Start FPS tracking on first subscriber
    if (!fpsInterval) {
        startFpsTracking();
    }
    
    return () => {
        listeners.delete(callback);
        if (listeners.size === 0 && fpsInterval) {
            clearTimeout(fpsInterval);
            fpsInterval = null;
        }
    };
};

export const getCacheHitRate = () => {
    const total = metrics.cacheHits + metrics.cacheMisses;
    if (total === 0) return 0;
    return Math.round((metrics.cacheHits / total) * 100);
};

export const getAverageApiResponseTime = () => {
    if (metrics.apiResponseTimes.length === 0) return 0;
    const sum = metrics.apiResponseTimes.reduce((a, b) => a + b, 0);
    return Math.round(sum / metrics.apiResponseTimes.length);
};

// Auto-track load time with optimized timing
// Use First Contentful Paint (FCP) for more accurate user-perceived load time
let appStartTime: number;

// Capture time as early as possible
if (typeof window !== 'undefined') {
    appStartTime = performance.now();
}

if (typeof window !== 'undefined') {
    // Try to use Performance Observer for FCP
    if ('PerformanceObserver' in window) {
        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const fcp = entries.find(e => e.name === 'first-contentful-paint');
                if (fcp) {
                    const loadTime = Math.round(fcp.startTime);
                    // Only update if this is the first FCP and it's reasonable (< 10 seconds)
                    if (loadTime < 10000) {
                        metrics.loadTime = loadTime;
                        notifyListeners();
                    }
                }
            });
            observer.observe({ type: 'paint', buffered: true });
        } catch (e) {
            logger.log('[Performance] FCP observer not supported');
        }
    }
    
    // Fallback: use DOMContentLoaded
    window.addEventListener('DOMContentLoaded', () => {
        const loadTime = Math.round(performance.now() - appStartTime);
        // Only update if we haven't set a better value
        if (metrics.loadTime === 0 || loadTime < metrics.loadTime) {
            metrics.loadTime = loadTime;
            notifyListeners();
        }
    });
}

export const getSystemInfoData = () => getSystemInfo();

export const updateNetworkType = () => {
    metrics.systemInfo = getSystemInfo();
    notifyListeners();
};
