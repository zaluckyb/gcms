import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Create content_plan_transactions table for robust persistence logging
  await db.execute(`
    CREATE TABLE IF NOT EXISTS content_plan_transactions (
      id SERIAL PRIMARY KEY,
      transaction_id VARCHAR(255) UNIQUE NOT NULL,
      content_plan_id INTEGER NOT NULL,
      operation VARCHAR(50) NOT NULL DEFAULT 'save_generated',
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      error_details TEXT,
      metadata JSONB,
      retry_count INTEGER DEFAULT 0,
      execution_time_ms INTEGER,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      completed_at TIMESTAMP WITH TIME ZONE
    );
  `)

  // Create indexes for better query performance
  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_content_plan_transactions_transaction_id 
    ON content_plan_transactions(transaction_id);
  `)

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_content_plan_transactions_content_plan_id 
    ON content_plan_transactions(content_plan_id);
  `)

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_content_plan_transactions_status 
    ON content_plan_transactions(status);
  `)

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_content_plan_transactions_created_at 
    ON content_plan_transactions(created_at);
  `)

  // Add trigger to automatically update updated_at timestamp
  await db.execute(`
    CREATE OR REPLACE FUNCTION update_content_plan_transactions_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ language 'plpgsql';
  `)

  await db.execute(`
    CREATE TRIGGER update_content_plan_transactions_updated_at
    BEFORE UPDATE ON content_plan_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_content_plan_transactions_updated_at();
  `)

  // Add version column to content_plans table if it doesn't exist
  await db.execute(`
    ALTER TABLE content_plans 
    ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
  `)

  // Add last_transaction_id column to content_plans table if it doesn't exist
  await db.execute(`
    ALTER TABLE content_plans 
    ADD COLUMN IF NOT EXISTS last_transaction_id VARCHAR(255);
  `)

  // Create index on version column for optimistic locking
  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_content_plans_version 
    ON content_plans(version);
  `)

  // Create index on last_transaction_id for transaction tracking
  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_content_plans_last_transaction_id 
    ON content_plans(last_transaction_id);
  `)

  console.log('✅ Content plan transactions table and related indexes created successfully')
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Drop the trigger and function
  await db.execute(`
    DROP TRIGGER IF EXISTS update_content_plan_transactions_updated_at ON content_plan_transactions;
  `)

  await db.execute(`
    DROP FUNCTION IF EXISTS update_content_plan_transactions_updated_at();
  `)

  // Drop indexes
  await db.execute(`
    DROP INDEX IF EXISTS idx_content_plan_transactions_transaction_id;
  `)

  await db.execute(`
    DROP INDEX IF EXISTS idx_content_plan_transactions_content_plan_id;
  `)

  await db.execute(`
    DROP INDEX IF EXISTS idx_content_plan_transactions_status;
  `)

  await db.execute(`
    DROP INDEX IF EXISTS idx_content_plan_transactions_created_at;
  `)

  await db.execute(`
    DROP INDEX IF EXISTS idx_content_plans_version;
  `)

  await db.execute(`
    DROP INDEX IF EXISTS idx_content_plans_last_transaction_id;
  `)

  // Remove added columns from content_plans table
  await db.execute(`
    ALTER TABLE content_plans 
    DROP COLUMN IF EXISTS version;
  `)

  await db.execute(`
    ALTER TABLE content_plans 
    DROP COLUMN IF EXISTS last_transaction_id;
  `)

  // Drop the transactions table
  await db.execute(`
    DROP TABLE IF EXISTS content_plan_transactions;
  `)

  console.log('✅ Content plan transactions table and related structures removed successfully')
}