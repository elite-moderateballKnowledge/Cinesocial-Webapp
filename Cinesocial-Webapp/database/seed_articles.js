/**
 * seed_articles.js — Seeds sample articles into the CineSocial database.
 * Run: node database/seed_articles.js
 */

const path = require('path');
const { createRequire } = require('module');

const backendRequire = createRequire(path.resolve(__dirname, '../backend/package.json'));
const sql = backendRequire('mssql/msnodesqlv8');
backendRequire('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const config = {
  server: process.env.DB_SERVER || 'localhost\\SQLEXPRESS',
  database: process.env.DB_NAME || 'CineSocial',
  driver: 'ODBC Driver 17 for SQL Server',
  options: {
    trustedConnection: true,
    trustServerCertificate: true,
  }
};

const articles = [
  {
    title: 'Oppenheimer: A Cinematic Reckoning with the Atomic Age',
    slug: 'oppenheimer-cinematic-reckoning-atomic-age',
    category: 'REVIEW',
    cover_image_url: 'https://image.tmdb.org/t/p/original/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    body: `Christopher Nolan's "Oppenheimer" is not merely a biopic — it is a full-sensory assault on the conscience. Clocking in at three hours, the film never once feels indulgent. Cillian Murphy delivers a career-defining performance as J. Robert Oppenheimer, a man whose brilliance is matched only by the moral abyss his creation opens beneath him.

The film's structure is audacious. Nolan interweaves two timelines — the color-drenched "Fission" sequence chronicling the Manhattan Project, and the stark black-and-white "Fusion" strand covering Lewis Strauss's confirmation hearing years later. The technique isn't gimmicky; it's essential. By showing us the consequences before the cause, Nolan transforms what could be a straightforward historical drama into a meditation on legacy, guilt, and the terrifying velocity of scientific progress.

Ludwig Göransson's score deserves its own paragraph. The music doesn't accompany the film — it inhabits it. The Trinity test sequence, presented in near-silence before the delayed shockwave hits, is the single most visceral moment I've experienced in a theater this decade. You feel the heat. You feel the dread. And then you feel the weight of what has just been unleashed.

Robert Downey Jr.'s Strauss is a masterclass in contained fury. His performance reminds us that the most dangerous men in history aren't the ones who build the bomb — they're the ones who decide where to point it.

If there is a flaw, it's that the film occasionally assumes too much historical literacy from its audience. The parade of real-world figures — Teller, Fermi, Bohr, Groves — can feel overwhelming on first viewing. But this is a film that rewards rewatching, and each subsequent viewing reveals new layers of meaning.

**Verdict: 4.8/5** — A towering achievement in cinema. Nolan has crafted a film that is simultaneously intimate and apocalyptic, a portrait of genius consumed by its own fire.`
  },
  {
    title: 'Why "The Dark Knight" Remains the Gold Standard for Superhero Films',
    slug: 'dark-knight-gold-standard-superhero-films',
    category: 'ANALYSIS',
    cover_image_url: 'https://image.tmdb.org/t/p/original/qJ2tW6WMUDux911BTUgMEFpVlPE.jpg',
    body: `Sixteen years after its release, "The Dark Knight" continues to cast a long shadow over every superhero film that follows. While the MCU has given us spectacle and the DCEU has given us... well, let's not go there... Nolan's 2008 masterpiece remains the definitive statement on what happens when you take a comic book character seriously without taking yourself too seriously.

**The Joker Problem**

Every villain since Heath Ledger's Joker has been measured against him, and every one has fallen short. This isn't because other actors lack talent — it's because Nolan and Ledger understood something fundamental: the best villain isn't the one with the biggest army or the most destructive weapon. The best villain is the one who makes the hero question whether heroism itself is possible.

The Joker's "social experiments" — the two ferries, the Harvey Dent corruption arc — aren't just plot devices. They're philosophical arguments. He's not trying to destroy Gotham; he's trying to prove that Gotham will destroy itself. And the terrifying thing is, he's almost right.

**Structure as Theme**

The film's three-act structure mirrors the classic tragedy arc: Act 1 establishes hope (Batman cleaning up Gotham with Dent as the "white knight"), Act 2 introduces chaos (the Joker systematically dismantling every institution), and Act 3 forces an impossible choice (Batman must become the villain to preserve Gotham's faith in its hero).

This structural elegance is what separates "The Dark Knight" from its imitators. Films like "Batman v Superman" tried to replicate the "dark and gritty" aesthetic without understanding that darkness without thematic purpose is just... dark.

**The Legacy**

The film's influence extends beyond superhero cinema. Its practical-effects-first approach, its Hans Zimmer score (that two-note Joker motif!), and its insistence on treating its audience as intelligent adults have become benchmarks for blockbuster filmmaking. Every time a director says "we wanted to ground this in reality," they're channeling Nolan, whether they know it or not.

"The Dark Knight" isn't just the best superhero film ever made. It's one of the best crime films, one of the best thrillers, and one of the best American films of the 21st century. Period.`
  },
  {
    title: 'Hot Take: Barbie Is the Most Subversive Studio Film of the Decade',
    slug: 'hot-take-barbie-most-subversive-studio-film',
    category: 'HOT TAKE',
    cover_image_url: 'https://image.tmdb.org/t/p/original/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg',
    body: `I'll say what everyone's thinking but few are willing to commit to: Greta Gerwig's "Barbie" is the most politically radical film to come out of a major studio since "Fight Club." And unlike "Fight Club," it knows exactly what it's doing.

**The Trojan Horse Strategy**

Warner Bros. spent $145 million on a film that systematically deconstructs patriarchy, capitalism, and the very brand that funded it. Mattel literally paid for a movie that calls Mattel out. This is the cinematic equivalent of a corporation accidentally funding its own roast, except Gerwig made sure the check cleared before they could read the script.

The genius is in the packaging. Pink. Sparkly. "Life in plastic, it's fantastic." Every marketing dollar spent on those hot-pink billboards was a dollar spent luring the exact audience that needed to hear America Ferrera's monologue about the impossible standards placed on women. Gerwig didn't sneak vegetables into the cake — she made the vegetables taste like cake.

**Ken Is Not the Joke You Think He Is**

Ryan Gosling's Ken is being misread by half the internet. He's not a parody of toxic masculinity — he's a portrait of what happens when masculinity has no identity beyond its relationship to femininity. His "Kenough" arc is genuinely moving, and if you laughed without feeling uncomfortable, you missed the point.

The Kendom sequence — where the Kens take over Barbieland and immediately install a bro-culture dystopia complete with horses, guitars, and constitutional amendments — is satire so precise it borders on prophecy. Replace "Barbieland" with any institution where women held power and men decided they wanted it back, and the allegory writes itself.

**The Ending They'll Argue About for Years**

Barbie chooses to become human. She chooses cellulite and mortality and gynecologist appointments over plastic perfection and immortality. This isn't a "message" — it's a thesis statement. Perfection is a prison. Identity requires vulnerability. You can't be "everything" and still be "someone."

The fact that this film grossed $1.4 billion — outearning Oppenheimer, outearning every other film that year — tells you something about where the culture actually is, regardless of what Twitter would have you believe.

**Verdict:** The discourse was wrong. "Barbie" isn't a guilty pleasure. It's just pleasure. And it's important.`
  },
  {
    title: 'The Art of the Long Take: How Modern Directors Are Redefining Cinematic Time',
    slug: 'art-of-long-take-modern-directors-redefining-cinematic-time',
    category: 'ESSAY',
    cover_image_url: 'https://image.tmdb.org/t/p/original/s66lbwWMEOOWpIEJYei0dkMGnME.jpg',
    body: `In an era of rapid-fire editing — where the average shot length in a Hollywood blockbuster has shrunk to under 2 seconds — a counter-movement is quietly reshaping cinema. The long take, once the exclusive domain of art-house auteurs like Tarkovsky and Béla Tarr, has become a weapon in the mainstream director's arsenal. But the way it's being used has changed fundamentally.

**From Technique to Philosophy**

When Alejandro González Iñárritu shot "Birdman" (2014) to appear as a single continuous take, he wasn't just showing off. The unbroken camera created claustrophobia — you couldn't escape Riggan Thomson's spiraling anxiety any more than he could. The technique was the theme: life doesn't cut away from your breakdowns.

Sam Mendes took this further with "1917" (2019), using the one-shot conceit to collapse the distance between viewer and soldier. You walk through No Man's Land in real time. You can't skip ahead. You can't look away. The long take becomes an act of empathy — forcing you to experience duration the way the characters do.

**The Digital Revolution**

What changed? Technology. The Steadicam liberated the camera from the tripod, but digital cinema liberated it from the film magazine. When you're not limited to 10-minute takes by the length of a film roll, suddenly a 20-minute unbroken shot becomes logistically possible. "Russian Ark" (2002) proved a feature-length single take was achievable. Everything since has been elaboration.

Alfonso Cuarón's "Children of Men" (2006) contains arguably the most famous long take in modern cinema — the car ambush sequence. But what makes it extraordinary isn't the technical achievement; it's the way the camera's refusal to cut away transforms an action scene into a humanitarian crisis unfolding in real time.

**The Paradox of the "Invisible" Cut**

Here's the irony: many of today's most celebrated "long takes" are stitched together from multiple shots using hidden cuts. "1917" is full of them — masked by whip-pans, characters passing behind objects, and momentary blackouts. Does this make them less valid?

I'd argue it doesn't matter. The effect on the viewer is identical. What matters is the contract between filmmaker and audience: "I will not give you the comfort of a cut. You will stay in this moment." Whether the take is genuinely unbroken or seamlessly assembled, the emotional experience is the same.

**Why It Matters Now**

In 2024, we consume most of our visual media in fragments — TikToks, Reels, Stories. The long take is a deliberate act of resistance against the attention economy. It says: slow down. Stay here. Watch this unfold. The directors who embrace it aren't being nostalgic — they're being radical.

Cinema has always been about the manipulation of time. The long take simply makes that manipulation visible — and in doing so, reminds us that the most powerful thing a filmmaker can do is make us forget we're watching a film at all.`
  },
  {
    title: 'The Forgotten Brilliance of Denis Villeneuve\'s Arrival',
    slug: 'forgotten-brilliance-denis-villeneuves-arrival',
    category: 'EDITORIAL',
    cover_image_url: 'https://image.tmdb.org/t/p/original/x2FJsf1ElAgr63Y3LU6LYIeOwk6.jpg',
    body: `In the shadow of "Dune" and its sequel, it's easy to forget that Denis Villeneuve made what might be the most intellectually rigorous science fiction film of the century. "Arrival" (2016) doesn't have sandworms or spice wars. It has linguistics. And it's magnificent.

**The Sapir-Whorf Hypothesis as Blockbuster**

"Arrival" is built on a radical premise: that learning an alien language could literally rewire your brain's perception of time. The Sapir-Whorf hypothesis — the idea that language shapes thought — is controversial in academic linguistics. But Villeneuve and screenwriter Eric Heisserer don't use it as pseudoscience; they use it as metaphor. What if understanding someone else's way of communicating didn't just change what you know, but changed how you experience existence?

Louise Banks (Amy Adams, in her best performance) doesn't just translate the heptapods' circular logograms — she begins to experience time as they do: non-linearly. Past, present, and future become simultaneous. The film's greatest trick is that it makes this cognitive shift happen to the audience too, through its structure.

**The Twist That Isn't a Twist**

When we realize that the "flashbacks" of Louise with her daughter are actually "flashforwards" — memories of a future she hasn't yet lived — the film doesn't ask us to feel clever for figuring it out. It asks us to feel devastated. Louise knows her daughter will die young. She knows her marriage will collapse. And she chooses to live that life anyway.

This isn't a plot twist. It's a philosophical argument: if you could see your entire life laid out before you — every joy and every tragedy — would you still choose to live it? "Arrival" says yes, and it earns that answer.

**Why We Need This Film Now**

In an era where first contact stories default to invasion narratives ("Independence Day," "Battle: Los Angeles," half the MCU), "Arrival" dares to suggest that the appropriate response to the unknown isn't a military strike — it's a conversation. The film's aliens don't come to conquer. They come to give. And the gift they offer — a new way of seeing time — is so profound that humanity nearly destroys itself fighting over who gets to unwrap it first.

Villeneuve understood something that too few filmmakers do: the most terrifying thing about encountering alien intelligence isn't that they might be hostile. It's that they might be so different from us that communication itself becomes the challenge. And the most hopeful thing is that we might rise to meet it.

"Arrival" is not a forgotten film — but it is an underappreciated one. In Villeneuve's filmography, it deserves to stand beside "Dune," not behind it.`
  }
];

