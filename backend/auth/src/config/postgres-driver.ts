import * as pg from 'pg';

/**
 * The `pg` module, to be passed to TypeORM as its `driver` option.
 *
 * TypeORM normally resolves the Postgres driver itself via
 * `PlatformTools.load('pg')`. Up to typeorm 1.0.0 that helper was a switch of
 * literal `require('pg')` calls; 1.1.0 replaced it with `require(name)` on a
 * variable, so static bundlers can no longer see the dependency. Vercel's file
 * tracer consequently leaves `pg` out of the serverless bundle and the driver
 * fails at runtime with "Postgres package has not been found installed" — even
 * though `pg` is a declared dependency and resolves fine locally.
 *
 * Importing it here gives the tracer a literal specifier to follow, and passing
 * it as `driver` skips TypeORM's own lookup entirely.
 */
export const postgresDriver = pg;
