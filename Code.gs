var QUIZ_FOLDER_ID = '1uIwG-Q2hJT_USwb1h5JWAvtG1hJK80rK';

// Quiz #3: November 24, 2026, 8:00 PM–9:00 PM Philippine Standard Time (UTC+8).
var QUIZ3_PREFIX = 'ITPE 130 Quiz3_';
var QUIZ3_OPEN_MS = Date.UTC(2026, 10, 24, 12, 0, 0);
var QUIZ3_CLOSE_MS = Date.UTC(2026, 10, 24, 13, 0, 0);

function getQuiz3Phase() {
  var now = Date.now();
  if (now < QUIZ3_OPEN_MS) return 'upcoming';
  if (now >= QUIZ3_CLOSE_MS) return 'closed';
  return 'open';
}

function sanitizeQuiz3Id(value) {
  return String(value || '')
    .trim()
    .replace(/[^A-Za-z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 80);
}

function findQuiz3SubmissionFile(studentId) {
  var safeId = sanitizeQuiz3Id(studentId);
  if (!safeId) return '';
  var prefix = QUIZ3_PREFIX + safeId + '_';
  var folder = DriveApp.getFolderById(QUIZ_FOLDER_ID);
  var files = folder.getFiles();
  while (files.hasNext()) {
    var file = files.next();
    if (file.getName().indexOf(prefix) === 0) return file.getName();
  }
  return '';
}

function getQuiz3Description(data) {
  try {
    return JSON.stringify({
      quiz: 'Quiz3',
      studentId: String(data.studentId || ''),
      studentName: String(data.studentName || '').substring(0, 80),
      section: String(data.studentSection || ''),
      submissionTimestamp: String(data.submissionTimestamp || new Date().toISOString()),
      score: data.score,
      total: data.total,
      answers: data.answers || {}
    }).substring(0, 500);
  } catch (e) {
    return 'Quiz3 submission record';
  }
}

var QUIZ4_PREFIX = 'ITPE 130 Quiz4_';
var QUIZ4_OPEN_MS = Date.UTC(2026, 10, 25, 12, 0, 0);
var QUIZ4_CLOSE_MS = Date.UTC(2026, 10, 25, 13, 0, 0);

function getQuiz4Phase() {
  var now = Date.now();
  if (now < QUIZ4_OPEN_MS) return 'upcoming';
  if (now >= QUIZ4_CLOSE_MS) return 'closed';
  return 'open';
}

function sanitizeQuiz4Id(value) {
  return String(value || '')
    .trim()
    .replace(/[^A-Za-z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 80);
}

function findQuiz4SubmissionFile(studentId) {
  var safeId = sanitizeQuiz4Id(studentId);
  if (!safeId) return '';
  var prefix = QUIZ4_PREFIX + safeId + '_';
  var folder = DriveApp.getFolderById(QUIZ_FOLDER_ID);
  var files = folder.getFiles();
  while (files.hasNext()) {
    var file = files.next();
    if (file.getName().indexOf(prefix) === 0) return file.getName();
  }
  return '';
}

function getQuiz4Description(data) {
  try {
    return JSON.stringify({
      quiz: 'Quiz4',
      studentId: String(data.studentId || ''),
      studentName: String(data.studentName || '').substring(0, 80),
      section: String(data.studentSection || ''),
      submissionTimestamp: String(data.submissionTimestamp || new Date().toISOString()),
      score: data.score,
      percentage: data.percentage,
      total: data.total,
      answers: data.answers || {}
    }).substring(0, 500);
  } catch (e) {
    return 'Quiz4 submission record';
  }
}

function doGet(e) {
  try {
    var params = (e && e.parameter) || {};

    if (params.action === 'quiz3-status') {
      var existingQuiz3 = findQuiz3SubmissionFile(params.studentId);
      return ContentService.createTextOutput(JSON.stringify({
        ok: true,
        quiz: 'Quiz3',
        phase: getQuiz3Phase(),
        submitted: Boolean(existingQuiz3),
        filename: existingQuiz3,
        serverTime: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (params.action === 'quiz4-status') {
      var existingQuiz4 = findQuiz4SubmissionFile(params.studentId);
      return ContentService.createTextOutput(JSON.stringify({
        ok: true,
        quiz: 'Quiz4',
        phase: getQuiz4Phase(),
        submitted: Boolean(existingQuiz4),
        filename: existingQuiz4,
        serverTime: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

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

    var isQuiz3 = data.quiz === 'Quiz3' || String(data.filename).indexOf(QUIZ3_PREFIX) === 0;
    var isQuiz4 = data.quiz === 'Quiz4' || String(data.filename).indexOf(QUIZ4_PREFIX) === 0;
    if (isQuiz3 && isQuiz4) throw new Error('Mixed quiz submission');

    if (isQuiz3) {
      var safeId = sanitizeQuiz3Id(data.studentId);
      if (!safeId) throw new Error('Missing student ID for Quiz3');
      var expectedPrefix = QUIZ3_PREFIX + safeId + '_';
      if (String(data.filename).indexOf(expectedPrefix) !== 0) throw new Error('Invalid Quiz3 filename');
    }

    if (isQuiz4) {
      var safeQuiz4Id = sanitizeQuiz4Id(data.studentId);
      if (!safeQuiz4Id) throw new Error('Missing student ID for Quiz4');
      var expectedQuiz4Prefix = QUIZ4_PREFIX + safeQuiz4Id + '_';
      if (String(data.filename).indexOf(expectedQuiz4Prefix) !== 0) throw new Error('Invalid Quiz4 filename');
    }

    var lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      var folder = DriveApp.getFolderById(QUIZ_FOLDER_ID);

      if (isQuiz3) {
        var priorQuiz3 = findQuiz3SubmissionFile(data.studentId);
        if (priorQuiz3) {
          return ContentService.createTextOutput(JSON.stringify({
            success: false,
            duplicate: true,
            error: 'DUPLICATE: student already submitted Quiz3'
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }

      if (isQuiz4) {
        var priorQuiz4 = findQuiz4SubmissionFile(data.studentId);
        if (priorQuiz4) {
          return ContentService.createTextOutput(JSON.stringify({
            success: false,
            duplicate: true,
            error: 'DUPLICATE: student already submitted Quiz4'
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }

      if (folder.getFilesByName(data.filename).hasNext()) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, duplicate: true, error: 'DUPLICATE: file already exists' }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      var created = folder.createFile(Utilities.newBlob(Utilities.base64Decode(data.dataBase64), 'application/pdf', data.filename));
      if (isQuiz3) created.setDescription(getQuiz3Description(data));
      if (isQuiz4) created.setDescription(getQuiz4Description(data));

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
