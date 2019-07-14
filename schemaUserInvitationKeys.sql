create table userinvitationkeys(
    invitationkey varchar(255) not null,
    userid varchar(255) not null,
    usedby varchar(255)[] not null default '{}'
)