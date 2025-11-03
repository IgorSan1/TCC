DROP TABLE saude.flyway_schema_history;

DROP EXTENSION IF EXISTS "uuid-ossp";

DROP SCHEMA saude;

DELETE FROM saude.flyway_schema_history WHERE version = '001';