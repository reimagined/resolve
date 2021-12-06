\c postgres;

CREATE USER "hn-user";
ALTER USER "hn-user" PASSWORD 'QweZxc123';

CREATE SCHEMA "event-store";
GRANT USAGE ON SCHEMA "event-store" TO "hn-user";
GRANT ALL ON SCHEMA "event-store" TO "hn-user";
GRANT ALL ON ALL TABLES IN SCHEMA "event-store" TO "hn-user";
GRANT ALL ON ALL SEQUENCES IN SCHEMA "event-store" TO "hn-user";
GRANT ALL ON ALL FUNCTIONS IN SCHEMA "event-store" TO "hn-user";
ALTER SCHEMA "event-store" OWNER TO "hn-user";

CREATE SCHEMA "read-store";
GRANT USAGE ON SCHEMA "read-store" TO "hn-user";
GRANT ALL ON SCHEMA "read-store" TO "hn-user";
GRANT ALL ON ALL TABLES IN SCHEMA "read-store" TO "hn-user";
GRANT ALL ON ALL SEQUENCES IN SCHEMA "read-store" TO "hn-user";
GRANT ALL ON ALL FUNCTIONS IN SCHEMA "read-store" TO "hn-user";
ALTER SCHEMA "read-store" OWNER TO "hn-user";
