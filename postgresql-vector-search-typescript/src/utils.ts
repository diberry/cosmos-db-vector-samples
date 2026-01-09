import pg from 'pg';
import { DefaultAzureCredential } from '@azure/identity';
import { AzureOpenAI } from 'openai/index.js';
import { getBearerTokenProvider } from '@azure/identity';
import { promises as fs } from 'fs';

const { Client } = pg;

// Define a type for JSON data
export type JsonData = Record<string, any>;

export interface PgClients {
    aiClient: AzureOpenAI | null;
    getClient: () => Promise<pg.Client>;
}

/**
 * Get PostgreSQL client using password authentication
 */
export function getPgClient(username: string, password: string): pg.Client {
    const host = process.env.AZURE_POSTGRESQL_HOST!;
    const database = process.env.AZURE_POSTGRESQL_DATABASE!;
    const port = parseInt(process.env.AZURE_POSTGRESQL_PORT || '5432', 10);
    const ssl = process.env.AZURE_POSTGRESQL_SSL === 'true';

    return new Client({
        host,
        port,
        database,
        user: username,
        password,
        ssl: ssl ? { rejectUnauthorized: false } : false
    });
}

/**
 * Get PostgreSQL client using Azure Active Directory passwordless authentication
 */
export async function getPgClientPasswordless(): Promise<pg.Client> {
    const host = process.env.AZURE_POSTGRESQL_HOST!;
    const database = process.env.AZURE_POSTGRESQL_DATABASE!;
    const port = parseInt(process.env.AZURE_POSTGRESQL_PORT || '5432', 10);
    const ssl = process.env.AZURE_POSTGRESQL_SSL === 'true';

    const credential = new DefaultAzureCredential();
    const tokenResponse = await credential.getToken('https://ossrdbms-aad.database.windows.net/.default');

    // Extract username from the host (first part before the dot)
    const user = host.split('.')[0];

    return new Client({
        host,
        port,
        database,
        user,
        password: tokenResponse.token,
        ssl: ssl ? { rejectUnauthorized: false } : false
    });
}

/**
 * Get clients for Azure OpenAI and PostgreSQL with passwordless authentication
 */
export function getClientsPasswordless(): PgClients {
    let aiClient: AzureOpenAI | null = null;

    // For Azure OpenAI with DefaultAzureCredential
    const apiVersion = process.env.AZURE_OPENAI_EMBEDDING_API_VERSION!;
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT!;
    const deployment = process.env.AZURE_OPENAI_EMBEDDING_MODEL!;

    if (apiVersion && endpoint && deployment) {
        const credential = new DefaultAzureCredential();
        const scope = 'https://cognitiveservices.azure.com/.default';
        const azureADTokenProvider = getBearerTokenProvider(credential, scope);
        aiClient = new AzureOpenAI({
            apiVersion,
            endpoint,
            deployment,
            azureADTokenProvider
        });
    }

    return {
        aiClient,
        getClient: getPgClientPasswordless
    };
}

/**
 * Connect to PostgreSQL database
 */
export async function connectToDatabase(client: pg.Client): Promise<void> {
    await client.connect();
    console.log('Connected to Azure Database for PostgreSQL');
}

/**
 * Read a JSON file and return its contents
 */
export async function readFileReturnJson(filePath: string): Promise<JsonData[]> {
    console.log(`Reading JSON file from ${filePath}`);
    const fileAsString = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(fileAsString);
}

/**
 * Write JSON data to a file
 */
export async function writeFileJson(filePath: string, jsonData: JsonData): Promise<void> {
    const jsonString = JSON.stringify(jsonData, null, 2);
    await fs.writeFile(filePath, jsonString, 'utf-8');
    console.log(`Wrote JSON file to ${filePath}`);
}

/**
 * Print search results
 */
export function printSearchResults(results: any[], queryText: string, indexType?: string): void {
    console.log(`\n=== Vector Search Results${indexType ? ` (${indexType} index)` : ''} ===`);
    console.log(`Query: "${queryText}"\n`);
    
    results.forEach((result, index) => {
        console.log(`${index + 1}. ${result.hotelname}`);
        console.log(`   Distance: ${result.distance?.toFixed(4) || 'N/A'}`);
        console.log(`   Description: ${result.description || 'N/A'}`);
        console.log('');
    });
}
