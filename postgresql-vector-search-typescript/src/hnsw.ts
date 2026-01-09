import path from 'path';
import { readFileReturnJson, getClientsPasswordless, connectToDatabase, printSearchResults } from './utils.js';

// ESM specific features - create __dirname equivalent
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config = {
    query: 'quintessential lodging near running trails, eateries, retail',
    tableName: 'hotels_hnsw',
    dataFile: process.env.DATA_FILE_WITH_VECTORS!,
    embeddedField: process.env.EMBEDDED_FIELD!,
    embeddingDimensions: parseInt(process.env.EMBEDDING_DIMENSIONS!, 10),
    deployment: process.env.AZURE_OPENAI_EMBEDDING_MODEL!,
    batchSize: parseInt(process.env.LOAD_SIZE_BATCH! || '100', 10),
    m: 16,              // Maximum number of connections per layer for HNSW
    efConstruction: 64  // Size of the dynamic candidate list for constructing the graph
};

/**
 * Enable pgvector extension
 */
async function enablePgVector(client: any): Promise<void> {
    await client.query('CREATE EXTENSION IF NOT EXISTS vector');
    console.log('pgvector extension enabled');
}

/**
 * Create the hotels table with vector column
 */
async function createTable(client: any): Promise<void> {
    const dropTableSQL = `DROP TABLE IF EXISTS ${config.tableName}`;
    await client.query(dropTableSQL);
    
    const createTableSQL = `
        CREATE TABLE ${config.tableName} (
            hotelid VARCHAR(50) PRIMARY KEY,
            hotelname VARCHAR(200) NOT NULL,
            description TEXT,
            category VARCHAR(100),
            tags JSONB,
            parking_included BOOLEAN,
            last_renovation_date TIMESTAMP,
            rating FLOAT,
            address_street VARCHAR(200),
            address_city VARCHAR(100),
            address_state VARCHAR(100),
            address_postal VARCHAR(20),
            address_country VARCHAR(100),
            location_lat FLOAT,
            location_lon FLOAT,
            ${config.embeddedField} vector(${config.embeddingDimensions})
        )
    `;
    
    await client.query(createTableSQL);
    console.log(`Table '${config.tableName}' created`);
}

/**
 * Insert hotel data with vectors
 */
async function insertData(client: any, data: any[]): Promise<void> {
    console.log(`Inserting ${data.length} records...`);
    
    for (let i = 0; i < data.length; i += config.batchSize) {
        const batch = data.slice(i, i + config.batchSize);
        
        for (const hotel of batch) {
            const insertSQL = `
                INSERT INTO ${config.tableName} (
                    hotelid, hotelname, description, category, tags,
                    parking_included, last_renovation_date, rating,
                    address_street, address_city, address_state,
                    address_postal, address_country,
                    location_lat, location_lon,
                    ${config.embeddedField}
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            `;
            
            const values = [
                hotel.HotelId,
                hotel.HotelName,
                hotel.Description || null,
                hotel.Category || null,
                hotel.Tags ? JSON.stringify(hotel.Tags) : null,
                hotel.ParkingIncluded || false,
                hotel.LastRenovationDate || null,
                hotel.Rating || null,
                hotel.Address?.StreetAddress || null,
                hotel.Address?.City || null,
                hotel.Address?.StateProvince || null,
                hotel.Address?.PostalCode || null,
                hotel.Address?.Country || null,
                hotel.Location?.Latitude || null,
                hotel.Location?.Longitude || null,
                JSON.stringify(hotel[config.embeddedField])
            ];
            
            await client.query(insertSQL, values);
        }
        
        console.log(`Inserted ${Math.min(i + config.batchSize, data.length)} of ${data.length} records`);
    }
}

/**
 * Create HNSW index on vector column
 */
async function createHNSWIndex(client: any): Promise<void> {
    console.log(`\nCreating HNSW index (m=${config.m}, ef_construction=${config.efConstruction})...`);
    
    const createIndexSQL = `
        CREATE INDEX ON ${config.tableName} 
        USING hnsw (${config.embeddedField} vector_cosine_ops) 
        WITH (m = ${config.m}, ef_construction = ${config.efConstruction})
    `;
    
    await client.query(createIndexSQL);
    console.log('HNSW index created');
}

/**
 * Perform vector search using cosine distance
 */
async function performVectorSearch(client: any, queryVector: number[]): Promise<any[]> {
    const searchSQL = `
        SELECT 
            hotelid,
            hotelname,
            description,
            ${config.embeddedField} <=> $1::vector AS distance
        FROM ${config.tableName}
        ORDER BY ${config.embeddedField} <=> $1::vector
        LIMIT 5
    `;
    
    const result = await client.query(searchSQL, [JSON.stringify(queryVector)]);
    return result.rows;
}

async function main() {
    const { aiClient, getClient } = getClientsPasswordless();
    let client: any = null;

    try {
        if (!aiClient) {
            throw new Error('AI client is not configured. Please check your environment variables.');
        }

        // Connect to database
        client = await getClient();
        await connectToDatabase(client);

        // Enable pgvector
        await enablePgVector(client);

        // Create table
        await createTable(client);

        // Load and insert data
        const dataPath = path.join(__dirname, '..', config.dataFile);
        const data = await readFileReturnJson(dataPath);
        await insertData(client, data);

        // Create HNSW index
        await createHNSWIndex(client);

        console.log('\nData insertion complete!');
        console.log('\n=== Performing Vector Search ===\n');

        // Create embedding for the query
        const queryEmbeddingResponse = await aiClient.embeddings.create({
            model: config.deployment,
            input: [config.query]
        });

        const queryVector = queryEmbeddingResponse.data[0].embedding;

        // Perform vector search
        const searchResults = await performVectorSearch(client, queryVector);

        // Print the results
        printSearchResults(searchResults, config.query, 'HNSW');

        console.log('Vector search completed successfully!');

    } catch (error) {
        console.error('App failed:', error);
        process.exitCode = 1;
    } finally {
        if (client) {
            await client.end();
        }
    }
}

// Execute the main function
main().catch(error => {
    console.error('Unhandled error:', error);
    process.exitCode = 1;
});
