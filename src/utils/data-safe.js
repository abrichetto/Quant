const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

class DataSafe {
    constructor(config = {}) {
        // Base directory for all data
        this.baseDir = config.baseDir || path.join(__dirname, '..', '..', 'data-safe');
        
        // Create core directories if they don't exist
        this.directories = {
            market: path.join(this.baseDir, 'market'),
            research: path.join(this.baseDir, 'research'),
            fundamentals: path.join(this.baseDir, 'fundamentals'),
            technicals: path.join(this.baseDir, 'technicals'),
            strategies: path.join(this.baseDir, 'strategies'),
            secure: path.join(this.baseDir, 'secure'),
            temp: path.join(this.baseDir, 'temp'),
        };
        
        // Create all directories
        Object.values(this.directories).forEach(dir => {
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        });
        
        // Create subdirectories for market data
        const marketSubdirs = ['equities', 'forex', 'crypto', 'commodities', 'indices'];
        marketSubdirs.forEach(subdir => {
            const subdirPath = path.join(this.directories.market, subdir);
            if (!fs.existsSync(subdirPath)) fs.mkdirSync(subdirPath, { recursive: true });
        });
        
        // Create subdirectories for research
        const researchSubdirs = ['reports', 'models', 'backtests', 'analysis'];
        researchSubdirs.forEach(subdir => {
            const subdirPath = path.join(this.directories.research, subdir);
            if (!fs.existsSync(subdirPath)) fs.mkdirSync(subdirPath, { recursive: true });
        });
        
        // Encryption setup - use environment variable for key
        this.encryptionKey = process.env.DD_ENCRYPTION_KEY;
        if (!this.encryptionKey) {
            console.warn('Warning: No encryption key found in environment variables (DD_ENCRYPTION_KEY)');
            console.warn('Secure storage functionality will be limited');
        }
        
        // Initialize the catalog (metadata index)
        this.catalogPath = path.join(this.baseDir, 'catalog.json');
        this.catalog = this._loadCatalog();
    }
    
    /**
     * Store market data for a specific asset
     * @param {string} asset - The asset ticker/symbol
     * @param {string} assetType - Type (equities, forex, crypto, etc)
     * @param {Object} data - The data to store
     * @param {Object} metadata - Additional metadata
     */
    storeMarketData(asset, assetType, data, metadata = {}) {
        // Validate asset type
        if (!['equities', 'forex', 'crypto', 'commodities', 'indices'].includes(assetType)) {
            throw new Error(`Invalid asset type: ${assetType}`);
        }
        
        // Create asset directory if it doesn't exist
        const assetDir = path.join(this.directories.market, assetType, asset);
        if (!fs.existsSync(assetDir)) fs.mkdirSync(assetDir, { recursive: true });
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const filename = `${asset}_${timestamp}.json`;
        const filePath = path.join(assetDir, filename);
        
        // Prepare the full object with metadata
        const fullData = {
            asset,
            assetType,
            timestamp,
            metadata,
            data
        };
        
        // Write the data to file
        fs.writeFileSync(filePath, JSON.stringify(fullData, null, 2));
        
        // Update catalog
        this._addToCatalog({
            type: 'market_data',
            asset,
            assetType,
            timestamp,
            filePath,
            metadata
        });
        
        return filePath;
    }
    
    /**
     * Store research data
     * @param {string} title - Research title
     * @param {string} category - Research category
     * @param {Object} data - The data to store
     * @param {Object} metadata - Additional metadata
     * @param {boolean} secure - Whether to encrypt the data
     */
    storeResearch(title, category, data, metadata = {}, secure = false) {
        // Validate category
        if (!['reports', 'models', 'backtests', 'analysis'].includes(category)) {
            throw new Error(`Invalid research category: ${category}`);
        }
        
        // Create safe filename
        const safeTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_');
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const filename = `${safeTitle}_${timestamp}.json`;
        
        // Determine directory based on security requirement
        const targetDir = secure ? 
            this.directories.secure : 
            path.join(this.directories.research, category);
        
        const filePath = path.join(targetDir, filename);
        
        // Prepare the full object with metadata
        const fullData = {
            title,
            category,
            timestamp,
            metadata,
            data
        };
        
        // Write the data (encrypted if necessary)
        if (secure && this.encryptionKey) {
            this._writeEncrypted(filePath, fullData);
        } else {
            fs.writeFileSync(filePath, JSON.stringify(fullData, null, 2));
        }
        
        // Update catalog
        this._addToCatalog({
            type: 'research',
            title,
            category,
            timestamp,
            filePath,
            secure,
            metadata
        });
        
        return filePath;
    }
    
