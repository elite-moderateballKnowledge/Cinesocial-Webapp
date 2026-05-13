const { poolPromise } = require('./backend/config/db');

async function run() {
  try {
    const pool = await poolPromise;
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Articles') AND name = 'Is_NSFW')
      BEGIN
          ALTER TABLE Articles ADD Is_NSFW BIT NOT NULL DEFAULT 0;
      END;
    `);
    console.log('Added Is_NSFW');
    
    await pool.request().query(`
      ALTER VIEW vw_PublishedArticles AS
      SELECT
          a.Article_ID,
          a.Author_ID,
          u.Username,
          u.flair_label,
          a.Title,
          a.Slug,
          a.Body,
          a.Cover_Image_URL,
          a.Status,
          a.Movie_ID,
          m.Title AS Movie_Title,
          a.Category,
          a.Created_At,
          a.Published_At,
          a.Updated_At,
          a.View_Count,
          a.Is_NSFW
      FROM Articles a
      JOIN Users u ON a.Author_ID = u.User_ID
      LEFT JOIN Movies m ON a.Movie_ID = m.Movie_ID
      WHERE a.Status = 'approved'
    `);
    console.log('Altered View vw_PublishedArticles');
    
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'System_Settings')
      BEGIN
          CREATE TABLE System_Settings (
              Setting_Key VARCHAR(50) PRIMARY KEY,
              Setting_Value VARCHAR(MAX)
          );
          INSERT INTO System_Settings (Setting_Key, Setting_Value) 
          VALUES ('Maintenance_Mode', 'false'), ('Disable_Signups', 'false');
      END;
    `);
    console.log('Created System_Settings');
    
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Article_Comments')
      BEGIN
          CREATE TABLE Article_Comments (
              Comment_ID INT IDENTITY(1,1) PRIMARY KEY,
              Article_ID INT NOT NULL,
              User_ID INT NOT NULL,
              Comment_Text TEXT NOT NULL,
              Created_At DATETIME DEFAULT GETDATE(),
              CONSTRAINT FK_Article_Comments_Article FOREIGN KEY (Article_ID) REFERENCES Articles(Article_ID) ON DELETE CASCADE,
              CONSTRAINT FK_Article_Comments_User FOREIGN KEY (User_ID) REFERENCES Users(User_ID)
          );
      END;
    `);
    console.log('Created Article_Comments');

    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
run();
