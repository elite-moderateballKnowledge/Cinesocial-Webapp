--Test Data Set--

-- ============================================================
-- 1. SUBSCRIPTIONS (no FK deps)
-- ============================================================
INSERT INTO Subscriptions (Plan_Name, Price_USD, Duration_Days, Can_Join_Parties, Can_Pin_Reviews, Has_Profile_Flair, Max_Party_Size)
VALUES
    ('Free',       0.00,  0,   0, 0, 0,  0),
    ('Basic',      4.99,  30,  1, 0, 0,  5),
    ('Pro',        9.99,  30,  1, 1, 1, 15),
    ('Cinephile', 19.99, 365,  1, 1, 1, 50);

-- ============================================================
-- 2. GENRES (no FK deps)
-- ============================================================
INSERT INTO Genres (G_Name, Niche)
VALUES
    ('Action',      'Mainstream'),
    ('Drama',       'Mainstream'),
    ('Sci-Fi',      'Niche'),
    ('Thriller',    'Mainstream'),
    ('Horror',      'Niche'),
    ('Comedy',      'Mainstream'),
    ('Animation',   'Family'),
    ('Crime',       'Niche'),
    ('Biography',   'Niche'),
    ('Adventure',   'Mainstream'),
    ('Romance',     'Mainstream'),
    ('Mystery',     'Niche'),
    ('Fantasy',     'Niche'),
    ('Documentary', 'Niche'),
    ('War',         'Niche');

-- ============================================================
-- 3. PERSONS (no FK deps)
-- ============================================================
INSERT INTO Persons (Full_Name, BDate, Nationality, Bio, Photo_URL)
VALUES
    ('Christopher Nolan',   '1970-07-30', 'British-American', 'Director known for mind-bending narratives and practical effects.', 'https://images.example.com/persons/nolan.jpg'),
    ('Leonardo DiCaprio',   '1974-11-11', 'American',         'Oscar-winning actor and environmental activist.', 'https://images.example.com/persons/dicaprio.jpg'),
    ('Joseph Gordon-Levitt','1981-02-17', 'American',         'Versatile actor known for independent and blockbuster films.', 'https://images.example.com/persons/jgl.jpg'),
    ('Elliot Page',         '1987-02-21', 'Canadian',         'Award-winning actor and LGBTQ+ activist.', 'https://images.example.com/persons/page.jpg'),
    ('Tom Hardy',           '1977-09-15', 'British',          'Character actor known for physical transformations.', 'https://images.example.com/persons/hardy.jpg'),
    ('Hans Zimmer',         '1957-09-12', 'German-American',  'Legendary film composer with hundreds of scores.', 'https://images.example.com/persons/zimmer.jpg'),
    ('Matthew McConaughey', '1969-11-04', 'American',         'Oscar-winning actor and producer.', 'https://images.example.com/persons/mcconaughey.jpg'),
    ('Anne Hathaway',       '1982-11-12', 'American',         'Oscar-winning actress and activist.', 'https://images.example.com/persons/hathaway.jpg'),
    ('Quentin Tarantino',   '1963-03-27', 'American',         'Director known for nonlinear storytelling and sharp dialogue.', 'https://images.example.com/persons/tarantino.jpg'),
    ('John Travolta',       '1954-02-18', 'American',         'Actor and dancer known for iconic film roles.', 'https://images.example.com/persons/travolta.jpg'),
    ('Samuel L. Jackson',   '1948-12-21', 'American',         'One of the highest-grossing actors in history.', 'https://images.example.com/persons/sjackson.jpg'),
    ('Uma Thurman',         '1970-04-29', 'American',         'Actress and model known for Pulp Fiction and Kill Bill.', 'https://images.example.com/persons/thurman.jpg'),
    ('Ridley Scott',        '1937-11-30', 'British',          'Director of Alien, Blade Runner, and Gladiator.', 'https://images.example.com/persons/scott.jpg'),
    ('Joaquin Phoenix',     '1974-10-28', 'American',         'Oscar-winning actor known for intense character studies.', 'https://images.example.com/persons/phoenix.jpg'),
    ('Zazie Beetz',         '1991-06-01', 'German-American',  'Actress known for Atlanta and Joker.', 'https://images.example.com/persons/beetz.jpg'),
    ('David Fincher',       '1962-08-28', 'American',         'Director known for dark, meticulous thrillers.', 'https://images.example.com/persons/fincher.jpg'),
    ('Brad Pitt',           '1963-12-18', 'American',         'Oscar-winning actor and producer.', 'https://images.example.com/persons/pitt.jpg'),
    ('Morgan Freeman',      '1937-06-01', 'American',         'Acclaimed actor known for his distinctive voice and gravitas.', 'https://images.example.com/persons/freeman.jpg'),
    ('Bong Joon-ho',        '1969-09-14', 'South Korean',     'Director who won the Palme d''Or and four Oscars for Parasite.', 'https://images.example.com/persons/bongjoonho.jpg'),
    ('Song Kang-ho',        '1967-01-17', 'South Korean',     'Leading actor of Korean cinema for three decades.', 'https://images.example.com/persons/songkangho.jpg'),
    ('Denis Villeneuve',    '1967-10-03', 'Canadian',         'Director of Arrival, Blade Runner 2049, and Dune.', 'https://images.example.com/persons/villeneuve.jpg'),
    ('Timothée Chalamet',   '2000-10-28', 'American-French',  'Young leading actor known for dramatic and literary adaptations.', 'https://images.example.com/persons/chalamet.jpg'),
    ('Zendaya',             '1996-09-01', 'American',         'Actress, singer, and fashion icon known for Euphoria and Dune.', 'https://images.example.com/persons/zendaya.jpg'),
    ('Robert Zemeckis',     '1951-05-14', 'American',         'Director of Forrest Gump, Back to the Future, and Cast Away.', 'https://images.example.com/persons/zemeckis.jpg'),
    ('Tom Hanks',           '1956-07-09', 'American',         'Two-time Oscar winner and one of Hollywood''s most beloved actors.', 'https://images.example.com/persons/hanks.jpg');

