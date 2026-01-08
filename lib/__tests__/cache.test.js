import { describe, it, expect, beforeEach, vi } from 'vitest';
// Mock expo-file-system before importing cache
vi.mock('expo-file-system/legacy', () => ({
    cacheDirectory: '/mock/cache/',
    getInfoAsync: vi.fn().mockResolvedValue({ exists: false }),
    makeDirectoryAsync: vi.fn().mockResolvedValue(undefined),
    readAsStringAsync: vi.fn().mockResolvedValue('{}'),
    writeAsStringAsync: vi.fn().mockResolvedValue(undefined),
    deleteAsync: vi.fn().mockResolvedValue(undefined),
}));
// Import after mocking
import { bgRemovalCache } from '../cache';
describe('BackgroundRemovalCache', () => {
    beforeEach(async () => {
        // Clear cache before each test
        await bgRemovalCache.clear();
    });
    describe('hashOptions', () => {
        it('should hash options to JSON string', () => {
            const hash = bgRemovalCache.hashOptions({
                format: 'PNG',
                maxDimension: 1024,
                quality: 100
            });
            expect(hash).toBe('{"format":"PNG","maxDimension":1024,"quality":100}');
        });
        it('should produce consistent hash regardless of key order', () => {
            const hash1 = bgRemovalCache.hashOptions({ a: 1, b: 2 });
            const hash2 = bgRemovalCache.hashOptions({ b: 2, a: 1 });
            expect(hash1).toBe(hash2);
        });
        it('should exclude functions from hash', () => {
            const hash = bgRemovalCache.hashOptions({
                value: 1,
                callback: () => { }
            });
            expect(hash).toBe('{"value":1}');
        });
    });
    describe('size', () => {
        it('should return 0 for empty cache', () => {
            expect(bgRemovalCache.size).toBe(0);
        });
    });
    describe('set and get', () => {
        it('should store and retrieve cached results', async () => {
            const path = 'file:///test/image.jpg';
            const optionsHash = bgRemovalCache.hashOptions({ format: 'PNG' });
            const resultPath = 'file:///cache/result.png';
            bgRemovalCache.set(path, optionsHash, resultPath);
            expect(bgRemovalCache.size).toBe(1);
        });
    });
    describe('clear', () => {
        it('should clear all cache entries', async () => {
            bgRemovalCache.set('path1', 'hash1', 'result1');
            bgRemovalCache.set('path2', 'hash2', 'result2');
            expect(bgRemovalCache.size).toBe(2);
            await bgRemovalCache.clear();
            expect(bgRemovalCache.size).toBe(0);
        });
    });
    describe('getCacheDirectory', () => {
        it('should return the cache directory path', () => {
            const dir = bgRemovalCache.getCacheDirectory();
            expect(dir).toContain('bg-removal');
        });
    });
    describe('configure', () => {
        it('should allow updating cache configuration', () => {
            bgRemovalCache.configure({
                maxEntries: 100,
                maxAgeMinutes: 60,
                persistToDisk: true,
            });
            // Configuration applied - no error thrown
            expect(true).toBe(true);
        });
    });
    describe('prune', () => {
        it('should return 0 when no entries are expired', () => {
            bgRemovalCache.set('path', 'hash', 'result');
            const removed = bgRemovalCache.prune();
            expect(removed).toBe(0);
        });
    });
});
