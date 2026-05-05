const { poolPromise, sql } = require('../config/db');
const { normalizeMoviePoster, enrichPersonProfileForDetail } = require('../utils/mediaAssets');

function toIsoDateOnly(value) {
  if (value == null || value === '') return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function toNumberRating(v) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : 0;
}

function sanitizePersonRow(raw) {
  return {
    Person_ID: Number(raw.Person_ID),
    Full_Name: String(raw.Full_Name ?? ''),
    BDate: toIsoDateOnly(raw.BDate),
    Nationality: raw.Nationality != null ? String(raw.Nationality) : null,
    Bio: raw.Bio != null ? String(raw.Bio) : null,
    Photo_URL: raw.Photo_URL != null ? String(raw.Photo_URL).trim() || null : null,
  };
}

function sanitizeMovieCreditRow(m) {
  return normalizeMoviePoster({
    Movie_ID: Number(m.Movie_ID),
    Title: String(m.Title ?? ''),
    M_Type: m.M_Type != null ? String(m.M_Type) : '',
    Poster_URL: m.Poster_URL != null ? String(m.Poster_URL) : null,
    Release_date: toIsoDateOnly(m.Release_date),
    A_Rating: toNumberRating(m.A_Rating),
    Role_Type: m.Role_Type != null ? String(m.Role_Type) : '',
    Character_Name: m.Character_Name != null ? String(m.Character_Name) : null,
  });
}

function ageFromBirthDate(bdate) {
  if (!bdate) return null;
  const d = new Date(bdate);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age -= 1;
  return age >= 0 && age < 130 ? age : null;
}

exports.getPersonById = async (req, res) => {
  const { id } = req.params;
  const personId = parseInt(id, 10);
  if (!Number.isFinite(personId) || personId < 1) {
    return res.status(400).json({ message: 'Invalid person id' });
  }

  try {
    const pool = await poolPromise;

    const personResult = await pool.request()
      .input('id', sql.Int, personId)
      .query(`
        SELECT Person_ID, Full_Name, BDate, Nationality, Bio, Photo_URL
        FROM Persons
        WHERE Person_ID = @id
      `);

    if (personResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Person not found' });
    }

    const moviesResult = await pool.request()
      .input('id', sql.Int, personId)
      .query(`
        SELECT m.Movie_ID, m.Title, m.M_Type, m.Poster_URL, m.Release_date, m.A_Rating,
               mc.Role_Type, mc.Character_Name
        FROM M_Cast mc
        JOIN Movies m ON m.Movie_ID = mc.M_ID
        WHERE mc.P_ID = @id
        ORDER BY m.Release_date DESC
      `);

    const raw = personResult.recordset[0];
    const personRow = sanitizePersonRow(raw);
    const enriched = await enrichPersonProfileForDetail(personRow);

    const movies = (moviesResult.recordset || []).map(sanitizeMovieCreditRow);

    const payload = {
      ...enriched,
      age: ageFromBirthDate(enriched.BDate),
      movies,
    };

    res.json(JSON.parse(JSON.stringify(payload)));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
