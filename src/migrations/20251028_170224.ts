import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Baseline migration — intentionally no-op.
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // No-op rollback.
}