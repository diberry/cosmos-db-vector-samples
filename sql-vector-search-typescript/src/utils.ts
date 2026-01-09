import { Connection, ConnectionConfiguration, Request, TYPES } from 'tedious';
import { DefaultAzureCredential, TokenCredential } from '@azure/identity';
import { AzureOpenAI } from 'openai/index.js';
import { getBearerTokenProvider } from '@azure/identity';
import { promises as fs } from 'fs';

// Define a type for JSON data
export type JsonData = Record<string, any>;

export interface SqlClients {
    aiClient: AzureOpenAI | null;
    getConnection: () => Promise<Connection>;
}

/**
 * Get SQL Database connection using SQL authentication (username/password)
 */
export function getSqlConnection(username: string, password: string): Connection {
    const server = process.env.AZURE_SQL_SERVER!;
    const database = process.env.AZURE_SQL_DATABASE!;
    const port = parseInt(process.env.AZURE_SQL_PORT || '1433', 10);

    const config: ConnectionConfiguration = {
        server,
        authentication: {
            type: 'default',
            options: {
                userName: username,
                password: password
            }
        },
        options: {
            database,
            port,
            encrypt: true,
            trustServerCertificate: false
        }
    };

    return new Connection(config);
}

/**
 * Get SQL Database connection using Azure Active Directory authentication
 */
export async function getSqlConnectionPasswordless(): Promise<Connection> {
    const server = process.env.AZURE_SQL_SERVER!;
    const database = process.env.AZURE_SQL_DATABASE!;
    const port = parseInt(process.env.AZURE_SQL_PORT || '1433', 10);

    const credential = new DefaultAzureCredential();
    const tokenResponse = await credential.getToken('https://database.windows.net//.default');

    const config: ConnectionConfiguration = {
        server,
        authentication: {
            type: 'azure-active-directory-access-token',
            options: {
                token: tokenResponse.token
            }
        },
        options: {
            database,
            port,
            encrypt: true,
            trustServerCertificate: false
        }
    };

    return new Connection(config);
}

/**
 * Get clients for Azure OpenAI and SQL Database with passwordless authentication
 */
export function getClientsPasswordless(): SqlClients {
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
        getConnection: getSqlConnectionPasswordless
    };
}

/**
 * Execute a SQL query and return results
 */
export function executeQuery<T = any>(connection: Connection, query: string, parameters?: { name: string; type: any; value: any }[]): Promise<T[]> {
    return new Promise((resolve, reject) => {
        const results: T[] = [];
        const request = new Request(query, (err) => {
            if (err) {
                reject(err);
            }
        });

        // Add parameters if provided
        if (parameters) {
            parameters.forEach(param => {
                request.addParameter(param.name, param.type, param.value);
            });
        }

        request.on('row', (columns) => {
            const row: any = {};
            columns.forEach((column: any) => {
                row[column.metadata.colName] = column.value;
            });
            results.push(row);
        });

        request.on('requestCompleted', () => {
            resolve(results);
        });

        request.on('error', (err) => {
            reject(err);
        });

        connection.execSql(request);
    });
}

/**
 * Execute a SQL command (INSERT, UPDATE, DELETE, CREATE, etc.)
 */
export function executeCommand(connection: Connection, command: string, parameters?: { name: string; type: any; value: any }[]): Promise<void> {
    return new Promise((resolve, reject) => {
        const request = new Request(command, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });

        // Add parameters if provided
        if (parameters) {
            parameters.forEach(param => {
                request.addParameter(param.name, param.type, param.value);
            });
        }

        request.on('error', (err) => {
            reject(err);
        });

        connection.execSql(request);
    });
}

/**
 * Connect to SQL Database
 */
export function connectToDatabase(connection: Connection): Promise<void> {
    return new Promise((resolve, reject) => {
        connection.on('connect', (err) => {
            if (err) {
                reject(err);
            } else {
                console.log('Connected to Azure SQL Database');
                resolve();
            }
        });

        connection.connect();
    });
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
export function printSearchResults(results: any[], queryText: string): void {
    console.log(`\n=== Vector Search Results for: "${queryText}" ===\n`);
    
    results.forEach((result, index) => {
        console.log(`${index + 1}. ${result.HotelName}`);
        console.log(`   Similarity Score: ${result.SimilarityScore?.toFixed(4) || 'N/A'}`);
        console.log(`   Description: ${result.Description || 'N/A'}`);
        console.log('');
    });
}
