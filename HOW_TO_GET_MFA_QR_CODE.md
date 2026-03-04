# How to Get Your MFA QR Code

## Quick Method: Use the Test Script

I've created a test script that will generate the QR code for you.

### Step 1: Run the Script

```bash
cd backend
node test-generate-mfa.js
```

### Step 2: Get the QR Code

The script will output:
- ✅ A secret key (you can enter this manually)
- ✅ A QR code data URL

### Step 3: View the QR Code

**Option A: Create HTML file** (Easiest)
1. Copy the QR code data URL from the output
2. Create a file called `qr-code.html`
3. Add this content:
   ```html
   <!DOCTYPE html>
   <html>
   <body>
     <h1>MFA QR Code</h1>
     <img src="PASTE_QR_CODE_DATA_URL_HERE" />
   </body>
   </html>
   ```
4. Open `qr-code.html` in your browser
5. Scan with Google Authenticator

**Option B: Use the Secret Key**
1. Copy the secret key from the output
2. Open Google Authenticator
3. Tap "+" → "Enter a setup key"
4. Paste the secret key
5. Done!

---

## Alternative: Use API Directly

### Using Postman or Thunder Client:

**Request:**
```
POST http://localhost:4000/api/mfa/generate
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
  Content-Type: application/json

Body:
{
  "employeeId": 1
}
```

**Response will include:**
- `qrCode`: Data URL you can display as an image
- `secret`: Manual entry code
- `otpauthUrl`: URL for QR code

---

## Using Browser Console

1. Open your frontend (http://localhost:5173)
2. Login as HR
3. Open browser console (F12)
4. Run this code:

```javascript
fetch('http://localhost:4000/api/mfa/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('hpms_admin_token')
  },
  body: JSON.stringify({ employeeId: 1 })
})
.then(r => r.json())
.then(data => {
  console.log('Secret:', data.data.secret);
  console.log('QR Code:', data.data.qrCode);
  // Display QR code
  const img = document.createElement('img');
  img.src = data.data.qrCode;
  document.body.appendChild(img);
});
```

This will display the QR code directly on the page!

---

## What to Do After Getting the QR Code

1. **Open Google Authenticator** on your phone
2. **Tap "+"** to add account
3. **Scan the QR code** OR enter the secret key manually
4. **Save** - you'll see a 6-digit code
5. **Use this code** when logging in

---

## Troubleshooting

**"Insufficient permissions"**
- Make sure you're logged in as HR
- Check that your role is 'HR' in the database

**"Employee not found"**
- Change the `employeeId` in the script
- Check what employee IDs exist in your database

**QR code not displaying**
- The data URL is very long - make sure you copy it all
- Try using the secret key instead (manual entry)
