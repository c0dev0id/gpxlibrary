/**
 * Database Module
 * Handles SQLite database operations with IndexedDB persistence
 */

const Database = (function() {
    'use strict';

    let db = null;
    let SQL = null;
    const DEFAULT_DB_NAME = 'gpx_library_db';
    let currentDbName = DEFAULT_DB_NAME;
    const DB_VERSION = 1;
    const STORE_NAME = 'sqliteStore';

    /**
     * Initialize SQL.js and load database from IndexedDB or create new
     * @param {string} dbName - Optional database name (for testing, use a different name)
     */
    async function init(dbName = DEFAULT_DB_NAME) {
        currentDbName = dbName;
        try {
            // Initialize SQL.js
            SQL = await initSqlJs({
                locateFile: file => `https://cdn.jsdelivr.net/npm/sql.js@1.8.0/dist/${file}`
            });
            
            // Try to load existing database from IndexedDB
            const savedDb = await loadFromIndexedDB();
            
            if (savedDb) {
                db = new SQL.Database(savedDb);
                console.log('Database loaded from IndexedDB');
                await runMigrations();
            } else {
                db = new SQL.Database();
                await createSchema();
                console.log('New database created');
            }
            
            return true;
        } catch (error) {
            console.error('Database initialization failed:', error);
            throw error;
        }
    }
    
    /**
     * Create database schema
     */
    async function createSchema() {
        // Folders table
        db.run(`
            CREATE TABLE folders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                parent_id INTEGER,
                created_at INTEGER NOT NULL,
                FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
            )
        `);
        
        // GPX files table
        db.run(`
            CREATE TABLE gpx_files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                folder_id INTEGER,
                content TEXT NOT NULL,
                length_km REAL DEFAULT 0,
                waypoint_count INTEGER DEFAULT 0,
                riding_time_hours REAL DEFAULT 0,
                created_at INTEGER NOT NULL,
                FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE
            )
        `);
        
        // Routes table (for within GPX files)
        db.run(`
            CREATE TABLE routes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                gpx_file_id INTEGER NOT NULL,
                index_in_gpx INTEGER NOT NULL,
                name TEXT,
                length_km REAL DEFAULT 0,
                riding_time_hours REAL DEFAULT 0,
                FOREIGN KEY (gpx_file_id) REFERENCES gpx_files(id) ON DELETE CASCADE
            )
        `);

        // Tracks table (for within GPX files)
        db.run(`
            CREATE TABLE tracks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                gpx_file_id INTEGER NOT NULL,
                index_in_gpx INTEGER NOT NULL,
                name TEXT,
                length_km REAL DEFAULT 0,
                riding_time_hours REAL DEFAULT 0,
                FOREIGN KEY (gpx_file_id) REFERENCES gpx_files(id) ON DELETE CASCADE
            )
        `);
        
        // Waypoints table (for within GPX files)
        db.run(`
            CREATE TABLE waypoints (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                gpx_file_id INTEGER NOT NULL,
                name TEXT,
                lat REAL NOT NULL,
                lon REAL NOT NULL,
                FOREIGN KEY (gpx_file_id) REFERENCES gpx_files(id) ON DELETE CASCADE
            )
        `);
        
        // Create indexes
        db.run('CREATE INDEX idx_folders_parent ON folders(parent_id)');
        db.run('CREATE INDEX idx_gpx_folder ON gpx_files(folder_id)');
        db.run('CREATE INDEX idx_routes_gpx ON routes(gpx_file_id)');
        db.run('CREATE INDEX idx_tracks_gpx ON tracks(gpx_file_id)');
        db.run('CREATE INDEX idx_waypoints_gpx ON waypoints(gpx_file_id)');
        
        await saveToIndexedDB();
    }

    /**
     * Run database migrations
     */
    async function runMigrations() {
        try {
            // Check if index_in_gpx column exists in routes table
            const routesColumns = db.exec("PRAGMA table_info(routes)");
            const hasRoutesIndex = routesColumns[0]?.values?.some(row => row[1] === 'index_in_gpx');

            if (!hasRoutesIndex) {
                console.log('Running migration: adding index_in_gpx to routes table');
                db.run('ALTER TABLE routes ADD COLUMN index_in_gpx INTEGER DEFAULT 0');
            }

            // Check if index_in_gpx column exists in tracks table
            const tracksColumns = db.exec("PRAGMA table_info(tracks)");
            const hasTracksIndex = tracksColumns[0]?.values?.some(row => row[1] === 'index_in_gpx');

            if (!hasTracksIndex) {
                console.log('Running migration: adding index_in_gpx to tracks table');
                db.run('ALTER TABLE tracks ADD COLUMN index_in_gpx INTEGER DEFAULT 0');
            }

            await saveToIndexedDB();
        } catch (error) {
            console.error('Migration error:', error);
            throw error;
        }
    }

    /**
     * Save database to IndexedDB
     */
    async function saveToIndexedDB() {
        return new Promise((resolve, reject) => {
            const data = db.export();
            const request = indexedDB.open(currentDbName, DB_VERSION);
            
            request.onerror = () => reject(request.error);
            
            request.onsuccess = (event) => {
                const indexedDb = event.target.result;
                const transaction = indexedDb.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                
                store.put(data, 'database');
                
                transaction.oncomplete = () => {
                    indexedDb.close();
                    resolve();
                };
                
                transaction.onerror = () => reject(transaction.error);
            };
            
            request.onupgradeneeded = (event) => {
                const indexedDb = event.target.result;
                if (!indexedDb.objectStoreNames.contains(STORE_NAME)) {
                    indexedDb.createObjectStore(STORE_NAME);
                }
            };
        });
    }
    
    /**
     * Load database from IndexedDB
     */
    async function loadFromIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(currentDbName, DB_VERSION);
            
            request.onerror = () => reject(request.error);
            
            request.onsuccess = (event) => {
                const indexedDb = event.target.result;
                
                if (!indexedDb.objectStoreNames.contains(STORE_NAME)) {
                    indexedDb.close();
                    resolve(null);
                    return;
                }
                
                const transaction = indexedDb.transaction([STORE_NAME], 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const getRequest = store.get('database');
                
                getRequest.onsuccess = () => {
                    indexedDb.close();
                    resolve(getRequest.result || null);
                };
                
                getRequest.onerror = () => {
                    indexedDb.close();
                    reject(getRequest.error);
                };
            };
            
            request.onupgradeneeded = (event) => {
                const indexedDb = event.target.result;
                if (!indexedDb.objectStoreNames.contains(STORE_NAME)) {
                    indexedDb.createObjectStore(STORE_NAME);
                }
            };
        });
    }
    
    /**
     * Execute a query and return results
     */
    function query(sql, params = []) {
        try {
            const stmt = db.prepare(sql);
            stmt.bind(params);
            
            const results = [];
            while (stmt.step()) {
                results.push(stmt.getAsObject());
            }
            stmt.free();
            
            return results;
        } catch (error) {
            console.error('Query error:', error, sql, params);
            throw error;
        }
    }
    
    /**
     * Execute a statement (INSERT, UPDATE, DELETE)
     * Returns the last insert ID for INSERT statements, true for others
     */
    async function execute(sql, params = []) {
        try {
            db.run(sql, params);

            // Get last insert ID immediately after INSERT (before saveToIndexedDB)
            let lastId = null;
            if (sql.trim().toUpperCase().startsWith('INSERT')) {
                const result = query('SELECT last_insert_rowid() as id');
                lastId = result[0].id;
                console.log('INSERT executed, last_insert_rowid():', lastId);
            }

            await saveToIndexedDB();

            return lastId !== null ? lastId : true;
        } catch (error) {
            console.error('Execute error:', error, sql, params);
            throw error;
        }
    }

    /**
     * Get last insert ID (deprecated - execute() now returns the ID directly for INSERT statements)
     */
    function getLastInsertId() {
        const result = query('SELECT last_insert_rowid() as id');
        console.log('getLastInsertId() returned:', result[0].id);
        return result[0].id;
    }
    
    /**
     * Export database as Uint8Array
     */
    function exportDatabase() {
        return db.export();
    }
    
    /**
     * Import database from Uint8Array
     */
    async function importDatabase(data) {
        try {
            db.close();
            db = new SQL.Database(data);
            await saveToIndexedDB();
            return true;
        } catch (error) {
            console.error('Import error:', error);
            throw error;
        }
    }
    
    /**
     * Begin transaction
     */
    function beginTransaction() {
        db.run('BEGIN TRANSACTION');
    }
    
    /**
     * Commit transaction
     */
    async function commit() {
        db.run('COMMIT');
        await saveToIndexedDB();
    }
    
    /**
     * Rollback transaction
     */
    function rollback() {
        db.run('ROLLBACK');
    }

    /**
     * Delete database and reinitialize (for development)
     */
    async function deleteAndReinitialize() {
        return new Promise((resolve, reject) => {
            // Close current database
            if (db) {
                db.close();
                db = null;
            }

            // Delete IndexedDB
            const request = indexedDB.deleteDatabase(currentDbName);

            request.onsuccess = async () => {
                console.log('Database deleted successfully');
                try {
                    // Reinitialize
                    await init();
                    resolve();
                } catch (error) {
                    reject(error);
                }
            };

            request.onerror = () => {
                reject(new Error('Failed to delete database'));
            };

            request.onblocked = () => {
                console.warn('Database deletion blocked - close all tabs using this database');
                reject(new Error('Database deletion blocked'));
            };
        });
    }

    // Public API
    return {
        init,
        query,
        execute,
        getLastInsertId,
        exportDatabase,
        importDatabase,
        saveToIndexedDB,
        beginTransaction,
        commit,
        rollback,
        deleteAndReinitialize
    };
})();
