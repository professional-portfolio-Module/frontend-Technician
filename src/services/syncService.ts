import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './api';

const CACHE_TASKS_KEY = '@tasks_cache';
const OFFLINE_QUEUE_KEY = '@offline_queue';

export interface OfflineMutation {
  taskId: string;
  payload: any;
  timestamp: number;
}

export const syncService = {
  /**
   * Cache task list locally
   */
  async cacheTasks(tasks: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem(CACHE_TASKS_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to cache tasks locally:', e);
    }
  },

  /**
   * Retrieve cached tasks
   */
  async getCachedTasks(): Promise<any[]> {
    try {
      const cached = await AsyncStorage.getItem(CACHE_TASKS_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      console.error('Failed to read cached tasks:', e);
      return [];
    }
  },

  /**
   * Add a task update/completion to the offline queue
   */
  async queueMutation(taskId: string, payload: any): Promise<void> {
    try {
      const queueStr = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      const queue: OfflineMutation[] = queueStr ? JSON.parse(queueStr) : [];
      
      // Prevent duplicate queue entries for the same task - overwrite with latest update (CRDT-like LWW)
      const existingIndex = queue.findIndex(item => item.taskId === taskId);
      const newMutation: OfflineMutation = {
        taskId,
        payload,
        timestamp: Date.now(),
      };

      if (existingIndex > -1) {
        queue[existingIndex] = newMutation;
      } else {
        queue.push(newMutation);
      }

      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      
      // Update the local task cache status to reflect the change immediately offline
      const tasks = await this.getCachedTasks();
      const updatedTasks = tasks.map(t => {
        if (t.task_id === taskId) {
          return { ...t, status: payload.status };
        }
        return t;
      });
      await this.cacheTasks(updatedTasks);
    } catch (e) {
      console.error('Failed to queue offline mutation:', e);
    }
  },

  /**
   * Synchronize all queued offline mutations to the backend
   */
  async syncOfflineMutations(): Promise<{ success: boolean; syncedCount: number }> {
    try {
      const queueStr = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      if (!queueStr) return { success: true, syncedCount: 0 };

      const queue: OfflineMutation[] = JSON.parse(queueStr);
      if (queue.length === 0) return { success: true, syncedCount: 0 };

      let syncedCount = 0;
      const remainingQueue: OfflineMutation[] = [];

      for (const mutation of queue) {
        try {
          const response = await apiClient.patch(
            `/Main/router-backend/api/scheduled-tasks/${mutation.taskId}`,
            mutation.payload
          );
          if (response.data && response.data.success) {
            syncedCount++;
          } else {
            // Keep in queue if response was not successful (non-validation issue)
            remainingQueue.push(mutation);
          }
        } catch (err) {
          console.warn(`Sync failed for task ${mutation.taskId}, retaining in queue:`, err);
          remainingQueue.push(mutation);
        }
      }

      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remainingQueue));
      return { success: true, syncedCount };
    } catch (e) {
      console.error('Offline synchronization error:', e);
      return { success: false, syncedCount: 0 };
    }
  },

  /**
   * Get queue length
   */
  async getQueueLength(): Promise<number> {
    try {
      const queueStr = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      if (!queueStr) return 0;
      const queue = JSON.parse(queueStr);
      return queue.length;
    } catch {
      return 0;
    }
  }
};
