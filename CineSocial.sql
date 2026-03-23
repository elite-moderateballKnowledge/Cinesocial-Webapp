--Do not add any DML code to this section--
--Use futhur sql files that purpose--

CREATE TABLE Movies(
Movie_ID INT IDENTITY(1,1),
Title VARCHAR(200) NOT NULL,
M_Type VARCHAR(10) NOT NULL,
Release_date DATE,
Runtime INT,
Synopsis VARCHAR(1024),
M_Language VARCHAR(50),
Poster_URL VARCHAR(255),
Trailer_URL VARCHAR(255),
A_Rating DECIMAL DEFAULT 0,
Sequel_of INT,

PRIMARY KEY(Movie_ID)
);

CREATE TABLE Subscriptions(
Subscription_ID INT IDENTITY(1,1),
Plan_Name VARCHAR(30) NOT NULL UNIQUE,
Price_USD DECIMAL NOT NULL,
Duration_Days INT NOT NULL,
Can_Join_Parties BIT DEFAULT 0,
Can_Pin_Reviews BIT DEFAULT 0,
Has_Profile_Flair BIT DEFAULT 0,
Max_Party_Size INT DEFAULT 0,

PRIMARY KEY(Subscription_ID)
);

CREATE TABLE Users(
User_ID INT IDENTITY(1,1),
Username VARCHAR(50) NOT NULL,
Email VARCHAR(100) NOT NULL UNIQUE,
Password_hash VARCHAR(255) NOT NULL,
Join_date DATE DEFAULT CAST(GETDATE() AS DATE),
Bio TEXT,
is_banned BIT DEFAULT 0,
sub_ID INT,
sub_exp DATETIME,
is_valid BIT DEFAULT 1,
flair_label VARCHAR(100),
has_premium_flair BIT DEFAULT 0,
Profile_Pic_URL VARCHAR(255),
last_login DATETIME,

PRIMARY KEY(User_ID)
);

CREATE TABLE Admins(
Admin_ID INT IDENTITY(1,1),
A_Username VARCHAR(50) NOT NULL,
A_Password VARCHAR(255) NOT NULL,

PRIMARY KEY(Admin_ID),
UNIQUE(A_Username)
);

CREATE TABLE Friends(
U_ID INT,
F_ID INT,

PRIMARY KEY(U_ID, F_ID),
CHECK(U_ID != F_ID)
);

CREATE TABLE Activity(
Activity_ID INT IDENTITY(1,1),
User_ID INT,
Action_Type VARCHAR(50) NOT NULL,
Movie_ID INT,
Rating DECIMAL CHECK(Rating >= 0.5 AND Rating <= 5.0),
Review_text TEXT,
Entity_type VARCHAR(50),
Entity_ID INT,
IP_Address VARCHAR(45),
Time_stamp DATETIME DEFAULT GETDATE(),
Details TEXT,
Contains_spoiler BIT DEFAULT 0,
Is_pinned BIT DEFAULT 0,

PRIMARY KEY(Activity_ID)
);

CREATE TABLE Persons(
Person_ID INT IDENTITY(1,1),
Full_Name VARCHAR(100) NOT NULL,
BDate DATE,
Nationality VARCHAR(60),
Bio VARCHAR(1024),
Photo_URL VARCHAR(255),

PRIMARY KEY(Person_ID)
);

CREATE TABLE SubHistory(
History_ID INT IDENTITY(1,1),
User_ID INT,
Subscription_ID INT,
Start_Date DATETIME NOT NULL,
End_Date DATETIME NOT NULL,
Payment_Status VARCHAR(20),
Created_at DATETIME DEFAULT GETDATE(),

PRIMARY KEY(History_ID)
);

CREATE TABLE Genres(
G_ID INT IDENTITY(1,1),
G_Name VARCHAR(50) NOT NULL UNIQUE,
Niche VARCHAR(50),

PRIMARY KEY(G_ID)
);

CREATE TABLE M_Genres(
M_ID INT,
G_ID INT,

PRIMARY KEY(M_ID, G_ID)
);

CREATE TABLE M_Cast(
Cast_ID INT IDENTITY(1,1),
M_ID INT,
P_ID INT,
Role_Type VARCHAR(20) NOT NULL,
Character_Name VARCHAR(100),

PRIMARY KEY(Cast_ID)
);

CREATE TABLE Lists(
List_ID INT IDENTITY(1,1),
U_ID INT,
List_Title VARCHAR(100) NOT NULL,
L_Description TEXT,
is_watchlist BIT DEFAULT 0,
is_public BIT DEFAULT 1,
Created_Date DATE DEFAULT CAST(GETDATE() AS DATE),

PRIMARY KEY(List_ID)
);

