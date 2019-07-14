create table surveyanswers{
    surveytaken TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            surveyid integer not null,
            id uuid default uuid_generate_v4(),
            userid integer not null,
            timerequired double precision[],
            timespent double precision[], 
            toofast boolean[],
            answer1,
            answer2,
            .
            .
            .
}