    /**
     * Store strategy data
     * @param {string} strategyName - Strategy name
     * @param {Object} strategyData - The strategy configuration
     * @param {Object} metadata - Additional metadata
     * @param {boolean} secure - Whether to encrypt the data
     */
    storeStrategy(strategyName, strategyData, metadata = {}, secure = false) {
        // Create safe filename
        const safeName = strategyName.replace(/[^a-zA-Z0-9_-]/g, '_');
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const filename = `${safeName}_${timestamp}.json`;
        
        // Determine directory based on security requirement
        const targetDir = secure ? 
            this.directories.secure : 
            this.directories.strategies;
        
        const filePath = path.join(targetDir, filename);
        
        // Prepare the full object with metadata
        const fullData = {
            strategyName,
            timestamp,
            metadata,
            strategyData
        };
        
        // Write the data (encrypted if necessary)
        if (secure && this.encryptionKey) {
            this._writeEncrypted(filePath, fullData);
        } else {
            fs.writeFileSync(filePath, JSON.stringify(fullData, null, 2));
        }
        
        // Update catalog
        this._addToCatalog({
            type: 'strategy',
            strategyName,
            timestamp,
            filePath,
            secure,
            metadata
        });
        
        return filePath;
    }
    
    /**
     * Store technical analysis data
     * @param {string} asset - The asset ticker/symbol
     * @param {string} analysisType - Type of analysis
     * @param {Object} data - The analysis data
     * @param {Object} metadata - Additional metadata
     */
    storeTechnicalAnalysis(asset, analysisType, data, metadata = {}) {
        // Create directory structure
        const assetDir = path.join(this.directories.technicals, asset);
        if (!fs.existsSync(assetDir)) fs.mkdirSync(assetDir, { recursive: true });
        
        // Generate filename
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const filename = `${analysisType}_${timestamp}.json`;
        const filePath = path.join(assetDir, filename);
        
        // Prepare the full object
        const fullData = {
            asset,
            analysisType,
            timestamp,
            metadata,
            data
        };
        
        // Write the data
        fs.writeFileSync(filePath, JSON.stringify(fullData, null, 2));
        
        // Update catalog
        this._addToCatalog({
            type: 'technical_analysis',
            asset,
            analysisType,
            timestamp,
            filePath,
            metadata
        });
        
        return filePath;
    }
    
    /**
     * Store fundamental data for a company
     * @param {string} ticker - Company ticker
     * @param {string} dataType - Type of fundamental data
     * @param {Object} data - The data to store
     * @param {Object} metadata - Additional metadata
     */
    storeFundamental(ticker, dataType, data, metadata = {}) {
        // Create company directory if it doesn't exist
        const companyDir = path.join(this.directories.fundamentals, ticker);
        if (!fs.existsSync(companyDir)) fs.mkdirSync(companyDir, { recursive: true });
        
        // Generate filename
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const filename = `${dataType}_${timestamp}.json`;
        const filePath = path.join(companyDir, filename);
        
        // Prepare the full object
        const fullData = {
            ticker,
            dataType,
            timestamp,
            metadata,
            data
        };
        
        // Write the data
        fs.writeFileSync(filePath, JSON.stringify(fullData, null, 2));
        
        // Update catalog
        this._addToCatalog({
            type: 'fundamental',
            ticker,
            dataType,
            timestamp,
            filePath,
            metadata
        });
        
        return filePath;
    }
    
    /**
     * Search for data in the catalog
     * @param {Object} query - Search parameters
     * @returns {Array} Matching items
     */
    search(query = {}) {
        return this.catalog.filter(item => {
            // Match all specified query parameters
            return Object.keys(query).every(key => {
                // Support for nested properties using dot notation
                if (key.includes('.')) {
                    const parts = key.split('.');
                    let value = item;
                    for (const part of parts) {
                        if (!value || !value[part]) return false;
                        value = value[part];
                    }
                    return value === query[key];
                }
                
                // Direct property match
                return item[key] === query[key];
            });
        });
    }
    
    /**
     * Retrieve data by ID
     * @param {string} id - The catalog ID
     * @returns {Object} The data
     */
    retrieveById(id) {
        const catalogItem = this.catalog.find(item => item.id === id);
        if (!catalogItem) throw new Error(`Item with ID ${id} not found in catalog`);
        
        return this._retrieveFile(catalogItem);
    }
    
    /**
     * Retrieve the most recent data for a specific asset
     * @param {string} asset - The asset ticker/symbol
     * @param {string} assetType - Type of asset
     * @returns {Object} The data
     */
    retrieveLatestMarketData(asset, assetType) {
        const matches = this.search({ 
            type: 'market_data', 
            asset, 
            assetType 
        });
        
        if (matches.length === 0) {
            throw new Error(`No market data found for ${asset} (${assetType})`);
        }
        
        // Sort by timestamp descending
        const sorted = matches.sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
        );
        
