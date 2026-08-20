import {
  AdminStats,
  Avatar,
  ChoiceStep,
  ImageAsset,
  ImageCollectionId,
  PlayerProgress,
  Story,
  StoryFullDetail,
  StoryNode,
  StoryOption,
  StoryStatus,
  UnlockedEnding,
  User,
  UserRole,
} from '../types';

const TOKEN_KEY = 'storyverse_auth_token';

export const getAuthToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

const fetchJson = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Yêu cầu thất bại (${response.status})`);
  }

  return data as T;
};

export const api = {
  // --- PLAYER AUTH (NAME + PIN + AVATAR) ---
  async checkPlayerName(name: string): Promise<{ exists: boolean; normalizedName: string }> {
    return fetchJson<{ exists: boolean; normalizedName: string }>(`/api/player/check-name/${encodeURIComponent(name)}`);
  },

  async registerPlayer(data: { playerName: string; pin: string; avatarId?: string }) {
    return fetchJson<{ player: User; token: string; message: string }>('/api/player/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async loginPlayer(data: { playerName: string; pin: string }) {
    return fetchJson<{ player: User; token: string; message: string }>('/api/player/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async loginAdmin(data: { name: string; pin: string }) {
    return fetchJson<{ user: User; token: string; message: string }>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getMe() {
    return fetchJson<{ user: User | null; player?: User | null }>('/api/player/me');
  },

  async updatePlayerProfile(data: { playerName?: string; avatarId?: string; avatarUrl?: string }) {
    return fetchJson<{ player: User; message: string }>('/api/player/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // --- AVATARS & IMAGES ---
  async getAvatars(): Promise<Avatar[]> {
    return fetchJson<Avatar[]>('/api/avatars');
  },

  async createAvatar(data: { name: string; imageUrl: string; thumbnailUrl?: string }): Promise<Avatar> {
    return fetchJson<Avatar>('/api/admin/avatars', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteAvatar(id: string): Promise<{ message: string }> {
    return fetchJson<{ message: string }>(`/api/admin/avatars/${id}`, {
      method: 'DELETE',
    });
  },

  async getImageAssets(collectionId?: ImageCollectionId): Promise<ImageAsset[]> {
    const url = collectionId ? `/api/images?collectionId=${collectionId}` : '/api/images';
    return fetchJson<ImageAsset[]>(url);
  },

  async createImageAsset(data: {
    name: string;
    url: string;
    thumbnailUrl?: string;
    collectionId: ImageCollectionId;
    type?: string;
  }): Promise<ImageAsset> {
    return fetchJson<ImageAsset>('/api/admin/images', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteImageAsset(id: string): Promise<{ message: string }> {
    return fetchJson<{ message: string }>(`/api/admin/images/${id}`, {
      method: 'DELETE',
    });
  },

  // Legacy auth methods
  async register(data: { email: string; name: string; password: string }) {
    return this.registerPlayer({ playerName: data.name, pin: data.password });
  },

  async login(data: { email: string; password: string }) {
    return fetchJson<{ user: User; token: string; message: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // --- PLAYER STORIES ---
  async getStories(status?: StoryStatus | 'ALL'): Promise<Story[]> {
    const url = status ? `/api/stories?status=${status}` : '/api/stories';
    return fetchJson<Story[]>(url);
  },

  async getStoryDetail(storyId: string): Promise<StoryFullDetail> {
    return fetchJson<StoryFullDetail>(`/api/stories/${storyId}`);
  },

  async getNode(storyId: string, nodeId: string): Promise<StoryNode & { options: StoryOption[] }> {
    return fetchJson<StoryNode & { options: StoryOption[] }>(`/api/stories/${storyId}/nodes/${nodeId}`);
  },

  // --- PROGRESS ---
  async getProgress(storyId: string): Promise<{ progress: PlayerProgress | null }> {
    return fetchJson<{ progress: PlayerProgress | null }>(`/api/progress/${storyId}`);
  },

  async saveProgress(data: {
    storyId: string;
    currentNodeId: string;
    choiceStep?: ChoiceStep;
  }): Promise<{ progress: PlayerProgress; message: string }> {
    return fetchJson<{ progress: PlayerProgress; message: string }>('/api/progress/save', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async resetProgress(storyId: string): Promise<{ message: string }> {
    return fetchJson<{ message: string }>('/api/progress/reset', {
      method: 'POST',
      body: JSON.stringify({ storyId }),
    });
  },

  async getUnlockedEndings(): Promise<{ endings: UnlockedEnding[] }> {
    return fetchJson<{ endings: UnlockedEnding[] }>('/api/player/endings');
  },

  async getPlayerStats(): Promise<{
    storiesStarted: number;
    storiesCompleted: number;
    endingsUnlocked: number;
    totalChoicesMade: number;
  }> {
    return fetchJson<{
      storiesStarted: number;
      storiesCompleted: number;
      endingsUnlocked: number;
      totalChoicesMade: number;
    }>('/api/player/stats');
  },

  // --- ADMIN CMS ---
  async getAdminStories(): Promise<(Story & { nodeCount: number; endingCount: number })[]> {
    return fetchJson<(Story & { nodeCount: number; endingCount: number })[]>('/api/admin/stories');
  },

  async createStory(data: {
    title: string;
    description: string;
    thumbnail?: string;
    genre: string;
    tags?: string[];
  }): Promise<{ story: Story; startNode: StoryNode }> {
    return fetchJson<{ story: Story; startNode: StoryNode }>('/api/admin/stories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateStory(
    id: string,
    data: Partial<Pick<Story, 'title' | 'description' | 'thumbnail' | 'genre' | 'tags' | 'visualSettings'>>
  ): Promise<Story> {
    return fetchJson<Story>(`/api/admin/stories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async updateStoryStatus(id: string, status: StoryStatus): Promise<{ story: Story; message: string }> {
    return fetchJson<{ story: Story; message: string }>(`/api/admin/stories/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async deleteStory(id: string): Promise<{ message: string }> {
    return fetchJson<{ message: string }>(`/api/admin/stories/${id}`, {
      method: 'DELETE',
    });
  },

  async createNode(storyId: string, nodeData: Partial<StoryNode>): Promise<StoryNode> {
    return fetchJson<StoryNode>(`/api/admin/stories/${storyId}/nodes`, {
      method: 'POST',
      body: JSON.stringify(nodeData),
    });
  },

  async updateNode(storyId: string, nodeId: string, nodeData: Partial<StoryNode>): Promise<StoryNode> {
    return fetchJson<StoryNode>(`/api/admin/stories/${storyId}/nodes/${nodeId}`, {
      method: 'PUT',
      body: JSON.stringify(nodeData),
    });
  },

  async deleteNode(storyId: string, nodeId: string): Promise<{ message: string }> {
    return fetchJson<{ message: string }>(`/api/admin/stories/${storyId}/nodes/${nodeId}`, {
      method: 'DELETE',
    });
  },

  async createOption(
    nodeId: string,
    optionData: { text: string; nextNodeId?: string; order?: number }
  ): Promise<StoryOption> {
    return fetchJson<StoryOption>(`/api/admin/nodes/${nodeId}/options`, {
      method: 'POST',
      body: JSON.stringify(optionData),
    });
  },

  async updateOption(optionId: string, optionData: Partial<StoryOption>): Promise<StoryOption> {
    return fetchJson<StoryOption>(`/api/admin/options/${optionId}`, {
      method: 'PUT',
      body: JSON.stringify(optionData),
    });
  },

  async deleteOption(optionId: string): Promise<{ message: string }> {
    return fetchJson<{ message: string }>(`/api/admin/options/${optionId}`, {
      method: 'DELETE',
    });
  },

  async getAdminStats(): Promise<AdminStats> {
    return fetchJson<AdminStats>('/api/admin/stats');
  },

  async getAdminUsers(): Promise<User[]> {
    return fetchJson<User[]>('/api/admin/users');
  },

  async updateUserRole(userId: string, role: UserRole): Promise<User> {
    return fetchJson<User>(`/api/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },

  async resetDatabase(): Promise<{ message: string }> {
    return fetchJson<{ message: string }>('/api/admin/reset-database', {
      method: 'POST',
    });
  },
};
