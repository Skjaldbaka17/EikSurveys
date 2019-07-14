create table surveyanswers{
    surveytaken TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            surveyid integer not null,
            userid uuid not null,
            timerequired double precision[],
            timespent double precision[], 
            toofast boolean[],
            answer1,
            answer2,
            .
            .
            .
}