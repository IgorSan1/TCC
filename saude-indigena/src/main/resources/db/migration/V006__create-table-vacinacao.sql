CREATE TABLE saude.vacinacao
(
    id                  BIGINT                          NOT NULL,
    uuid                UUID            UNIQUE          NOT NULL,
    pessoa_id           BIGINT                          NOT NULL,
    vacina_id           BIGINT                          NOT NULL,
    data_aplicacao      TIMESTAMP WITH TIME ZONE        NOT NULL,
    data_proxima_dose   TIMESTAMP WITH TIME ZONE        NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    removed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE saude.vacinacao
    ADD CONSTRAINT pk_vacinacao PRIMARY KEY (id);

ALTER TABLE saude.vacinacao
    ADD CONSTRAINT fk_pessoa FOREIGN KEY (pessoa_id) REFERENCES saude.pessoa(id);

ALTER TABLE saude.vacinacao
    ADD CONSTRAINT fk_vacina FOREIGN KEY (vacina_id) REFERENCES saude.vacina(id);

CREATE SEQUENCE saude.vacinacao_seq START WITH 1 INCREMENT BY 1;