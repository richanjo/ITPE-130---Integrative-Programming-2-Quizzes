var QUIZ_FOLDER_ID = '1uIwG-Q2hJT_USwb1h5JWAvtG1hJK80rK';

function doGet(e) {
  try {
    var params = (e && e.parameter) || {};
    if (params.action === 'check' && params.filename) {
      if (params.folderId && params.folderId !== QUIZ_FOLDER_ID) throw new Error('Invalid folder');
      var folder = DriveApp.getFolderById(QUIZ_FOLDER_ID);
      return ContentService.createTextOutput(JSON.stringify({ exists: folder.getFilesByName(params.filename).hasNext() }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ exists: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    if (data.folderId && data.folderId !== QUIZ_FOLDER_ID) throw new Error('Invalid folder');
    if (!data.filename || !data.dataBase64) throw new Error('Missing filename or PDF data');
    var lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      var folder = DriveApp.getFolderById(QUIZ_FOLDER_ID);
      if (folder.getFilesByName(data.filename).hasNext()) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, duplicate: true, error: 'DUPLICATE: file already exists' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      folder.createFile(Utilities.newBlob(Utilities.base64Decode(data.dataBase64), 'application/pdf', data.filename));
      return ContentService.createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
