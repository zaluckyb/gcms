import * as migration_20241218_add_content_items_fields from './20241218_add_content_items_fields';
import * as migration_20250101_120000_content_plan_transactions from './20250101_120000_content_plan_transactions';
import * as migration_20250101_130000_fix_content_plans_schema from './20250101_130000_fix_content_plans_schema';
import * as migration_20250101_140000_restructure_content_plans from './20250101_140000_restructure_content_plans';
import * as migration_20251028_170224 from './20251028_170224';
import * as migration_20251103_120000_post_id_text from './20251103_120000_post_id_text';
import * as migration_20251103_205653_fix_content_plans_array_structure from './20251103_205653_fix_content_plans_array_structure';
import * as migration_20251103_210000_create_content_plans_tables from './20251103_210000_create_content_plans_tables';
import * as migration_20251103_230000_create_content_plans_tables from './20251103_230000_create_content_plans_tables';
import * as migration_20251103_235900_create_missing_tables from './20251103_235900_create_missing_tables';
import * as migration_20251104_170359_add_content_items_fields from './20251104_170359_add_content_items_fields';
import * as migration_20251104_190500_add_image_prompts_table from './20251104_190500_add_image_prompts_table';
import * as migration_20251110_121000_create_header_global from './20251110_121000_create_header_global';

export const migrations = [
  {
    up: migration_20241218_add_content_items_fields.up,
    down: migration_20241218_add_content_items_fields.down,
    name: '20241218_add_content_items_fields',
  },
  {
    up: migration_20250101_120000_content_plan_transactions.up,
    down: migration_20250101_120000_content_plan_transactions.down,
    name: '20250101_120000_content_plan_transactions',
  },
  {
    up: migration_20250101_130000_fix_content_plans_schema.up,
    down: migration_20250101_130000_fix_content_plans_schema.down,
    name: '20250101_130000_fix_content_plans_schema',
  },
  {
    up: migration_20250101_140000_restructure_content_plans.up,
    down: migration_20250101_140000_restructure_content_plans.down,
    name: '20250101_140000_restructure_content_plans',
  },
  {
    up: migration_20251028_170224.up,
    down: migration_20251028_170224.down,
    name: '20251028_170224',
  },
  {
    up: migration_20251103_120000_post_id_text.up,
    down: migration_20251103_120000_post_id_text.down,
    name: '20251103_120000_post_id_text',
  },
  {
    up: migration_20251103_205653_fix_content_plans_array_structure.up,
    down: migration_20251103_205653_fix_content_plans_array_structure.down,
    name: '20251103_205653_fix_content_plans_array_structure',
  },
  {
    up: migration_20251103_210000_create_content_plans_tables.up,
    down: migration_20251103_210000_create_content_plans_tables.down,
    name: '20251103_210000_create_content_plans_tables',
  },
  {
    up: migration_20251103_230000_create_content_plans_tables.up,
    down: migration_20251103_230000_create_content_plans_tables.down,
    name: '20251103_230000_create_content_plans_tables',
  },
  {
    up: migration_20251103_235900_create_missing_tables.up,
    down: migration_20251103_235900_create_missing_tables.down,
    name: '20251103_235900_create_missing_tables',
  },
  {
    up: migration_20251104_170359_add_content_items_fields.up,
    down: migration_20251104_170359_add_content_items_fields.down,
    name: '20251104_170359_add_content_items_fields'
  },
  {
    up: migration_20251104_190500_add_image_prompts_table.up,
    down: migration_20251104_190500_add_image_prompts_table.down,
    name: '20251104_190500_add_image_prompts_table'
  },
  {
    up: migration_20251110_121000_create_header_global.up,
    down: migration_20251110_121000_create_header_global.down,
    name: '20251110_121000_create_header_global'
  },
];
