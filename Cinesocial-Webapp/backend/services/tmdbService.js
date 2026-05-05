const axios = require('axios');
const { poolPromise, sql } = require('../config/db');

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const PROFILE_BASE_URL = 'https://image.tmdb.org/t/p/w185';
const YOUTUBE_BASE_URL = 'https://www.youtube.com/watch?v=';

const HYDRATE_CAST_LIMIT = 15;
const API_DELAY_MS = 200;

let lastTmdbRequestAt = 0;
let movieGenreListCache = null;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function throttleTmdb() {
  const elapsed = Date.now() - lastTmdbRequestAt;
  if (elapsed < API_DELAY_MS) {
    await delay(API_DELAY_MS - elapsed);
  }
  lastTmdbRequestAt = Date.now();
}

function getBearerToken() {
  return (process.env.TMDB_API_KEY || process.env.TMDB_READ_ACCESS_TOKEN || '').trim();
}

async function tmdbGet(endpoint, params = {}) {
  const token = getBearerToken();
  if (!token) {
    throw new Error('TMDB_API_KEY (or TMDB_READ_ACCESS_TOKEN) is not configured');
  }

  await throttleTmdb();

  const response = await axios.get(`${TMDB_BASE_URL}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
    params,
  });
  return response.data;
}

function truncate(value, maxLength) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

function fullImageUrl(baseUrl, imagePath) {
  return imagePath ? `${baseUrl}${imagePath}` : null;
}

function mapRating(voteAverage) {
  const rating = Number.isFinite(voteAverage) ? voteAverage / 2 : 0;
  const rounded = Math.round(rating * 10) / 10;
  return Math.max(0, Math.min(5, rounded));
}

function getTrailerUrl(videos = {}) {
  const trailer = (videos.results || []).find(
    video => video.site === 'YouTube' && video.type === 'Trailer' && video.key
  );
  return trailer ? `${YOUTUBE_BASE_URL}${trailer.key}` : null;
}

function getTopCast(movieDetails, limit) {
  return (movieDetails.credits?.cast || [])
    .filter(person => person.id && person.name)
    .sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER))
    .slice(0, limit);
}

function getDirectors(movieDetails) {
  const directorsById = new Map();
  for (const person of movieDetails.credits?.crew || []) {
    if (person.id && person.name && person.job === 'Director') {
      directorsById.set(person.id, person);
    }
  }
  return [...directorsById.values()];
}

function mapPerson(person, details = null) {
  return {
    tmdb_id: person.id,
    Full_Name: truncate(person.name, 100),
    BDate: details?.birthday || null,
    Nationality: truncate(details?.place_of_birth, 60),
    Bio: truncate(details?.biography, 1024),
    Photo_URL: truncate(
      fullImageUrl(PROFILE_BASE_URL, person.profile_path || details?.profile_path),
      255
    ),
  };
}

function mapMovieFromDetails(movieDetails) {
  return {
    Title: truncate(movieDetails.title, 200),
    M_Type: 'movie',
    Release_date: movieDetails.release_date || null,
    Runtime: movieDetails.runtime ?? null,
    Synopsis: truncate(movieDetails.overview || 'No synopsis available.', 1024),
    M_Language: truncate(movieDetails.original_language, 50),
    Poster_URL: truncate(fullImageUrl(POSTER_BASE_URL, movieDetails.poster_path), 255),
    Trailer_URL: truncate(getTrailerUrl(movieDetails.videos), 255),
    A_Rating: mapRating(movieDetails.vote_average),
  };
}

function mapGenre(genre) {
  return {
    tmdb_id: genre.id,
    G_ID: genre.id,
    G_Name: truncate(genre.name, 50),
    Niche: null,
  };
}

function createTransactionRequest(transaction) {
  return new sql.Request(transaction);
}

async function insertGenre(transaction, genre, genreIdCache) {
  if (genreIdCache.has(genre.tmdb_id)) {
    return { id: genreIdCache.get(genre.tmdb_id), inserted: false };
  }

  const existingByName = await createTransactionRequest(transaction)
    .input('name', sql.VarChar(50), genre.G_Name)
    .query('SELECT G_ID FROM Genres WHERE G_Name = @name');

  if (existingByName.recordset.length) {
    const id = existingByName.recordset[0].G_ID;
    genreIdCache.set(genre.tmdb_id, id);
    return { id, inserted: false };
  }

  const existingById = await createTransactionRequest(transaction)
    .input('id', sql.Int, genre.G_ID)
    .query('SELECT G_ID FROM Genres WHERE G_ID = @id');

  if (existingById.recordset.length) {
    const id = existingById.recordset[0].G_ID;
    genreIdCache.set(genre.tmdb_id, id);
    return { id, inserted: false };
  }

  await createTransactionRequest(transaction)
    .input('id', sql.Int, genre.G_ID)
    .input('name', sql.VarChar(50), genre.G_Name)
    .query(`
      BEGIN TRY
        SET IDENTITY_INSERT Genres ON;
        INSERT INTO Genres (G_ID, G_Name, Niche)
        VALUES (@id, @name, NULL);
        SET IDENTITY_INSERT Genres OFF;
      END TRY
      BEGIN CATCH
        IF (SELECT OBJECTPROPERTY(OBJECT_ID('Genres'), 'TableHasIdentity')) = 1
        BEGIN
          SET IDENTITY_INSERT Genres OFF;
        END;
        THROW;
      END CATCH;
    `);
  genreIdCache.set(genre.tmdb_id, genre.G_ID);
  return { id: genre.G_ID, inserted: true };
}

async function updateMissingPersonDetails(transaction, personId, person) {
  if (!person.BDate && !person.Nationality && !person.Bio && !person.Photo_URL) {
    return;
  }
  await createTransactionRequest(transaction)
    .input('id', sql.Int, personId)
    .input('bdate', sql.Date, person.BDate)
    .input('nationality', sql.VarChar(60), person.Nationality)
    .input('bio', sql.VarChar(1024), person.Bio)
    .input('photoUrl', sql.VarChar(255), person.Photo_URL)
    .query(`
      UPDATE Persons
      SET
        BDate = COALESCE(BDate, @bdate),
        Nationality = COALESCE(Nationality, @nationality),
        Bio = COALESCE(Bio, @bio),
        Photo_URL = COALESCE(Photo_URL, @photoUrl)
      WHERE Person_ID = @id;
    `);
}

async function insertPerson(transaction, person) {
  const byTmdb = await createTransactionRequest(transaction)
    .input('tmdbPersonId', sql.Int, person.tmdb_id)
    .query('SELECT Person_ID FROM Persons WHERE Tmdb_Person_ID = @tmdbPersonId');

  if (byTmdb.recordset.length) {
    const id = byTmdb.recordset[0].Person_ID;
    await updateMissingPersonDetails(transaction, id, person);
    return { id, inserted: false };
  }

  const existing = await createTransactionRequest(transaction)
    .input('name', sql.VarChar(100), person.Full_Name)
    .query('SELECT Person_ID, Tmdb_Person_ID FROM Persons WHERE Full_Name = @name');

  if (existing.recordset.length) {
    const id = existing.recordset[0].Person_ID;
    if (existing.recordset[0].Tmdb_Person_ID == null && person.tmdb_id) {
      await createTransactionRequest(transaction)
        .input('id', sql.Int, id)
        .input('tmdbPersonId', sql.Int, person.tmdb_id)
        .query('UPDATE Persons SET Tmdb_Person_ID = @tmdbPersonId WHERE Person_ID = @id');
    }
    await updateMissingPersonDetails(transaction, id, person);
    return { id, inserted: false };
  }

  const inserted = await createTransactionRequest(transaction)
    .input('fullName', sql.VarChar(100), person.Full_Name)
    .input('bdate', sql.Date, person.BDate)
    .input('nationality', sql.VarChar(60), person.Nationality)
    .input('bio', sql.VarChar(1024), person.Bio)
    .input('photoUrl', sql.VarChar(255), person.Photo_URL)
    .input('tmdbPersonId', sql.Int, person.tmdb_id)
    .query(`
      INSERT INTO Persons (Full_Name, BDate, Nationality, Bio, Photo_URL, Tmdb_Person_ID)
      OUTPUT INSERTED.Person_ID
      VALUES (@fullName, @bdate, @nationality, @bio, @photoUrl, @tmdbPersonId);
    `);

  return { id: inserted.recordset[0].Person_ID, inserted: true };
}

async function insertMovieGenre(transaction, movieId, genreId) {
  await createTransactionRequest(transaction)
    .input('movieId', sql.Int, movieId)
    .input('genreId', sql.Int, genreId)
    .query(`
      IF NOT EXISTS (
        SELECT 1 FROM M_Genres WHERE M_ID = @movieId AND G_ID = @genreId
      )
      BEGIN
        INSERT INTO M_Genres (M_ID, G_ID)
        VALUES (@movieId, @genreId);
      END
    `);
}

async function insertMovieCast(transaction, movieId, personId, relationship) {
  const result = await createTransactionRequest(transaction)
    .input('movieId', sql.Int, movieId)
    .input('personId', sql.Int, personId)
    .input('roleType', sql.VarChar(20), relationship.Role_Type)
    .input('characterName', sql.VarChar(100), relationship.Character_Name)
    .query(`
      IF NOT EXISTS (
        SELECT 1
        FROM M_Cast
        WHERE M_ID = @movieId
          AND P_ID = @personId
          AND Role_Type = @roleType
          AND (
            Character_Name = @characterName
            OR (Character_Name IS NULL AND @characterName IS NULL)
          )
      )
      BEGIN
        INSERT INTO M_Cast (M_ID, P_ID, Role_Type, Character_Name)
        VALUES (@movieId, @personId, @roleType, @characterName);
        SELECT 1 AS inserted;
      END
      ELSE
      BEGIN
        SELECT 0 AS inserted;
      END
    `);
  return result.recordset[0]?.inserted === 1;
}

async function getMovieGenreNameMap() {
  if (movieGenreListCache) {
    return movieGenreListCache;
  }
  try {
    const data = await tmdbGet('/genre/movie/list', { language: 'en-US' });
    const map = new Map();
    for (const g of data.genres || []) {
      map.set(g.id, g.name);
    }
    movieGenreListCache = map;
    return map;
  } catch {
    movieGenreListCache = new Map([
      [28, 'Action'],
      [12, 'Adventure'],
      [16, 'Animation'],
      [35, 'Comedy'],
      [80, 'Crime'],
      [99, 'Documentary'],
      [18, 'Drama'],
      [10751, 'Family'],
      [14, 'Fantasy'],
      [36, 'History'],
      [27, 'Horror'],
      [10402, 'Music'],
      [9648, 'Mystery'],
      [10749, 'Romance'],
      [878, 'Science Fiction'],
      [10770, 'TV Movie'],
      [53, 'Thriller'],
      [10752, 'War'],
      [37, 'Western'],
    ]);
    return movieGenreListCache;
  }
}

async function getStubGenreObjects(genreIds) {
  const map = await getMovieGenreNameMap();
  return (genreIds || [])
    .filter(id => map.has(id))
    .map(id => mapGenre({ id, name: map.get(id) }));
}

async function isMovieStub(pool, movieId) {
  const r = await pool
    .request()
    .input('movieId', sql.Int, movieId)
    .query('SELECT COUNT(*) AS c FROM M_Cast WHERE M_ID = @movieId');
  return (r.recordset[0]?.c || 0) === 0;
}

async function getMovieGenres(pool, movieId) {
  const r = await pool
    .request()
    .input('movieId', sql.Int, movieId)
    .query(`
      SELECT g.G_Name
      FROM Genres g
      INNER JOIN M_Genres mg ON g.G_ID = mg.G_ID
      WHERE mg.M_ID = @movieId
      ORDER BY g.G_Name
    `);
  return r.recordset.map(row => row.G_Name);
}

/**
 * @returns {Promise<Array<{ movie_id: number, title: string, year: number|null, release_date: string|null, poster_url: string|null, avg_rating: number, genres: string[], tmdb_id: number, is_stub: boolean }>>}
 */
async function searchMovies(query, page = 1) {
  if (!getBearerToken()) {
    return [];
  }

  const trimmed = (query || '').trim();
  if (!trimmed) {
    return [];
  }

  let data;
  try {
    data = await tmdbGet('/search/movie', {
      query: trimmed,
      page,
      language: 'en-US',
    });
  } catch (err) {
    console.warn('tmdbService.searchMovies TMDB error:', err.message);
    return [];
  }

  const pool = await poolPromise;
  const top = (data.results || []).slice(0, 10);
  const out = [];

  for (const item of top) {
    const tmdbId = item.id;
    if (!tmdbId) {
      continue;
    }

    const existing = await pool
      .request()
      .input('tmdbId', sql.Int, tmdbId)
      .query('SELECT Movie_ID FROM Movies WHERE Tmdb_ID = @tmdbId');

    let movieId;

    if (existing.recordset.length) {
      movieId = existing.recordset[0].Movie_ID;
    } else {
      const title = truncate(item.title, 200);
      const releaseDate = item.release_date || null;
      const synopsis = truncate(item.overview || 'No synopsis available.', 1024);
      const lang = truncate(item.original_language, 50);
      const posterUrl = truncate(fullImageUrl(POSTER_BASE_URL, item.poster_path), 255);
      const genreObjects = await getStubGenreObjects(item.genre_ids);

      const transaction = new sql.Transaction(pool);
      await transaction.begin();
      try {
        const ins = await createTransactionRequest(transaction)
          .input('title', sql.VarChar(200), title)
          .input('type', sql.VarChar(10), 'movie')
          .input('releaseDate', sql.Date, releaseDate)
          .input('runtime', sql.Int, 0)
          .input('synopsis', sql.VarChar(1024), synopsis)
          .input('language', sql.VarChar(50), lang)
          .input('posterUrl', sql.VarChar(255), posterUrl)
          .input('trailerUrl', sql.VarChar(255), null)
          .input('rating', sql.Decimal(3, 1), 0.0)
          .input('tmdbId', sql.Int, tmdbId)
          .query(`
            INSERT INTO Movies (
              Title, M_Type, Release_date, Runtime, Synopsis, M_Language,
              Poster_URL, Trailer_URL, A_Rating, Sequel_of, Tmdb_ID, Last_Fetched
            )
            OUTPUT INSERTED.Movie_ID
            VALUES (
              @title, @type, @releaseDate, @runtime, @synopsis, @language,
              @posterUrl, @trailerUrl, @rating, NULL, @tmdbId, NULL
            );
          `);

        movieId = ins.recordset[0].Movie_ID;

        const genreIdCache = new Map();
        for (const genre of genreObjects) {
          const { id: genreId } = await insertGenre(transaction, genre, genreIdCache);
          await insertMovieGenre(transaction, movieId, genreId);
        }

        await transaction.commit();
      } catch (e) {
        await transaction.rollback();
        console.error('tmdbService.searchMovies insert failed:', e.message);
        continue;
      }
    }

    const is_stub = await isMovieStub(pool, movieId);
    const genres = await getMovieGenres(pool, movieId);

    const row = await pool
      .request()
      .input('movieId', sql.Int, movieId)
      .query(`
        SELECT Title, Poster_URL, Release_date, A_Rating
        FROM Movies
        WHERE Movie_ID = @movieId
      `);
    const db = row.recordset[0] || {};
    const releaseDate = db.Release_date || item.release_date || null;
    const year = releaseDate ? new Date(releaseDate).getFullYear() : null;
    const ar = db.A_Rating != null ? Number(db.A_Rating) : 0;

    out.push({
      movie_id: movieId,
      title: db.Title || item.title,
      year: Number.isFinite(year) ? year : null,
      release_date: releaseDate,
      poster_url: db.Poster_URL || fullImageUrl(POSTER_BASE_URL, item.poster_path),
      avg_rating: Number.isFinite(ar) ? ar : 0,
      genres,
      tmdb_id: tmdbId,
      is_stub,
    });
  }

  return out;
}

async function markMovieTmdbInvalid(pool, movieId) {
  await pool
    .request()
    .input('id', sql.Int, movieId)
    .query(`
      UPDATE Movies
      SET Tmdb_ID = -1, Last_Fetched = GETDATE()
      WHERE Movie_ID = @id;
    `);
}

async function markHydrateAttempt(pool, movieId) {
  await pool
    .request()
    .input('id', sql.Int, movieId)
    .query('UPDATE Movies SET Last_Fetched = GETDATE() WHERE Movie_ID = @id');
}

/**
 * @returns {Promise<null | { hydrated: true, cast_count: number }>}
 */
async function hydrateMovieDetails(movieId) {
  const pool = await poolPromise;
  const id = Number(movieId);
  if (!Number.isFinite(id)) {
    return null;
  }

  const movieRow = await pool
    .request()
    .input('id', sql.Int, id)
    .query(`
      SELECT Movie_ID, Tmdb_ID, Last_Fetched
      FROM Movies
      WHERE Movie_ID = @id
    `);

  if (!movieRow.recordset.length) {
    return null;
  }

  const { Tmdb_ID: tmdbId, Last_Fetched: lastFetched } = movieRow.recordset[0];

  if (tmdbId == null || tmdbId === -1) {
    return null;
  }

  const castCountResult = await pool
    .request()
    .input('id', sql.Int, id)
    .query('SELECT COUNT(*) AS c FROM M_Cast WHERE M_ID = @id');

  const castCount = castCountResult.recordset[0]?.c || 0;
  if (castCount > 0) {
    return null;
  }

  if (
    lastFetched != null &&
    new Date(lastFetched).getTime() > Date.now() - 24 * 60 * 60 * 1000
  ) {
    return null;
  }

  if (!getBearerToken()) {
    return null;
  }

  let movieDetails;
  try {
    movieDetails = await tmdbGet(`/movie/${tmdbId}`, {
      append_to_response: 'credits,videos',
      language: 'en-US',
    });
  } catch (err) {
    const status = err.response?.status;
    if (status === 404) {
      await markMovieTmdbInvalid(pool, id);
    } else {
      await markHydrateAttempt(pool, id);
    }
    console.warn(`tmdbService.hydrateMovieDetails fetch failed for movie ${id}:`, err.message);
    return null;
  }

  const mapped = mapMovieFromDetails(movieDetails);
  const cast = getTopCast(movieDetails, HYDRATE_CAST_LIMIT);
  const directors = getDirectors(movieDetails);
  const personsByTmdbId = new Map();

  for (const castMember of cast) {
    personsByTmdbId.set(castMember.id, mapPerson(castMember, null));
  }
  for (const director of directors) {
    if (!personsByTmdbId.has(director.id)) {
      personsByTmdbId.set(director.id, mapPerson(director, null));
    }
  }

  const castRelationships = [
    ...cast.map(castMember => ({
      tmdb_person_id: castMember.id,
      Role_Type: 'actor',
      Character_Name: truncate(castMember.character, 100),
    })),
    ...directors.map(director => ({
      tmdb_person_id: director.id,
      Role_Type: 'director',
      Character_Name: null,
    })),
  ];

  const genres = (movieDetails.genres || []).filter(g => g.id && g.name).map(mapGenre);

  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const genreIdCache = new Map();
    for (const genre of genres) {
      await insertGenre(transaction, genre, genreIdCache);
    }

    const personIdByTmdbId = new Map();
    for (const person of personsByTmdbId.values()) {
      const { id: personId } = await insertPerson(transaction, person);
      personIdByTmdbId.set(person.tmdb_id, personId);
    }

    await createTransactionRequest(transaction)
      .input('movieId', sql.Int, id)
      .input('runtime', sql.Int, mapped.Runtime ?? 0)
      .input('synopsis', sql.VarChar(1024), mapped.Synopsis)
      .input('language', sql.VarChar(50), mapped.M_Language)
      .input('posterUrl', sql.VarChar(255), mapped.Poster_URL)
      .input('trailerUrl', sql.VarChar(255), mapped.Trailer_URL)
      .input('rating', sql.Decimal(3, 1), mapped.A_Rating)
      .input('releaseDate', sql.Date, mapped.Release_date)
      .query(`
        UPDATE Movies
        SET
          Runtime = CASE WHEN Runtime IS NULL OR Runtime = 0 THEN @runtime ELSE Runtime END,
          Synopsis = CASE
            WHEN Synopsis IS NULL OR LTRIM(RTRIM(Synopsis)) = ''
              OR Synopsis = 'No synopsis available.'
            THEN @synopsis
            ELSE Synopsis
          END,
          M_Language = COALESCE(NULLIF(LTRIM(RTRIM(M_Language)), ''), @language),
          Poster_URL = COALESCE(Poster_URL, @posterUrl),
          Trailer_URL = COALESCE(Trailer_URL, @trailerUrl),
          A_Rating = CASE WHEN A_Rating IS NULL OR A_Rating = 0 THEN @rating ELSE A_Rating END,
          Release_date = COALESCE(Release_date, @releaseDate),
          Last_Fetched = GETDATE()
        WHERE Movie_ID = @movieId;
      `);

    for (const genre of genres) {
      const gid = genreIdCache.get(genre.tmdb_id);
      if (gid) {
        await insertMovieGenre(transaction, id, gid);
      }
    }

    for (const relationship of castRelationships) {
      const pid = personIdByTmdbId.get(relationship.tmdb_person_id);
      if (!pid) {
        continue;
      }
      await insertMovieCast(transaction, id, pid, relationship);
    }

    await transaction.commit();
  } catch (e) {
    await transaction.rollback();
    console.error(`tmdbService.hydrateMovieDetails txn failed for movie ${id}:`, e.message);
    await markHydrateAttempt(pool, id);
    return null;
  }

  const finalCount = await pool
    .request()
    .input('id', sql.Int, id)
    .query('SELECT COUNT(*) AS c FROM M_Cast WHERE M_ID = @id');

  const finalC = finalCount.recordset[0]?.c || 0;
  return { hydrated: true, cast_count: finalC };
}

function knownForTitles(person) {
  const titles = [];
  for (const item of person.known_for || []) {
    if (item.media_type === 'movie' && item.title) {
      titles.push(item.title);
    } else if (item.media_type === 'tv' && item.name) {
      titles.push(item.name);
    }
  }
  return titles.slice(0, 5);
}

/**
 * @returns {Promise<Array<{ person_id: number, full_name: string, photo_url: string|null, known_for_titles: string[] }>>}
 */
async function searchPeople(query) {
  if (!getBearerToken()) {
    return [];
  }

  const trimmed = (query || '').trim();
  if (!trimmed) {
    return [];
  }

  let data;
  try {
    data = await tmdbGet('/search/person', {
      query: trimmed,
      language: 'en-US',
      page: 1,
    });
  } catch (err) {
    console.warn('tmdbService.searchPeople TMDB error:', err.message);
    return [];
  }

  const pool = await poolPromise;
  const top = (data.results || []).slice(0, 5);
  const out = [];

  for (const person of top) {
    if (!person.id || !person.name) {
      continue;
    }

    const fullName = truncate(person.name, 100);
    const photoUrl = truncate(fullImageUrl(PROFILE_BASE_URL, person.profile_path), 255);
    const tmdbPersonId = person.id;

    const existing = await pool
      .request()
      .input('name', sql.VarChar(100), fullName)
      .query('SELECT Person_ID FROM Persons WHERE Full_Name = @name');

    let personId;

    if (existing.recordset.length) {
      personId = existing.recordset[0].Person_ID;
      await pool
        .request()
        .input('id', sql.Int, personId)
        .input('photoUrl', sql.VarChar(255), photoUrl)
        .input('tmdbPersonId', sql.Int, tmdbPersonId)
        .query(`
          UPDATE Persons
          SET
            Photo_URL = COALESCE(Photo_URL, @photoUrl),
            Tmdb_Person_ID = COALESCE(Tmdb_Person_ID, @tmdbPersonId)
          WHERE Person_ID = @id;
        `);
    } else {
      const ins = await pool
        .request()
        .input('fullName', sql.VarChar(100), fullName)
        .input('photoUrl', sql.VarChar(255), photoUrl)
        .input('tmdbPersonId', sql.Int, tmdbPersonId)
        .query(`
          INSERT INTO Persons (Full_Name, BDate, Nationality, Bio, Photo_URL, Tmdb_Person_ID)
          OUTPUT INSERTED.Person_ID
          VALUES (@fullName, NULL, NULL, NULL, @photoUrl, @tmdbPersonId);
        `);
      personId = ins.recordset[0].Person_ID;
    }

    out.push({
      person_id: personId,
      full_name: fullName,
      photo_url: fullImageUrl(PROFILE_BASE_URL, person.profile_path),
      known_for_titles: knownForTitles(person),
    });
  }

  return out;
}

module.exports = {
  searchMovies,
  hydrateMovieDetails,
  searchPeople,
};
