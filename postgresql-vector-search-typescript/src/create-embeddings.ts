import path from 'path';
import { readFileReturnJson, writeFileJson, getClientsPasswordless } from './utils.js';

// ESM specific features - create __dirname equivalent
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config = {
    query: 'quintessential lodging near running trails, eateries, retail',
    dataFileWithoutVectors: process.env.DATA_FILE!,
    dataFileWithVectors: process.env.DATA_FILE_WITH_VECTORS!,
    embeddedField: process.env.EMBEDDED_FIELD!,
    embeddingDimensions: parseInt(process.env.EMBEDDING_DIMENSIONS!, 10),
    deployment: process.env.AZURE_OPENAI_EMBEDDING_MODEL!,
    batchSize: 16
};

/**
 * Create embeddings for a batch of text inputs
 */
async function createEmbeddings(aiClient: any, texts: string[]): Promise<number[][]> {
    const response = await aiClient.embeddings.create({
        model: config.deployment,
        input: texts
    });
    
    return response.data.map((item: any) => item.embedding);
}

/**
 * Process embeddings in batches
 */
async function processEmbeddingBatch(aiClient: any, data: any[]): Promise<any[]> {
    const results = [...data];
    
    for (let i = 0; i < data.length; i += config.batchSize) {
        const batch = data.slice(i, i + config.batchSize);
        const texts = batch.map(item => `${item.HotelName} ${item.Description}`);
        
        console.log(`Processing batch ${Math.floor(i / config.batchSize) + 1} of ${Math.ceil(data.length / config.batchSize)}`);
        
        const embeddings = await createEmbeddings(aiClient, texts);
        
        batch.forEach((item, batchIndex) => {
            const dataIndex = i + batchIndex;
            results[dataIndex][config.embeddedField] = embeddings[batchIndex];
        });
    }
    
    return results;
}

async function main() {
    const { aiClient } = getClientsPasswordless();

    try {
        if (!aiClient) {
            throw new Error('AI client is not configured. Please check your environment variables.');
        }

        // Read data without vectors
        const dataPath = path.join(__dirname, '..', config.dataFileWithoutVectors);
        const data = await readFileReturnJson(dataPath);
        
        console.log(`Loaded ${data.length} records`);

        // Generate embeddings
        console.log('Generating embeddings...');
        const dataWithEmbeddings = await processEmbeddingBatch(aiClient, data);

        // Write data with vectors
        const outputPath = path.join(__dirname, '..', config.dataFileWithVectors);
        await writeFileJson(outputPath, dataWithEmbeddings);
        
        console.log(`Successfully created embeddings for ${dataWithEmbeddings.length} records`);
        console.log(`Output written to: ${outputPath}`);

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
