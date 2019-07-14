CREATE TABLE Payments(
    paymentid serial PRIMARY key,
    userid uuid NOT null,
    processed BOOLEAN NOT NULL DEFAULT false,
    paid BOOLEAN NOT NULL DEFAULT false,
    money INTEGER NOT null,
    aurnumber varchar(255),
    bankaccount varchar(255),
    ssn varchar(255),
    datecreated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);