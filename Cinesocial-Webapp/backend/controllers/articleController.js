const { poolPromise, sql } = require('../config/db');

// ─────────────────────────────────────────────────────────────
// Helper: generate a URL-safe slug from a title string
// ─────────────────────────────────────────────────────────────
function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')   // strip special chars
    .replace(/\s+/g, '-')           // spaces → hyphens
    .replace(/-+/g, '-')            // collapse multiple hyphens
    .substring(0, 210);             // hard cap at 210 chars
}

// ─────────────────────────────────────────────────────────────
// Helper: check if requesting user holds a Cinephile subscription
// Returns true if plan_name = 'Cinephile' AND sub_exp > now.
// ─────────────────────────────────────────────────────────────
async function isCinephile(pool, userId) {
  const result = await pool.request()
    .input('userId', sql.Int, userId)
    .query(`
      SELECT s.Plan_Name, s.Has_Profile_Flair, u.sub_exp
      FROM Users u
      LEFT JOIN Subscriptions s ON u.sub_ID = s.Subscription_ID
      WHERE u.User_ID = @userId
    `);

  if (result.recordset.length === 0) return false;
  const row = result.recordset[0];

  // Accept either Cinephile plan name OR Has_Profile_Flair flag
  const isPremium =
    (row.Plan_Name === 'Cinephile' || row.Has_Profile_Flair === true) &&
    row.sub_exp &&
    new Date(row.sub_exp) > new Date();

  return isPremium;
}

