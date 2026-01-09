import { CosmosClient, CosmosClientOptions } from '@azure/cosmos';
import { AzureOpenAI } from 'openai/index.js';
import { promises as fs } from "fs";
import { DefaultAzureCredential, TokenCredential, getBearerTokenProvider } from '@azure/identity';

// Define a type for JSON data
export type JsonData = Record<string, any>;

export function getClients(): { aiClient: AzureOpenAI; cosmosClient: CosmosClient } {
    const apiKey = process.env.AZURE_OPENAI_EMBEDDING_KEY!;
    const apiVersion = process.env.AZURE_OPENAI_EMBEDDING_API_VERSION!;
    const endpoint = process.env.AZURE_OPENAI_EMBEDDING_ENDPOINT!;
    const deployment = process.env.AZURE_OPENAI_EMBEDDING_MODEL!;
    
    const aiClient = new AzureOpenAI({
        apiKey,
        apiVersion,
        endpoint,
        deployment
    });
    
    const cosmosEndpoint = process.env.AZURE_COSMOSDB_NOSQL_ENDPOINT!;
    const cosmosKey = process.env.AZURE_COSMOSDB_NOSQL_KEY!;
    
    const cosmosClient = new CosmosClient({ 
        endpoint: cosmosEndpoint, 
        key: cosmosKey 
    });

    return { aiClient, cosmosClient };
}

export function getClientsPasswordless(): { aiClient: AzureOpenAI | null; cosmosClient: CosmosClient | null } {
    let aiClient: AzureOpenAI | null = null;
    let cosmosClient: CosmosClient | null = null;

    // For Azure OpenAI with DefaultAzureCredential
    const apiVersion = process.env.AZURE_OPENAI_EMBEDDING_API_VERSION!;
    const endpoint = process.env.AZURE_OPENAI_EMBEDDING_ENDPOINT!;
    const deployment = process.env.AZURE_OPENAI_EMBEDDING_MODEL!;

    if (apiVersion && endpoint && deployment) {
        const credential = new DefaultAzureCredential();
        const scope = "https://cognitiveservices.azure.com/.default";
        const azureADTokenProvider = getBearerTokenProvider(credential, scope);
        aiClient = new AzureOpenAI({
            apiVersion,
            endpoint,
            deployment,
            azureADTokenProvider
        });
    }

    // For Cosmos DB with DefaultAzureCredential
    const cosmosEndpoint = process.env.AZURE_COSMOSDB_NOSQL_ENDPOINT!;

    if (cosmosEndpoint) {
        const credential = new DefaultAzureCredential();
        
        const options: CosmosClientOptions = {
            endpoint: cosmosEndpoint,
            aadCredentials: credential
        };
        
        cosmosClient = new CosmosClient(options);
    }

    return { aiClient, cosmosClient };
}

export async function readFileReturnJson(filePath: string): Promise<JsonData[]> {
    console.log(`Reading JSON file from ${filePath}`);
    const fileAsString = await fs.readFile(filePath, "utf-8");
    return JSON.parse(fileAsString);
}

export async function writeFileJson(filePath: string, jsonData: JsonData): Promise<void> {
    const jsonString = JSON.stringify(jsonData, null, 2);
    await fs.writeFile(filePath, jsonString, "utf-8");
    console.log(`Wrote JSON file to ${filePath}`);
}

export async function insertData(config: any, container: any, data: any[]): Promise<any> {
    console.log(`Processing in batches of ${config.batchSize}...`);
    const totalBatches = Math.ceil(data.length / config.batchSize);

    let inserted = 0;
    let failed = 0;

    for (let i = 0; i < totalBatches; i++) {
        const start = i * config.batchSize;
        const end = Math.min(start + config.batchSize, data.length);
        const batch = data.slice(start, end);

        try {
            // Cosmos DB NoSQL uses bulk operations
            const operations = batch.map(item => ({
                operationType: 'Create' as const,
                resourceBody: item
            }));
            
            const result = await container.items.bulk(operations);
            
            // Count successful insertions
            const successCount = result.filter((r: any) => r.statusCode >= 200 && r.statusCode < 300).length;
            inserted += successCount;
            failed += batch.length - successCount;
            
            console.log(`Batch ${i + 1} complete: ${successCount} inserted`);
        } catch (error: any) {
            console.error(`Error in batch ${i + 1}:`, error);
            failed += batch.length;
        }

        // Small pause between batches
        if (i < totalBatches - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    return { total: data.length, inserted, failed };
}

export function printSearchResults(insertSummary: any, indexSummary: any, searchResults: any[]) {
    if (!searchResults || searchResults.length === 0) {
        console.log('No search results found.');
        return;
    }

    console.log(`\nInsert Summary: ${insertSummary.inserted} inserted, ${insertSummary.failed} failed`);
    console.log(`\nSearch Results (${searchResults.length}):`);
    
    searchResults.forEach((result, index) => {
        const score = result.SimilarityScore || result._score || 'N/A';
        console.log(`${index + 1}. HotelName: ${result.HotelName}, Score: ${typeof score === 'number' ? score.toFixed(4) : score}`);
    });
}
