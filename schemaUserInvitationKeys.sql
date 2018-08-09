create table userinvitationkeys(
    invitationkey varchar(255) not null,
    userid integer not null,
    usedby integer[] not null default '{}'
)