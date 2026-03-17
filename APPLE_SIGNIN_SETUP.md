# Apple Sign In - Complete Setup Guide

## ⚠️ Prerequisites

1. **Apple Developer Account** ($99/year) - https://developer.apple.com/programs/
2. **Domain name** (Apple requires HTTPS for production)
3. **Time required**: ~45-60 minutes

---

## 📋 Step-by-Step Setup

### **STEP 1: Create App ID (10 minutes)**

1. Go to https://developer.apple.com/account/resources/identifiers/list
2. Click the **+** button (top left)
3. Select **App IDs** → Click **Continue**
4. Select **App** → Click **Continue**
5. Fill in the form:
   - **Description**: `AllRemotes Web App`
   - **Bundle ID**: Select **Explicit**
   - **Bundle ID**: `com.allremotes.webapp` (or your domain reversed)
6. Scroll down and check **Sign in with Apple**
7. Click **Continue** → Click **Register**

---

### **STEP 2: Create Service ID (10 minutes)**

1. Go back to Identifiers list
2. Click the **+** button
3. Select **Services IDs** → Click **Continue**
4. Fill in the form:
   - **Description**: `AllRemotes Web Service`
   - **Identifier**: `com.allremotes.webapp.service`
5. Check **Sign in with Apple**
6. Click **Configure** next to "Sign in with Apple"
7. In the configuration:
   - **Primary App ID**: Select the App ID you created in Step 1
   - **Domains and Subdomains**: Add:
     - `localhost` (for development)
     - `yourdomain.com` (for production)
   - **Return URLs**: Add:
     - `http://localhost:3000` (for development)
     - `https://yourdomain.com` (for production)
8. Click **Save** → Click **Continue** → Click **Register**

**IMPORTANT**: Save your Service ID: `com.allremotes.webapp.service`

---

### **STEP 3: Create Private Key (5 minutes)**

1. Go to https://developer.apple.com/account/resources/authkeys/list
2. Click the **+** button
3. Fill in:
   - **Key Name**: `AllRemotes Sign In Key`
4. Check **Sign in with Apple**
5. Click **Configure** next to "Sign in with Apple"
6. Select your **Primary App ID** from Step 1
7. Click **Save** → Click **Continue** → Click **Register**
8. **Download the key file** (`.p8` file)
   - ⚠️ **YOU CAN ONLY DOWNLOAD THIS ONCE!**
   - Save it somewhere safe
9. Note the **Key ID** (10 characters, like `ABC123XYZ9`)

---

### **STEP 4: Get Your Team ID (1 minute)**

1. Go to https://developer.apple.com/account
2. Click **Membership** in the sidebar
3. Copy your **Team ID** (10 characters)

---

### **STEP 5: Prepare Your Private Key (5 minutes)**

1. Open the `.p8` file you downloaded in a text editor
2. Copy the entire contents (including the BEGIN/END lines)
3. You'll need this for your `.env` file

---

## 🔧 Implementation Steps

### **STEP 6: Install Required Package**

```bash
npm install apple-signin-auth
```

---

### **STEP 7: Add Environment Variables**

Open your `.env` file and add these lines:

```env
# Apple Sign In Configuration
NEXT_PUBLIC_APPLE_SERVICE_ID=com.allremotes.webapp.service
APPLE_TEAM_ID=YOUR_TEAM_ID_HERE
APPLE_KEY_ID=YOUR_KEY_ID_HERE
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
YOUR_PRIVATE_KEY_CONTENT_HERE
-----END PRIVATE KEY-----"
```

**Replace:**
- `YOUR_TEAM_ID_HERE` → Your Team ID from Step 4
- `YOUR_KEY_ID_HERE` → Your Key ID from Step 3
- `YOUR_PRIVATE_KEY_CONTENT_HERE` → Contents of your `.p8` file from Step 5

**Example:**
```env
NEXT_PUBLIC_APPLE_SERVICE_ID=com.allremotes.webapp.service
APPLE_TEAM_ID=ABC123XYZ9
APPLE_KEY_ID=DEF456GHI8
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...
...rest of your key...
-----END PRIVATE KEY-----"
```

---

### **STEP 8: I'll Create the Implementation Code**

I'll now create:
1. API route to handle Apple Sign In token exchange
2. Update login/register pages with Apple Sign In SDK
3. Add Apple Sign In button initialization

Would you like me to implement the code now, or do you want to complete Steps 1-7 first?

---

## 📝 Quick Checklist

Before implementing the code, make sure you have:

- [ ] Apple Developer Account ($99/year)
- [ ] Created App ID with Sign in with Apple enabled
- [ ] Created Service ID with domains and return URLs configured
- [ ] Created and downloaded Private Key (.p8 file)
- [ ] Copied your Team ID
- [ ] Copied your Key ID
- [ ] Added all credentials to `.env` file
- [ ] Installed `apple-signin-auth` package

---

## 🚀 Next Steps

Once you have all the credentials:
1. Add them to your `.env` file
2. Let me know, and I'll implement the Apple Sign In code
3. Test on your iPhone 13 Pro Max

**Note**: Apple Sign In requires HTTPS in production, but works with `http://localhost` in development.
