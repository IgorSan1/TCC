DROP TABLE saude.admin;

DROP SEQUENCE saude.admin_seq;

DELETE FROM saude.flyway_schema_history WHERE version = '002';