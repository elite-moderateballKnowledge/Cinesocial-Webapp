const path = require('path');
const { createRequire } = require('module');

const backendRequire = createRequire(path.resolve(__dirname, '../backend/package.json'));
const axios = backendRequire('axios');
const sql = backendRequire('mssql/msnodesqlv8');
backendRequire('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true });

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const PROFILE_BASE_URL = 'https://image.tmdb.org/t/p/w185';
const YOUTUBE_BASE_URL = 'https://www.youtube.com/watch?v=';
const API_DELAY_MS = 250;
const DRY_RUN_MOVIE_COUNT = 3;
const CAST_LIMIT = 10;
const BIOGRAPHY_CAST_LIMIT = 5;

const isDryRun = process.argv.includes('--dry-run');

const dbConfig = {
  server: process.env.DB_SERVER || 'localhost\\SQLEXPRESS',
  database: process.env.DB_NAME || 'CineSocial',
  driver: 'ODBC Driver 17 for SQL Server',
  options: {
    trustedConnection: true,
    trustServerCertificate: true,
  },
};

const stats = {
  moviesInserted: 0,
  personsInserted: 0,
  genresInserted: 0,
  castRelationshipsInserted: 0,
  failedMovies: [],
};

const tmdbMovieIdsSeen = new Set();
const tmdbPersonIdToDbId = new Map();
const tmdbGenreIdToDbId = new Map();
const personDetailsCache = new Map();

let lastTmdbRequestAt = 0;

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

async function tmdbGet(endpoint, params = {}) {
  if (!process.env.TMDB_API_KEY) {
    throw new Error('TMDB_API_KEY is missing. Add it to .env before running the seed.');
  }

  await throttleTmdb();

  const response = await axios.get(`${TMDB_BASE_URL}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
    },
    params,
  });

  return response.data;
}

function truncate(value, maxLength) {
  if (value === null || value === undefined) {
    return null;
  }

  const text = String(value).trim();
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

function fullImageUrl(baseUrl, imagePath) {
  return imagePath ? `${baseUrl}${imagePath}` : null;
}

function toSqlDate(value) {
  if (!value) {
    return null;
  }

  return value;
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

function getTopCast(movieDetails) {
  return (movieDetails.credits?.cast || [])
    .filter(person => person.id && person.name)
    .sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER))
    .slice(0, CAST_LIMIT);
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

function mapMovie(movieDetails) {
  return {
    tmdb_id: movieDetails.id,
    Title: truncate(movieDetails.title, 200),
    M_Type: 'movie',
    Release_date: toSqlDate(movieDetails.release_date),
    Runtime: movieDetails.runtime ?? 0,
    Synopsis: truncate(movieDetails.overview || 'No synopsis available.', 1024),
    M_Language: truncate(movieDetails.original_language, 50),
    Poster_URL: truncate(fullImageUrl(POSTER_BASE_URL, movieDetails.poster_path), 255),
    Trailer_URL: truncate(getTrailerUrl(movieDetails.videos), 255),
    A_Rating: mapRating(movieDetails.vote_average),
    Sequel_of: null,
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

function mapPerson(person, details = null) {
  return {
    tmdb_id: person.id,
    Full_Name: truncate(person.name, 100),
    BDate: toSqlDate(details?.birthday),
    Nationality: truncate(details?.place_of_birth, 60),
    Bio: truncate(details?.biography, 1024),
    Photo_URL: truncate(fullImageUrl(PROFILE_BASE_URL, person.profile_path || details?.profile_path), 255),
  };
}

function printSchemaSummary() {
  console.log('Schema/config confirmed:');
  console.log('- CineSocial.sql: Movies(Movie_ID, Title, M_Type, Release_date, Runtime, Synopsis, M_Language, Poster_URL, Trailer_URL, A_Rating, Sequel_of), Persons(Person_ID, Full_Name, BDate, Nationality, Bio, Photo_URL), Genres(G_ID, G_Name, Niche), M_Genres(M_ID, G_ID), M_Cast(Cast_ID, M_ID, P_ID, Role_Type, Character_Name).');
  console.log('- CineSocial_1.sql: sample DML uses the same tables and shows insert order with Genres/Persons before Movies, then M_Genres and M_Cast.');
  console.log('- .env.example: DB_SERVER and DB_NAME are used by the existing trusted SQL Server connection pattern; TMDB_API_KEY was added for TMDB bearer auth.');
  console.log('- backend/config/db.js: uses mssql/msnodesqlv8, ODBC Driver 17 for SQL Server, trustedConnection, trustServerCertificate, and dotenv.');
}

async function fetchMovieIds() {
  const endpoints = isDryRun
    ? [{ name: 'popular', pages: 1 }]
    : [
        { name: 'popular', pages: 5 },
        { name: 'top_rated', pages: 5 },
      ];

  const ids = [];

  for (const endpoint of endpoints) {
    for (let page = 1; page <= endpoint.pages; page += 1) {
      const data = await tmdbGet(`/movie/${endpoint.name}`, {
        language: 'en-US',
        page,
      });

      for (const movie of data.results || []) {
        if (!tmdbMovieIdsSeen.has(movie.id)) {
          tmdbMovieIdsSeen.add(movie.id);
          ids.push(movie.id);
        }
      }
    }
  }

  return isDryRun ? ids.slice(0, DRY_RUN_MOVIE_COUNT) : ids;
}

async function fetchMovieDetails(movieId) {
  return tmdbGet(`/movie/${movieId}`, {
    append_to_response: 'credits,videos',
    language: 'en-US',
  });
}

async function fetchPersonDetails(personId) {
  if (personDetailsCache.has(personId)) {
    return personDetailsCache.get(personId);
  }

  const details = await tmdbGet(`/person/${personId}`, {
    language: 'en-US',
  });

  personDetailsCache.set(personId, details);
  return details;
}

async function prepareMoviePayload(movieDetails) {
  const movie = mapMovie(movieDetails);

  if (!movie.Release_date) {
    throw new Error('Missing release_date; skipping movie to satisfy schema mapping rule.');
  }

  const genres = (movieDetails.genres || []).filter(genre => genre.id && genre.name).map(mapGenre);
  const cast = getTopCast(movieDetails);
  const directors = getDirectors(movieDetails);
  const personsByTmdbId = new Map();

  for (let index = 0; index < cast.length; index += 1) {
    const castMember = cast[index];
    const details = index < BIOGRAPHY_CAST_LIMIT ? await fetchPersonDetails(castMember.id) : null;
    personsByTmdbId.set(castMember.id, mapPerson(castMember, details));
  }

  for (const director of directors) {
    if (!personsByTmdbId.has(director.id)) {
      personsByTmdbId.set(director.id, mapPerson(director));
    }
  }

  return {
    movie,
    genres,
    persons: [...personsByTmdbId.values()],
    castRelationships: [
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
    ],
  };
}

function createTransactionRequest(transaction) {
  return new sql.Request(transaction);
}

async function insertGenre(transaction, genre) {
  if (tmdbGenreIdToDbId.has(genre.tmdb_id)) {
    return { id: tmdbGenreIdToDbId.get(genre.tmdb_id), inserted: false };
  }

  const existingByName = await createTransactionRequest(transaction)
    .input('name', sql.VarChar(50), genre.G_Name)
    .query('SELECT G_ID FROM Genres WHERE G_Name = @name');

  if (existingByName.recordset.length) {
    const id = existingByName.recordset[0].G_ID;
    return { id, inserted: false };
  }

  const existingById = await createTransactionRequest(transaction)
    .input('id', sql.Int, genre.G_ID)
    .query('SELECT G_ID FROM Genres WHERE G_ID = @id');

  if (!existingById.recordset.length) {
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

    return { id: genre.G_ID, inserted: true };
  }

  const inserted = await createTransactionRequest(transaction)
    .input('name', sql.VarChar(50), genre.G_Name)
    .query(`
      INSERT INTO Genres (G_Name, Niche)
      OUTPUT INSERTED.G_ID
      VALUES (@name, NULL);
    `);

  const id = inserted.recordset[0].G_ID;
  return { id, inserted: true };
}

async function insertPerson(transaction, person) {
  if (tmdbPersonIdToDbId.has(person.tmdb_id)) {
    const id = tmdbPersonIdToDbId.get(person.tmdb_id);
    await updateMissingPersonDetails(transaction, id, person);
    return { id, inserted: false };
  }

  const existing = await createTransactionRequest(transaction)
    .input('name', sql.VarChar(100), person.Full_Name)
    .query('SELECT Person_ID FROM Persons WHERE Full_Name = @name');

  if (existing.recordset.length) {
    const id = existing.recordset[0].Person_ID;
    await updateMissingPersonDetails(transaction, id, person);
    return { id, inserted: false };
  }

  const inserted = await createTransactionRequest(transaction)
    .input('fullName', sql.VarChar(100), person.Full_Name)
    .input('bdate', sql.Date, person.BDate)
    .input('nationality', sql.VarChar(60), person.Nationality)
    .input('bio', sql.VarChar(1024), person.Bio)
    .input('photoUrl', sql.VarChar(255), person.Photo_URL)
    .query(`
      INSERT INTO Persons (Full_Name, BDate, Nationality, Bio, Photo_URL)
      OUTPUT INSERTED.Person_ID
      VALUES (@fullName, @bdate, @nationality, @bio, @photoUrl);
    `);

  const id = inserted.recordset[0].Person_ID;
  return { id, inserted: true };
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

async function insertMovie(transaction, movie) {
  const existing = await createTransactionRequest(transaction)
    .input('title', sql.VarChar(200), movie.Title)
    .input('releaseDate', sql.Date, movie.Release_date)
    .query('SELECT Movie_ID FROM Movies WHERE Title = @title AND Release_date = @releaseDate');

  if (existing.recordset.length) {
    return { id: existing.recordset[0].Movie_ID, inserted: false };
  }

  const inserted = await createTransactionRequest(transaction)
    .input('title', sql.VarChar(200), movie.Title)
    .input('type', sql.VarChar(10), movie.M_Type)
    .input('releaseDate', sql.Date, movie.Release_date)
    .input('runtime', sql.Int, movie.Runtime)
    .input('synopsis', sql.VarChar(1024), movie.Synopsis)
    .input('language', sql.VarChar(50), movie.M_Language)
    .input('posterUrl', sql.VarChar(255), movie.Poster_URL)
    .input('trailerUrl', sql.VarChar(255), movie.Trailer_URL)
    .input('rating', sql.Decimal(3, 1), movie.A_Rating)
    .query(`
      INSERT INTO Movies (
        Title,
        M_Type,
        Release_date,
        Runtime,
        Synopsis,
        M_Language,
        Poster_URL,
        Trailer_URL,
        A_Rating,
        Sequel_of
      )
      OUTPUT INSERTED.Movie_ID
      VALUES (
        @title,
        @type,
        @releaseDate,
        @runtime,
        @synopsis,
        @language,
        @posterUrl,
        @trailerUrl,
        @rating,
        NULL
      );
    `);

  return { id: inserted.recordset[0].Movie_ID, inserted: true };
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

async function insertMoviePayload(pool, payload) {
  const transaction = new sql.Transaction(pool);

  await transaction.begin();

  try {
    const genreIdByTmdbId = new Map();
    const personIdByTmdbId = new Map();
    const localStats = {
      moviesInserted: 0,
      personsInserted: 0,
      genresInserted: 0,
      castRelationshipsInserted: 0,
    };

    for (const genre of payload.genres) {
      const { id, inserted } = await insertGenre(transaction, genre);
      genreIdByTmdbId.set(genre.tmdb_id, id);

      if (inserted) {
        localStats.genresInserted += 1;
      }
    }

    for (const person of payload.persons) {
      const { id, inserted } = await insertPerson(transaction, person);
      personIdByTmdbId.set(person.tmdb_id, id);

      if (inserted) {
        localStats.personsInserted += 1;
      }
    }

    const { id: movieId, inserted: movieInserted } = await insertMovie(transaction, payload.movie);

    if (movieInserted) {
      localStats.moviesInserted += 1;
    }

    for (const genre of payload.genres) {
      await insertMovieGenre(transaction, movieId, genreIdByTmdbId.get(genre.tmdb_id));
    }

    for (const relationship of payload.castRelationships) {
      const inserted = await insertMovieCast(
        transaction,
        movieId,
        personIdByTmdbId.get(relationship.tmdb_person_id),
        relationship
      );

      if (inserted) {
        localStats.castRelationshipsInserted += 1;
      }
    }

    await transaction.commit();

    for (const [tmdbId, dbId] of genreIdByTmdbId) {
      tmdbGenreIdToDbId.set(tmdbId, dbId);
    }

    for (const [tmdbId, dbId] of personIdByTmdbId) {
      tmdbPersonIdToDbId.set(tmdbId, dbId);
    }

    stats.moviesInserted += localStats.moviesInserted;
    stats.personsInserted += localStats.personsInserted;
    stats.genresInserted += localStats.genresInserted;
    stats.castRelationshipsInserted += localStats.castRelationshipsInserted;

    console.log(`Inserted/updated ${payload.movie.Title} (${payload.movie.Release_date}).`);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

function printDryRunPayload(payloads) {
  console.log(JSON.stringify({
    mode: 'dry-run',
    note: 'No database writes were performed.',
    movies: payloads,
  }, null, 2));
}

function printSummary() {
  console.log('\nSeed summary:');
  console.log(`- Total movies inserted: ${stats.moviesInserted}`);
  console.log(`- Total persons inserted: ${stats.personsInserted}`);
  console.log(`- Total genres inserted: ${stats.genresInserted}`);
  console.log(`- Total cast relationships inserted: ${stats.castRelationshipsInserted}`);

  if (stats.failedMovies.length) {
    console.log('- Failed movies:');
    for (const failure of stats.failedMovies) {
      console.log(`  - ${failure.title}: ${failure.reason}`);
    }
  } else {
    console.log('- Failed movies: none');
  }
}

async function runDryRun(movieIds) {
  const payloads = [];

  for (const movieId of movieIds) {
    const movieDetails = await fetchMovieDetails(movieId);
    payloads.push(await prepareMoviePayload(movieDetails));
  }

  printDryRunPayload(payloads);
}

async function runSeed(movieIds) {
  const pool = await new sql.ConnectionPool(dbConfig).connect();

  try {
    console.log('Connected to SQL Server successfully.');

    for (const movieId of movieIds) {
      let movieTitle = `TMDB movie ${movieId}`;

      try {
        const movieDetails = await fetchMovieDetails(movieId);
        movieTitle = movieDetails.title || movieTitle;
        const payload = await prepareMoviePayload(movieDetails);
        await insertMoviePayload(pool, payload);
      } catch (error) {
        stats.failedMovies.push({
          title: movieTitle,
          reason: error.message,
        });
        console.error(`Failed to seed ${movieTitle}: ${error.message}`);
      }
    }
  } finally {
    await pool.close();
  }
}

async function main() {
  printSchemaSummary();
  console.log(isDryRun ? '\nRunning TMDB dry run...' : '\nRunning TMDB database seed...');

  const movieIds = await fetchMovieIds();
  console.log(`Fetched ${movieIds.length} unique TMDB movie IDs.`);

  if (isDryRun) {
    await runDryRun(movieIds);
    return;
  }

  await runSeed(movieIds);
  printSummary();
}

main().catch(error => {
  console.error(`Seed failed: ${error.message}`);
  process.exit(1);
});
