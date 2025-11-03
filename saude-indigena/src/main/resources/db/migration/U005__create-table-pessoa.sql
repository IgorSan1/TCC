DROP TABLE saude.pessoa;

DROP SEQUENCE saude.pessoa_seq;

DELETE FROM saude.flyway_schema_history WHERE version = '005';