-- ============================================================
-- 4. MOVIES (Sequel_of references within this table)
-- ============================================================
INSERT INTO Movies (Title, M_Type, Release_date, Runtime, Synopsis, M_Language, Poster_URL, Trailer_URL, A_Rating, Sequel_of)
VALUES
-- Movie_ID 1
('Inception',
 'Movie',
 '2010-07-16',
 148,
 'A skilled thief who steals secrets from people''s dreams is offered a chance to have his criminal record erased if he can implant an idea into a target''s subconscious.',
 'English',
 'https://images.example.com/posters/inception.jpg',
 'https://youtube.com/watch?v=YoHD9XEInc0',
 4.7,
 NULL),

-- Movie_ID 2
('Interstellar',
 'Movie',
 '2014-11-07',
 169,
 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity''s survival as Earth faces environmental collapse.',
 'English',
 'https://images.example.com/posters/interstellar.jpg',
 'https://youtube.com/watch?v=zSWdZVtXT7E',
 4.6,
 NULL),

-- Movie_ID 3
('The Dark Knight',
 'Movie',
 '2008-07-18',
 152,
 'Batman raises the stakes in his war on crime as the Joker — a criminal mastermind — wreaks havoc and chaos on the people of Gotham.',
 'English',
 'https://images.example.com/posters/darkknight.jpg',
 'https://youtube.com/watch?v=EXeTwQWrcwY',
 4.9,
 NULL),

-- Movie_ID 4
('The Dark Knight Rises',
 'Movie',
 '2012-07-20',
 164,
 'Eight years after the Joker''s reign of anarchy, the masked villain Bane forces a broken-out-of-retirement Batman to defend Gotham once more.',
 'English',
 'https://images.example.com/posters/dkr.jpg',
 'https://youtube.com/watch?v=g8evyE9TuYk',
 4.3,
 3),  -- sequel of The Dark Knight

-- Movie_ID 5
('Pulp Fiction',
 'Movie',
 '1994-10-14',
 154,
 'The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.',
 'English',
 'https://images.example.com/posters/pulpfiction.jpg',
 'https://youtube.com/watch?v=s7EdQ4FqbhY',
 4.8,
 NULL),

-- Movie_ID 6
('Joker',
 'Movie',
 '2019-10-04',
 122,
 'A mentally troubled comedian in Gotham City spirals into madness and becomes the criminal mastermind known as the Joker.',
 'English',
 'https://images.example.com/posters/joker.jpg',
 'https://youtube.com/watch?v=zAGVQLHvwOY',
 4.2,
 NULL),