async function seed() {
  let pool;
  try {
    pool = await new sql.ConnectionPool(config).connect();
    console.log('Connected to SQL Server.');

    // Get the first valid user to be the "author"
    const userResult = await pool.request().query(`
      SELECT TOP 1 User_ID FROM Users WHERE is_valid = 1 ORDER BY User_ID
    `);
    if (userResult.recordset.length === 0) {
      console.error('No valid users found. Please create a user first.');
      process.exit(1);
    }
    const authorId = userResult.recordset[0].User_ID;
    console.log(`Using Author ID: ${authorId}`);

    // Try to get a movie ID for the Oppenheimer article
    const movieResult = await pool.request().query(`
      SELECT Movie_ID, Title FROM Movies WHERE Title LIKE '%Oppenheimer%' OR Title LIKE '%Dark Knight%' OR Title LIKE '%Barbie%' OR Title LIKE '%Arrival%'
    `);
    const movieMap = {};
    for (const m of movieResult.recordset) {
      const t = m.Title.toLowerCase();
      if (t.includes('oppenheimer')) movieMap['oppenheimer'] = m.Movie_ID;
      if (t.includes('dark knight')) movieMap['dark-knight'] = m.Movie_ID;
      if (t.includes('barbie')) movieMap['barbie'] = m.Movie_ID;
      if (t.includes('arrival')) movieMap['arrival'] = m.Movie_ID;
    }
    console.log('Found movies:', movieMap);

    // Check existing articles to avoid duplicates
    const existingResult = await pool.request().query(`SELECT Slug FROM Articles`);
    const existingSlugs = new Set(existingResult.recordset.map(r => r.Slug));

    let inserted = 0;
    for (const article of articles) {
      if (existingSlugs.has(article.slug)) {
        console.log(`  Skipping "${article.title}" — slug already exists.`);
        continue;
      }

      // Map movie IDs where available
      let movieId = null;
      if (article.slug.includes('oppenheimer')) movieId = movieMap['oppenheimer'] || null;
      if (article.slug.includes('dark-knight')) movieId = movieMap['dark-knight'] || null;
      if (article.slug.includes('barbie')) movieId = movieMap['barbie'] || null;
      if (article.slug.includes('arrival')) movieId = movieMap['arrival'] || null;

      await pool.request()
        .input('authorId', sql.Int, authorId)
        .input('title', sql.VarChar(200), article.title)
        .input('slug', sql.VarChar(220), article.slug)
        .input('body', sql.VarChar(sql.MAX), article.body)
        .input('coverImageUrl', sql.VarChar(255), article.cover_image_url)
        .input('movieId', sql.Int, movieId)
        .input('category', sql.VarChar(50), article.category)
        .query(`
          INSERT INTO Articles (Author_ID, Title, Slug, Body, Cover_Image_URL, Movie_ID, Category, Status, Published_At)
          VALUES (@authorId, @title, @slug, @body, @coverImageUrl, @movieId, @category, 'approved', GETDATE())
        `);

      console.log(`  ✅ Inserted: "${article.title}" [${article.category}]`);
      inserted++;
    }

    console.log(`\nDone! Inserted ${inserted} articles.`);
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    if (pool) await pool.close();
    process.exit(0);
  }
}

seed();
