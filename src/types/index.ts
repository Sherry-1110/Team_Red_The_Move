export type CampusArea = 'North' | 'South' | 'Downtown' | 'Other';
export type ActivityType = 'Food' | 'Study' | 'Sports' | 'Social' | 'Other';

export type Comment = {
  id: string;
  author: string;
  text: string;
  createdAt: string;
};

export type Move = {
  id: string;
  title: string;
  description: string;
  remarks: string;
  location: string;
  locationName?: string;
  locationUrl?: string;
  latitude?: number;
  longitude?: number;
  startTime: string;
  endTime: string;
  createdAt: string;
  area: CampusArea;
  activityType: ActivityType;
  hostId: string;
  hostName: string;
  attendees: string[];
  maxParticipants: number;
  comments: Comment[];
};

export type User = {
  id: string;
  name: string;
};

export const AREA_FILTERS: Array<'All' | CampusArea> = ['All', 'North', 'South', 'Downtown', 'Other'];
export const ACTIVITY_FILTERS: Array<'All' | ActivityType> = [
  'All',
  'Food',
  'Study',
  'Sports',
  'Social',
  'Other',
];
export const FILTER_OPTIONS: Array<'All' | CampusArea | ActivityType> = [
  'All',
  'North',
  'South',
  'Downtown',
  'Food',
  'Study',
  'Sports',
  'Social',
  'Other',
];