-- Movie_ID 7
('Se7en',
 'Movie',
 '1995-09-22',
 127,
 'Two detectives — a veteran and his new partner — hunt a serial killer who uses the seven deadly sins as his modus operandi.',
 'English',
 'https://images.example.com/posters/se7en.jpg',
 'https://youtube.com/watch?v=znmZoVkCjpI',
 4.6,
 NULL),

-- Movie_ID 8
('Parasite',
 'Movie',
 '2019-05-30',
 132,
 'A poor family schemes to become employed by a wealthy family by infiltrating their household and posing as unrelated, highly qualified individuals.',
 'Korean',
 'https://images.example.com/posters/parasite.jpg',
 'https://youtube.com/watch?v=5xH0HfJHsaY',
 4.7,
 NULL),

-- Movie_ID 9
('Dune',
 'Movie',
 '2021-10-22',
 155,
 'Paul Atreides, a brilliant and gifted young man born into a great destiny, must travel to the most dangerous planet in the universe to protect his family and people.',
 'English',
 'https://images.example.com/posters/dune.jpg',
 'https://youtube.com/watch?v=n9xhJrPXop4',
 4.3,
 NULL),

-- Movie_ID 10
('Dune: Part Two',
 'Movie',
 '2024-03-01',
 166,
 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
 'English',
 'https://images.example.com/posters/dune2.jpg',
 'https://youtube.com/watch?v=Way9Dexny3w',
 4.5,
 9),  -- sequel of Dune

-- Movie_ID 11
('Forrest Gump',
 'Movie',
 '1994-07-06',
 142,
 'The presidencies of Kennedy and Johnson, Vietnam, Watergate, and other historical events unfold through the perspective of an Alabama man with a low IQ.',
 'English',
 'https://images.example.com/posters/forrestgump.jpg',
 'https://youtube.com/watch?v=bLvqoHBptjg',
 4.7,
 NULL),

-- Movie_ID 12
('Gladiator',
 'Movie',
 '2000-05-05',
 155,
 'A Roman general is betrayed and his family murdered by a corrupt prince, who then must fight as a gladiator in the arena to exact his vengeance.',
 'English',
 'https://images.example.com/posters/gladiator.jpg',
 'https://youtube.com/watch?v=owK1qxDselE',
 4.5,
 NULL),

-- Movie_ID 13
('The Shawshank Redemption',
 'Movie',
 '1994-09-23',
 142,
 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.',
 'English',
 'https://images.example.com/posters/shawshank.jpg',
 'https://youtube.com/watch?v=6hB3S9bIaco',
 5.0,
 NULL),

-- Movie_ID 14
('Spirited Away',
 'Movie',
 '2001-07-20',
 125,
 'During her family''s move to the suburbs, a sulky 10-year-old girl wanders into a world ruled by gods, witches, and spirits, where humans are changed into beasts.',
 'Japanese',
 'https://images.example.com/posters/spiritedaway.jpg',
 'https://youtube.com/watch?v=ByXuk9QqQkk',
 4.8,
 NULL),

-- Movie_ID 15
('Get Out',
 'Movie',
 '2017-02-24',
 104,
 'A young African-American visits his white girlfriend''s parents for the weekend, where his uneasiness about their overly accommodating behaviour soon transforms into terror.',
 'English',
 'https://images.example.com/posters/getout.jpg',
 'https://youtube.com/watch?v=DzfpyUB60YY',
 4.2,
 NULL);

