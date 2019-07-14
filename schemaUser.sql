CREATE TABLE eikusers(
    key serial primary key,
    userid uuid default uuid_generate_v4(),
    ssn varchar(255) NOT NULL DEFAULT '',
    age Integer not null default -1,
    phone Varchar(255) unique NOT NULL DEFAULT '',
    phoneid VARCHAR(255) NOT NULL DEFAULT '',
    name VARCHAR(255) NOT NULL DEFAULT '',
    sex varchar(255) NOT NULL DEFAULT '',
    socialposition varchar(255) NOT NULL DEFAULT '',
    address varchar(255) NOT NULL DEFAULT '',
    location varchar(255) DEFAULT '',
    surveystaken integer[] NOT NULL DEFAULT '{}',
    loggedin INTEGER NOT NULL DEFAULT 0,
    firstSurveyTaken Boolean not null default false,
    prizemoneyearned Integer not null default 0,
    prizemoneycashed integer not null default 0,
    customalert jsonb default null,
    DATECreated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lastActivityDate TIMESTAMP NOT NULL DEFAULT now(),
    devicetoken text DEFAULT null,
    ssninfo jsonb default null,
    termsof BOOLEAN NOT NULL DEFAULT false
);

-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; fyrir uuid_generate_v4()!   

-- customalert = '{"message":"Þú ert svalur", 
-- "title": "Yó!", 
-- "cancelButton": "Hætta", 
-- "url": "https://itunes.apple.com/us/app/quotel-quotes-quotations/id1394606175?mt=8",
-- "okeyButton": "Næs"
-- }'
