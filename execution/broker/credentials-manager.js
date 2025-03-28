const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class CredentialsManager {
  constructor() {
    this.encryptionKey = process.env.ENCRYPTION_KEY;
    if (!this.encryptionKey) {
      throw new Error('Encryption key not found in environment variables');
    }
  }

  // Encrypt credentials for storage
  encryptCredentials(credentials) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-gcm', 
      Buffer.from(this.encryptionKey, 'hex'),
      iv
    );
    
    let encrypted = cipher.update(JSON.stringify(credentials), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    
    return {
      iv: iv.toString('hex'),
      encryptedData: encrypted,
      authTag
    };
  }

  // Decrypt stored credentials for use
  decryptCredentials(encryptedData, iv, authTag) {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      Buffer.from(this.encryptionKey, 'hex'),
      Buffer.from(iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }

  // Save encrypted credentials
  saveCredentials(broker, credentials) {
    const encrypted = this.encryptCredentials(credentials);
    
    // Create credentials directory if it doesn't exist
    const credDir = path.join(__dirname, '..', '..', '..', 'config', 'secure');
    if (!fs.existsSync(credDir)) {
      fs.mkdirSync(credDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(credDir, `${broker}.enc`),
      JSON.stringify(encrypted)
    );
    
    return true;
  }

  // Load and decrypt credentials
  loadCredentials(broker) {
    const credPath = path.join(__dirname, '..', '..', '..', 'config', 'secure', `${broker}.enc`);
    
    if (!fs.existsSync(credPath)) {
      throw new Error(`Credentials for ${broker} not found`);
    }
    
    const encrypted = JSON.parse(fs.readFileSync(credPath, 'utf8'));
    return this.decryptCredentials(
      encrypted.encryptedData,
      encrypted.iv,
      encrypted.authTag
    );
  }
}

module.exports = new CredentialsManager();