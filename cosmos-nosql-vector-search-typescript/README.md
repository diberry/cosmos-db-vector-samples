# Cosmos DB NoSQL Vector Search Samples (TypeScript)

This package demonstrates vector search capabilities using Azure Cosmos DB NoSQL API with TypeScript.

## Prerequisites

- Node.js 18+
- Azure subscription with:
  - Azure Cosmos DB for NoSQL account
  - Azure OpenAI Service with text-embedding-3-small model deployed

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and configure your Azure settings:
```bash
cp .env.example .env
```

3. Update the `.env` file with your Azure credentials:
   - `AZURE_COSMOSDB_NOSQL_ENDPOINT` - Your Cosmos DB endpoint
   - `AZURE_OPENAI_ENDPOINT` - Your Azure OpenAI endpoint
   - `AZURE_OPENAI_EMBEDDING_MODEL` - Your embedding model deployment name

## Running the Samples

### 1. Create Embeddings
Generate embeddings for the hotel dataset:
```bash
npm run start:embed
```

### 2. Vector Search with Flat Index
K-NN exact search (brute-force):
```bash
npm run start:flat
```

### 3. Vector Search with Quantized Flat Index
Quantized k-NN for better efficiency:
```bash
npm run start:quantized-flat
```

### 4. Vector Search with DiskANN Index
High-performance approximate nearest neighbor (best for >50k vectors/partition):
```bash
npm run start:diskann
```

## Index Types

- **Flat**: K-NN brute-force exact search. Most accurate but slowest for large datasets.
- **Quantized Flat**: Compressed vectors for better memory efficiency while maintaining good accuracy.
- **DiskANN**: Highest performance for large-scale vector search (>50k vectors per partition). Uses graph-based approximate nearest neighbor algorithm.

## Authentication

This sample supports passwordless authentication using `DefaultAzureCredential`. Ensure you're authenticated via:
- Azure CLI: `az login`
- Visual Studio Code: Azure Account extension
- Managed Identity: When deployed to Azure

## Data

Sample data is located in `../data/HotelsData_toCosmosDB_Vector.json` and includes:
- Hotel information (name, description, category)
- Pre-generated embeddings (1536 dimensions using text-embedding-3-small)

## Learn More

- [Azure Cosmos DB Vector Search](https://learn.microsoft.com/azure/cosmos-db/nosql/vector-search)
- [Azure Cosmos DB NoSQL API](https://learn.microsoft.com/azure/cosmos-db/nosql/)
- [Azure OpenAI Embeddings](https://learn.microsoft.com/azure/ai-services/openai/how-to/embeddings)
