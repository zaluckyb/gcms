import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  // Baseline migration — intentionally no-op.
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  // No-op rollback.
}