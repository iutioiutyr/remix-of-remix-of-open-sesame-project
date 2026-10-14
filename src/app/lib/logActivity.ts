import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import { currentUser } from '../store/auth'

export type ActivityAction =
  | 'content_opened'   // user clicked a card / opened the download modal
  | 'stream_started'   // user clicked the Download / Stream button
  | 'episode_selected' // user tapped an episode box in a series

export interface ActivityPayload {
  action: ActivityAction
  contentId?: string | number
  contentTitle?: string
  contentType?: 'MOVIES' | 'TV SERIES' | 'ANIMATION' | string
  contentCategory?: string
  episodeNumber?: number
}

export async function logActivity(payload: ActivityPayload): Promise<void> {
  const user = currentUser.value
  if (!user) return // only track authenticated users
  try {
    await addDoc(collection(db, 'activityLogs'), {
      uid:          user.uid,
      userEmail:    user.email   ?? '',
      userName:     user.displayName ?? user.email?.split('@')[0] ?? 'User',
      action:       payload.action,
      contentId:    String(payload.contentId ?? ''),
      contentTitle: payload.contentTitle   ?? '',
      contentType:  payload.contentType    ?? '',
      contentCategory: payload.contentCategory ?? '',
      episodeNumber:   payload.episodeNumber   ?? null,
      timestamp:    serverTimestamp(),
    })
  } catch (_) {
    // silently swallow — never break UX because of logging
  }
}
