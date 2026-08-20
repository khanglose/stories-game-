export type UserRole = 'ADMIN' | 'PLAYER';

export interface PlayerProfile {
  id: string;
  playerName: string;
  normalizedName: string;
  avatarId?: string;
  avatarUrl: string;
  role: UserRole;
  createdAt: string;
  updatedAt?: string;
}

// User interface for backwards-compatibility
export interface User extends PlayerProfile {
  name: string;
  email?: string;
  avatar?: string;
}

export interface Avatar {
  id: string;
  name: string;
  imageUrl: string;
  thumbnailUrl?: string;
  isDefault?: boolean;
  createdAt: string;
}

export type ImageCollectionId = 
  | 'Backgrounds' 
  | 'Characters' 
  | 'Locations' 
  | 'Objects' 
  | 'Story Images' 
  | 'Other';

export interface ImageAsset {
  id: string;
  name: string;
  url: string;
  thumbnailUrl?: string;
  collectionId: ImageCollectionId;
  type?: string;
  width?: number;
  height?: number;
  createdAt: string;
  createdBy?: string;
}

export interface StoryVisualSettings {
  defaultBackgroundImageId?: string;
  overlayColor?: string;
  overlayOpacity?: number; // 0 to 100
  imagePosition?: 'center' | 'top' | 'bottom';
  imageFit?: 'cover' | 'contain';
  transitionType?: 'fade' | 'slide' | 'zoom';
  transitionDuration?: number; // ms
  fontFamily?: string;
  textColor?: string;
}

export interface NodeVisualSettings {
  imageAssetId?: string;
  displayMode?: 'BACKGROUND' | 'STORY_IMAGE' | 'CHARACTER' | 'PORTRAIT' | 'FULLSCREEN';
  imagePosition?: 'center' | 'top' | 'bottom';
  imageFit?: 'cover' | 'contain';
  overlayColor?: string;
  overlayOpacity?: number;
  transition?: 'fade' | 'slide' | 'zoom';
}

export type StoryStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type StoryGenre = 
  | 'Bí Ẩn / Kinh Dị' 
  | 'Khoa Học Viễn Tưởng' 
  | 'Kỳ Ảo / Phiêu Lưu' 
  | 'Trinh Thám / Hình Sự' 
  | 'Cyberpunk' 
  | 'Đời Thường / Lãng Mạn';

export interface Story {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  genre: StoryGenre | string;
  status: StoryStatus;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  createdBy: string;
  authorName: string;
  tags: string[];
  visualSettings?: StoryVisualSettings;
  stats: {
    plays: number;
    completions: number;
  };
}

export type NodeType = 'NORMAL' | 'ENDING';
export type EndingType = 'VICTORY' | 'TRAGIC' | 'SECRET' | 'NEUTRAL';

export type JumpscareType = 
  | 'SCREAM_SHAKE' 
  | 'GHOST_POPUP' 
  | 'BLOOD_VIGNETTE' 
  | 'GLITCH_STATIC' 
  | 'DARK_PULSE';

export type JumpscareSound = 
  | 'scream' 
  | 'screech' 
  | 'heartbeat' 
  | 'glitch' 
  | 'thud' 
  | 'whisper';

export interface StoryOption {
  id: string;
  nodeId: string;
  text: string;
  nextNodeId: string;
  order: number;
  icon?: string;
}

export interface StoryNode {
  id: string;
  storyId: string;
  title: string;
  content: string;
  image?: string;
  imageAssetId?: string;
  visualSettings?: NodeVisualSettings;
  type: NodeType;
  endingType?: EndingType;
  endingTitle?: string;
  isStart: boolean;
  position?: { x: number; y: number };
  options?: StoryOption[];
  // Jumpscare / Horror configuration
  hasJumpscare?: boolean;
  jumpscareType?: JumpscareType;
  jumpscareImage?: string;
  jumpscareSound?: JumpscareSound;
  jumpscareIntensity?: 'mild' | 'intense' | 'extreme';
  jumpscareText?: string;
  // Deep story elements from collection
  characterName?: string;
  characterAvatar?: string;
  characterRole?: string;
  inspectItemName?: string;
  inspectItemImage?: string;
  inspectItemDescription?: string;
  sceneTheme?: 'horror' | 'cyber' | 'fantasy' | 'mystery' | 'default';
  createdAt: string;
  updatedAt: string;
}

export interface ChoiceStep {
  nodeId: string;
  nodeTitle: string;
  optionId: string;
  optionText: string;
  timestamp: string;
}

export interface PlayerProgress {
  id: string;
  userId: string;
  storyId: string;
  currentNodeId: string;
  completed: boolean;
  reachedEndingId?: string;
  choicePath: ChoiceStep[];
  startedAt: string;
  completedAt?: string;
  updatedAt: string;
}

export interface UnlockedEnding {
  id: string;
  userId: string;
  storyId: string;
  storyTitle: string;
  storyThumbnail: string;
  endingNodeId: string;
  endingTitle: string;
  endingType: EndingType;
  unlockedAt: string;
}

export interface StoryFullDetail extends Story {
  nodes: StoryNode[];
  startNodeId?: string;
  totalEndings: number;
}

export interface AdminStats {
  totalStories: number;
  publishedStories: number;
  draftStories: number;
  totalUsers: number;
  totalPlays: number;
  totalEndingsReached: number;
  genreBreakdown: { genre: string; count: number }[];
  popularStories: { id: string; title: string; plays: number; completions: number }[];
}

