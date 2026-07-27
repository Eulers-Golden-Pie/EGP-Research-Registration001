# EGP Participant Registration Portal

A two-page registration and parental-consent portal for the Euler's
Golden Pie educational intervention.

## Participant group

This version is for participants under 18.

A parent or legal guardian must complete the form.

## Website flow

1. Parent reads the intervention information.
2. Parent enters their contact details.
3. Parent adds one or more participating children.
4. Parent reads the Participant Information Sheet.
5. Parent provides required consent.
6. Parent provides WhatsApp communication permission.
7. Parent may optionally provide photo and video permission.
8. Registration is submitted to Google Apps Script.
9. Apps Script saves one Google Sheet row per child.
10. Apps Script sends one family confirmation email.
11. Apps Script redirects the browser to the confirmation page.

## Files

- `index.html` — registration and consent form
- `styles.css` — dark theme and responsive layout
- `script.js` — child management, validation, and submission
- `config.js` — Google Apps Script deployment URL
- `pages/success.html` — confirmation page
- `docs/participant-information-sheet.pdf` — current PIS
- `Code.gs` — Google Apps Script backend

## Important privacy rule

Never upload any of the following to GitHub:

- Google Sheet exports
- Participant names or email addresses
- Parent phone numbers
- Consent records
- Registration data
- Passwords
- Google credentials
- Private keys

The Apps Script `/exec` URL may appear in `config.js`. It is a public
submission endpoint, not a secret credential. Server-side validation
must remain enabled.

## Deployment

After changing `Code.gs`, update the Apps Script web-app deployment:

1. Open Apps Script.
2. Select **Deploy → Manage deployments**.
3. Edit the active deployment.
4. Create or select a new version.
5. Confirm:
   - Execute as: Me
   - Access: Anyone
6. Deploy.
7. Confirm that the `/exec` URL still matches `config.js`.
