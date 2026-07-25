# EGP Research Registration Portal

Participant registration portal for the EGP Educational Intervention
Research Study.

## Study

- Study ID: EGP-2026-001
- Form version: 1.0
- Participant groups:
  - Adults aged 18+
  - Students under 18 with parent/legal guardian permission

## Technology

- GitHub Pages
- HTML
- CSS
- Vanilla JavaScript
- Google Apps Script
- Google Sheets

## Setup

1. Add the Participant Information Sheet PDF to:

   `docs/EGP_Participant_Information_Sheet_v1.pdf`

2. Create a Google Sheet.

3. Create a Google Apps Script project connected to the Sheet.

4. Paste the backend code into `Code.gs`.

5. Deploy the Apps Script project as a web app.

6. Copy the `/exec` deployment URL.

7. Paste that URL into `config.js`.

8. Publish the repository through GitHub Pages.

## Important

Do not commit private credentials, passwords, service-account files,
participant exports, or other confidential records to this repository.

The Apps Script web-app URL is a submission endpoint, not a private
credential. All real validation must still happen on the server.
