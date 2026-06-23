/**
 * Mayfair — contact form backend (Google Apps Script, container-bound to a Sheet).
 *
 * Receives a urlencoded POST from the website contact form, appends one row to
 * the "Submissions" tab, and emails a notification to acquisitions@mayfaircre.com.
 *
 * Deploy:  Extensions ▸ Apps Script ▸ paste this file ▸ Deploy ▸ New deployment
 *          ▸ Web app ▸ Execute as: Me ▸ Who has access: Anyone.
 * See DEPLOY.md, Step 4 for the full click-by-click.
 */

var NOTIFY_TO  = "acquisitions@mayfaircre.com";
var SHEET_NAME = "Submissions";

function doPost(e) {
  try {
    var p = (e && e.parameter) ? e.parameter : {};

    // Honeypot: silently accept and discard bot submissions.
    if (p.company_website) {
      return json_({ ok: true });
    }

    var now     = new Date();
    var name    = String(p.name    || "").trim();
    var company = String(p.company || "").trim();
    var email   = String(p.email   || "").trim();
    var phone   = String(p.phone   || "").trim();
    var role    = String(p.role    || "").trim();
    var message = String(p.message || "").trim();

    getSheet_().appendRow([now, name, company, email, phone, role, message]);

    var subject = "Mayfair inquiry — " + (name || "no name") +
                  (company ? " (" + company + ")" : "");
    var body =
      "New contact submission\n\n" +
      "Time:    " + now + "\n" +
      "Name:    " + name + "\n" +
      "Company: " + company + "\n" +
      "Email:   " + email + "\n" +
      "Phone:   " + phone + "\n" +
      "Role:    " + role + "\n\n" +
      "Message:\n" + message + "\n";

    MailApp.sendEmail({
      to: NOTIFY_TO,
      subject: subject,
      body: body,
      replyTo: email || NOTIFY_TO
    });

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

/** Health check — visiting the Web App URL in a browser returns this. */
function doGet() {
  return json_({ ok: true, service: "mayfair-contact" });
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Timestamp", "Name", "Company", "Email", "Phone", "Role", "Message"]);
    sheet.getRange("A1:G1").setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Run once from the editor (Run ▸ testSubmission) to authorize the script and
 * confirm a row is written + the email is sent, before you deploy the Web App.
 */
function testSubmission() {
  doPost({ parameter: {
    name: "Test Buyer",
    company: "Test Co",
    email: "test@example.com",
    phone: "(000) 000-0000",
    role: "Developer",
    message: "Test submission from the Apps Script editor."
  }});
}
