import fs from 'fs';
import path from 'path';
import {
  AdminStats,
  Avatar,
  ChoiceStep,
  ImageAsset,
  ImageCollectionId,
  PlayerProgress,
  Story,
  StoryGenre,
  StoryNode,
  StoryOption,
  StoryStatus,
  UnlockedEnding,
  User,
  UserRole,
} from '../src/types';
import {
  INITIAL_AVATARS,
  INITIAL_IMAGE_ASSETS,
  INITIAL_NODES,
  INITIAL_OPTIONS,
  INITIAL_STORIES,
  INITIAL_USERS,
} from './seed';
import { hashPin, normalizePlayerName, verifyPin } from './authHelper';

interface StoredUser extends User {
  pinHash: string;
  passwordHash?: string;
}

interface DatabaseSchema {
  users: StoredUser[];
  avatars: Avatar[];
  imageAssets: ImageAsset[];
  stories: Story[];
  nodes: StoryNode[];
  options: StoryOption[];
  progress: PlayerProgress[];
  unlockedEndings: UnlockedEnding[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'storyverse.json');

class DatabaseStore {
  private data: DatabaseSchema = {
    users: [],
    avatars: [],
    imageAssets: [],
    stories: [],
    nodes: [],
    options: [],
    progress: [],
    unlockedEndings: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        
        // Ensure avatars and imageAssets exist if older DB format
        if (!this.data.avatars || this.data.avatars.length === 0) {
          this.data.avatars = [...INITIAL_AVATARS];
        }
        if (!this.data.imageAssets || this.data.imageAssets.length === 0) {
          this.data.imageAssets = [...INITIAL_IMAGE_ASSETS];
        }
        
        // Ensure Admin KhangVan exists with proper hashed pin
        const adminName = process.env.ADMIN_NAME || 'KhangVan';
        const adminPin = process.env.ADMIN_INITIAL_PIN || '150408';
        const normAdmin = normalizePlayerName(adminName);
        
        let adminUser = this.data.users.find((u) => u.normalizedName === normAdmin || u.role === 'ADMIN');
        if (!adminUser) {
          const newAdmin: StoredUser = {
            id: 'user-admin-khangvan',
            name: adminName,
            playerName: adminName,
            normalizedName: normAdmin,
            role: 'ADMIN',
            avatarId: 'avatar-hero-1',
            avatarUrl: INITIAL_AVATARS[0].imageUrl,
            createdAt: new Date().toISOString(),
            pinHash: hashPin(adminPin),
            passwordHash: hashPin(adminPin),
          };
          this.data.users.unshift(newAdmin);
        } else {
          adminUser.role = 'ADMIN';
          adminUser.normalizedName = normalizePlayerName(adminUser.name || adminUser.playerName || adminName);
          if (!adminUser.pinHash) {
            adminUser.pinHash = hashPin(adminPin);
          }
        }

        // Migrate any users missing normalizedName
        this.data.users.forEach((u) => {
          if (!u.playerName && u.name) u.playerName = u.name;
          if (!u.name && u.playerName) u.name = u.playerName;
          if (!u.normalizedName) u.normalizedName = normalizePlayerName(u.playerName || u.name || '');
          if (!u.avatarUrl && u.avatar) u.avatarUrl = u.avatar;
          if (!u.avatar && u.avatarUrl) u.avatar = u.avatarUrl;
        });

        this.save();
      } else {
        // Seed initial data
        this.data = {
          users: INITIAL_USERS.map((u) => ({
            ...u,
            pinHash: u.pinHash || hashPin('150408'),
          })),
          avatars: [...INITIAL_AVATARS],
          imageAssets: [...INITIAL_IMAGE_ASSETS],
          stories: [...INITIAL_STORIES],
          nodes: [...INITIAL_NODES],
          options: [...INITIAL_OPTIONS],
          progress: [],
          unlockedEndings: [],
        };
        this.save();
      }
    } catch (err) {
      console.error('Error initializing database file, reverting to seeds in memory:', err);
      this.data = {
        users: INITIAL_USERS.map((u) => ({
          ...u,
          pinHash: u.pinHash || hashPin('150408'),
        })),
        avatars: [...INITIAL_AVATARS],
        imageAssets: [...INITIAL_IMAGE_ASSETS],
        stories: [...INITIAL_STORIES],
        nodes: [...INITIAL_NODES],
        options: [...INITIAL_OPTIONS],
        progress: [],
        unlockedEndings: [],
      };
    }
  }

  private save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database file:', err);
    }
  }

  // --- USERS & PLAYERS ---
  public getUsers(): User[] {
    return this.data.users.map(({ pinHash, passwordHash, ...u }) => u);
  }

  public findUserById(id: string): StoredUser | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public findUserByNormalizedName(normalizedName: string): StoredUser | undefined {
    const norm = normalizePlayerName(normalizedName);
    return this.data.users.find((u) => u.normalizedName === norm);
  }

  public findUserByEmail(email: string): StoredUser | undefined {
    return this.data.users.find((u) => u.email && u.email.toLowerCase() === email.toLowerCase());
  }

  public createPlayer(params: {
    playerName: string;
    pin: string;
    avatarId?: string;
  }): { player: User; error?: string } {
    const rawName = (params.playerName || '').trim();
    if (!rawName || rawName.length < 2) {
      return { error: 'Tên người chơi phải có ít nhất 2 ký tự.', player: null as any };
    }
    if (rawName.length > 30) {
      return { error: 'Tên người chơi tối đa 30 ký tự.', player: null as any };
    }

    const pin = (params.pin || '').trim();
    if (!pin || pin.length < 4 || pin.length > 12) {
      return { error: 'Mã PIN phải từ 4 đến 12 ký tự.', player: null as any };
    }

    const norm = normalizePlayerName(rawName);
    const existing = this.findUserByNormalizedName(norm);
    if (existing) {
      return {
        error: 'Tên này đã tồn tại trên hệ thống. Hãy đăng nhập bằng mã PIN hoặc chọn tên khác.',
        player: null as any,
      };
    }

    let avatarUrl = `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80`;
    let avatarId = params.avatarId;
    if (avatarId) {
      const foundAvatar = this.data.avatars.find((a) => a.id === avatarId);
      if (foundAvatar) {
        avatarUrl = foundAvatar.imageUrl;
      }
    } else if (this.data.avatars.length > 0) {
      avatarId = this.data.avatars[0].id;
      avatarUrl = this.data.avatars[0].imageUrl;
    }

    const newPlayer: StoredUser = {
      id: `player-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: rawName,
      playerName: rawName,
      normalizedName: norm,
      role: 'PLAYER',
      avatarId,
      avatarUrl,
      avatar: avatarUrl,
      createdAt: new Date().toISOString(),
      pinHash: hashPin(pin),
    };

    this.data.users.push(newPlayer);
    this.save();

    const { pinHash, passwordHash, ...safePlayer } = newPlayer;
    return { player: safePlayer };
  }

  public loginPlayer(params: {
    playerName: string;
    pin: string;
  }): { player: User | null; error?: string } {
    const rawName = (params.playerName || '').trim();
    const pin = (params.pin || '').trim();

    if (!rawName) {
      return { player: null, error: 'Vui lòng nhập tên người chơi.' };
    }
    if (!pin) {
      return { player: null, error: 'Vui lòng nhập mã PIN.' };
    }

    const norm = normalizePlayerName(rawName);
    const user = this.findUserByNormalizedName(norm);
    if (!user) {
      return { player: null, error: 'Không tìm thấy người chơi với tên này. Vui lòng tạo hồ sơ mới.' };
    }

    const isMatch = verifyPin(pin, user.pinHash) || (user.passwordHash && verifyPin(pin, user.passwordHash));
    if (!isMatch) {
      return { player: null, error: 'Mã PIN không chính xác. Không thể truy cập hồ sơ.' };
    }

    const { pinHash, passwordHash, ...safeUser } = user;
    return { player: safeUser };
  }

  public loginAdmin(params: {
    name?: string;
    pin: string;
  }): { user: User | null; error?: string } {
    const rawName = (params.name || '').trim();
    const pin = (params.pin || '').trim();

    if (!pin) {
      return { user: null, error: 'Vui lòng nhập Mã PIN Quản Trị Viên (Mặc định: 150408).' };
    }

    // Ensure at least one admin exists in database
    let admin = this.data.users.find((u) => u.role === 'ADMIN');
    if (!admin) {
      const adminName = process.env.ADMIN_NAME || 'KhangVan';
      const adminPin = process.env.ADMIN_INITIAL_PIN || '150408';
      const newAdmin: StoredUser = {
        id: 'user-admin-khangvan',
        name: adminName,
        playerName: adminName,
        normalizedName: normalizePlayerName(adminName),
        role: 'ADMIN',
        avatarId: 'avatar-hero-1',
        avatarUrl: INITIAL_AVATARS[0].imageUrl,
        createdAt: new Date().toISOString(),
        pinHash: hashPin(adminPin),
        passwordHash: hashPin(adminPin),
      };
      this.data.users.unshift(newAdmin);
      this.save();
      admin = newAdmin;
    }

    // Allow master PIN 150408 for instant and secure admin access
    const isMasterPin = pin === '150408' || pin === (process.env.ADMIN_INITIAL_PIN || '150408');

    let matchedUser = admin;
    if (rawName) {
      const norm = normalizePlayerName(rawName);
      const found = this.data.users.find((u) => 
        ((u.normalizedName === norm || u.name?.toLowerCase() === rawName.toLowerCase() || u.email?.toLowerCase() === rawName.toLowerCase()) && u.role === 'ADMIN') ||
        ((norm === 'admin' || norm === 'administrator' || norm === 'khangvan' || norm === 'khang') && u.role === 'ADMIN')
      );
      if (found) {
        matchedUser = found;
      }
    }

    const isMatch =
      isMasterPin ||
      verifyPin(pin, matchedUser.pinHash) ||
      (matchedUser.passwordHash && verifyPin(pin, matchedUser.passwordHash));

    if (!isMatch) {
      return { user: null, error: 'Mã PIN Quản trị viên không chính xác (Mặc định: 150408).' };
    }

    const { pinHash, passwordHash, ...safeUser } = matchedUser;
    return { user: safeUser };
  }

  public resetToDefault(): { success: boolean; message: string } {
    this.data = {
      users: INITIAL_USERS.map((u) => ({
        ...u,
        pinHash: u.pinHash || hashPin('150408'),
        passwordHash: u.passwordHash || hashPin('150408'),
      })),
      avatars: [...INITIAL_AVATARS],
      imageAssets: [...INITIAL_IMAGE_ASSETS],
      stories: [...INITIAL_STORIES],
      nodes: [...INITIAL_NODES],
      options: [...INITIAL_OPTIONS],
      progress: [],
      unlockedEndings: [],
    };
    this.save();
    return {
      success: true,
      message: 'Hệ thống StoryVerse đã được khôi phục nguyên trạng mới hoàn toàn!',
    };
  }

  public updatePlayerProfile(
    userId: string,
    updates: { playerName?: string; avatarId?: string; avatarUrl?: string }
  ): { player: User | null; error?: string } {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) return { player: null, error: 'Không tìm thấy người chơi.' };

    if (updates.playerName) {
      const trimmed = updates.playerName.trim();
      if (trimmed.length < 2 || trimmed.length > 30) {
        return { player: null, error: 'Tên người chơi phải từ 2 đến 30 ký tự.' };
      }
      const newNorm = normalizePlayerName(trimmed);
      if (newNorm !== user.normalizedName) {
        const existing = this.findUserByNormalizedName(newNorm);
        if (existing && existing.id !== userId) {
          return { player: null, error: 'Tên này đã được sử dụng bởi người chơi khác.' };
        }
        user.name = trimmed;
        user.playerName = trimmed;
        user.normalizedName = newNorm;
      }
    }

    if (updates.avatarId) {
      user.avatarId = updates.avatarId;
      const foundAvatar = this.data.avatars.find((a) => a.id === updates.avatarId);
      if (foundAvatar) {
        user.avatarUrl = foundAvatar.imageUrl;
        user.avatar = foundAvatar.imageUrl;
      }
    } else if (updates.avatarUrl) {
      user.avatarUrl = updates.avatarUrl;
      user.avatar = updates.avatarUrl;
    }

    user.updatedAt = new Date().toISOString();
    this.save();

    const { pinHash, passwordHash, ...safeUser } = user;
    return { player: safeUser };
  }

  // Legacy User registration for backwards-compat
  public createUser(userData: {
    email: string;
    name: string;
    passwordHash: string;
    role?: UserRole;
    avatar?: string;
  }): User {
    const norm = normalizePlayerName(userData.name);
    const newUser: StoredUser = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      email: userData.email,
      name: userData.name,
      playerName: userData.name,
      normalizedName: norm,
      role: userData.role || 'PLAYER',
      avatar: userData.avatar || INITIAL_AVATARS[0]?.imageUrl || '',
      avatarUrl: userData.avatar || INITIAL_AVATARS[0]?.imageUrl || '',
      avatarId: INITIAL_AVATARS[0]?.id || 'avatar-hero-1',
      createdAt: new Date().toISOString(),
      pinHash: hashPin(userData.passwordHash),
      passwordHash: userData.passwordHash,
    };
    this.data.users.push(newUser);
    this.save();
    const { pinHash, passwordHash, ...safeUser } = newUser;
    return safeUser;
  }

  public updateUserRole(userId: string, role: UserRole): User | null {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) return null;
    user.role = role;
    this.save();
    const { pinHash, passwordHash, ...safeUser } = user;
    return safeUser;
  }

  // --- AVATARS LIBRARY ---
  public getAvatars(): Avatar[] {
    return this.data.avatars;
  }

  public getAvatarById(id: string): Avatar | undefined {
    return this.data.avatars.find((a) => a.id === id);
  }

  public createAvatar(data: { name: string; imageUrl: string; thumbnailUrl?: string }): Avatar {
    const newAvatar: Avatar = {
      id: `avatar-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: data.name,
      imageUrl: data.imageUrl,
      thumbnailUrl: data.thumbnailUrl || data.imageUrl,
      isDefault: false,
      createdAt: new Date().toISOString(),
    };
    this.data.avatars.push(newAvatar);
    this.save();
    return newAvatar;
  }

  public deleteAvatar(id: string): boolean {
    const initialLen = this.data.avatars.length;
    this.data.avatars = this.data.avatars.filter((a) => a.id !== id);
    if (this.data.avatars.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // --- IMAGE ASSETS LIBRARY ---
  public getImageAssets(collectionId?: ImageCollectionId): ImageAsset[] {
    if (collectionId) {
      return this.data.imageAssets.filter((img) => img.collectionId === collectionId);
    }
    return this.data.imageAssets;
  }

  public createImageAsset(data: {
    name: string;
    url: string;
    thumbnailUrl?: string;
    collectionId: ImageCollectionId;
    type?: string;
    createdBy?: string;
  }): ImageAsset {
    const newAsset: ImageAsset = {
      id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: data.name,
      url: data.url,
      thumbnailUrl: data.thumbnailUrl || data.url,
      collectionId: data.collectionId || 'Backgrounds',
      type: data.type || 'image/jpeg',
      createdAt: new Date().toISOString(),
      createdBy: data.createdBy || 'Admin',
    };
    this.data.imageAssets.push(newAsset);
    this.save();
    return newAsset;
  }

  public deleteImageAsset(id: string): boolean {
    const initialLen = this.data.imageAssets.length;
    this.data.imageAssets = this.data.imageAssets.filter((img) => img.id !== id);
    if (this.data.imageAssets.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // --- STORIES ---
  public getStories(statusFilter?: StoryStatus | 'ALL'): Story[] {
    if (!statusFilter || statusFilter === 'PUBLISHED') {
      return this.data.stories.filter((s) => s.status === 'PUBLISHED');
    }
    if (statusFilter === 'ALL') {
      return this.data.stories;
    }
    return this.data.stories.filter((s) => s.status === statusFilter);
  }

  public getStoryById(id: string): Story | undefined {
    return this.data.stories.find((s) => s.id === id);
  }

  public createStory(params: {
    title: string;
    description: string;
    thumbnail?: string;
    genre: StoryGenre | string;
    createdBy: string;
    authorName: string;
    tags?: string[];
  }): { story: Story; startNode: StoryNode } {
    const storyId = `story-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newStory: Story = {
      id: storyId,
      title: params.title,
      description: params.description,
      thumbnail: params.thumbnail || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
      genre: params.genre,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: params.createdBy,
      authorName: params.authorName || 'Admin StoryVerse',
      tags: params.tags || ['Mới', 'Phiêu lưu'],
      stats: {
        plays: 0,
        completions: 0,
      },
    };

    // Auto-create initial start node
    const startNodeId = `node-${Date.now()}-start`;
    const startNode: StoryNode = {
      id: startNodeId,
      storyId: storyId,
      title: 'Khởi Đầu Câu Chuyện',
      content: 'Hãy viết đoạn mở đầu đầy lôi cuốn cho câu chuyện của bạn tại đây với {{playerName}}...',
      type: 'NORMAL',
      isStart: true,
      position: { x: 400, y: 50 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.stories.unshift(newStory);
    this.data.nodes.push(startNode);
    this.save();

    return { story: newStory, startNode };
  }

  public updateStory(
    id: string,
    updates: Partial<Pick<Story, 'title' | 'description' | 'thumbnail' | 'genre' | 'tags' | 'visualSettings'>>
  ): Story | null {
    const story = this.data.stories.find((s) => s.id === id);
    if (!story) return null;
    if (updates.title !== undefined) story.title = updates.title;
    if (updates.description !== undefined) story.description = updates.description;
    if (updates.thumbnail !== undefined) story.thumbnail = updates.thumbnail;
    if (updates.genre !== undefined) story.genre = updates.genre;
    if (updates.tags !== undefined) story.tags = updates.tags;
    if (updates.visualSettings !== undefined) story.visualSettings = updates.visualSettings;
    story.updatedAt = new Date().toISOString();
    this.save();
    return story;
  }

  public updateStoryStatus(id: string, status: StoryStatus): Story | null {
    const story = this.data.stories.find((s) => s.id === id);
    if (!story) return null;
    story.status = status;
    story.updatedAt = new Date().toISOString();
    if (status === 'PUBLISHED' && !story.publishedAt) {
      story.publishedAt = new Date().toISOString();
    }
    this.save();
    return story;
  }

  public deleteStory(id: string): boolean {
    const initialStoryCount = this.data.stories.length;
    this.data.stories = this.data.stories.filter((s) => s.id !== id);
    if (this.data.stories.length === initialStoryCount) return false;

    // Remove associated nodes & options
    const nodeIdsToRemove = new Set(this.data.nodes.filter((n) => n.storyId === id).map((n) => n.id));
    this.data.nodes = this.data.nodes.filter((n) => n.storyId !== id);
    this.data.options = this.data.options.filter((o) => !nodeIdsToRemove.has(o.nodeId));
    this.data.progress = this.data.progress.filter((p) => p.storyId !== id);
    this.data.unlockedEndings = this.data.unlockedEndings.filter((e) => e.storyId !== id);

    this.save();
    return true;
  }

  // --- NODES ---
  public getNodesByStoryId(storyId: string): (StoryNode & { options: StoryOption[] })[] {
    const storyNodes = this.data.nodes.filter((n) => n.storyId === storyId);
    return storyNodes.map((node) => {
      const nodeOptions = this.data.options
        .filter((o) => o.nodeId === node.id)
        .sort((a, b) => a.order - b.order);
      return {
        ...node,
        options: nodeOptions,
      };
    });
  }

  public getNodeById(nodeId: string): (StoryNode & { options: StoryOption[] }) | null {
    const node = this.data.nodes.find((n) => n.id === nodeId);
    if (!node) return null;
    const nodeOptions = this.data.options
      .filter((o) => o.nodeId === node.id)
      .sort((a, b) => a.order - b.order);
    return {
      ...node,
      options: nodeOptions,
    };
  }

  public createNode(storyId: string, nodeData: Partial<StoryNode>): StoryNode {
    const newNodeId = `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    // If this node is set as isStart, unset start on other nodes of this story
    if (nodeData.isStart) {
      this.data.nodes.forEach((n) => {
        if (n.storyId === storyId) n.isStart = false;
      });
    }

    const newNode: StoryNode = {
      id: newNodeId,
      storyId: storyId,
      title: nodeData.title || (nodeData.type === 'ENDING' ? 'Kết Thúc Mới' : 'Tình Huống Mới'),
      content: nodeData.content || 'Nội dung tình huống tiếp theo với {{playerName}}...',
      image: nodeData.image || '',
      imageAssetId: nodeData.imageAssetId,
      visualSettings: nodeData.visualSettings,
      type: nodeData.type || 'NORMAL',
      endingType: nodeData.endingType || 'NEUTRAL',
      endingTitle: nodeData.endingTitle || (nodeData.type === 'ENDING' ? nodeData.title || 'Kết Thúc' : undefined),
      isStart: !!nodeData.isStart,
      position: nodeData.position || { x: 300, y: 300 },
      hasJumpscare: !!nodeData.hasJumpscare,
      jumpscareType: nodeData.jumpscareType,
      jumpscareImage: nodeData.jumpscareImage,
      jumpscareSound: nodeData.jumpscareSound,
      jumpscareIntensity: nodeData.jumpscareIntensity,
      jumpscareText: nodeData.jumpscareText,
      characterName: nodeData.characterName,
      characterAvatar: nodeData.characterAvatar,
      characterRole: nodeData.characterRole,
      inspectItemName: nodeData.inspectItemName,
      inspectItemImage: nodeData.inspectItemImage,
      inspectItemDescription: nodeData.inspectItemDescription,
      sceneTheme: nodeData.sceneTheme || 'default',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.nodes.push(newNode);
    this.save();
    return newNode;
  }

  public updateNode(nodeId: string, updates: Partial<StoryNode>): StoryNode | null {
    const node = this.data.nodes.find((n) => n.id === nodeId);
    if (!node) return null;

    if (updates.isStart) {
      this.data.nodes.forEach((n) => {
        if (n.storyId === node.storyId && n.id !== nodeId) {
          n.isStart = false;
        }
      });
    }

    if (updates.title !== undefined) node.title = updates.title;
    if (updates.content !== undefined) node.content = updates.content;
    if (updates.image !== undefined) node.image = updates.image;
    if (updates.imageAssetId !== undefined) node.imageAssetId = updates.imageAssetId;
    if (updates.visualSettings !== undefined) node.visualSettings = updates.visualSettings;
    if (updates.type !== undefined) node.type = updates.type;
    if (updates.endingType !== undefined) node.endingType = updates.endingType;
    if (updates.endingTitle !== undefined) node.endingTitle = updates.endingTitle;
    if (updates.isStart !== undefined) node.isStart = updates.isStart;
    if (updates.position !== undefined) node.position = updates.position;
    
    // Jumpscare / Horror properties
    if (updates.hasJumpscare !== undefined) node.hasJumpscare = updates.hasJumpscare;
    if (updates.jumpscareType !== undefined) node.jumpscareType = updates.jumpscareType;
    if (updates.jumpscareImage !== undefined) node.jumpscareImage = updates.jumpscareImage;
    if (updates.jumpscareSound !== undefined) node.jumpscareSound = updates.jumpscareSound;
    if (updates.jumpscareIntensity !== undefined) node.jumpscareIntensity = updates.jumpscareIntensity;
    if (updates.jumpscareText !== undefined) node.jumpscareText = updates.jumpscareText;

    // Deep Storytelling elements
    if (updates.characterName !== undefined) node.characterName = updates.characterName;
    if (updates.characterAvatar !== undefined) node.characterAvatar = updates.characterAvatar;
    if (updates.characterRole !== undefined) node.characterRole = updates.characterRole;
    if (updates.inspectItemName !== undefined) node.inspectItemName = updates.inspectItemName;
    if (updates.inspectItemImage !== undefined) node.inspectItemImage = updates.inspectItemImage;
    if (updates.inspectItemDescription !== undefined) node.inspectItemDescription = updates.inspectItemDescription;
    if (updates.sceneTheme !== undefined) node.sceneTheme = updates.sceneTheme;

    node.updatedAt = new Date().toISOString();

    this.save();
    return node;
  }

  public deleteNode(nodeId: string): boolean {
    const nodeIndex = this.data.nodes.findIndex((n) => n.id === nodeId);
    if (nodeIndex === -1) return false;
    const node = this.data.nodes[nodeIndex];
    this.data.nodes.splice(nodeIndex, 1);

    // Delete options originating from this node
    this.data.options = this.data.options.filter((o) => o.nodeId !== nodeId);

    // Update options pointing to this node to empty nextNodeId
    this.data.options.forEach((o) => {
      if (o.nextNodeId === nodeId) {
        o.nextNodeId = '';
      }
    });

    // If deleted node was start, assign another node as start if exists
    if (node.isStart) {
      const anotherNode = this.data.nodes.find((n) => n.storyId === node.storyId);
      if (anotherNode) {
        anotherNode.isStart = true;
      }
    }

    this.save();
    return true;
  }

  // --- OPTIONS ---
  public createOption(nodeId: string, optionData: { text: string; nextNodeId?: string; order?: number }): StoryOption {
    const newOptionId = `opt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const existingOptions = this.data.options.filter((o) => o.nodeId === nodeId);
    const newOption: StoryOption = {
      id: newOptionId,
      nodeId: nodeId,
      text: optionData.text || 'Lựa chọn tiếp theo',
      nextNodeId: optionData.nextNodeId || '',
      order: optionData.order !== undefined ? optionData.order : existingOptions.length + 1,
    };
    this.data.options.push(newOption);
    this.save();
    return newOption;
  }

  public updateOption(optionId: string, updates: Partial<StoryOption>): StoryOption | null {
    const option = this.data.options.find((o) => o.id === optionId);
    if (!option) return null;
    if (updates.text !== undefined) option.text = updates.text;
    if (updates.nextNodeId !== undefined) option.nextNodeId = updates.nextNodeId;
    if (updates.order !== undefined) option.order = updates.order;
    this.save();
    return option;
  }

  public deleteOption(optionId: string): boolean {
    const idx = this.data.options.findIndex((o) => o.id === optionId);
    if (idx === -1) return false;
    this.data.options.splice(idx, 1);
    this.save();
    return true;
  }

  // --- PLAYER PROGRESS & CHOICES ---
  public getProgress(userId: string, storyId: string): PlayerProgress | null {
    return this.data.progress.find((p) => p.userId === userId && p.storyId === storyId) || null;
  }

  public saveProgress(
    userId: string,
    storyId: string,
    currentNodeId: string,
    choiceStep?: ChoiceStep
  ): PlayerProgress {
    let prog = this.data.progress.find((p) => p.userId === userId && p.storyId === storyId);
    const node = this.data.nodes.find((n) => n.id === currentNodeId);
    const isEnding = node?.type === 'ENDING';

    // Update story play stats
    const story = this.data.stories.find((s) => s.id === storyId);
    if (story) {
      if (!prog) {
        story.stats.plays += 1;
      }
      if (isEnding && (!prog || !prog.completed)) {
        story.stats.completions += 1;
      }
    }

    if (!prog) {
      prog = {
        id: `prog-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        userId,
        storyId,
        currentNodeId,
        completed: isEnding,
        reachedEndingId: isEnding ? currentNodeId : undefined,
        choicePath: choiceStep ? [choiceStep] : [],
        startedAt: new Date().toISOString(),
        completedAt: isEnding ? new Date().toISOString() : undefined,
        updatedAt: new Date().toISOString(),
      };
      this.data.progress.push(prog);
    } else {
      prog.currentNodeId = currentNodeId;
      prog.updatedAt = new Date().toISOString();
      if (choiceStep) {
        prog.choicePath.push(choiceStep);
      }
      if (isEnding) {
        prog.completed = true;
        prog.reachedEndingId = currentNodeId;
        prog.completedAt = new Date().toISOString();
      }
    }

    // If reached ending, save to unlocked endings
    if (isEnding && node) {
      this.saveUnlockedEnding(
        userId,
        storyId,
        currentNodeId,
        node.endingTitle || node.title,
        node.endingType || 'NEUTRAL'
      );
    }

    this.save();
    return prog;
  }

  public resetProgress(userId: string, storyId: string): boolean {
    const idx = this.data.progress.findIndex((p) => p.userId === userId && p.storyId === storyId);
    if (idx !== -1) {
      this.data.progress.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  }

  public getUnlockedEndings(userId: string): UnlockedEnding[] {
    return this.data.unlockedEndings.filter((e) => e.userId === userId);
  }

  public saveUnlockedEnding(
    userId: string,
    storyId: string,
    endingNodeId: string,
    endingTitle: string,
    endingType: any
  ): UnlockedEnding {
    const existing = this.data.unlockedEndings.find(
      (e) => e.userId === userId && e.storyId === storyId && e.endingNodeId === endingNodeId
    );
    if (existing) return existing;

    const story = this.data.stories.find((s) => s.id === storyId);
    const newEnding: UnlockedEnding = {
      id: `end-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId,
      storyId,
      storyTitle: story?.title || 'Câu Chuyện',
      storyThumbnail: story?.thumbnail || '',
      endingNodeId,
      endingTitle,
      endingType: endingType || 'NEUTRAL',
      unlockedAt: new Date().toISOString(),
    };
    this.data.unlockedEndings.push(newEnding);
    this.save();
    return newEnding;
  }

  public getPlayerStats(userId: string) {
    const userProgress = this.data.progress.filter((p) => p.userId === userId);
    const userEndings = this.data.unlockedEndings.filter((e) => e.userId === userId);
    const totalChoices = userProgress.reduce((sum, p) => sum + p.choicePath.length, 0);

    return {
      storiesStarted: userProgress.length,
      storiesCompleted: userProgress.filter((p) => p.completed).length,
      endingsUnlocked: userEndings.length,
      totalChoicesMade: totalChoices,
    };
  }

  // --- ADMIN STATS ---
  public getAdminStats(): AdminStats {
    const genreMap: Record<string, number> = {};
    this.data.stories.forEach((s) => {
      genreMap[s.genre] = (genreMap[s.genre] || 0) + 1;
    });

    const popular = [...this.data.stories]
      .sort((a, b) => b.stats.plays - a.stats.plays)
      .slice(0, 5)
      .map((s) => ({
        id: s.id,
        title: s.title,
        plays: s.stats.plays,
        completions: s.stats.completions,
      }));

    return {
      totalStories: this.data.stories.length,
      publishedStories: this.data.stories.filter((s) => s.status === 'PUBLISHED').length,
      draftStories: this.data.stories.filter((s) => s.status === 'DRAFT').length,
      totalUsers: this.data.users.length,
      totalPlays: this.data.stories.reduce((sum, s) => sum + (s.stats.plays || 0), 0),
      totalEndingsReached: this.data.unlockedEndings.length,
      genreBreakdown: Object.entries(genreMap).map(([genre, count]) => ({ genre, count })),
      popularStories: popular,
    };
  }
}

export const db = new DatabaseStore();
