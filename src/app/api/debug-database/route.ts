import config from '@payload-config'
import { getPayload } from 'payload'
import { sql } from '@payloadcms/db-postgres'

export const GET = async (): Promise<Response> => {
  const payload = await getPayload({ config })
  
  try {
    // Check what tables exist
    const tablesResult = await payload.db.drizzle.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `)

    // Check users table structure
    const usersColumnsResult = await payload.db.drizzle.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `)

    // Check if specific tables exist
    const requiredTables = [
      'users',
      'users_persona_profile_strengths', 
      'users_persona_profile_uses',
      'users_sessions',
      'personas',
      'personas_strengths',
      'personas_uses'
    ]

    const tableChecks: Record<string, boolean> = {}
    for (const tableName of requiredTables) {
      try {
        const result = await payload.db.drizzle.execute(sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = ${tableName}
          );
        `)
        tableChecks[tableName] = (result as any)[0]?.exists || false
      } catch (e) {
        tableChecks[tableName] = false
      }
    }

    // Check users table for persona columns
    const personaColumns = [
      'persona_selected_persona_id',
      'persona_profile_name',
      'persona_profile_category',
      'persona_profile_focus',
      'persona_profile_personality_tone',
      'persona_profile_personality_voice_style',
      'persona_profile_personality_motivations',
      'persona_profile_personality_audience_perception'
    ]

    const columnChecks: Record<string, boolean> = {}
    for (const columnName of personaColumns) {
      try {
        const result = await payload.db.drizzle.execute(sql`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name = ${columnName}
          );
        `)
        columnChecks[columnName] = (result as any)[0]?.exists || false
      } catch (e) {
        columnChecks[columnName] = false
      }
    }

    return Response.json({
      success: true,
      allTables: tablesResult,
      usersColumns: usersColumnsResult,
      tableChecks,
      columnChecks,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Database debug error:', error)
    return Response.json({
      success: false,
      error: (error as Error)?.message || String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}