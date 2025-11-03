CREATE TABLE saude.usuario
(
    id                  BIGINT                          NOT NULL,
    uuid                UUID            UNIQUE          NOT NULL,
    nome_completo       VARCHAR(90)                     NOT NULL,
    cpf                 VARCHAR(11)     UNIQUE          NOT NULL,
    data_nascimento     TIMESTAMP WITH TIME ZONE        NOT NULL,
    email               VARCHAR(20)                     NOT NULL,
    telefone            VARCHAR(50)                     NOT NULL,
    usuario             VARCHAR(30)                     NOT NULL,
    password            VARCHAR(255)                    NOT NULL,
    cargo               VARCHAR(30)                     NOT NULL,
    role                VARCHAR(50)                     NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    removed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE saude.usuario
    ADD CONSTRAINT pk_usuario PRIMARY KEY (id);

CREATE SEQUENCE saude.usuario_seq START WITH 1 INCREMENT BY 1;