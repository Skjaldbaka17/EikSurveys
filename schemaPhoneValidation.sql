create table phonevalidation(
    id serial primary key,
    phone Varchar(255) UNIQUE NOT NULL,
    validationkey VARCHAR(255) NOT NULL,
    used boolean not null default false,
    DATECreated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);