CREATE TABLE eikusers(
    id serial PRIMARY key,
    ssn INTEGER NOT NULL DEFAULT -1,
    email varchar(255) NOT NULL DEFAULT '',
    password VARCHAR(255) NOT NULL DEFAULT '', 
    invitationkey varchar(255) NOT NULL DEFAULT '',
    phone INTEGER NOT NULL DEFAULT -1,
    phoneid VARCHAR(255) NOT NULL DEFAULT '',
    name VARCHAR(255) NOT NULL DEFAULT '',
    sex varchar(255) NOT NULL DEFAULT '',
    socialposition varchar(255) NOT NULL DEFAULT '',
    address varchar(255) NOT NULL DEFAULT '',
    surveystaken integer[] NOT NULL DEFAULT '{}',
    loggedin INTEGER NOT NULL DEFAULT 0,
    DATECreated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lastActivityDate TIMESTAMP NOT NULL DEFAULT now()
);