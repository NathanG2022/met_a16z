const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

class SQLExecutor {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  async executeSQL(sql) {
    try {
      console.log('Executing SQL...');
      console.log('SQL:', sql.substring(0, 100) + (sql.length > 100 ? '...' : ''));
      
      // Split SQL into individual statements
      const statements = sql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      console.log(`Found ${statements.length} statements to execute`);

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement.length === 0) continue;

        console.log(`\nExecuting statement ${i + 1}/${statements.length}:`);
        console.log(statement.substring(0, 200) + (statement.length > 200 ? '...' : ''));

        try {
          // Execute the statement
          const { data, error } = await this.supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            console.error(`❌ Error in statement ${i + 1}:`, error);
            throw error;
          }
          
          console.log(`✅ Statement ${i + 1} executed successfully`);
        } catch (stmtError) {
          console.error(`❌ Failed to execute statement ${i + 1}:`, stmtError.message);
          throw stmtError;
        }
      }

      console.log('\n✅ All SQL statements executed successfully!');
      return true;
    } catch (error) {
      console.error('❌ SQL execution failed:', error.message);
      return false;
    }
  }

  async executeFile(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const sql = fs.readFileSync(filePath, 'utf8');
      return await this.executeSQL(sql);
    } catch (error) {
      console.error('❌ Failed to execute file:', error.message);
      return false;
    }
  }

  async testConnection() {
    try {
      console.log('Testing Supabase connection...');
      
      // Try a simple query
      const { data, error } = await this.supabase
        .from('notes')
        .select('count')
        .limit(1);

      if (error) {
        console.error('❌ Connection test failed:', error.message);
        return false;
      }

      console.log('✅ Supabase connection successful!');
      return true;
    } catch (error) {
      console.error('❌ Connection test failed:', error.message);
      return false;
    }
  }
}

// CLI interface
async function main() {
  const executor = new SQLExecutor();
  const command = process.argv[2];
  const filePath = process.argv[3];

  switch (command) {
    case 'test':
      const connectionOk = await executor.testConnection();
      process.exit(connectionOk ? 0 : 1);
      break;

    case 'file':
      if (!filePath) {
        console.error('❌ Please specify a SQL file path');
        console.log('Usage: node execute-sql.js file <sql-file-path>');
        process.exit(1);
      }
      
      const success = await executor.executeFile(filePath);
      process.exit(success ? 0 : 1);
      break;

    case 'sql':
      if (!filePath) {
        console.error('❌ Please specify SQL content');
        console.log('Usage: node execute-sql.js sql "<sql-content>"');
        process.exit(1);
      }
      
      const sqlSuccess = await executor.executeSQL(filePath);
      process.exit(sqlSuccess ? 0 : 1);
      break;

    default:
      console.log('SQL Executor for Supabase');
      console.log('');
      console.log('Usage:');
      console.log('  node execute-sql.js test                                    - Test connection');
      console.log('  node execute-sql.js file <sql-file-path>                    - Execute SQL file');
      console.log('  node execute-sql.js sql "<sql-content>"                     - Execute SQL string');
      console.log('');
      console.log('Examples:');
      console.log('  node execute-sql.js test');
      console.log('  node execute-sql.js file migration_001_add_transcription_fields.sql');
      console.log('  node execute-sql.js sql "SELECT COUNT(*) FROM notes;"');
      break;
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ SQL executor failed:', error.message);
    process.exit(1);
  });
}

module.exports = SQLExecutor; 