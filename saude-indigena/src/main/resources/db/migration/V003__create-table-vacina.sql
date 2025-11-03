CREATE TABLE saude.vacina
(
    id                      BIGINT                          NOT NULL,
    uuid                    UUID            UNIQUE          NOT NULL,
    nome                    VARCHAR(90)                     NOT NULL,
    numero_lote             VARCHAR(90)                     NOT NULL,
    data_fabricacao         TIMESTAMP WITHOUT TIME ZONE     NOT NULL,
    data_validade           TIMESTAMP WITHOUT TIME ZONE     NOT NULL,
    ativo                   BOOLEAN                         NOT NULL,
    fabricante              VARCHAR(90)                     NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    removed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE saude.vacina
    ADD CONSTRAINT pk_vacina PRIMARY KEY (id);

CREATE SEQUENCE saude.vacina_seq START WITH 1 INCREMENT BY 1;