import { Router, Request, Response } from 'express';
import { Blog } from '../models/Blog';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';
import fs from 'fs';
import path from 'path';

export const blogRouter = Router();

/**
 * POST /api/blogs/upload-image or /api/create-blog/upload-image
 * Dedicated API to host uploaded image files (Admin Only).
 * Accepts { image: "data:image/...", filename: "photo.jpg" }
 * Saves to public/uploads/ and returns { success: true, url: "/uploads/..." }
 */
blogRouter.post(['/upload-image', '/create-blog/upload-image'], authenticateToken, requireRole('super_admin', 'branch_admin'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { image, filename } = req.body;
    if (!image) {
      res.status(400).json({ success: false, message: 'Image data is required.' });
      return;
    }

    if (image.startsWith('http://') || image.startsWith('https://')) {
      res.status(200).json({ success: true, url: image });
      return;
    }

    const matches = image.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (!matches) {
      res.status(400).json({ success: false, message: 'Invalid image format. Expected base64 data URI.' });
      return;
    }

    const rawExt = matches[1].toLowerCase();
    const ext = rawExt === 'jpeg' ? 'jpg' : rawExt.replace(/[^a-z0-9]/g, '') || 'png';
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    const cleanBaseName = filename 
      ? filename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40)
      : 'blog_image';
    const uniqueFileName = `${cleanBaseName}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, uniqueFileName);
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${uniqueFileName}`;
    res.status(200).json({
      success: true,
      url: publicUrl,
      message: 'Image successfully uploaded and hosted.'
    });
  } catch (error: any) {
    console.error('Error saving uploaded blog image:', error);
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to save blog image.'
    });
  }
});

/**
 * POST /api/create-blog or /api/blogs/create-blog
 * Dedicated API for Blog Creation Dashboard (Admin Only)
 */
blogRouter.post(['/create-blog', '/'], authenticateToken, requireRole('super_admin', 'branch_admin'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      id,
      title,
      subtitle,
      content,
      coverImage,
      coverImageCaption,
      tags,
      featured,
      status,
      videoUrl,
      authorId,
      authorName,
      authorRole,
      authorAvatar,
      authorBio,
    } = req.body;

    if (!title || !title.trim()) {
      res.status(400).json({
        success: false,
        message: 'Blog title is required.',
      });
      return;
    }

    const blogId = id || `blog_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const wordCount = (title + ' ' + (subtitle || '') + ' ' + (content || '')).trim().split(/\s+/).filter(Boolean).length;
    const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

    // Upsert blog in database
    const updatedBlog = await Blog.findOneAndUpdate(
      { id: blogId },
      {
        id: blogId,
        title: title.trim(),
        subtitle: subtitle ? subtitle.trim() : '',
        content: content || '',
        coverImage: coverImage || '',
        coverImageCaption: coverImageCaption || '',
        tags: Array.isArray(tags) && tags.length > 0 ? tags : ['General'],
        featured: Boolean(featured),
        status: status === 'published' ? 'published' : 'draft',
        videoUrl: videoUrl || '',
        authorId: authorId || 'admin_super_1',
        authorName: authorName || 'Priyanka (Super Admin)',
        authorRole: authorRole || 'Super Admin • Chief Academic Officer',
        authorAvatar: authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        authorBio: authorBio || 'Physics Honours & IT Specialist. Founder at Veyra.',
        readTimeMinutes,
        publishedAt: status === 'published' ? new Date().toISOString() : undefined,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({
      success: true,
      message: `Blog "${updatedBlog.title}" successfully created and saved.`,
      blog: updatedBlog,
    });
  } catch (error: any) {
    console.error('Error creating blog:', error);
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to create blog post on server.',
    });
  }
});

/**
 * GET /api/blogs
 * Fetch all blogs (supports ?status=published or all for super admin)
 */
blogRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, tag } = req.query;
    const query: any = {};
    if (status) query.status = status;
    if (tag) query.tags = tag;

    const blogs = await Blog.find(query).sort({ featured: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: blogs.length,
      blogs,
    });
  } catch (error: any) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to fetch blogs.',
    });
  }
});

/**
 * GET /api/blogs/:id
 */
blogRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const blog = await Blog.findOne({ id: req.params.id });
    if (!blog) {
      res.status(404).json({
        success: false,
        message: 'Blog post not found.',
      });
      return;
    }
    res.status(200).json({
      success: true,
      blog,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to fetch blog post.',
    });
  }
});

/**
 * POST /api/blogs/:id/clap
 * Increment claps
 */
blogRouter.post('/:id/clap', async (req: Request, res: Response): Promise<void> => {
  try {
    const blog = await Blog.findOneAndUpdate(
      { id: req.params.id },
      { $inc: { claps: 1 } },
      { new: true }
    );
    if (!blog) {
      res.status(404).json({ success: false, message: 'Blog not found' });
      return;
    }
    res.status(200).json({ success: true, claps: blog.claps });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Failed to clap' });
  }
});

/**
 * DELETE /api/blogs/:id (Admin Only)
 */
blogRouter.delete('/:id', authenticateToken, requireRole('super_admin', 'branch_admin'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const deleted = await Blog.findOneAndDelete({ id: req.params.id });
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Blog not found' });
      return;
    }
    res.status(200).json({ success: true, message: 'Blog deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Failed to delete blog' });
  }
});
