# Azure SQL Database Vector Search Samples (TypeScript)

This package demonstrates vector search capabilities using Azure SQL Database with TypeScript and the native `VECTOR` data type.

## Prerequisites

- Node.js 18+
- Azure subscription with:
  - Azure SQL Database (with vector support enabled)
  - Azure OpenAI Service with text-embedding-3-small model deployed

## Features

- **Native Vector Support**: Uses Azure SQL Database's native `VECTOR(1536)` data type
- **Vector Distance Function**: Leverages `VECTOR_DISTANCE` function for similarity search
- **Passwordless Authentication**: Uses `DefaultAzureCredential` for secure access
- **TypeScript SDK**: Built with `tedious` driver for SQL Server connectivity

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
   - `AZURE_SQL_SERVER` - Your SQL Server endpoint (e.g., myserver.database.windows.net)
   - `AZURE_SQL_DATABASE` - Your database name
   - `AZURE_OPENAI_ENDPOINT` - Your Azure OpenAI endpoint
   - `AZURE_OPENAI_EMBEDDING_MODEL` - Your embedding model deployment name

## Running the Samples

### 1. Create Embeddings
Generate embeddings for the hotel dataset:
```bash
npm run start:embed
```

### 2. Vector Search
Create the database table, insert data with vectors, and perform vector search:
```bash
npm run start:vector-search
```

## How It Works

### Vector Data Type
Azure SQL Database's native `VECTOR` type stores embeddings efficiently:
```sql
CREATE TABLE Hotels (
    HotelId NVARCHAR(50) PRIMARY KEY,
    HotelName NVARCHAR(200),
    Description NVARCHAR(MAX),
    contentVector VECTOR(1536)
)
```

### Vector Search Query
Use `VECTOR_DISTANCE` function to find similar vectors:
```sql
SELECT TOP 5
    HotelName,
    Description,
    VECTOR_DISTANCE('cosine', contentVector, @queryVector) AS SimilarityScore
FROM Hotels
ORDER BY VECTOR_DISTANCE('cosine', contentVector, @queryVector)
```

### Converting JSON to Vector
Use `JSON_ARRAY_TO_VECTOR` to convert JSON arrays to vector type:
```sql
INSERT INTO Hotels (contentVector)
VALUES (JSON_ARRAY_TO_VECTOR(@vectorJson))
```

## Authentication

This sample supports passwordless authentication using `DefaultAzureCredential`. Ensure you're authenticated via:
- Azure CLI: `az login`
- Visual Studio Code: Azure Account extension
- Managed Identity: When deployed to Azure

Make sure your Azure SQL Database is configured for Azure AD authentication and your user/identity has appropriate permissions.

## Distance Metrics

Azure SQL Database supports three distance functions:
- **cosine**: Cosine similarity (default, good for normalized vectors)
- **euclidean**: Euclidean distance (L2 norm)
- **dotproduct**: Dot product similarity

## Data

Sample data is located in `../data/HotelsData_toCosmosDB_Vector.json` and includes:
- Hotel information (name, description, category, location)
- Pre-generated embeddings (1536 dimensions using text-embedding-3-small)

## Performance Considerations

- Vector columns are optimized for storage and retrieval
- For large datasets (>50,000 vectors), consider approximate vector indexes when available
- Current implementation uses exact k-NN search (brute force)

## Learn More

- [Azure SQL Database Vector Support](https://learn.microsoft.com/en-us/azure/azure-sql/database/ai-artificial-intelligence-intelligent-applications)
- [Vector Search in SQL Server](https://learn.microsoft.com/en-us/sql/sql-server/ai/vectors)
- [VECTOR_DISTANCE Function](https://learn.microsoft.com/en-us/sql/t-sql/functions/vector-distance-transact-sql)
- [Azure OpenAI Embeddings](https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/embeddings)
