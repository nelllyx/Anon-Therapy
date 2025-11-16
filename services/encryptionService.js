const crypto = require('crypto');

class EncryptionService {
    constructor() {
        // Get encryption key from environment or generate one
        // In production, this should be a strong, randomly generated key stored securely
        this.algorithm = 'aes-256-gcm';
        this.keyLength = 32; // 256 bits
        this.ivLength = 16; // 128 bits
        this.tagLength = 16; // 128 bits
        this.saltLength = 64; // For key derivation
        
        // Get encryption key from environment variable
        // If not set, generate a temporary one (NOT RECOMMENDED FOR PRODUCTION)
        this.encryptionKey = process.env.MESSAGE_ENCRYPTION_KEY || this.generateKey();
        
        if (!process.env.MESSAGE_ENCRYPTION_KEY) {
            console.warn('⚠️  WARNING: MESSAGE_ENCRYPTION_KEY not set in environment. Using temporary key. This is not secure for production!');
        }
    }

    /**
     * Generate a random encryption key
     */
    generateKey() {
        return crypto.randomBytes(this.keyLength).toString('hex');
    }

    /**
     * Derive encryption key from password using PBKDF2
     * For production, consider using a key derivation service
     */
    deriveKey(password, salt) {
        return crypto.pbkdf2Sync(password, salt, 100000, this.keyLength, 'sha512');
    }

    /**
     * Encrypt a message
     * @param {string} plaintext - The message to encrypt
     * @param {string} key - Optional encryption key (uses default if not provided)
     * @returns {Object} - Encrypted data with iv, tag, and encrypted content
     */
    encrypt(plaintext, key = null) {
        try {
            const encryptionKey = key ? Buffer.from(key, 'hex') : Buffer.from(this.encryptionKey, 'hex');
            
            // Generate random IV
            const iv = crypto.randomBytes(this.ivLength);
            
            // Create cipher
            const cipher = crypto.createCipheriv(this.algorithm, encryptionKey, iv);
            
            // Encrypt the message
            let encrypted = cipher.update(plaintext, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            // Get authentication tag
            const tag = cipher.getAuthTag();
            
            return {
                encryptedContent: encrypted,
                iv: iv.toString('hex'),
                tag: tag.toString('hex')
            };
        } catch (error) {
            console.error('Encryption error:', error);
            throw new Error('Failed to encrypt message');
        }
    }

    /**
     * Decrypt a message
     * @param {Object} encryptedData - Object with encryptedContent, iv, and tag
     * @param {string} key - Optional decryption key (uses default if not provided)
     * @returns {string} - Decrypted plaintext
     */
    decrypt(encryptedData, key = null) {
        try {
            const { encryptedContent, iv, tag } = encryptedData;
            
            if (!encryptedContent || !iv || !tag) {
                throw new Error('Invalid encrypted data format');
            }
            
            const encryptionKey = key ? Buffer.from(key, 'hex') : Buffer.from(this.encryptionKey, 'hex');
            const ivBuffer = Buffer.from(iv, 'hex');
            const tagBuffer = Buffer.from(tag, 'hex');
            
            // Create decipher
            const decipher = crypto.createDecipheriv(this.algorithm, encryptionKey, ivBuffer);
            decipher.setAuthTag(tagBuffer);
            
            // Decrypt the message
            let decrypted = decipher.update(encryptedContent, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
        } catch (error) {
            console.error('Decryption error:', error);
            throw new Error('Failed to decrypt message');
        }
    }

    /**
     * Generate a secure random string
     */
    generateSecureRandom(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }
}

module.exports = new EncryptionService();

