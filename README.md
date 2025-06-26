# XNotify 🐦➡️📲

**XNotify** is a personal bot that watches specific Twitter/X accounts and sends you a WhatsApp message when they post something new. Perfect for tracking artists, concerts, or news — without needing the official Twitter API.

## 💡 How It Works

- Uses **Playwright** + **Puppeteer Stealth** to log in and scrape tweets like a real user.
- Rotates between **multiple logged-in accounts** to avoid getting rate-limited.
- Sends new tweets to **WhatsApp** via Twilio.
- Deployable on **Railway**, no need to commit your login sessions.

---

## ⚙️ Setup

### 1. Clone and install

```bash
git clone https://github.com/yourusername/xnotify.git
cd xnotify
pnpm install
````

### 2. Log in to Twitter/X (3 accounts)

This step creates session files (like cookies) for the bot to use.

```bash
pnpm tsx scripts/login.ts
```

You’ll be prompted to log in 3 times. Sessions will be saved to `auth/X1.json`, `X2.json`, `X3.json`.

---

### 3. Convert sessions to base64 for Railway

```bash
base64 auth/X1.json
# copy and save as TWITTER1_JSON_B64 in your .env

base64 auth/X2.json
# save as TWITTER2_JSON_B64

base64 auth/X3.json
# save as TWITTER3_JSON_B64
```

---

### 4. Create `.env`

```env
TWILIO_SID=your_twilio_sid
TWILIO_TOKEN=your_twilio_token
TWILIO_FROM=whatsapp:+14155238886
TWILIO_TO=whatsapp:+60123456789

TWITTER1_JSON_B64=base64string...
TWITTER2_JSON_B64=base64string...
TWITTER3_JSON_B64=base64string...
```

---

### 5. Run the bot locally

```bash
pnpm dev
```

You’ll start getting WhatsApp alerts for tracked users.

---

## 🚀 Deploying to Railway

This bot is ready for Railway:

* Your `.env` will restore session files on boot
* No need to upload or commit the `auth/` folder
* The script runs forever and checks every 30 seconds

---

## ✏️ Customization

Want to follow different people?

Just edit this line in `src/index.ts`:

```ts
const trackedUsers = ['h47172776', 'livenationsg', 'livenationph'];
```

Change the poll interval here:

```ts
setInterval(checkPosts, 30 * 1000); // every 30 seconds
```

---

Made by [@mishoshup](https://github.com/mishoshup).

MIT License.
