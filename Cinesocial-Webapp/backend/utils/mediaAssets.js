const axios = require('axios');

/** Required by https://meta.wikimedia.org/wiki/User-Agent_policy */
const WIKI_USER_AGENT = 'CineSocial/1.0 (local development; movie discovery app)';

// ---------------------------------------------------------------------------
// Movie poster normalisation (existing)
// ---------------------------------------------------------------------------
const posterUrlsByTitle = {
  'Dune: Part Two': 'https://image.tmdb.org/t/p/original/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
  Dune: 'https://image.tmdb.org/t/p/original/gDzOcq0pfeCeqMBwKIJlSmQpjkZ.jpg',
  Joker: 'https://image.tmdb.org/t/p/original/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg',
  Parasite: 'https://image.tmdb.org/t/p/original/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
  'Get Out': 'https://image.tmdb.org/t/p/original/mE24wUCfjK8AoBBjaMjho7Rczr7.jpg',
  Interstellar: 'https://image.tmdb.org/t/p/original/yQvGrMoipbRoddT0ZR8tPoR7NfX.jpg',
  'The Dark Knight Rises': 'https://image.tmdb.org/t/p/original/hr0L2aueqlP2BYUblTTjmtn0hw4.jpg',
  Inception: 'https://image.tmdb.org/t/p/original/xlaY2zyzMfkhk0HSC5VUwzoZPU1.jpg',
  'The Dark Knight': 'https://image.tmdb.org/t/p/original/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
  'Spirited Away': 'https://image.tmdb.org/t/p/original/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg',
  Gladiator: 'https://image.tmdb.org/t/p/original/wN2xWp1eIwCKOD0BHTcErTBv1Uq.jpg',
  Se7en: 'https://image.tmdb.org/t/p/original/191nKfP0ehp3uIvWqgPbFmI4lv9.jpg',
  'Pulp Fiction': 'https://image.tmdb.org/t/p/original/vQWk5YBFWF4bZaofAbv0tShwBvQ.jpg',
  'The Shawshank Redemption': 'https://image.tmdb.org/t/p/original/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg',
  'Forrest Gump': 'https://image.tmdb.org/t/p/original/Cw4hIUIAmSYfK9QfaUW5igp9La.jpg',
};

const isPlaceholderUrl = (url) => {
  if (url == null) return true;
  const s = String(url).trim();
  if (!s) return true;
  if (!/^https?:\/\//i.test(s)) return true;
  return /(^|\/\/)(images|pics)\.example\.com\//i.test(s);
};

const normalizeMoviePoster = (movie) => {
  if (!movie) return movie;
  if (isPlaceholderUrl(movie.Poster_URL)) {
    return { ...movie, Poster_URL: posterUrlsByTitle[movie.Title] || null };
  }
  return movie;
};

const normalizeMoviePosters = (movies) => movies.map(normalizeMoviePoster);

// ---------------------------------------------------------------------------
// Person photos: TMDB (optional key) then Wikipedia summary thumbnail (no key)
// ---------------------------------------------------------------------------

const getTmdbToken = () =>
  (process.env.TMDB_API_KEY || process.env.TMDB_READ_ACCESS_TOKEN || '').trim();

/** First search hit; cached per process. */
const _tmdbPersonSearchCache = Object.create(null);

const fetchTmdbPersonSearchFirst = async (fullName) => {
  const key = fullName?.trim();
  if (!key) return null;
  if (key in _tmdbPersonSearchCache) return _tmdbPersonSearchCache[key];

  const token = getTmdbToken();
  if (!token) {
    _tmdbPersonSearchCache[key] = null;
    return null;
  }

  try {
    const { data } = await axios.get('https://api.themoviedb.org/3/search/person', {
      params: { query: key, include_adult: false, page: 1 },
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      timeout: 8000,
    });
    const first = data?.results?.[0] || null;
    _tmdbPersonSearchCache[key] = first;
    return first;
  } catch {
    _tmdbPersonSearchCache[key] = null;
    return null;
  }
};

const _wikiSummaryCache = Object.create(null);

const fetchWikipediaPersonSummary = async (fullName) => {
  const key = fullName?.trim();
  if (!key) return { thumbnail: null, extract: null };
  if (key in _wikiSummaryCache) return _wikiSummaryCache[key];

  const pageTitle = key.replace(/ /g, '_');
  try {
    const { data, status } = await axios.get(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`,
      {
        timeout: 8000,
        validateStatus: () => true,
        headers: { 'User-Agent': WIKI_USER_AGENT, Accept: 'application/json' },
      }
    );
    if (status !== 200 || !data) {
      const empty = { thumbnail: null, extract: null };
      _wikiSummaryCache[key] = empty;
      return empty;
    }
    const out = {
      thumbnail: data.thumbnail?.source || null,
      extract: data.extract || null,
    };
    _wikiSummaryCache[key] = out;
    return out;
  } catch {
    const empty = { thumbnail: null, extract: null };
    _wikiSummaryCache[key] = empty;
    return empty;
  }
};

async function resolvePhotoWhenPlaceholder(person) {
  const name = person.Full_Name;
  const tmdb = await fetchTmdbPersonSearchFirst(name);
  if (tmdb?.profile_path) {
    return `https://image.tmdb.org/t/p/w185${tmdb.profile_path}`;
  }
  const wiki = await fetchWikipediaPersonSummary(name);
  return wiki.thumbnail || null;
}

/**
 * Enriches a cast array: placeholder or missing Photo_URL is replaced via TMDB, then Wikipedia.
 */
const enrichCastPhotos = async (cast) => {
  if (!Array.isArray(cast) || cast.length === 0) return cast;
  return Promise.all(
    cast.map(async (person) => {
      const trimmed = (person.Photo_URL || '').trim();
      if (!isPlaceholderUrl(trimmed)) return person;
      const photoUrl = await resolvePhotoWhenPlaceholder(person);
      return { ...person, Photo_URL: photoUrl };
    })
  );
};

const genderLabel = (g) => {
  if (g === 1) return 'Female';
  if (g === 2) return 'Male';
  if (g === 3) return 'Non-binary';
  return null;
};

/**
 * Single person (actor page): resolved photo, TMDB gender when key is set, optional Wikipedia extract.
 */
const enrichPersonProfileForDetail = async (person) => {
  if (!person) return person;
  const name = person.Full_Name;
  let photoUrl = (person.Photo_URL || '').trim();
  const tmdb = await fetchTmdbPersonSearchFirst(name);
  const gender = genderLabel(tmdb?.gender);

  if (isPlaceholderUrl(photoUrl) && tmdb?.profile_path) {
    photoUrl = `https://image.tmdb.org/t/p/w185${tmdb.profile_path}`;
  }
  let wikiSummary = null;
  if (isPlaceholderUrl(photoUrl)) {
    const wiki = await fetchWikipediaPersonSummary(name);
    if (wiki.thumbnail) photoUrl = wiki.thumbnail;
    wikiSummary = wiki.extract || null;
  }

  const shortBio = !person.Bio || String(person.Bio).trim().length < 60;
  if (shortBio && !wikiSummary) {
    const wiki = await fetchWikipediaPersonSummary(name);
    wikiSummary = wiki.extract || null;
  }

  return {
    ...person,
    Photo_URL: isPlaceholderUrl(photoUrl) ? null : photoUrl,
    gender,
    wikiSummary,
  };
};

module.exports = {
  normalizeMoviePoster,
  normalizeMoviePosters,
  enrichCastPhotos,
  enrichPersonProfileForDetail,
};
