create table surveyinvitationkeys (
    surveyid integer not null,
    invitationkey VARCHAR(255) not null,
    used boolean not null default false,
    usedby integer[] not null default '{}',
    reusable boolean not null default false
);

-- INSERT INTO user_subservices(user_id, subservice_id) 
-- SELECT 1 id, x
-- FROM  	unnest(ARRAY[1,2,3,4,5,6,7,8,22,33]) x