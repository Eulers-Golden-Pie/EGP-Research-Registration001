# EGP Research Registration Portal

Premium static registration portal for the Euler’s Golden Pie research study.

## Launch with a new Google Sheet
1. Create a new Google Sheet.
2. Open **Extensions → Apps Script**.
3. Replace the default code with `apps-script/Code.gs`.
4. Save, then choose **Deploy → New deployment → Web app**.
5. Execute as **Me** and allow access to **Anyone**.
6. Copy the deployment URL ending in `/exec`.
7. Paste it into `config.js` as `appsScriptUrl`.
8. Commit and enable GitHub Pages.

The backend enforces the August 4, 2026 11:59 PM Central deadline and the 12-participant maximum using `LockService`, preventing simultaneous overbooking. One child equals one participant spot.
