import path from 'path';
import { VectorIndexType, VectorEmbeddingDataType, VectorEmbeddingDistanceFunction } from '@azure/cosmos';
import { readFileReturnJson, getClientsPasswordless, insertData, printSearchResults } from './utils.js';

// ESM specific features - create __dirname equivalent
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config = {
    query: "quintessential lodging near running trails, eateries, retail",
    databaseName: process.env.AZURE_COSMOSDB_NOSQL_DATABASE_NAME || "Hotels",
    containerName: "hotels_diskann",
    dataFile: process.env.DATA_FILE_WITH_VECTORS!,
    batchSize: parseInt(process.env.LOAD_SIZE_BATCH! || '100', 10),
    embeddedField: process.env.EMBEDDED_FIELD!,
    embeddingDimensions: parseInt(process.env.EMBEDDING_DIMENSIONS!, 10),
    deployment: process.env.AZURE_OPENAI_EMBEDDING_MODEL!,
    quantizationByteSize: 512  // Byte size for quantization
};

async function main() {
    const { aiClient, cosmosClient } = getClientsPasswordless();

    try {
        if (!aiClient) {
            throw new Error('AI client is not configured. Please check your environment variables.');
        }
        if (!cosmosClient) {
            throw new Error('Cosmos DB client is not configured. Please check your environment variables.');
        }

        // Create or get database
        const { database } = await cosmosClient.databases.createIfNotExists({ id: config.databaseName });
        console.log(`Using database: ${config.databaseName}`);

        // Create container with vector policy (DiskANN index)
        // DiskANN is most performant for > 50,000 vectors per physical partition
        const containerDefinition = {
            id: config.containerName,
            partitionKey: {
                paths: ['/Category']
            },
            vectorEmbeddingPolicy: {
                vectorEmbeddings: [
                    {
                        path: `/${config.embeddedField}`,
                        dataType: VectorEmbeddingDataType.Float32,
                        dimensions: config.embeddingDimensions,
                        distanceFunction: VectorEmbeddingDistanceFunction.Cosine
                    }
                ]
            },
            indexingPolicy: {
                vectorIndexes: [
                    {
                        path: `/${config.embeddedField}`,
                        type: VectorIndexType.DiskANN,  // High-performance DiskANN index
                        quantizationByteSize: config.quantizationByteSize
                    }
                ],
                excludedPaths: [
                    {
                        path: `/"${config.embeddedField}"/?`
                    }
                ]
            }
        };

        const { container } = await database.containers.createIfNotExists(containerDefinition);
        console.log(`Created container: ${config.containerName}`);

        // Load and insert data
        const data = await readFileReturnJson(path.join(__dirname, "..", config.dataFile));
        const insertSummary = await insertData(config, container, data);
        const indexSummary = { 
            indexType: 'diskANN',
            quantizationByteSize: config.quantizationByteSize
        };

        // Create embedding for the query
        const createEmbeddedForQueryResponse = await aiClient.embeddings.create({
            model: config.deployment,
            input: [config.query]
        });

        // Perform vector search using SQL query with VECTORDISTANCE
        const querySpec = {
            query: `SELECT TOP 5 c.HotelName, c.Description, VECTORDISTANCE(c.@embeddedField, @queryVector) AS SimilarityScore 
                    FROM c 
                    ORDER BY VECTORDISTANCE(c.@embeddedField, @queryVector)`
                .replace(/@embeddedField/g, config.embeddedField),
            parameters: [
                {
                    name: '@queryVector',
                    value: createEmbeddedForQueryResponse.data[0].embedding
                }
            ]
        };

        const { resources: searchResults } = await container.items.query(querySpec).fetchAll();

        // Print the results
        printSearchResults(insertSummary, indexSummary, searchResults);

    } catch (error) {
        console.error('App failed:', error);
        process.exitCode = 1;
    }
}

// Execute the main function
main().catch(error => {
    console.error('Unhandled error:', error);
    process.exitCode = 1;
});