-- ============================================================
-- 5. USERS (sub_ID refs Subscriptions; some NULL = Free tier)
-- ============================================================
INSERT INTO Users (Username, Email, Password_hash, Join_date, Bio, is_banned, sub_ID, sub_exp, is_valid, flair_label, has_premium_flair, Profile_Pic_URL, last_login)
VALUES
('cinephile_max',   'max@email.com',      '$2b$12$aXdummy1hash', '2023-01-15', 'Movie lover. Nolan fanatic.',            0, 3, '2025-12-31 00:00:00', 1, 'Pro Critic',   1, 'https://pics.example.com/max.jpg',    '2025-01-10 21:30:00'),
('reelqueen_sara',  'sara@email.com',     '$2b$12$aXdummy2hash', '2023-03-22', 'I watch everything. Judge nothing.',     0, 4, '2025-12-31 00:00:00', 1, 'Cinephile',    1, 'https://pics.example.com/sara.jpg',   '2025-01-11 19:00:00'),
('thriller_jose',   'jose@email.com',     '$2b$12$aXdummy3hash', '2023-05-10', 'Thrillers and crime only.',              0, 2, '2025-06-30 00:00:00', 1, NULL,           0, 'https://pics.example.com/jose.jpg',   '2025-01-09 23:15:00'),
('horrorking_li',   'li@email.com',       '$2b$12$aXdummy4hash', '2023-07-04', 'Scream if you can.',                     0, NULL, NULL,               1, NULL,           0, 'https://pics.example.com/li.jpg',     '2025-01-08 00:45:00'),
('popcorn_andy',    'andy@email.com',     '$2b$12$aXdummy5hash', '2023-09-18', 'Casual viewer. Popcorn required.',       0, 2, '2025-03-31 00:00:00', 1, NULL,           0, 'https://pics.example.com/andy.jpg',   '2025-01-11 18:00:00'),
('filmcritic_zoe',  'zoe@email.com',      '$2b$12$aXdummy6hash', '2024-01-01', 'Writing about film since 2019.',         0, 3, '2025-12-31 00:00:00', 1, 'Verified Critic', 1, 'https://pics.example.com/zoe.jpg', '2025-01-11 10:20:00'),
('silentscreen_kim','kim@email.com',      '$2b$12$aXdummy7hash', '2024-02-14', 'Silent films and Kubrick.',              0, NULL, NULL,               1, NULL,           0, 'https://pics.example.com/kim.jpg',    '2025-01-07 16:00:00'),
('blockbuster_raj', 'raj@email.com',      '$2b$12$aXdummy8hash', '2024-03-30', 'Superhero movies are cinema.',           0, 2, '2025-04-30 00:00:00', 1, NULL,           0, 'https://pics.example.com/raj.jpg',    '2025-01-10 14:00:00'),
('arthouselena',    'lena@email.com',     '$2b$12$aXdummy9hash', '2024-05-20', 'Arthouse. Slow cinema. Subtitles.',      0, 4, '2026-05-20 00:00:00', 1, 'Cinephile',    1, 'https://pics.example.com/lena.jpg',   '2025-01-11 22:00:00'),
('baduser_x',       'banned@email.com',   '$2b$12$aXdummyAhash', '2024-06-01', 'Spam reviewer.',                         1, NULL, NULL,               0, NULL,           0, NULL,                                  '2024-12-01 10:00:00');

-- ============================================================
-- 6. ADMINS
-- ============================================================
INSERT INTO Admins (A_Username, A_Password)
VALUES
    ('superadmin',  '$2b$12$adminHashAAA'),
    ('mod_priya',   '$2b$12$adminHashBBB');

-- ============================================================
-- 7. FRIENDS (U_ID, F_ID — bidirectional pairs)
-- ============================================================
INSERT INTO Friends (U_ID, F_ID)
VALUES
    (1, 2), (2, 1),
    (1, 3), (3, 1),
    (2, 6), (6, 2),
    (3, 5), (5, 3),
    (4, 7), (7, 4),
    (6, 9), (9, 6),
    (8, 1), (1, 8);

-- ============================================================
-- 8. SUB HISTORY
-- ============================================================
INSERT INTO SubHistory (User_ID, Subscription_ID, Start_Date, End_Date, Payment_Status)
VALUES
    (1,  2, '2023-01-15 00:00:00', '2023-02-14 00:00:00', 'Paid'),
    (1,  3, '2023-02-15 00:00:00', '2025-12-31 00:00:00', 'Paid'),
    (2,  4, '2023-03-22 00:00:00', '2025-12-31 00:00:00', 'Paid'),
    (3,  2, '2024-12-31 00:00:00', '2025-06-30 00:00:00', 'Paid'),
    (5,  2, '2024-12-31 00:00:00', '2025-03-31 00:00:00', 'Paid'),
    (6,  3, '2024-01-01 00:00:00', '2025-12-31 00:00:00', 'Paid'),
    (8,  2, '2024-12-31 00:00:00', '2025-04-30 00:00:00', 'Paid'),
    (9,  4, '2024-05-20 00:00:00', '2026-05-20 00:00:00', 'Paid'),
    (10, 2, '2024-06-01 00:00:00', '2024-07-01 00:00:00', 'Refunded');

