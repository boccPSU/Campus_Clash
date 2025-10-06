-- SQLite
CREATE TABLE Users (
    uid int IDENTITY(1, 1) PRIMARY KEY,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL
)