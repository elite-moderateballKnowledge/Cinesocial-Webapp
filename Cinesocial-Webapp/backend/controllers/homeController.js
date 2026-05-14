const { poolPromise, sql } = require('../config/db');
const { normalizeMoviePoster } = require('../utils/mediaAssets');

// ─────────────────────────────────────────────────────────────
// Helper: parse genres string → array
// vw_MovieSummary returns genres as comma-separated string
// ─────────────────────────────────────────────────────────────
function parseGenres(row) {
  if (!row) return [];
  const raw = row.genres ?? row.Genres ?? '';
  if (!raw) return [];
  return String(raw).split(',').map(g => g.trim()).filter(Boolean);
}

// ─────────────────────────────────────────────────────────────
// Helper: normalise a raw movie row into the homepage shape
// ─────────────────────────────────────────────────────────────
function toMovieShape(row) {
  const m = normalizeMoviePoster(row);
  return {
    movie_id:     m.Movie_ID   ?? m.movie_id,
    title:        m.Title      ?? m.title,
    release_date: m.Release_date ?? m.release_date,
    poster_url:   m.Poster_URL  ?? m.poster_url,
    avg_rating:   m.A_Rating   ?? m.avg_rating ?? m.average_rating ?? null,
    genres:       parseGenres(m),
  };
}

// ─────────────────────────────────────────────────────────────
// Helper: normalise a raw article row
// ─────────────────────────────────────────────────────────────
function toArticleShape(row) {
  if (!row) return null;
  const body = row.Body ?? row.body ?? '';
  return {
    article_id:      row.Article_ID  ?? row.article_id,
    slug:            row.Slug        ?? row.slug,
    title:           row.Title       ?? row.title,
    category:        row.Category    ?? row.category,
    author_username: row.Username    ?? row.author_username,
    author_flair:    row.flair_label ?? row.author_flair ?? null,
    cover_image_url: row.Cover_Image_URL ?? row.cover_image_url ?? null,
    excerpt:         String(body).replace(/\n/g, ' ').substring(0, 150),
    published_at:    row.Published_At ?? row.published_at,
  };
}