-- ============================================================
-- 9. ACTIVITY (reviews, ratings, bans, logins, etc.)
--    Action_Type values: REVIEW, RATE, BAN, LOGIN, PIN, WATCH
-- ============================================================
INSERT INTO Activity (User_ID, Action_Type, Movie_ID, Rating, Review_text, Entity_type, Entity_ID, IP_Address, Contains_spoiler, Is_pinned, Details)
VALUES
-- Reviews for Inception (Movie 1)
(1, 'REVIEW', 1,  4.5, 'A layered masterpiece. The dream-within-a-dream concept still blows my mind on every rewatch.', 'Movie', 1, '192.168.1.1', 0, 1, NULL),
(2, 'REVIEW', 1,  5.0, 'Nolan at his absolute best. The practical effects and Zimmer''s score make it unforgettable.', 'Movie', 1, '192.168.1.2', 0, 0, NULL),
(3, 'REVIEW', 1,  4.0, 'Great movie, though it gets a bit cold emotionally. Still a technical marvel.', 'Movie', 1, '192.168.1.3', 0, 0, NULL),
(6, 'REVIEW', 1,  4.5, 'The third act in zero-gravity is one of the most creative sequences in modern cinema.', 'Movie', 1, '192.168.1.6', 0, 0, NULL),

-- Reviews for Interstellar (Movie 2)
(1, 'REVIEW', 2,  5.0, 'The docking scene with the spinning station still gives me chills. Zimmer''s organ score is genius.', 'Movie', 2, '192.168.1.1', 0, 0, NULL),
(2, 'REVIEW', 2,  4.5, 'Emotionally devastating. The time dilation scenes are unlike anything in sci-fi.', 'Movie', 2, '192.168.1.2', 0, 0, NULL),
(9, 'REVIEW', 2,  4.0, 'Beautiful but the ending loses me. The love-as-a-dimension concept is a bit too much.', 'Movie', 2, '192.168.1.9', 1, 0, NULL),

-- Reviews for The Dark Knight (Movie 3)
(1, 'REVIEW', 3,  5.0, 'Ledger''s Joker is the greatest villain performance in cinema history. Period.', 'Movie', 3, '192.168.1.1', 0, 0, NULL),
(8, 'REVIEW', 3,  5.0, 'Not just a superhero film — a crime epic on par with Heat and The Godfather.', 'Movie', 3, '192.168.1.8', 0, 0, NULL),
(3, 'REVIEW', 3,  4.5, 'The interrogation scenes between Batman and Joker are electrifying. IMAX was the right call.', 'Movie', 3, '192.168.1.3', 0, 0, NULL),

-- Reviews for Pulp Fiction (Movie 5)
(2, 'REVIEW', 5,  5.0, 'The gold standard of non-linear storytelling. Every character feels vividly real.', 'Movie', 5, '192.168.1.2', 0, 0, NULL),
(6, 'REVIEW', 5,  4.5, 'Tarantino''s dialogue is its own art form. Could listen to Travolta and Jackson talk all day.', 'Movie', 5, '192.168.1.6', 0, 1, NULL),
(9, 'REVIEW', 5,  4.0, 'Stylish, violent, funny. A film that defines a generation of filmmakers.', 'Movie', 5, '192.168.1.9', 0, 0, NULL),

-- Reviews for Joker (Movie 6)
(4, 'REVIEW', 6,  4.5, 'Phoenix deserved every award. A dark, uncomfortable, necessary film.', 'Movie', 6, '192.168.1.4', 0, 0, NULL),
(5, 'REVIEW', 6,  3.5, 'Good performance but the script borrows too heavily from Scorsese''s work.', 'Movie', 6, '192.168.1.5', 0, 0, NULL),

-- Reviews for Se7en (Movie 7)
(3, 'REVIEW', 7,  5.0, 'The ending is one of cinema''s great gut-punches. Fincher was already a master at 32.', 'Movie', 7, '192.168.1.3', 1, 0, NULL),
(6, 'REVIEW', 7,  4.5, 'The rain, the grime, the dread. Every frame drips with atmosphere.', 'Movie', 7, '192.168.1.6', 0, 0, NULL),

-- Reviews for Parasite (Movie 8)
(9, 'REVIEW', 8,  5.0, 'The most perfectly constructed screenplay of the decade. Class anxiety through a genre lens.', 'Movie', 8, '192.168.1.9', 0, 0, NULL),
(2, 'REVIEW', 8,  4.5, 'First film in a foreign language to win Best Picture and it deserved every single vote.', 'Movie', 8, '192.168.1.2', 0, 0, NULL),
(7, 'REVIEW', 8,  4.5, 'Bong Joon-ho is a genius. The stairs motif alone deserves an essay.', 'Movie', 8, '192.168.1.7', 0, 0, NULL),

