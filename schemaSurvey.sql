CREATE TABLE eiksurveys(
    surveyid serial PRIMARY key,
    firstsurvey boolean not null default false,
    name varchar(255) not null,
    prize Integer not null default 0,
    about text not null default '',
    numberofquestions integer not null default 0,
    questions jsonb not null,
    maxamount Integer not null,
    minamount Integer not null default 0,
    currentamount Integer not null default 0,
    takenby Integer[] not null default '{}',
    viewedby Integer[] not null default '{}',
    maxage Integer not null,
    minage Integer not null default 15,
    sex varchar(255)[] NOT NULL DEFAULT '{}',
    socialposition varchar(255)[] NOT NULL DEFAULT '{}',
    answerstable varchar(255) not null,
    location varchar(255)[] NOT NULL DEFAULT '{}',
    DATECreated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- INSERT INTO eiksurveys (surveyid, price, about, name, questions, maxamount, maxage, surveytable) 
-- values( -1, 600,'Svaraðu nokkrum auðveldum spurningum og fáðu verðlaun!', 'Fyrsta könnunin', 
-- '[{"question": "", "options": null, "placeholder":"Fullt nafn"}, {"question": "", "options": null, "placeholder":"Kennitala"},
--  {"question": "Kyn?", "options": ["Karlkyn", "Kvenkyn", "Annað"], "placeholder":null}, {"question": "Staða?", "options": 
--  ["Grunnskóla", "Menntaskóla", "Háskóla", "Vinnumarkaði", "Annað"], "placeholder":null}, 
--  {"question": "", "options": null, "placeholder":"Heimilisfang"}, {"question": "", "options": null, "placeholder":"Símanúmer"}, 
--  {"question": "", "options": null, "placeholder":"Staðfestingarkóði"}]', -1, 1000, 'firstsurvey');