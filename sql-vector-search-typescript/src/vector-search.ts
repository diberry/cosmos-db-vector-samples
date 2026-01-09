import path from 'path';
import { TYPES } from 'tedious';
import { 
    readFileReturnJson, 
    getClientsPasswordless, 
    connectToDatabase, 
    executeCommand, 
    executeQuery,
    printSearchResults 
} from './utils.js';

// ESM specific features - create __dirname equivalent
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config = {
    query: 'quintessential lodging near running trails, eateries, retail',
    tableName: 'Hotels',
    dataFile: process.env.DATA_FILE_WITH_VECTORS!,
    embeddedField: process.env.EMBEDDED_FIELD!,
    embeddingDimensions: parseInt(process.env.EMBEDDING_DIMENSIONS!, 10),
    deployment: process.env.AZURE_OPENAI_EMBEDDING_MODEL!,
    batchSize: parseInt(process.env.LOAD_SIZE_BATCH! || '100', 10)
};

/**
 * Create the Hotels table with vector column
 */
async function createTable(connection: any): Promise<void> {
    const createTableSQL = `
        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = '${config.tableName}')
        BEGIN
            CREATE TABLE ${config.tableName} (
                HotelId NVARCHAR(50) PRIMARY KEY,
                HotelName NVARCHAR(200) NOT NULL,
                Description NVARCHAR(MAX),
                Category NVARCHAR(100),
                Tags NVARCHAR(MAX),
                ParkingIncluded BIT,
                LastRenovationDate DATETIME,
                Rating FLOAT,
                Address_StreetAddress NVARCHAR(200),
                Address_City NVARCHAR(100),
                Address_StateProvince NVARCHAR(100),
                Address_PostalCode NVARCHAR(20),
                Address_Country NVARCHAR(100),
                Location_Latitude FLOAT,
                Location_Longitude FLOAT,
                ${config.embeddedField} VECTOR(${config.embeddingDimensions})
            )
        END
    `;
    
    await executeCommand(connection, createTableSQL);
    console.log(`Table '${config.tableName}' is ready`);
}

/**
 * Insert hotel data with vectors into the database
 */
async function insertData(connection: any, data: any[]): Promise<void> {
    console.log(`Inserting ${data.length} records...`);
    
    for (let i = 0; i < data.length; i += config.batchSize) {
        const batch = data.slice(i, i + config.batchSize);
        
        for (const hotel of batch) {
            const insertSQL = `
                INSERT INTO ${config.tableName} (
                    HotelId, HotelName, Description, Category, Tags,
                    ParkingIncluded, LastRenovationDate, Rating,
                    Address_StreetAddress, Address_City, Address_StateProvince,
                    Address_PostalCode, Address_Country,
                    Location_Latitude, Location_Longitude,
                    ${config.embeddedField}
                )
                VALUES (
                    @HotelId, @HotelName, @Description, @Category, @Tags,
                    @ParkingIncluded, @LastRenovationDate, @Rating,
                    @Address_StreetAddress, @Address_City, @Address_StateProvince,
                    @Address_PostalCode, @Address_Country,
                    @Location_Latitude, @Location_Longitude,
                    JSON_ARRAY_TO_VECTOR(@contentVector)
                )
            `;
            
            const parameters = [
                { name: 'HotelId', type: TYPES.NVarChar, value: hotel.HotelId },
                { name: 'HotelName', type: TYPES.NVarChar, value: hotel.HotelName },
                { name: 'Description', type: TYPES.NVarChar, value: hotel.Description || null },
                { name: 'Category', type: TYPES.NVarChar, value: hotel.Category || null },
                { name: 'Tags', type: TYPES.NVarChar, value: hotel.Tags ? JSON.stringify(hotel.Tags) : null },
                { name: 'ParkingIncluded', type: TYPES.Bit, value: hotel.ParkingIncluded || false },
                { name: 'LastRenovationDate', type: TYPES.DateTime, value: hotel.LastRenovationDate || null },
                { name: 'Rating', type: TYPES.Float, value: hotel.Rating || null },
                { name: 'Address_StreetAddress', type: TYPES.NVarChar, value: hotel.Address?.StreetAddress || null },
                { name: 'Address_City', type: TYPES.NVarChar, value: hotel.Address?.City || null },
                { name: 'Address_StateProvince', type: TYPES.NVarChar, value: hotel.Address?.StateProvince || null },
                { name: 'Address_PostalCode', type: TYPES.NVarChar, value: hotel.Address?.PostalCode || null },
                { name: 'Address_Country', type: TYPES.NVarChar, value: hotel.Address?.Country || null },
                { name: 'Location_Latitude', type: TYPES.Float, value: hotel.Location?.Latitude || null },
                { name: 'Location_Longitude', type: TYPES.Float, value: hotel.Location?.Longitude || null },
                { name: 'contentVector', type: TYPES.NVarChar, value: JSON.stringify(hotel[config.embeddedField]) }
            ];
            
            await executeCommand(connection, insertSQL, parameters);
        }
        
        console.log(`Inserted ${Math.min(i + config.batchSize, data.length)} of ${data.length} records`);
    }
}

/**
 * Perform vector search
 */
async function performVectorSearch(connection: any, queryVector: number[]): Promise<any[]> {
    const searchSQL = `
        SELECT TOP 5
            HotelId,
            HotelName,
            Description,
            VECTOR_DISTANCE('cosine', ${config.embeddedField}, JSON_ARRAY_TO_VECTOR(@queryVector)) AS SimilarityScore
        FROM ${config.tableName}
        ORDER BY VECTOR_DISTANCE('cosine', ${config.embeddedField}, JSON_ARRAY_TO_VECTOR(@queryVector))
    `;
    
    const parameters = [
        { name: 'queryVector', type: TYPES.NVarChar, value: JSON.stringify(queryVector) }
    ];
    
    return executeQuery(connection, searchSQL, parameters);
}

async function main() {
    const { aiClient, getConnection } = getClientsPasswordless();
    let connection: any = null;

    try {
        if (!aiClient) {
            throw new Error('AI client is not configured. Please check your environment variables.');
        }

        // Connect to database
        connection = await getConnection();
        await connectToDatabase(connection);

        // Create table
        await createTable(connection);

        // Load and insert data
        const dataPath = path.join(__dirname, '..', config.dataFile);
        const data = await readFileReturnJson(dataPath);
        await insertData(connection, data);

        console.log('\nData insertion complete!');
        console.log('\n=== Performing Vector Search ===\n');

        // Create embedding for the query
        const queryEmbeddingResponse = await aiClient.embeddings.create({
            model: config.deployment,
            input: [config.query]
        });

        const queryVector = queryEmbeddingResponse.data[0].embedding;

        // Perform vector search
        const searchResults = await performVectorSearch(connection, queryVector);

        // Print the results
        printSearchResults(searchResults, config.query);

        console.log('Vector search completed successfully!');

    } catch (error) {
        console.error('App failed:', error);
        process.exitCode = 1;
    } finally {
        if (connection) {
            connection.close();
        }
    }
}

// Execute the main function
main().catch(error => {
    console.error('Unhandled error:', error);
    process.exitCode = 1;
});
