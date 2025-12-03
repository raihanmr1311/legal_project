const { google } = require('googleapis');
const fs = require('fs');

function _loadServiceAccountKey() {
  const envVal = process.env.GDRIVE_SERVICE_ACCOUNT_KEY;
  if (!envVal) throw new Error('Missing GDRIVE_SERVICE_ACCOUNT_KEY');
  try { if (fs.existsSync(envVal)) return require(envVal); } catch(e){}
  try { if (envVal.trim().startsWith('{')) return JSON.parse(envVal); } catch(e){}
  try { const decoded = Buffer.from(envVal, 'base64').toString('utf8'); if (decoded.trim().startsWith('{')) return JSON.parse(decoded); } catch(e){}
  throw new Error('GDRIVE_SERVICE_ACCOUNT_KEY must be path, raw JSON, or base64 JSON');
}

function getDrive() {
  const key = _loadServiceAccountKey();
  const jwtClient = new google.auth.JWT(
    key.client_email, null, key.private_key,
    ['https://www.googleapis.com/auth/drive.metadata.readonly','https://www.googleapis.com/auth/drive']
  );
  return google.drive({ version: 'v3', auth: jwtClient });
}

async function main() {
  const folderId = process.argv[2] || process.env.GDRIVE_TARGET_FOLDER_ID;
  if (!folderId) {
    console.error('Usage: node Src/check_drive_folder.js <folderId>  OR set GDRIVE_TARGET_FOLDER_ID');
    process.exit(2);
  }

  const drive = getDrive();
  try {
    console.log('Fetching metadata for folder id:', folderId);
    const res = await drive.files.get({ fileId: folderId, fields: 'id,name,parents,driveId,owners,permissions,capabilities,explicitlyTrashed', supportsAllDrives: true });
    console.log('Folder metadata:');
    console.log(JSON.stringify(res.data, null, 2));

    // Print simple checks
    console.log('\nChecks:');
    if (res.data.driveId) console.log('- This folder belongs to a Shared Drive (driveId=' + res.data.driveId + ')'); else console.log('- This folder is in My Drive (no driveId)');
    if (res.data.owners && res.data.owners.length) console.log('- Owners:', res.data.owners.map(o=>o.emailAddress||o.displayName).join(', '));
    if (res.data.permissions && res.data.permissions.length) {
      console.log('- Permissions:');
      res.data.permissions.forEach(p => console.log('  -', p.id, p.type, p.role, p.emailAddress || p.displayName || ''));
    } else {
      console.log('- No explicit permissions returned');
    }

  } catch (err) {
    console.error('Failed to fetch folder metadata:', err && err.message ? err.message : err);
    if (err && err.response && err.response.data) console.error('Detailed:', JSON.stringify(err.response.data, null, 2));
    process.exit(3);
  }
}

main();
