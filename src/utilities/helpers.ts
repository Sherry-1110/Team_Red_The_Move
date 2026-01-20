import type { DocumentData } from 'firebase/firestore';
import type { Move } from '../types';

export const createId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const firestoreDocToMove = (docData: DocumentData, docId: string): Move => {
  const fallbackMaxParticipants = 12;
  const attendees = Array.isArray(docData.attendees) ? docData.attendees : [];
  const maxParticipants = Number(docData.maxParticipants);
  const normalizedMaxParticipants =
    Number.isFinite(maxParticipants) && maxParticipants >= 1
      ? maxParticipants
      : fallbackMaxParticipants;
  const safeMaxParticipants = Math.max(normalizedMaxParticipants, attendees.length);

  return {
    id: docId,
    title: docData.title ?? '',
    description: docData.description ?? '',
    remarks: typeof docData.remarks === 'string' ? docData.remarks : '',
    location: docData.location ?? '',
    startTime: docData.startTime ?? new Date().toISOString(),
    endTime: docData.endTime ?? new Date().toISOString(),
    createdAt: docData.createdAt ?? new Date().toISOString(),
    area: (docData.area ?? 'Other'),
    activityType: (docData.activityType ?? 'Other'),
    hostId: docData.hostId ?? '',
    hostName: docData.hostName ?? '',
    attendees,
    maxParticipants: safeMaxParticipants,
    comments: Array.isArray(docData.comments) ? docData.comments : [],
  };
};

export const formatTimeAgo = (isoTime: string, now: number) => {
  const timestamp = new Date(isoTime).getTime();
  if (Number.isNaN(timestamp)) return 'just now';
  const diff = Math.max(0, now - timestamp);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return 'just now';
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  return `${Math.floor(diff / day)}d ago`;
};

export const formatEventTime = (isoTime: string) => {
  const timestamp = new Date(isoTime);
  if (Number.isNaN(timestamp.getTime())) return isoTime;
  return timestamp.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const formatEventDayDate = (isoTime: string) => {
  const timestamp = new Date(isoTime);
  if (Number.isNaN(timestamp.getTime())) return isoTime;
  return timestamp.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatEventTimeOnly = (isoTime: string) => {
  const timestamp = new Date(isoTime);
  if (Number.isNaN(timestamp.getTime())) return isoTime;
  return timestamp.toLocaleString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const getStatusLabel = (startTime: string, endTime: string, now: number) => {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return 'Upcoming';
  if (now < start) return 'Upcoming';
  if (now <= end) return 'Live Now';
  return 'Past';
};

export const sortByNewest = (moves: Move[]) =>
  [...moves].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
