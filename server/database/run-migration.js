const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

class MigrationRunner {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    this.migrationsDir = path.join(__dirname, 'migrations');
    this.ensureMigrationsDir();
  }

  ensureMigrationsDir() {
    if (!fs.existsSync(this.migrationsDir)) {
      fs.mkdirSync(this.migrationsDir, { recursive: true });
    }
  }

  async runMigration(migrationFile) {
    try {
      console.log(`🚀 Running migration: ${migrationFile}`);
      
      // Read migration file
      const migrationPath = path.join(__dirname, migrationFile);
      if (!fs.existsSync(migrationPath)) {
        throw new Error(`Migration file not found: ${migrationPath}`);
      }

      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      // Split SQL into individual statements
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      console.log(`📝 Found ${statements.length} SQL statements to execute`);

      // Execute each statement
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        console.log(`  Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          const { error } = await this.supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            console.error(`❌ Error executing statement ${i + 1}:`, error);
            throw error;
          }
          
          console.log(`  ✅ Statement ${i + 1} executed successfully`);
        } catch (stmtError) {
          console.error(`❌ Failed to execute statement ${i + 1}:`, stmtError.message);
          throw stmtError;
        }
      }

      // Record migration in migrations table
      await this.recordMigration(migrationFile);
      
      console.log(`✅ Migration ${migrationFile} completed successfully!`);
      return true;
      
    } catch (error) {
      console.error(`❌ Migration ${migrationFile} failed:`, error.message);
      return false;
    }
  }

  async recordMigration(migrationFile) {
    try {
      // Create migrations table if it doesn't exist
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          migration_file TEXT NOT NULL UNIQUE,
          executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          status TEXT DEFAULT 'completed'
        );
      `;

      await this.supabase.rpc('exec_sql', { sql: createTableSQL });

      // Record the migration
      const { error } = await this.supabase
        .from('migrations')
        .insert({
          migration_file: migrationFile,
          status: 'completed'
        });

      if (error) {
        console.warn('Warning: Could not record migration in migrations table:', error.message);
      }
    } catch (error) {
      console.warn('Warning: Could not record migration:', error.message);
    }
  }

  async checkMigrationStatus(migrationFile) {
    try {
      const { data, error } = await this.supabase
        .from('migrations')
        .select('*')
        .eq('migration_file', migrationFile)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data ? data.status : 'not_run';
    } catch (error) {
      console.warn('Warning: Could not check migration status:', error.message);
      return 'unknown';
    }
  }

  async rollbackMigration(migrationFile) {
    try {
      console.log(`🔄 Rolling back migration: ${migrationFile}`);
      
      // Read rollback file
      const rollbackFile = migrationFile.replace('.sql', '_rollback.sql');
      const rollbackPath = path.join(__dirname, rollbackFile);
      
      if (!fs.existsSync(rollbackPath)) {
        throw new Error(`Rollback file not found: ${rollbackPath}`);
      }

      const rollbackSQL = fs.readFileSync(rollbackPath, 'utf8');
      
      // Execute rollback
      const { error } = await this.supabase.rpc('exec_sql', { sql: rollbackSQL });
      
      if (error) {
        throw error;
      }

      // Remove migration record
      await this.supabase
        .from('migrations')
        .delete()
        .eq('migration_file', migrationFile);

      console.log(`✅ Rollback of ${migrationFile} completed successfully!`);
      return true;
      
    } catch (error) {
      console.error(`❌ Rollback of ${migrationFile} failed:`, error.message);
      return false;
    }
  }

  async listMigrations() {
    try {
      const { data, error } = await this.supabase
        .from('migrations')
        .select('*')
        .order('executed_at', { ascending: true });

      if (error) {
        console.warn('Warning: Could not fetch migration history:', error.message);
        return [];
      }

      return data || [];
    } catch (error) {
      console.warn('Warning: Could not fetch migration history:', error.message);
      return [];
    }
  }
}

// CLI interface
async function main() {
  const runner = new MigrationRunner();
  const command = process.argv[2];
  const migrationFile = process.argv[3];

  switch (command) {
    case 'run':
      if (!migrationFile) {
        console.error('❌ Please specify a migration file');
        console.log('Usage: node run-migration.js run <migration-file>');
        process.exit(1);
      }
      
      const status = await runner.checkMigrationStatus(migrationFile);
      if (status === 'completed') {
        console.log(`⚠️  Migration ${migrationFile} has already been run`);
        process.exit(0);
      }
      
      const success = await runner.runMigration(migrationFile);
      process.exit(success ? 0 : 1);
      break;

    case 'rollback':
      if (!migrationFile) {
        console.error('❌ Please specify a migration file to rollback');
        console.log('Usage: node run-migration.js rollback <migration-file>');
        process.exit(1);
      }
      
      const rollbackSuccess = await runner.rollbackMigration(migrationFile);
      process.exit(rollbackSuccess ? 0 : 1);
      break;

    case 'status':
      if (migrationFile) {
        const migrationStatus = await runner.checkMigrationStatus(migrationFile);
        console.log(`Migration ${migrationFile}: ${migrationStatus}`);
      } else {
        const migrations = await runner.listMigrations();
        console.log('Migration History:');
        migrations.forEach(migration => {
          console.log(`  ${migration.migration_file} - ${migration.status} (${migration.executed_at})`);
        });
      }
      break;

    default:
      console.log('Database Migration Runner');
      console.log('');
      console.log('Usage:');
      console.log('  node run-migration.js run <migration-file>     - Run a migration');
      console.log('  node run-migration.js rollback <migration-file> - Rollback a migration');
      console.log('  node run-migration.js status [migration-file]  - Check migration status');
      console.log('');
      console.log('Examples:');
      console.log('  node run-migration.js run migration_001_add_transcription_fields.sql');
      console.log('  node run-migration.js rollback migration_001_add_transcription_fields.sql');
      console.log('  node run-migration.js status');
      break;
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Migration runner failed:', error.message);
    process.exit(1);
  });
}

module.exports = MigrationRunner; 