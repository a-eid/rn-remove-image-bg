export class CacheManager {
    cache;
    MAX_SIZE = 50; // Limit to 50 items to avoid memory leaks
    constructor() {
        this.cache = new Map();
    }
    /**
     * Generates a unique cache key based on input URI and processing options
     */
    generateKey(uri, options) {
        // We include relevant options that affect output
        const { format = 'PNG', quality = 100, maxDimension = 0 } = options;
        return `${uri}|${format}|${quality}|${maxDimension}`;
    }
    get(uri, options) {
        const key = this.generateKey(uri, options);
        const entry = this.cache.get(key);
        if (entry) {
            entry.timestamp = Date.now(); // Update usage timestamp (simple LRU)
            return entry.dataUrl;
        }
        return null;
    }
    set(uri, options, dataUrl) {
        const key = this.generateKey(uri, options);
        // Evict if full
        if (this.cache.size >= this.MAX_SIZE) {
            this.evictOldest();
        }
        this.cache.set(key, {
            dataUrl,
            timestamp: Date.now()
        });
    }
    clear() {
        this.cache.clear();
    }
    size() {
        return this.cache.size;
    }
    evictOldest() {
        // Find oldest entry
        let oldestKey = null;
        let oldestTime = Infinity;
        for (const [key, entry] of this.cache.entries()) {
            if (entry.timestamp < oldestTime) {
                oldestTime = entry.timestamp;
                oldestKey = key;
            }
        }
        if (oldestKey) {
            this.cache.delete(oldestKey);
        }
    }
}
// Singleton instance
export const cacheManager = new CacheManager();
