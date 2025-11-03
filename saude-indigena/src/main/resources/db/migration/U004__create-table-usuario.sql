DROP TABLE saude.usuario;

DROP SEQUENCE saude.usuario_seq;

DELETE FROM saude.flyway_schema_history WHERE version = '004';