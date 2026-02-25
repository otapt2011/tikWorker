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
  
  global.generateTikTokSchema = generateSchema;
})(typeof window !== 'undefined' ? window : self);