import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const CACHE_PREFIX = 'cache_';
const QUEUE_KEY = 'offline_queue';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

class OfflineManager {
    constructor() {
        this.isOnline = true;
        this.setupNetworkListener();
    }

    setupNetworkListener() {
        NetInfo.addEventListener(state => {
            const wasOffline = !this.isOnline;
            this.isOnline = state.isConnected && state.isInternetReachable;

            if (wasOffline && this.isOnline) {
                this.processQueue();
            }
        });
    }

    async cacheData(key, data) {
        try {
            const cacheItem = {
                data,
                timestamp: Date.now(),
            };
            await AsyncStorage.setItem(
                `${CACHE_PREFIX}${key}`,
                JSON.stringify(cacheItem),
            );
        } catch (error) {
            console.error('Error caching data:', error);
        }
    }

    async getCachedData(key) {
        try {
            const cached = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
            if (!cached) return null;

            const { data, timestamp } = JSON.parse(cached);

            // Check if cache is expired
            if (Date.now() - timestamp > CACHE_EXPIRY) {
                await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
                return null;
            }

            return data;
        } catch (error) {
            console.error('Error getting cached data:', error);
            return null;
        }
    }

    async queueRequest(request) {
        try {
            const queue = await this.getQueue();
            queue.push({
                ...request,
                timestamp: Date.now(),
            });
            await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
            console.log('Request queued for offline sync');
        } catch (error) {
            console.error('Error queuing request:', error);
        }
    }

    async getQueue() {
        try {
            const queue = await AsyncStorage.getItem(QUEUE_KEY);
            return queue ? JSON.parse(queue) : [];
        } catch (error) {
            console.error('Error getting queue:', error);
            return [];
        }
    }

    async processQueue() {
        if (!this.isOnline) return;

        try {
            const queue = await this.getQueue();
            if (queue.length === 0) return;

            console.log(`Processing ${queue.length} queued requests...`);

            const axios = require('axios').default;
            const failedRequests = [];

            for (const request of queue) {
                try {
                    // Validate request has required properties
                    if (!request || !request.url || !request.method) {
                        console.warn('Invalid request in queue, skipping');
                        continue;
                    }
                    await axios(request);
                    console.log('Queued request processed successfully');
                } catch (error) {
                    console.error('Failed to process queued request:', error.message);
                    failedRequests.push(request);
                }
            }

            // Keep failed requests in queue
            await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(failedRequests));
        } catch (error) {
            console.error('Error processing queue:', error.message);
        }
    }

    async clearCache() {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
            await AsyncStorage.multiRemove(cacheKeys);
            console.log('Cache cleared');
        } catch (error) {
            console.error('Error clearing cache:', error);
        }
    }

    async clearQueue() {
        try {
            await AsyncStorage.removeItem(QUEUE_KEY);
            console.log('Queue cleared');
        } catch (error) {
            console.error('Error clearing queue:', error);
        }
    }

    getOnlineStatus() {
        return this.isOnline;
    }
}

export const offlineManager = new OfflineManager();