        // Return the most recent data
        return this._retrieveFile(sorted[0]);
    }
    
    /**
     * Retrieve the most recent research for a category
     * @param {string} category - Research category
     * @returns {Array} Research data
     */
    retrieveLatestResearch(category) {
        const matches = this.search({ 
            type: 'research', 
            category 
        });
        
        if (matches.length === 0) {
            throw new Error(`No research found for category: ${category}`);
        }
        
        // Sort by timestamp descending
        const sorted = matches.sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
        );
        
        // Return the most recent data
        return this._retrieveFile(sorted[0]);
    }
    
    /**
     * Export all data for backup
     * @param {string} exportPath - Path to export to
     * @param {boolean} includeSecure - Whether to include secure data
     */
    exportData(exportPath, includeSecure = false) {
        // Create directory if it doesn't exist
        if (!fs.existsSync(exportPath)) fs.mkdirSync(exportPath, { recursive: true });
        
        // Copy the catalog
        fs.writeFileSync(
            path.join(exportPath, 'catalog.json'), 
            JSON.stringify(this.catalog, null, 2)
        );
        
        // Copy all files except secure ones
        for (const item of this.catalog) {
            if (item.secure && !includeSecure) continue;
            
            const sourcePath = item.filePath;
            const relativePath = path.relative(this.baseDir, sourcePath);
            const targetPath = path.join(exportPath, relativePath);
            
            // Create directory if it doesn't exist
            const targetDir = path.dirname(targetPath);
            if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
            
            try {
                // Retrieve and save the file
                const data = this._retrieveFile(item);
                fs.writeFileSync(targetPath, JSON.stringify(data, null, 2));
            } catch (error) {
                console.error(`Error exporting ${sourcePath}:`, error);
            }
        }
        
        return exportPath;
    }
    
    /**
     * Import data from a backup
     * @param {string} importPath - Path to import from
     */
    importData(importPath) {
        // Check if catalog exists
        const catalogPath = path.join(importPath, 'catalog.json');
        if (!fs.existsSync(catalogPath)) {
            throw new Error(`No catalog found at ${catalogPath}`);
        }
        
        // Read the catalog
        const importedCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
        
        // Import each file
        let importedCount = 0;
        for (const item of importedCatalog) {
            try {
                const relativePath = path.relative(importPath, item.filePath);
                const sourcePath = path.join(importPath, relativePath);
                const targetPath = path.join(this.baseDir, relativePath);
                
                // Create directory if it doesn't exist
                const targetDir = path.dirname(targetPath);
                if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
                
                // Read the source file
                const data = JSON.parse(fs.readFileSync(sourcePath, 'utf-8'));
                
                // Write the file (encrypted if necessary)
                if (item.secure && this.encryptionKey) {
                    this._writeEncrypted(targetPath, data);
                } else {
                    fs.writeFileSync(targetPath, JSON.stringify(data, null, 2));
                }
                
                importedCount++;
            } catch (error) {
                console.error(`Error importing ${item.filePath}:`, error);
            }
        }
        
        // Update the catalog
        this.catalog = [...this.catalog, ...importedCatalog];
        this._saveCatalog();
        
        return importedCount;
    }
    
    // Private methods
    
    /**
     * Load or create catalog
     */
    _loadCatalog() {
        if (fs.existsSync(this.catalogPath)) {
            return JSON.parse(fs.readFileSync(this.catalogPath, 'utf-8'));
        }
        return [];
    }
    
    /**
     * Save catalog to disk
     */
    _saveCatalog() {
        fs.writeFileSync(this.catalogPath, JSON.stringify(this.catalog, null, 2));
    }
    
    /**
     * Add an item to the catalog
     */
    _addToCatalog(item) {
        // Generate a unique ID
        item.id = crypto.randomUUID ? 
            crypto.randomUUID() : 
            Date.now().toString(36) + Math.random().toString(36).substring(2);
        
        this.catalog.push(item);
        this._saveCatalog();
    }
    
    /**
     * Retrieve file data (decrypting if necessary)
     */
    _retrieveFile(catalogItem) {
        const filePath = catalogItem.filePath;
        
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }
        
        if (catalogItem.secure && this.encryptionKey) {
            return this._readEncrypted(filePath);
        }
        
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
    
    /**
     * Encrypt and write data
     */
    _writeEncrypted(filePath, data) {
        if (!this.encryptionKey) {
            throw new Error('Encryption key not available');
        }
        
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(
            'aes-256-gcm', 
            Buffer.from(this.encryptionKey, 'hex'),
            iv
        );
        
        let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag().toString('hex');
        
        // Format: IV:AuthTag:EncryptedData
        const encryptedData = `${iv.toString('hex')}:${authTag}:${encrypted}`;
        fs.writeFileSync(filePath, encryptedData);
    }
    
    /**
     * Read and decrypt data
     */
    _readEncrypted(filePath) {
        if (!this.encryptionKey) {
            throw new Error('Encryption key not available');
        }
        
        const encryptedData = fs.readFileSync(filePath, 'utf8');
        const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
        
        const decipher = crypto.createDecipheriv(
            'aes-256-gcm',
            Buffer.from(this.encryptionKey, 'hex'),
            Buffer.from(ivHex, 'hex')
        );
        
        decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
        
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return JSON.parse(decrypted);
    }
}

module.exports = DataSafe;