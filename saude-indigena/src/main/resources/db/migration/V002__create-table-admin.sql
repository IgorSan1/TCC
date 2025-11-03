CREATE TABLE saude.admin
(
    id                  BIGINT                          NOT NULL,
    uuid                UUID            UNIQUE          NOT NULL,
    usuario             VARCHAR(30)                     NOT NULL,
    password            VARCHAR(255)                    NOT NULL,
    role                VARCHAR(50)                     NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    removed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE saude.admin
    ADD CONSTRAINT pk_admin PRIMARY KEY (id);

CREATE SEQUENCE saude.admin_seq START WITH 1 INCREMENT BY 1;