// ─────────────────────────────────────────────────────────────
// GET /api/home
// Returns all homepage sections in one network round-trip.
// All sub-queries run in parallel via Promise.all.
// ─────────────────────────────────────────────────────────────
exports.getHomepage = async (req, res) => {
  try {
    const pool = await poolPromise;

    const [
      featuredRows,
      trendingRows,
      latestArticleRows,
      newListRows,
      editorialRows,
      topRatedRows,
      topByGenreRows,
      newReleaseRows,
    ] = await Promise.all([

      // ── featured: highest rated movie that has a poster ──
      pool.request().query(`
        SELECT TOP 1
          m.Movie_ID, m.Title, m.Release_date, m.Poster_URL,
          m.A_Rating AS avg_rating, m.Synopsis,
          (SELECT STRING_AGG(g.G_Name, ', ')
           FROM M_Genres mg JOIN Genres g ON mg.G_ID = g.G_ID
           WHERE mg.M_ID = m.Movie_ID) AS genres
        FROM Movies m
        WHERE m.Poster_URL IS NOT NULL
          AND m.Poster_URL NOT LIKE '%example.com%'
          AND m.A_Rating IS NOT NULL
        ORDER BY m.A_Rating DESC
      `).then(r => r.recordset),

      // ── trending: 8 movies with most reviews recently ──
      pool.request().query(`
        SELECT TOP 8
          m.Movie_ID, m.Title, m.Release_date, m.Poster_URL,
          m.A_Rating AS avg_rating,
          (SELECT STRING_AGG(g.G_Name, ', ')
           FROM M_Genres mg JOIN Genres g ON mg.G_ID = g.G_ID
           WHERE mg.M_ID = m.Movie_ID) AS genres,
          COUNT(a.Activity_ID) AS recent_review_count
        FROM Movies m
        LEFT JOIN Activity a ON m.Movie_ID = a.Movie_ID
          AND a.Action_Type = 'REVIEW'
          AND a.Time_stamp >= DATEADD(day, -90, GETDATE())
        GROUP BY m.Movie_ID, m.Title, m.Release_date, m.Poster_URL, m.A_Rating
        ORDER BY recent_review_count DESC, m.A_Rating DESC
      `).then(r => r.recordset),

      // ── latest_articles: 4 most recently published ──
      pool.request().query(`
        SELECT TOP 4
          Article_ID, Slug, Title, Category, Body,
          Cover_Image_URL, Published_At, Username, flair_label
        FROM vw_PublishedArticles
        ORDER BY Published_At DESC
      `).then(r => r.recordset).catch(() => []),

      // ── new_lists: 6 most recently created public lists ──
      pool.request().query(`
        SELECT TOP 6
          l.List_ID, l.List_Title, u.Username AS owner_username,
          u.flair_label AS owner_flair,
          (SELECT COUNT(*) FROM ListMovies lm WHERE lm.L_ID = l.List_ID) AS movie_count,
          l.Created_At
        FROM Lists l
        JOIN Users u ON l.U_ID = u.User_ID
        WHERE l.is_public = 1 AND l.is_watchlist = 0
        ORDER BY l.Created_At DESC
      `).then(r => r.recordset).catch(() => []),

      // ── editorial_pick: most recent EDITORIAL article ──
      pool.request().query(`
        SELECT TOP 1
          Article_ID, Slug, Title, Category, Body,
          Cover_Image_URL, Published_At, Username, flair_label
        FROM vw_PublishedArticles
        WHERE Category = 'EDITORIAL'
        ORDER BY Published_At DESC
      `).then(r => r.recordset).catch(() => []),

      // ── top_rated: 5 all-time highest rated movies ──
      pool.request().query(`
        SELECT TOP 10
          m.Movie_ID, m.Title, m.Release_date, m.Poster_URL,
          m.A_Rating AS avg_rating,
          (SELECT STRING_AGG(g.G_Name, ', ')
           FROM M_Genres mg JOIN Genres g ON mg.G_ID = g.G_ID
           WHERE mg.M_ID = m.Movie_ID) AS genres
        FROM Movies m
        WHERE m.A_Rating IS NOT NULL
        ORDER BY m.A_Rating DESC
      `).then(r => r.recordset),

      pool.request().query(`
        WITH RankedGenreMovies AS (
          SELECT
            g.G_ID AS genre_id,
            g.G_Name AS genre_name,
            m.Movie_ID,
            m.Title,
            m.Release_date,
            m.Poster_URL,
            m.A_Rating AS avg_rating,
            COUNT(*) OVER (PARTITION BY g.G_ID) AS genre_movie_count,
            ROW_NUMBER() OVER (
              PARTITION BY g.G_ID
              ORDER BY m.A_Rating DESC, m.Release_date DESC, m.Movie_ID DESC
            ) AS genre_rank,
            (SELECT STRING_AGG(g2.G_Name, ', ')
             FROM M_Genres mg2 JOIN Genres g2 ON mg2.G_ID = g2.G_ID
             WHERE mg2.M_ID = m.Movie_ID) AS genres
          FROM Genres g
          JOIN M_Genres mg ON g.G_ID = mg.G_ID
          JOIN Movies m ON mg.M_ID = m.Movie_ID
          WHERE m.A_Rating IS NOT NULL
        )
        SELECT TOP 5
          genre_id, genre_name, Movie_ID, Title, Release_date,
          Poster_URL, avg_rating, genre_movie_count, genres
        FROM RankedGenreMovies
        WHERE genre_rank = 1
        ORDER BY avg_rating DESC, genre_movie_count DESC, genre_name ASC
      `).then(r => r.recordset),

      pool.request().query(`
        SELECT TOP 8
          m.Movie_ID, m.Title, m.Release_date, m.Poster_URL,
          m.A_Rating AS avg_rating,
          (SELECT STRING_AGG(g.G_Name, ', ')
           FROM M_Genres mg JOIN Genres g ON mg.G_ID = g.G_ID
           WHERE mg.M_ID = m.Movie_ID) AS genres
        FROM Movies m
        WHERE m.Release_date IS NOT NULL
        ORDER BY m.Release_date DESC, m.Movie_ID DESC
      `).then(r => r.recordset),
    ]);

    // ── Enrich lists with up to 4 preview poster URLs ──
    const newLists = await Promise.all(
      newListRows.map(async listRow => {
        let preview_posters = [];
        try {
          const postersResult = await pool.request()
            .input('listId', sql.Int, listRow.List_ID)
            .query(`
              SELECT TOP 4 m.Poster_URL
              FROM ListMovies lm
              JOIN Movies m ON lm.M_ID = m.Movie_ID
              WHERE lm.L_ID = @listId
                AND m.Poster_URL IS NOT NULL
                AND m.Poster_URL NOT LIKE '%example.com%'
              ORDER BY lm.L_ID
            `);
          preview_posters = postersResult.recordset
            .map(r => normalizeMoviePoster({ Poster_URL: r.Poster_URL, Title: '' }).Poster_URL)
            .filter(Boolean);
        } catch { /* leave empty */ }

        return {
          list_id:       listRow.List_ID,
          list_title:    listRow.List_Title,
          owner_username: listRow.owner_username,
          owner_flair:   listRow.owner_flair ?? null,
          movie_count:   listRow.movie_count,
          preview_posters,
        };
      })
    );

    res.json({
      featured:        featuredRows.length ? toMovieShape(featuredRows[0]) : null,
      trending:        trendingRows.map(toMovieShape),
      latest_articles: latestArticleRows.map(toArticleShape),
      new_lists:       newLists,
      editorial_pick:  editorialRows.length ? toArticleShape(editorialRows[0]) : null,
      top_rated:       topRatedRows.map(toMovieShape),
      top_by_genre:    topByGenreRows.map(row => ({
        genre_id: row.genre_id,
        genre_name: row.genre_name,
        movie_count: row.genre_movie_count,
        movie: toMovieShape(row),
      })),
      new_releases:    newReleaseRows.map(toMovieShape),
    });
  } catch (err) {
    console.error('getHomepage:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
