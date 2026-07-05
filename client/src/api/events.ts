import { apiClient } from './client';
import type { Event } from './types';

export async function getEvents(): Promise<Event[]> {
  return apiClient.get('/events');
}
