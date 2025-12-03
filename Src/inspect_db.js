const mysql = require('mysql2/promise');
(async ()=>{
  try{
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'legal_project',
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    });
    console.log('Connected. Running diagnostics...');
    const [create] = await conn.query("SHOW CREATE TABLE laporan");
    console.log('\nSHOW CREATE TABLE laporan:');
    if (create && create[0] && create[0]['Create Table']) console.log(create[0]['Create Table']);
    else console.log(create);

    const [cols] = await conn.query("SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, IS_NULLABLE FROM information_schema.COLUMNS WHERE table_schema = DATABASE() AND table_name = 'laporan' AND column_name IN ('perseroan','id')");
    console.log('\nColumns info:');
    console.table(cols);

    const [fks] = await conn.query("SELECT constraint_name, column_name, referenced_table_name, referenced_column_name FROM information_schema.KEY_COLUMN_USAGE WHERE table_schema = DATABASE() AND table_name = 'laporan' AND referenced_table_name IS NOT NULL");
    console.log('\nForeign keys on laporan:');
    console.table(fks);

    await conn.end();
  }catch(e){
    console.error('Inspect failed:', e.message || e);
    process.exit(1);
  }
})();