CREATE TABLE ListMovies(
L_ID INT,
M_ID INT,
Edit_Date DATE DEFAULT CAST(GETDATE() AS DATE),
Watch_status VARCHAR(10),

PRIMARY KEY(L_ID, M_ID)
);

CREATE TABLE Parties(
Party_ID INT IDENTITY(1,1),
Party_Name VARCHAR(100) NOT NULL,
Created_By INT,
Movie_ID INT,
Created_at DATETIME DEFAULT GETDATE(),
Max_Members INT NOT NULL,
Invite_Code VARCHAR(20) UNIQUE,
Is_Active BIT DEFAULT 1,

PRIMARY KEY(Party_ID)
);

CREATE TABLE P_Members(
Party_ID INT,
User_ID INT,
Role VARCHAR(10) DEFAULT 'member',
Joined_Date DATETIME DEFAULT GETDATE(),

PRIMARY KEY(Party_ID, User_ID)
);

CREATE TABLE UserGenres(
User_ID INT,
G_ID INT,

PRIMARY KEY(User_ID, G_ID)
);


ALTER TABLE Movies
ADD CONSTRAINT FK_Movies_Sequel FOREIGN KEY(Sequel_of) REFERENCES Movies(Movie_ID);

ALTER TABLE Users
ADD CONSTRAINT FK_Users_Subscription FOREIGN KEY(sub_ID) REFERENCES Subscriptions(Subscription_ID);

ALTER TABLE Friends
ADD CONSTRAINT FK_Friends_User FOREIGN KEY(U_ID) REFERENCES Users(User_ID);

ALTER TABLE Friends
ADD CONSTRAINT FK_Friends_Friend FOREIGN KEY(F_ID) REFERENCES Users(User_ID);

ALTER TABLE Activity
ADD CONSTRAINT FK_Activity_User FOREIGN KEY(User_ID) REFERENCES Users(User_ID);

ALTER TABLE Activity
ADD CONSTRAINT FK_Activity_Movie FOREIGN KEY(Movie_ID) REFERENCES Movies(Movie_ID);

ALTER TABLE SubHistory
ADD CONSTRAINT FK_SubHistory_User FOREIGN KEY(User_ID) REFERENCES Users(User_ID);

ALTER TABLE SubHistory
ADD CONSTRAINT FK_SubHistory_Subscription FOREIGN KEY(Subscription_ID) REFERENCES Subscriptions(Subscription_ID);

ALTER TABLE M_Genres
ADD CONSTRAINT FK_MGenres_Movie FOREIGN KEY(M_ID) REFERENCES Movies(Movie_ID);

ALTER TABLE M_Genres
ADD CONSTRAINT FK_MGenres_Genre FOREIGN KEY(G_ID) REFERENCES Genres(G_ID);

ALTER TABLE M_Cast
ADD CONSTRAINT FK_MCast_Movie FOREIGN KEY(M_ID) REFERENCES Movies(Movie_ID);

ALTER TABLE M_Cast
ADD CONSTRAINT FK_MCast_Person FOREIGN KEY(P_ID) REFERENCES Persons(Person_ID);

ALTER TABLE Lists
ADD CONSTRAINT FK_Lists_User FOREIGN KEY(U_ID) REFERENCES Users(User_ID);

ALTER TABLE ListMovies
ADD CONSTRAINT FK_ListMovies_List FOREIGN KEY(L_ID) REFERENCES Lists(List_ID);

ALTER TABLE ListMovies
ADD CONSTRAINT FK_ListMovies_Movie FOREIGN KEY(M_ID) REFERENCES Movies(Movie_ID);

ALTER TABLE Parties
ADD CONSTRAINT FK_Parties_User FOREIGN KEY(Created_By) REFERENCES Users(User_ID);

ALTER TABLE Parties
ADD CONSTRAINT FK_Parties_Movie FOREIGN KEY(Movie_ID) REFERENCES Movies(Movie_ID);

ALTER TABLE P_Members
ADD CONSTRAINT FK_PMembers_Party FOREIGN KEY(Party_ID) REFERENCES Parties(Party_ID);

ALTER TABLE P_Members
ADD CONSTRAINT FK_PMembers_User FOREIGN KEY(User_ID) REFERENCES Users(User_ID);

ALTER TABLE UserGenres
ADD CONSTRAINT FK_UserGenres_User FOREIGN KEY(User_ID) REFERENCES Users(User_ID);

ALTER TABLE UserGenres
ADD CONSTRAINT FK_UserGenres_Genre FOREIGN KEY(G_ID) REFERENCES Genres(G_ID);

--Do not add any DML code to this section--
--Use futhur sql files that purpose--