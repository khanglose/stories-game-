import { Avatar, ImageAsset, Story, StoryNode, StoryOption, User } from '../src/types';
import { hashPin, normalizePlayerName } from './authHelper';

const ADMIN_NAME = process.env.ADMIN_NAME || 'KhangVan';
const ADMIN_INITIAL_PIN = process.env.ADMIN_INITIAL_PIN || '150408';

export const INITIAL_AVATARS: Avatar[] = [
  {
    id: 'avatar-hero-1',
    name: 'Hiệp Sĩ Quả Cảm',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'avatar-explorer-2',
    name: 'Nhà Thám Hiểm',
    imageUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'avatar-mage-3',
    name: 'Pháp Sư Bí Ẩn',
    imageUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'avatar-cyber-4',
    name: 'Hacker Cyberpunk',
    imageUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'avatar-detective-5',
    name: 'Thám Tử Tư',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'avatar-scholar-6',
    name: 'Học Giả Thời Gian',
    imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'avatar-ninja-7',
    name: 'Bóng Đêm Thầm Lặng',
    imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'avatar-astral-8',
    name: 'Du Hành Vũ Trụ',
    imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_IMAGE_ASSETS: ImageAsset[] = [
  {
    id: 'img-bg-manor',
    name: 'Biệt Thự Đêm Sương Mù',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
    collectionId: 'Locations',
    type: 'image/jpeg',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'img-bg-hall',
    name: 'Đại Sảnh Hoang Phế',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&auto=format&fit=crop&q=80',
    collectionId: 'Locations',
    type: 'image/jpeg',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'img-bg-space',
    name: 'Trạm Không Gian Aethelgard',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80',
    collectionId: 'Backgrounds',
    type: 'image/jpeg',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'img-bg-kingdom',
    name: 'Lâu Đài Rực Lửa',
    url: 'https://images.unsplash.com/photo-1514539079130-25950c84af65?w=1200&auto=format&fit=crop&q=80',
    collectionId: 'Backgrounds',
    type: 'image/jpeg',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'img-obj-diary',
    name: 'Nhật Ký Gia Tộc & Ngọc Huyết Phách',
    url: 'https://images.unsplash.com/photo-1520523839898-50712705391e?w=1200&auto=format&fit=crop&q=80',
    collectionId: 'Objects',
    type: 'image/jpeg',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'img-obj-portal',
    name: 'Quả Cầu Giả Kim Thuật',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80',
    collectionId: 'Objects',
    type: 'image/jpeg',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'img-bg-dawn',
    name: 'Bình Minh Hy Vọng',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80',
    collectionId: 'Story Images',
    type: 'image/jpeg',
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_USERS: (User & { passwordHash: string; pinHash?: string })[] = [
  {
    id: 'user-admin-khangvan',
    name: ADMIN_NAME,
    playerName: ADMIN_NAME,
    normalizedName: normalizePlayerName(ADMIN_NAME),
    role: 'ADMIN',
    avatarId: 'avatar-hero-1',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
    passwordHash: hashPin(ADMIN_INITIAL_PIN),
    pinHash: hashPin(ADMIN_INITIAL_PIN),
  },
];

export const INITIAL_STORIES: Story[] = [];

export const INITIAL_NODES: StoryNode[] = [];

export const INITIAL_OPTIONS: StoryOption[] = [];
