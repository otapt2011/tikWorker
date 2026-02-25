// ============================================================
// tiktok.schema.js – Generate SQLite schema from TikTok sqlData
// ============================================================

(function(global) {
  function getSqlType(value) {
    if (value === null || value === undefined) return 'TEXT';
    const type = typeof value;
    if (type === 'number') return Number.isInteger(value) ? 'INTEGER' : 'REAL';
    if (type === 'boolean') return 'INTEGER';
    if (type === 'string') return 'TEXT';
    return 'TEXT';
  }
  
  function generateSchema(sqlData) {
    const { userName, data, videoHash } = sqlData;
    if (!data) throw new Error('Invalid sqlData: missing data object');
    
    const statements = [];
    
    // 1. USERS table
    const profileArray = data.profile || [];
    if (profileArray.length === 0) {
      statements.push(`CREATE TABLE IF NOT EXISTS users (
                userName TEXT PRIMARY KEY
            );`);
    } else {
      const profile = profileArray[0];
      const columns = [];
      for (const [key, value] of Object.entries(profile)) {
        if (key === 'userName') continue;
        columns.push(`"${key}" ${getSqlType(value)}`);
      }
      statements.push(`CREATE TABLE IF NOT EXISTS users (
    userName TEXT PRIMARY KEY,
    ${columns.join(',\n    ')}
);`);
    }
    
    // 2. VIDEO_HASH table
    if (videoHash && videoHash.length > 0) {
      const first = videoHash[0];
      const cols = [];
      for (const [key, value] of Object.entries(first)) {
        if (key === 'hashId') {
          cols.push(`"${key}" ${getSqlType(value)} PRIMARY KEY`);
        } else {
          cols.push(`"${key}" ${getSqlType(value)}`);
        }
      }
      statements.push(`CREATE TABLE IF NOT EXISTS video_hash (
    ${cols.join(',\n    ')}
);`);
    } else {
      statements.push(`CREATE TABLE IF NOT EXISTS video_hash (
    hashId TEXT PRIMARY KEY,
    link TEXT,
    deleted INTEGER
);`);
    }
    
    // 3. Other tables
    for (const [tableName, array] of Object.entries(data)) {
      if (tableName === 'profile') continue;
      
      if (!Array.isArray(array) || array.length === 0) {
        statements.push(`CREATE TABLE IF NOT EXISTS "${tableName}" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userName TEXT NOT NULL REFERENCES users(userName)
);`);
        continue;
      }
      
      const sample = array[0];
      const columns = [];
      let hasNaturalKey = false;
      for (const [key, value] of Object.entries(sample)) {
        const colType = getSqlType(value);
        if (key === 'id' || key === 'shortId' || key === 'hashId') {
          columns.push(`"${key}" ${colType} PRIMARY KEY`);
          hasNaturalKey = true;
        } else {
          columns.push(`"${key}" ${colType}`);
        }
      }
      if (!hasNaturalKey) {
        columns.unshift('id INTEGER PRIMARY KEY AUTOINCREMENT');
      }
      
      columns.push('userName TEXT NOT NULL REFERENCES users(userName)');
      
      if (sample.hasOwnProperty('shortId')) {
        columns.push('FOREIGN KEY (shortId) REFERENCES video_hash(hashId)');
      }
      
      statements.push(`CREATE TABLE IF NOT EXISTS "${tableName}" (
    ${columns.join(',\n    ')}
);`);
    }
    
    return statements.join('\n\n');
  }
  
  function generateInsertSQLA(sqlData) {
  const { userName, data } = sqlData;
  if (!data) throw new Error('Invalid sqlData: missing data object');
  
  let insertScript = `-- INSERT statements for user: ${userName || 'unknown'}\n\n`;
  
  // Helper to escape single quotes in values
  const escape = (val) => {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
    if (typeof val === 'boolean') return val ? '1' : '0';
    if (typeof val === 'number') return val;
    return `'${JSON.stringify(val).replace(/'/g, "''")}'`; // fallback for objects
  };
  
  // Process each table (profile is special -> users table)
  for (const [tableName, rows] of Object.entries(data)) {
    if (!Array.isArray(rows) || rows.length === 0) continue;
    
    let tableSqlName = tableName;
    if (tableName === 'profile') tableSqlName = 'users';
    
    // Collect column names from first row (excluding any internal ones)
    const firstRow = rows[0];
    const columns = Object.keys(firstRow).filter(col => col !== 'id' || !firstRow.id); // if id is autoincrement, we might skip it? We'll keep for now.
    
    // Build INSERT template
    const colList = columns.map(c => `"${c}"`).join(', ');
    const valuesList = rows.map(row => {
      const vals = columns.map(col => escape(row[col])).join(', ');
      return `(${vals})`;
    }).join(',\n');
    
    insertScript += `INSERT INTO "${tableSqlName}" (${colList}) VALUES\n${valuesList};\n\n`;
  }
  
  return insertScript;
}


function generateInsertSQL(sqlData, includeId = false) {
  const { userName, data } = sqlData;
  if (!data) throw new Error('Invalid sqlData: missing data object');
  
  let insertScript = `-- INSERT statements for user: ${userName || 'unknown'}\n\n`;
  
  // Helper to escape values for SQL
  const escape = (val) => {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'string') {
      // Escape single quotes by doubling them
      return `'${val.replace(/'/g, "''")}'`;
    }
    if (typeof val === 'boolean') return val ? '1' : '0';
    if (typeof val === 'number') return val.toString();
    // For objects/arrays, store as JSON (double‑escaped)
    return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  };
  
  // Process each table (key = table name in data, value = array of rows)
  for (const [tableName, rows] of Object.entries(data)) {
    if (!Array.isArray(rows) || rows.length === 0) continue;
    
    // Map profile to users table
    let sqlTableName = tableName;
    if (tableName === 'profile') sqlTableName = 'users';
    
    // Get column names from first row
    const firstRow = rows[0];
    let columns = Object.keys(firstRow);
    
    // Optionally remove 'id' column if it's likely autoincrement
    if (!includeId && columns.includes('id')) {
      // Check if id might be autoincrement (simple heuristic: integer and first row id is 1 or sequential)
      // We'll just remove it; user can override with includeId=true if needed.
      columns = columns.filter(col => col !== 'id');
    }
    
    // Build column list (quoted to avoid reserved words)
    const colList = columns.map(c => `"${c}"`).join(', ');
    
    // Build values for each row
    const valuesRows = rows.map(row => {
      const vals = columns.map(col => escape(row[col])).join(', ');
      return `(${vals})`;
    });
    
    // Combine into a single INSERT with multiple rows
    insertScript += `INSERT INTO "${sqlTableName}" (${colList}) VALUES\n`;
    insertScript += valuesRows.join(',\n');
    insertScript += ';\n\n';
  }
  
  return insertScript;
}
  
  function analyzeMessageContent(messages) {
  if (!Array.isArray(messages)) return {};
  
  const counts = {
    string: 0,
    boolean: 0,
    number: 0,
    url: 0,
    emoji: 0,
    filePath: 0,
    longString: 0,
    other: 0
  };
  
  messages.forEach(msg => {
    const content = msg.Content;
    if (content === undefined || content === null) return;
    
    const str = String(content).trim();
    
    // Detect type
    if (/^https?:\/\//i.test(str)) {
      counts.url++;
    } else if (/^[\p{Emoji}\p{Emoji_Presentation}\p{Extended_Pictographic}]+$/u.test(str)) {
      counts.emoji++;
    } else if (/^(true|false)$/i.test(str)) {
      counts.boolean++;
    } else if (/^-?\d+(\.\d+)?$/.test(str)) {
      counts.number++;
    } else if (/^(\/|\.\/|[a-zA-Z]:\\)/.test(str) || /\.[a-zA-Z0-9]{2,4}$/.test(str)) {
      counts.filePath++;
    } else if (str.length > 100) {
      counts.longString++;
    } else {
      counts.string++;
    }
  });
  
  return counts;
}
  
  global.generateTikTokSchema = generateSchema;
  global.generateInsertSQL = generateInsertSQL;
global.analyzeMessageContent = analyzeMessageContent;
})(typeof window !== 'undefined' ? window : self);