-- Reviews for Dune (Movie 9)
(1, 'REVIEW', 9,  4.0, 'A stunning visual achievement. Villeneuve turned the unfilmable into poetry.', 'Movie', 9, '192.168.1.1', 0, 0, NULL),
(8, 'REVIEW', 9,  3.5, 'Gorgeous but feels like half a movie. Part Two redeemed it though.', 'Movie', 9, '192.168.1.8', 0, 0, NULL),

-- Reviews for Dune Part Two (Movie 10)
(1, 'REVIEW', 10, 4.5, 'Everything the first film promised, fully delivered. Chalamet and Zendaya are electric.', 'Movie', 10, '192.168.1.1', 0, 0, NULL),
(9, 'REVIEW', 10, 5.0, 'One of the greatest sci-fi epics ever made. The arena sequence is jaw-dropping.', 'Movie', 10, '192.168.1.9', 0, 0, NULL),

-- Reviews for Forrest Gump (Movie 11)
(5, 'REVIEW', 11, 4.5, 'Tom Hanks at the peak of his powers. Life is indeed like a box of chocolates.', 'Movie', 11, '192.168.1.5', 0, 0, NULL),
(7, 'REVIEW', 11, 4.0, 'Sentimental but genuinely moving. A snapshot of American history through the eyes of innocence.', 'Movie', 11, '192.168.1.7', 0, 0, NULL),

-- Reviews for Shawshank (Movie 13)
(2, 'REVIEW', 13, 5.0, 'Possibly the most re-watchable film ever made. Hope is a good thing.', 'Movie', 13, '192.168.1.2', 0, 0, NULL),
(5, 'REVIEW', 13, 5.0, 'Morgan Freeman''s narration alone makes it worth watching. A perfect film.', 'Movie', 13, '192.168.1.5', 0, 0, NULL),
(6, 'REVIEW', 13, 4.5, 'Darabont''s direction is restrained and powerful. The ultimate feel-good film without being cheap.', 'Movie', 13, '192.168.1.6', 0, 0, NULL),

-- Reviews for Spirited Away (Movie 14)
(7, 'REVIEW', 14, 5.0, 'Studio Ghibli''s magnum opus. Every frame is a painting, every moment feels alive.', 'Movie', 14, '192.168.1.7', 0, 0, NULL),
(9, 'REVIEW', 14, 4.5, 'Miyazaki''s imagination is boundless. A film that works on every level for every age.', 'Movie', 14, '192.168.1.9', 0, 0, NULL),

-- Reviews for Get Out (Movie 15)
(4, 'REVIEW', 15, 4.5, 'Peele turned social anxiety into horror and it works terrifyingly well.', 'Movie', 15, '192.168.1.4', 0, 0, NULL),

-- BAN action
(1, 'BAN', NULL, NULL, NULL, 'User', 10, '10.0.0.1', 0, 0, 'User banned for repeated spam reviews.');

-- ============================================================
-- 10. M_GENRES (Movie ↔ Genre many-to-many)
-- ============================================================
-- Inception (1): Sci-Fi, Action, Thriller
INSERT INTO M_Genres (M_ID, G_ID) VALUES (1, 3), (1, 1), (1, 4);
-- Interstellar (2): Sci-Fi, Drama, Adventure
INSERT INTO M_Genres (M_ID, G_ID) VALUES (2, 3), (2, 2), (2, 10);
-- The Dark Knight (3): Action, Crime, Drama, Thriller
INSERT INTO M_Genres (M_ID, G_ID) VALUES (3, 1), (3, 8), (3, 2), (3, 4);
-- The Dark Knight Rises (4): Action, Crime, Drama
INSERT INTO M_Genres (M_ID, G_ID) VALUES (4, 1), (4, 8), (4, 2);
-- Pulp Fiction (5): Crime, Drama, Thriller
INSERT INTO M_Genres (M_ID, G_ID) VALUES (5, 8), (5, 2), (5, 4);
-- Joker (6): Crime, Drama, Thriller
INSERT INTO M_Genres (M_ID, G_ID) VALUES (6, 8), (6, 2), (6, 4);
-- Se7en (7): Crime, Drama, Mystery, Thriller
INSERT INTO M_Genres (M_ID, G_ID) VALUES (7, 8), (7, 2), (7, 12), (7, 4);
-- Parasite (8): Drama, Thriller, Comedy
INSERT INTO M_Genres (M_ID, G_ID) VALUES (8, 2), (8, 4), (8, 6);
-- Dune (9): Sci-Fi, Adventure, Drama
INSERT INTO M_Genres (M_ID, G_ID) VALUES (9, 3), (9, 10), (9, 2);
-- Dune Part Two (10): Sci-Fi, Adventure, Action
INSERT INTO M_Genres (M_ID, G_ID) VALUES (10, 3), (10, 10), (10, 1);
-- Forrest Gump (11): Drama, Romance, Comedy
INSERT INTO M_Genres (M_ID, G_ID) VALUES (11, 2), (11, 11), (11, 6);
-- Gladiator (12): Action, Adventure, Drama
INSERT INTO M_Genres (M_ID, G_ID) VALUES (12, 1), (12, 10), (12, 2);
-- Shawshank (13): Drama
INSERT INTO M_Genres (M_ID, G_ID) VALUES (13, 2);
-- Spirited Away (14): Animation, Adventure, Fantasy
INSERT INTO M_Genres (M_ID, G_ID) VALUES (14, 7), (14, 10), (14, 13);
-- Get Out (15): Horror, Mystery, Thriller
INSERT INTO M_Genres (M_ID, G_ID) VALUES (15, 5), (15, 12), (15, 4);