// ─────────────────────────────────────────────────────────────
// PUBLIC — GET /api/articles
// Query params: ?category=ESSAY&limit=10&page=1
// Returns all approved articles from vw_PublishedArticles
// ─────────────────────────────────────────────────────────────
exports.getPublishedArticles = async (req, res) => {
  const { category, limit = 12, page = 1 } = req.query;
  const pageSize = Math.min(parseInt(limit, 10) || 12, 50);
  const offset   = (Math.max(parseInt(page, 10) || 1, 1) - 1) * pageSize;

  try {
    const pool = await poolPromise;
    let query = `
      SELECT
        Article_ID, Author_ID, Title, Slug, Body,
        Cover_Image_URL, Status, Movie_ID, Category,
        Created_At, Published_At, Updated_At, View_Count,
        Username, flair_label, Movie_Title
      FROM vw_PublishedArticles
    `;

    const params = {};
    if (category) {
      query += ` WHERE Category = @category`;
      params.category = category.toUpperCase();
    }

    query += ` ORDER BY Published_At DESC
               OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`;

    const req2 = pool.request()
      .input('offset',   sql.Int, offset)
      .input('pageSize', sql.Int, pageSize);

    if (params.category) {
      req2.input('category', sql.VarChar, params.category);
    }

    const result = await req2.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error('getPublishedArticles:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────
// PUBLIC — GET /api/articles/:slug
// Returns single approved article; increments View_Count.
// Also returns up to 3 related articles (same category or movie).
// ─────────────────────────────────────────────────────────────
exports.getArticleBySlug = async (req, res) => {
  const { slug } = req.params;

  try {
    const pool = await poolPromise;

    // Fetch the article
    const result = await pool.request()
      .input('slug', sql.VarChar, slug)
      .query(`
        SELECT
          Article_ID, Author_ID, Title, Slug, Body,
          Cover_Image_URL, Status, Movie_ID, Category,
          Created_At, Published_At, Updated_At, View_Count,
          Username, flair_label, Movie_Title
        FROM vw_PublishedArticles
        WHERE Slug = @slug
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Article not found.' });
    }

    const article = result.recordset[0];

    // Increment View_Count (fire-and-forget; do not await in critical path)
    pool.request()
      .input('articleId', sql.Int, article.Article_ID)
      .query(`UPDATE Articles SET View_Count = View_Count + 1 WHERE Article_ID = @articleId`)
      .catch(e => console.warn('View count update failed:', e.message));

    // Fetch related articles (same category or same movie, exclude self)
    const relatedResult = await pool.request()
      .input('category',  sql.VarChar, article.Category)
      .input('movieId',   sql.Int,     article.Movie_ID || 0)
      .input('articleId', sql.Int,     article.Article_ID)
      .query(`
        SELECT TOP 3
          Article_ID, Title, Slug, Cover_Image_URL, Category,
          Published_At, Username, flair_label, View_Count,
          LEFT(CAST(Body AS VARCHAR(MAX)), 120) AS Excerpt
        FROM vw_PublishedArticles
        WHERE Article_ID <> @articleId
          AND (Category = @category OR (Movie_ID = @movieId AND @movieId <> 0))
        ORDER BY Published_At DESC
      `);

    res.json({ article, related: relatedResult.recordset });
  } catch (err) {
    console.error('getArticleBySlug:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────
// CINEPHILE AUTH — POST /api/articles
// Body: { title, body, cover_image_url, movie_id, category }
// Gates on Cinephile plan; auto-generates slug; status = 'pending'
// ─────────────────────────────────────────────────────────────
exports.createArticle = async (req, res) => {
  const userId = req.user.userId;
  const { title, body, cover_image_url, movie_id, category, is_nsfw } = req.body;

  // Validate required fields
  if (!title || !body || !category) {
    return res.status(400).json({ message: 'title, body, and category are required.' });
  }

  const validCategories = ['REVIEW', 'ESSAY', 'EDITORIAL', 'ANALYSIS', 'HOT TAKE'];
  if (!validCategories.includes(category.toUpperCase())) {
    return res.status(400).json({
      message: `category must be one of: ${validCategories.join(', ')}`
    });
  }

  try {
    const pool = await poolPromise;

    // ── Cinephile gate ──
    const cinephile = await isCinephile(pool, userId);
    if (!cinephile) {
      return res.status(403).json({ message: 'Upgrade to Cinephile to publish articles.' });
    }

    // ── Generate unique slug ──
    let baseSlug = slugify(title);
    let slug = baseSlug;
    let attempt = 0;

    while (true) {
      const exists = await pool.request()
        .input('slug', sql.VarChar, slug)
        .query(`SELECT 1 FROM Articles WHERE Slug = @slug`);
      if (exists.recordset.length === 0) break;
      attempt += 1;
      slug = `${baseSlug}-${attempt}`;
    }

    // ── Insert article ──
    const insertResult = await pool.request()
      .input('authorId',      sql.Int,          userId)
      .input('title',         sql.VarChar(200),  title)
      .input('slug',          sql.VarChar(220),  slug)
      .input('body',          sql.VarChar(sql.MAX), body)
      .input('coverImageUrl', sql.VarChar(255),  cover_image_url || null)
      .input('movieId',       sql.Int,           movie_id || null)
      .input('category',      sql.VarChar(50),   category.toUpperCase())
      .input('isNsfw',        sql.Bit,           is_nsfw ? 1 : 0)
      .query(`
        INSERT INTO Articles
          (Author_ID, Title, Slug, Body, Cover_Image_URL, Movie_ID, Category, Status, Is_NSFW)
        OUTPUT INSERTED.Article_ID, INSERTED.Slug, INSERTED.Status, INSERTED.Created_At
        VALUES
          (@authorId, @title, @slug, @body, @coverImageUrl, @movieId, @category, 'pending', @isNsfw)
      `);

    const newArticle = insertResult.recordset[0];
    res.status(201).json({
      message: 'Article submitted for review.',
      article: { ...newArticle, title, category: category.toUpperCase() }
    });
  } catch (err) {
    console.error('createArticle:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────
// CINEPHILE AUTH — GET /api/articles/my-articles
// Returns all articles by the logged-in user, any status
// ─────────────────────────────────────────────────────────────
exports.getMyArticles = async (req, res) => {
  const userId = req.user.userId;

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT
          a.Article_ID, a.Title, a.Slug, a.Category, a.Status,
          a.Rejection_Note, a.Cover_Image_URL, a.Movie_ID,
          a.Created_At, a.Published_At, a.Updated_At, a.View_Count,
          LEFT(CAST(a.Body AS VARCHAR(MAX)), 200) AS Excerpt
        FROM Articles a
        WHERE a.Author_ID = @userId
        ORDER BY a.Created_At DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error('getMyArticles:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────
// CINEPHILE AUTH — PUT /api/articles/:id
// Author can edit only their own pending or rejected articles
// ─────────────────────────────────────────────────────────────
exports.updateArticle = async (req, res) => {
  const userId    = req.user.userId;
  const articleId = parseInt(req.params.id, 10);
  const { title, body, cover_image_url, movie_id, category } = req.body;

  try {
    const pool = await poolPromise;

    // Fetch article and verify ownership + editability
    const check = await pool.request()
      .input('articleId', sql.Int, articleId)
      .query(`SELECT Author_ID, Status FROM Articles WHERE Article_ID = @articleId`);

    if (check.recordset.length === 0) {
      return res.status(404).json({ message: 'Article not found.' });
    }

    const art = check.recordset[0];

    if (art.Author_ID !== userId) {
      return res.status(403).json({ message: 'You can only edit your own articles.' });
    }

    if (art.Status === 'approved') {
      return res.status(403).json({ message: 'Published articles cannot be edited.' });
    }

    // Build dynamic SET clause
    const fields = [];
    const request = pool.request().input('articleId', sql.Int, articleId);

    if (title) {
      fields.push('Title = @title');
      request.input('title', sql.VarChar(200), title);

      // Regenerate slug only on title change
      let baseSlug = slugify(title);
      let slug = baseSlug;
      let attempt = 0;
      while (true) {
        const exists = await pool.request()
          .input('slug', sql.VarChar, slug)
          .input('articleId', sql.Int, articleId)
          .query(`SELECT 1 FROM Articles WHERE Slug = @slug AND Article_ID <> @articleId`);
        if (exists.recordset.length === 0) break;
        attempt += 1;
        slug = `${baseSlug}-${attempt}`;
      }
      fields.push('Slug = @slug');
      request.input('slug', sql.VarChar(220), slug);
    }
    if (body)            { fields.push('Body = @body');                   request.input('body',          sql.VarChar(sql.MAX), body); }
    if (cover_image_url !== undefined) { fields.push('Cover_Image_URL = @coverImg'); request.input('coverImg',      sql.VarChar(255),    cover_image_url || null); }
    if (movie_id !== undefined)        { fields.push('Movie_ID = @movieId');          request.input('movieId',       sql.Int,             movie_id || null); }
    if (category)        { fields.push('Category = @category');           request.input('category',      sql.VarChar(50),     category.toUpperCase()); }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'No fields to update.' });
    }

    // Editing a rejected article re-queues it as pending
    if (art.Status === 'rejected') {
      fields.push("Status = 'pending'", 'Rejection_Note = NULL');
    }

    fields.push('Updated_At = GETDATE()');

    await request.query(`UPDATE Articles SET ${fields.join(', ')} WHERE Article_ID = @articleId`);
    res.json({ message: 'Article updated successfully.' });
  } catch (err) {
    console.error('updateArticle:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────
// CINEPHILE AUTH — DELETE /api/articles/:id
// Author can delete their own article only
// ─────────────────────────────────────────────────────────────
exports.deleteArticle = async (req, res) => {
  const userId    = req.user.userId;
  const articleId = parseInt(req.params.id, 10);

  try {
    const pool = await poolPromise;

    const check = await pool.request()
      .input('articleId', sql.Int, articleId)
      .query(`SELECT Author_ID FROM Articles WHERE Article_ID = @articleId`);

    if (check.recordset.length === 0) {
      return res.status(404).json({ message: 'Article not found.' });
    }

    if (check.recordset[0].Author_ID !== userId) {
      return res.status(403).json({ message: 'You can only delete your own articles.' });
    }

    await pool.request()
      .input('articleId', sql.Int, articleId)
      .query(`DELETE FROM Articles WHERE Article_ID = @articleId`);

    res.json({ message: 'Article deleted.' });
  } catch (err) {
    console.error('deleteArticle:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN — GET /api/admin/articles/pending
// Returns all pending articles ordered oldest-first (FIFO review queue)
// ─────────────────────────────────────────────────────────────
exports.getPendingArticles = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT
        a.Article_ID, a.Title, a.Slug, a.Category, a.Status,
        a.Cover_Image_URL, a.Movie_ID, a.Created_At, a.Updated_At,
        u.Username, u.flair_label,
        LEFT(CAST(a.Body AS VARCHAR(MAX)), 300) AS Excerpt
      FROM Articles a
      JOIN Users u ON a.Author_ID = u.User_ID
      WHERE a.Status = 'pending'
      ORDER BY a.Created_At ASC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('getPendingArticles:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN — POST /api/admin/articles/:id/approve
// Calls sp_PublishArticle; logs action in Activity
// ─────────────────────────────────────────────────────────────
exports.approveArticle = async (req, res) => {
  const articleId = parseInt(req.params.id, 10);
  const adminId   = req.admin.adminId;

  try {
    const pool = await poolPromise;

    // Confirm article exists and is pending
    const check = await pool.request()
      .input('articleId', sql.Int, articleId)
      .query(`SELECT Status FROM Articles WHERE Article_ID = @articleId`);

    if (check.recordset.length === 0) {
      return res.status(404).json({ message: 'Article not found.' });
    }
    if (check.recordset[0].Status !== 'pending') {
      return res.status(400).json({ message: 'Only pending articles can be approved.' });
    }

    await pool.request()
      .input('articleId', sql.Int, articleId)
      .input('adminId',   sql.Int, adminId)
      .execute('sp_PublishArticle');

    res.json({ message: 'Article approved and published.' });
  } catch (err) {
    console.error('approveArticle:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN — POST /api/admin/articles/:id/reject
// Body: { rejection_note }
// Sets Status = 'rejected'; stores admin note; does NOT delete
// ─────────────────────────────────────────────────────────────
exports.rejectArticle = async (req, res) => {
  const articleId     = parseInt(req.params.id, 10);
  const { rejection_note } = req.body;

  if (!rejection_note || !rejection_note.trim()) {
    return res.status(400).json({ message: 'rejection_note is required.' });
  }

  try {
    const pool = await poolPromise;

    const check = await pool.request()
      .input('articleId', sql.Int, articleId)
      .query(`SELECT Status FROM Articles WHERE Article_ID = @articleId`);

    if (check.recordset.length === 0) {
      return res.status(404).json({ message: 'Article not found.' });
    }
    if (check.recordset[0].Status !== 'pending') {
      return res.status(400).json({ message: 'Only pending articles can be rejected.' });
    }

    await pool.request()
      .input('articleId',     sql.Int,           articleId)
      .input('rejectionNote', sql.VarChar(sql.MAX), rejection_note.trim())
      .query(`
        UPDATE Articles
        SET Status         = 'rejected',
            Rejection_Note = @rejectionNote,
            Updated_At     = GETDATE()
        WHERE Article_ID = @articleId
      `);

    res.json({ message: 'Article rejected. Author will see the note.' });
  } catch (err) {
    console.error('rejectArticle:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────
// COMMENTS — GET /api/articles/:slug/comments
// ─────────────────────────────────────────────────────────────
exports.getComments = async (req, res) => {
  const { slug } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('slug', sql.VarChar, slug)
      .query(`
        SELECT c.Comment_ID, c.Comment_Text, c.Created_At, u.Username, u.flair_label, u.Profile_Pic_URL
        FROM Article_Comments c
        JOIN Articles a ON c.Article_ID = a.Article_ID
        JOIN Users u ON c.User_ID = u.User_ID
        WHERE a.Slug = @slug
        ORDER BY c.Created_At DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error('getComments:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────
// COMMENTS — POST /api/articles/:slug/comments
// ─────────────────────────────────────────────────────────────
exports.addComment = async (req, res) => {
  const { slug } = req.params;
  const { text } = req.body;
  const userId = req.user.userId;
  
  if (!text || !text.trim()) {
    return res.status(400).json({ message: 'Comment text is required.' });
  }

  try {
    const pool = await poolPromise;
    const articleRes = await pool.request()
      .input('slug', sql.VarChar, slug)
      .query(`SELECT Article_ID FROM Articles WHERE Slug = @slug`);
      
    if (articleRes.recordset.length === 0) {
      return res.status(404).json({ message: 'Article not found.' });
    }
    
    const articleId = articleRes.recordset[0].Article_ID;
    
    const insertRes = await pool.request()
      .input('articleId', sql.Int, articleId)
      .input('userId', sql.Int, userId)
      .input('text', sql.VarChar(sql.MAX), text.trim())
      .query(`
        INSERT INTO Article_Comments (Article_ID, User_ID, Comment_Text)
        OUTPUT INSERTED.Comment_ID, INSERTED.Comment_Text, INSERTED.Created_At
        VALUES (@articleId, @userId, @text)
      `);
      
    // Fetch the user's details to return the full comment object
    const userRes = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`SELECT Username, flair_label, Profile_Pic_URL FROM Users WHERE User_ID = @userId`);
      
    const newComment = {
      ...insertRes.recordset[0],
      ...userRes.recordset[0]
    };

    res.status(201).json({ message: 'Comment added', comment: newComment });
  } catch (err) {
    console.error('addComment:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
