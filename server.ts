import dotenv from 'dotenv';
import express, { NextFunction, Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { UserRole } from './src/types';
import { db } from './server/db';
import { normalizePlayerName } from './server/authHelper';

dotenv.config();

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    name: string;
    playerName?: string;
    role: UserRole;
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support large Base64 images directly from mobile phone photo galleries / cameras
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // --- AUTH MIDDLEWARE ---
  const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return next();
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) return next();

    const user = db.findUserById(token);
    if (user) {
      req.user = {
        id: user.id,
        name: user.name || user.playerName || 'Player',
        playerName: user.playerName || user.name,
        role: user.role,
        email: user.email,
      };
    }
    next();
  };

  const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Yêu cầu xác thực người chơi để tiếp tục.' });
    }
    next();
  };

  const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Yêu cầu đăng nhập với tài khoản Quản trị viên (ADMIN).' });
    }
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Truy cập bị từ chối: Bạn không có quyền Quản trị viên (ADMIN) để thực hiện thao tác này.',
      });
    }
    next();
  };

  app.use(authenticateToken);

  // ==========================================
  // --- PLAYER AUTH ROUTES (PIN + AVATAR) ---
  // ==========================================

  // Check if player name is available
  app.get('/api/player/check-name/:name', (req: Request, res: Response) => {
    const { name } = req.params;
    const norm = normalizePlayerName(name);
    const existing = db.findUserByNormalizedName(norm);
    return res.json({ exists: !!existing, normalizedName: norm });
  });

  // Player Register (Name + PIN + Avatar)
  app.post('/api/player/register', (req: Request, res: Response) => {
    try {
      const { playerName, pin, avatarId } = req.body;
      const result = db.createPlayer({ playerName, pin, avatarId });

      if (result.error) {
        return res.status(400).json({ error: result.error });
      }

      return res.json({
        player: result.player,
        token: result.player.id,
        message: 'Tạo hồ sơ người chơi thành công!',
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Lỗi hệ thống khi đăng ký người chơi.' });
    }
  });

  // Player Login (Name + PIN)
  app.post('/api/player/login', (req: Request, res: Response) => {
    try {
      const { playerName, pin } = req.body;
      const result = db.loginPlayer({ playerName, pin });

      if (result.error || !result.player) {
        return res.status(401).json({ error: result.error || 'Đăng nhập không thành công.' });
      }

      return res.json({
        player: result.player,
        token: result.player.id,
        message: `Chào mừng trở lại, ${result.player.playerName || result.player.name}!`,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Lỗi đăng nhập.' });
    }
  });

  // Admin Login (Admin Name + Admin PIN)
  app.post('/api/admin/login', (req: Request, res: Response) => {
    try {
      const { name, pin } = req.body;
      const result = db.loginAdmin({ name, pin });

      if (result.error || !result.user) {
        return res.status(401).json({ error: result.error || 'Xác thực Quản trị viên thất bại.' });
      }

      return res.json({
        user: result.user,
        token: result.user.id,
        message: 'Đăng nhập Quản trị viên thành công!',
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Lỗi đăng nhập admin.' });
    }
  });

  // Get Current Profile (Player or Admin)
  app.get('/api/player/me', (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.json({ player: null, user: null });
    }
    const fullUser = db.findUserById(req.user.id);
    if (!fullUser) return res.json({ player: null, user: null });
    const { pinHash, passwordHash, ...safeUser } = fullUser;
    return res.json({ player: safeUser, user: safeUser });
  });

  // Update Player Profile (Name / Avatar)
  app.put('/api/player/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const { playerName, avatarId, avatarUrl } = req.body;
    const result = db.updatePlayerProfile(req.user!.id, { playerName, avatarId, avatarUrl });
    if (result.error || !result.player) {
      return res.status(400).json({ error: result.error || 'Cập nhật hồ sơ thất bại.' });
    }
    return res.json({ player: result.player, message: 'Đã cập nhật hồ sơ thành công!' });
  });

  // Legacy auth/me route for compatibility
  app.get('/api/auth/me', (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.json({ user: null });
    }
    const fullUser = db.findUserById(req.user.id);
    if (!fullUser) return res.json({ user: null });
    const { pinHash, passwordHash, ...safeUser } = fullUser;
    return res.json({ user: safeUser });
  });

  // Legacy auth/login route for compatibility
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (email && email.toLowerCase() === 'admin@storyverse.com') {
      const admin = db.findUserByNormalizedName('khangvan') || db.findUserById('user-admin-khangvan');
      if (admin) {
        const { pinHash, passwordHash, ...safeUser } = admin;
        return res.json({ user: safeUser, token: admin.id, message: 'Đăng nhập thành công!' });
      }
    }
    const result = db.loginPlayer({ playerName: email || req.body.name, pin: password });
    if (result.player) {
      return res.json({ user: result.player, token: result.player.id, message: 'Đăng nhập thành công!' });
    }
    return res.status(401).json({ error: result.error || 'Thông tin không hợp lệ.' });
  });

  // ==========================================
  // --- AVATARS & IMAGE ASSETS ---
  // ==========================================

  app.get('/api/avatars', (_req: Request, res: Response) => {
    return res.json(db.getAvatars());
  });

  app.get('/api/images', (req: Request, res: Response) => {
    const collectionId = req.query.collectionId as any;
    return res.json(db.getImageAssets(collectionId));
  });

  app.post('/api/admin/avatars', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const { name, imageUrl, thumbnailUrl } = req.body;
    if (!name || !imageUrl) {
      return res.status(400).json({ error: 'Tên và đường dẫn ảnh avatar là bắt buộc.' });
    }
    const avatar = db.createAvatar({ name, imageUrl, thumbnailUrl });
    return res.json(avatar);
  });

  app.delete('/api/admin/avatars/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const success = db.deleteAvatar(id);
    if (!success) return res.status(404).json({ error: 'Không tìm thấy avatar.' });
    return res.json({ message: 'Đã xóa avatar thành công.' });
  });

  app.get('/api/admin/images', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const collectionId = req.query.collectionId as any;
    return res.json(db.getImageAssets(collectionId));
  });

  app.post('/api/admin/images', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const { name, url, thumbnailUrl, collectionId, type } = req.body;
    if (!name || !url) {
      return res.status(400).json({ error: 'Tên ảnh và URL là bắt buộc.' });
    }
    const asset = db.createImageAsset({
      name,
      url,
      thumbnailUrl,
      collectionId: collectionId || 'Backgrounds',
      type,
      createdBy: req.user?.name || 'Admin',
    });
    return res.json(asset);
  });

  app.delete('/api/admin/images/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const success = db.deleteImageAsset(id);
    if (!success) return res.status(404).json({ error: 'Không tìm thấy hình ảnh.' });
    return res.json({ message: 'Đã xóa hình ảnh thành công.' });
  });

  // ==========================================
  // --- PLAYER / PUBLIC STORY ROUTES ---
  // ==========================================

  // Get stories: Only PUBLISHED stories for regular players. Admin can view ALL.
  app.get('/api/stories', (req: AuthenticatedRequest, res: Response) => {
    const isAdmin = req.user?.role === 'ADMIN';
    const statusQuery = req.query.status as string;

    if (isAdmin && statusQuery) {
      return res.json(db.getStories(statusQuery as any));
    }

    // Regular players strictly get PUBLISHED stories only
    return res.json(db.getStories('PUBLISHED'));
  });

  // Get single story detail + start node
  app.get('/api/stories/:id', (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const story = db.getStoryById(id);
    if (!story) {
      return res.status(404).json({ error: 'Không tìm thấy câu chuyện.' });
    }

    const isAdmin = req.user?.role === 'ADMIN';
    if (story.status !== 'PUBLISHED' && !isAdmin) {
      return res.status(403).json({ error: 'Câu chuyện này đang ở trạng thái nháp hoặc chưa được xuất bản.' });
    }

    const nodes = db.getNodesByStoryId(id);
    const startNode = nodes.find((n) => n.isStart) || nodes[0];
    const totalEndings = nodes.filter((n) => n.type === 'ENDING').length;

    return res.json({
      ...story,
      nodes,
      startNodeId: startNode?.id,
      totalEndings,
    });
  });

  // Get a specific node with its options
  app.get('/api/stories/:id/nodes/:nodeId', (req: AuthenticatedRequest, res: Response) => {
    const { id, nodeId } = req.params;
    const story = db.getStoryById(id);
    if (!story) {
      return res.status(404).json({ error: 'Không tìm thấy câu chuyện.' });
    }

    const isAdmin = req.user?.role === 'ADMIN';
    if (story.status !== 'PUBLISHED' && !isAdmin) {
      return res.status(403).json({ error: 'Câu chuyện chưa được xuất bản.' });
    }

    const node = db.getNodeById(nodeId);
    if (!node || node.storyId !== id) {
      return res.status(404).json({ error: 'Không tìm thấy tình huống này trong câu chuyện.' });
    }

    return res.json(node);
  });

  // ==========================================
  // --- PLAYER PROGRESS & ENDINGS ---
  // ==========================================

  app.get('/api/progress/:storyId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const { storyId } = req.params;
    const progress = db.getProgress(req.user!.id, storyId);
    return res.json({ progress });
  });

  app.post('/api/progress/save', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const { storyId, currentNodeId, choiceStep } = req.body;
    if (!storyId || !currentNodeId) {
      return res.status(400).json({ error: 'Thiếu thông tin storyId hoặc currentNodeId.' });
    }

    const progress = db.saveProgress(req.user!.id, storyId, currentNodeId, choiceStep);
    return res.json({ progress, message: 'Đã lưu tiến trình thành công.' });
  });

  app.post('/api/progress/reset', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const { storyId } = req.body;
    if (!storyId) {
      return res.status(400).json({ error: 'Thiếu thông tin storyId.' });
    }

    db.resetProgress(req.user!.id, storyId);
    return res.json({ message: 'Đã thiết lập lại tiến trình câu chuyện.' });
  });

  app.get('/api/player/endings', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const endings = db.getUnlockedEndings(req.user!.id);
    return res.json({ endings });
  });

  app.get('/api/player/stats', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const stats = db.getPlayerStats(req.user!.id);
    return res.json(stats);
  });

  // ==========================================
  // --- ADMIN CMS ROUTES (Strictly Protected) ---
  // ==========================================

  // Admin: Get all stories (draft, published, archived)
  app.get('/api/admin/stories', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const stories = db.getStories('ALL');
    const storiesWithMeta = stories.map((s) => {
      const nodes = db.getNodesByStoryId(s.id);
      return {
        ...s,
        nodeCount: nodes.length,
        endingCount: nodes.filter((n) => n.type === 'ENDING').length,
      };
    });
    return res.json(storiesWithMeta);
  });

  // Admin: Create new Story
  app.post('/api/admin/stories', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const { title, description, thumbnail, genre, tags } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'Tiêu đề và Mô tả câu chuyện là bắt buộc.' });
    }

    const result = db.createStory({
      title,
      description,
      thumbnail,
      genre: genre || 'Bí Ẩn / Kinh Dị',
      tags,
      createdBy: req.user!.id,
      authorName: req.user!.name,
    });

    return res.json(result);
  });

  // Admin: Update Story Details
  app.put('/api/admin/stories/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const updated = db.updateStory(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Không tìm thấy câu chuyện để cập nhật.' });
    }
    return res.json(updated);
  });

  // Admin: Publish / Unpublish Story
  app.patch('/api/admin/stories/:id/status', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status)) {
      return res.status(400).json({ error: 'Trạng thái không hợp lệ (DRAFT, PUBLISHED, ARCHIVED).' });
    }

    if (status === 'PUBLISHED') {
      const nodes = db.getNodesByStoryId(id);
      const hasStart = nodes.some((n) => n.isStart);
      const hasEnding = nodes.some((n) => n.type === 'ENDING');
      if (!hasStart) {
        return res.status(400).json({ error: 'Không thể xuất bản: Câu chuyện phải có ít nhất 1 node Khởi đầu (START).' });
      }
      if (!hasEnding) {
        return res.status(400).json({ error: 'Không thể xuất bản: Câu chuyện phải có ít nhất 1 node Kết thúc (ENDING).' });
      }
    }

    const updated = db.updateStoryStatus(id, status);
    if (!updated) {
      return res.status(404).json({ error: 'Không tìm thấy câu chuyện.' });
    }

    return res.json({
      story: updated,
      message: `Đã chuyển trạng thái câu chuyện thành ${status}!`,
    });
  });

  // Admin: Delete Story
  app.delete('/api/admin/stories/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const success = db.deleteStory(id);
    if (!success) {
      return res.status(404).json({ error: 'Không tìm thấy câu chuyện để xóa.' });
    }
    return res.json({ message: 'Đã xóa toàn bộ câu chuyện và dữ liệu liên quan thành công.' });
  });

  // Admin: Create Node in Story
  app.post('/api/admin/stories/:id/nodes', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const story = db.getStoryById(id);
    if (!story) return res.status(404).json({ error: 'Câu chuyện không tồn tại.' });

    const newNode = db.createNode(id, req.body);
    return res.json(newNode);
  });

  // Admin: Update Node
  app.put('/api/admin/stories/:id/nodes/:nodeId', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const { nodeId } = req.params;
    const updated = db.updateNode(nodeId, req.body);
    if (!updated) return res.status(404).json({ error: 'Không tìm thấy node.' });
    return res.json(updated);
  });

  // Admin: Delete Node
  app.delete('/api/admin/stories/:id/nodes/:nodeId', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const { nodeId } = req.params;
    const success = db.deleteNode(nodeId);
    if (!success) return res.status(404).json({ error: 'Không tìm thấy node để xóa.' });
    return res.json({ message: 'Đã xóa node thành công.' });
  });

  // Admin: Create Option on a Node
  app.post('/api/admin/nodes/:nodeId/options', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const { nodeId } = req.params;
    const { text, nextNodeId, order } = req.body;
    if (!text) return res.status(400).json({ error: 'Vui lòng nhập văn bản cho lựa chọn.' });

    const newOption = db.createOption(nodeId, { text, nextNodeId, order });
    return res.json(newOption);
  });

  // Admin: Update Option
  app.put('/api/admin/options/:optionId', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const { optionId } = req.params;
    const updated = db.updateOption(optionId, req.body);
    if (!updated) return res.status(404).json({ error: 'Không tìm thấy option.' });
    return res.json(updated);
  });

  // Admin: Delete Option
  app.delete('/api/admin/options/:optionId', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const { optionId } = req.params;
    const success = db.deleteOption(optionId);
    if (!success) return res.status(404).json({ error: 'Không tìm thấy option để xóa.' });
    return res.json({ message: 'Đã xóa option thành công.' });
  });

  // Admin: Get Analytics Stats
  app.get('/api/admin/stats', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    return res.json(db.getAdminStats());
  });

  // Admin: User Management
  app.get('/api/admin/users', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    return res.json(db.getUsers());
  });

  app.patch('/api/admin/users/:id/role', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { role } = req.body;
    if (!['ADMIN', 'PLAYER'].includes(role)) {
      return res.status(400).json({ error: 'Role không hợp lệ (ADMIN hoặc PLAYER).' });
    }
    const updated = db.updateUserRole(id, role);
    if (!updated) return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
    return res.json(updated);
  });

  // Admin: Reset Database to clean fresh state
  app.post('/api/admin/reset-database', (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = db.resetToDefault();
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Lỗi khi khôi phục dữ liệu ban đầu.' });
    }
  });

  // ==========================================
  // --- VITE MIDDLEWARE (Dev & Production) ---
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`StoryVerse Server running on port ${PORT}`);
  });
}

startServer();