-- ============================================================
-- 11. M_CAST (Movie ↔ Person with roles)
-- ============================================================
INSERT INTO M_Cast (M_ID, P_ID, Role_Type, Character_Name)
VALUES
-- Inception
(1, 1,  'Director',  NULL),
(1, 2,  'Actor',     'Dom Cobb'),
(1, 3,  'Actor',     'Arthur'),
(1, 4,  'Actor',     'Ariadne'),
(1, 5,  'Actor',     'Eames'),
(1, 6,  'Composer',  NULL),
-- Interstellar
(2, 1,  'Director',  NULL),
(2, 7,  'Actor',     'Cooper'),
(2, 8,  'Actor',     'Amelia Brand'),
(2, 6,  'Composer',  NULL),
-- The Dark Knight
(3, 1,  'Director',  NULL),
(3, 5,  'Actor',     'Bane'),
-- The Dark Knight Rises
(4, 1,  'Director',  NULL),
(4, 5,  'Actor',     'Bane'),
-- Pulp Fiction
(5, 9,  'Director',  NULL),
(5, 10, 'Actor',     'Vincent Vega'),
(5, 11, 'Actor',     'Jules Winnfield'),
(5, 12, 'Actor',     'Mia Wallace'),
-- Joker
(6, 14, 'Actor',     'Arthur Fleck / Joker'),
(6, 15, 'Actor',     'Sophie Dumond'),
-- Se7en
(7, 16, 'Director',  NULL),
(7, 17, 'Actor',     'Detective Mills'),
(7, 18, 'Actor',     'Detective Somerset'),
-- Parasite
(8, 19, 'Director',  NULL),
(8, 20, 'Actor',     'Ki-taek'),
-- Dune
(9, 21, 'Director',  NULL),
(9, 22, 'Actor',     'Paul Atreides'),
(9, 23, 'Actor',     'Chani'),
-- Dune Part Two
(10, 21,'Director',  NULL),
(10, 22,'Actor',     'Paul Atreides'),
(10, 23,'Actor',     'Chani'),
-- Forrest Gump
(11, 24,'Director',  NULL),
(11, 25,'Actor',     'Forrest Gump'),
-- Gladiator
(12, 13,'Director',  NULL),
-- Shawshank
(13, 18,'Actor',     'Ellis Boyd ''Red'' Redding'),
-- Spirited Away
-- Get Out
(15, 11,'Actor',     'Rod Williams');

-- ============================================================
-- 12. LISTS (Watchlists and curated lists)
-- ============================================================
INSERT INTO Lists (U_ID, List_Title, L_Description, is_watchlist, is_public)
VALUES
(1, 'My Watchlist',              'Films I need to watch.',              1, 0),
(1, 'Nolan Universe',            'Every Christopher Nolan film ranked.', 0, 1),
(2, 'My Watchlist',              'Queue.',                               1, 0),
(2, 'Best of the 90s',           'The decade that defined modern cinema.',0, 1),
(3, 'Thriller Marathon',         'Back-to-back thrillers for the weekend.',0,1),
(6, 'Critics'' Picks',           'Films every cinephile must see.',      0, 1),
(7, 'Arthouse Essentials',       'Slow cinema and foreign language gems.',0, 1),
(9, 'International Cinema',      'The best non-English films.',           0, 1),
(4, 'My Watchlist',              'Horror and dark films.',               1, 0),
(5, 'Weekend Watchlist',         NULL,                                   1, 0);

