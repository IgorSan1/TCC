CREATE TABLE saude.pessoa
(
    id              BIGINT                          NOT NULL,
    uuid            UUID            UNIQUE          NOT NULL,
    nome_completo   VARCHAR(90)                     NOT NULL,
    cpf             VARCHAR(11)     UNIQUE          NOT NULL,
    sexo            VARCHAR(20)                     NOT NULL,
    data_nascimento TIMESTAMP WITH TIME ZONE        NOT NULL,
    etnia           VARCHAR(50)                     NOT NULL,
    cns             VARCHAR(15)     UNIQUE          NOT NULL,
    comunidade      VARCHAR(90)                     NOT NULL,
    ativo           BOOLEAN,

    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    removed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE saude.pessoa
    ADD CONSTRAINT pk_pessoa PRIMARY KEY (id);

CREATE SEQUENCE saude.pessoa_seq START WITH 1 INCREMENT BY 1;