-- ============================================================
-- 13. LIST MOVIES (movies inside lists)
-- ============================================================
INSERT INTO ListMovies (L_ID, M_ID, Watch_status)
VALUES
-- List 1: User 1 watchlist
(1, 6,  'pending'),
(1, 12, 'pending'),
(1, 15, 'watching'),
-- List 2: Nolan Universe (User 1)
(2, 1,  'watched'),
(2, 2,  'watched'),
(2, 3,  'watched'),
(2, 4,  'watched'),
-- List 3: User 2 watchlist
(3, 9,  'pending'),
(3, 10, 'pending'),
(3, 14, 'watching'),
-- List 4: Best of the 90s (User 2)
(4, 5,  'watched'),
(4, 7,  'watched'),
(4, 11, 'watched'),
(4, 13, 'watched'),
-- List 5: Thriller Marathon (User 3)
(5, 5,  'watched'),
(5, 6,  'watched'),
(5, 7,  'pending'),
(5, 15, 'pending'),
-- List 6: Critics Picks (User 6)
(6, 8,  'watched'),
(6, 13, 'watched'),
(6, 14, 'watched'),
-- List 7: Arthouse Essentials (User 7)
(7, 14, 'watched'),
(7, 8,  'watched'),
-- List 8: International Cinema (User 9)
(8, 8,  'watched'),
(8, 14, 'watched'),
(8, 6,  'pending'),
-- List 9: User 4 watchlist
(9, 15, 'watched'),
(9, 6,  'watched'),
-- List 10: User 5 weekend watchlist
(10, 11,'pending'),
(10, 13,'watched');

-- ============================================================
-- 14. PARTIES (watch parties — requires sub with Can_Join_Parties)
-- ============================================================
INSERT INTO Parties (Party_Name, Created_By, Movie_ID, Max_Members, Invite_Code, Is_Active)
VALUES
('Nolan Night',             1, 1,  10, 'NOLAN2025',  1),
('Parasite Watch-Along',    2, 8,  8,  'PARA8008',   1),
('90s Crime Night',         3, 5,  6,  'PULP1994',   1),
('Dune Rewatch Party',      9, 10, 15, 'DUNE2024',   1),
('Shawshank Classic',       6, 13, 12, 'SHAW1994',   0);

-- ============================================================
-- 15. P_MEMBERS (party members)
-- ============================================================
INSERT INTO P_Members (Party_ID, User_ID, Role)
VALUES
-- Party 1: Nolan Night
(1, 1, 'host'),
(1, 2, 'member'),
(1, 3, 'member'),
(1, 8, 'member'),
-- Party 2: Parasite
(2, 2, 'host'),
(2, 9, 'member'),
(2, 7, 'member'),
-- Party 3: 90s Crime
(3, 3, 'host'),
(3, 5, 'member'),
(3, 6, 'member'),
-- Party 4: Dune
(4, 9, 'host'),
(4, 1, 'member'),
(4, 2, 'member'),
(4, 6, 'member'),
-- Party 5: Shawshank (inactive)
(5, 6, 'host'),
(5, 2, 'member');

-- ============================================================
-- 16. USER GENRES (user preference tags)
-- ============================================================
INSERT INTO UserGenres (User_ID, G_ID)
VALUES
(1, 3),  -- max: Sci-Fi
(1, 4),  -- max: Thriller
(1, 1),  -- max: Action
(2, 2),  -- sara: Drama
(2, 8),  -- sara: Crime
(2, 3),  -- sara: Sci-Fi
(3, 4),  -- jose: Thriller
(3, 8),  -- jose: Crime
(4, 5),  -- li: Horror
(4, 12), -- li: Mystery
(5, 6),  -- andy: Comedy
(5, 2),  -- andy: Drama
(6, 2),  -- zoe: Drama
(6, 8),  -- zoe: Crime
(6, 3),  -- zoe: Sci-Fi
(7, 7),  -- kim: Animation
(7, 13), -- kim: Fantasy
(8, 1),  -- raj: Action
(8, 10), -- raj: Adventure
(9, 2),  -- lena: Drama
(9, 14); -- lena: Documentary