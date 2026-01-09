# Azure Database for PostgreSQL Vector Search Samples (TypeScript)

This package demonstrates vector search capabilities using Azure Database for PostgreSQL with the **pgvector** extension and TypeScript.

## Prerequisites

- Node.js 18+
- Azure subscription with:
  - Azure Database for PostgreSQL Flexible Server (with pgvector extension enabled)
  - Azure OpenAI Service with text-embedding-3-small model deployed

## Features

- **pgvector Extension**: Uses PostgreSQL's pgvector extension for native vector support
- **Multiple Index Types**: Supports IVFFlat and HNSW indexing algorithms
- **Distance Metrics**: Cosine distance (`<=>` operator) for similarity search
- **Passwordless Authentication**: Uses `DefaultAzureCredential` for secure access
- **TypeScript SDK**: Built with `pg` driver for PostgreSQL connectivity

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
   - `AZURE_POSTGRESQL_HOST` - Your PostgreSQL server endpoint
   - `AZURE_POSTGRESQL_DATABASE` - Your database name
   - `AZURE_OPENAI_ENDPOINT` - Your Azure OpenAI endpoint
   - `AZURE_OPENAI_EMBEDDING_MODEL` - Your embedding model deployment name

4. Enable the pgvector extension in your PostgreSQL database:
```sql
CREATE EXTENSION vector;
```

## Running the Samples

### 1. Create Embeddings
Generate embeddings for the hotel dataset:
```bash
npm run start:embed
```

### 2. Vector Search with IVFFlat Index
Use IVFFlat (Inverted File with Flat Compression) for approximate nearest neighbor search:
```bash
npm run start:ivfflat
```

**IVFFlat** is good for:
- Large datasets
- Faster build times than HNSW
- Balance between speed and accuracy

### 3. Vector Search with HNSW Index
Use HNSW (Hierarchical Navigable Small World) for high-performance approximate search:
```bash
npm run start:hnsw
```

**HNSW** is good for:
- High recall accuracy
- Fast query times
- Best for production workloads with high query volume

## How It Works

### pgvector Extension
The pgvector extension adds a `vector` data type to PostgreSQL:
```sql
CREATE TABLE hotels (
    hotelid VARCHAR(50) PRIMARY KEY,
    hotelname VARCHAR(200),
    description TEXT,
    contentVector vector(1536)
);
```

### Vector Indexing

**IVFFlat Index:**
```sql
CREATE INDEX ON hotels 
USING ivfflat (contentVector vector_cosine_ops) 
WITH (lists = 100);
```

**HNSW Index:**
```sql
CREATE INDEX ON hotels 
USING hnsw (contentVector vector_cosine_ops) 
WITH (m = 16, ef_construction = 64);
```

### Vector Search Query
Use distance operators for similarity search:
```sql
SELECT hotelname, description,
       contentVector <=> $1::vector AS distance
FROM hotels
ORDER BY contentVector <=> $1::vector
LIMIT 5;
```

## Distance Operators

pgvector supports three distance operators:
- `<->` - L2 (Euclidean) distance
- `<#>` - Inner product (negative)
- `<=>` - Cosine distance (used in these samples)

## Index Parameters

### IVFFlat
- **lists**: Number of clusters (higher = more accurate but slower indexing)
- Recommended: `sqrt(rows)` to `rows/1000`

### HNSW
- **m**: Maximum connections per layer (16 is typical, higher = more accurate but more memory)
- **ef_construction**: Size of dynamic candidate list (64-200 typical, higher = better index quality but slower build)

## Authentication

This sample supports passwordless authentication using `DefaultAzureCredential`. Ensure you're authenticated via:
- Azure CLI: `az login`
- Visual Studio Code: Azure Account extension
- Managed Identity: When deployed to Azure

Your PostgreSQL database must be configured for Azure AD authentication.

## Data

Sample data is located in `../data/HotelsData_toCosmosDB_Vector.json` and includes:
- Hotel information (name, description, category, location)
- Pre-generated embeddings (1536 dimensions using text-embedding-3-small)

## Performance Tips

1. **IVFFlat**: Set `probes` parameter at query time for speed/accuracy tradeoff:
   ```sql
   SET ivfflat.probes = 10;
   ```

2. **HNSW**: Set `ef_search` parameter for query-time accuracy:
   ```sql
   SET hnsw.ef_search = 100;
   ```

3. For best performance with normalized vectors (like OpenAI embeddings), consider using inner product (`<#>`)

## Learn More

- [pgvector Extension](https://github.com/pgvector/pgvector)
- [Azure Database for PostgreSQL pgvector](https://learn.microsoft.com/azure/postgresql/flexible-server/how-to-use-pgvector)
- [Optimize pgvector Performance](https://learn.microsoft.com/azure/postgresql/flexible-server/how-to-optimize-performance-pgvector)
- [Azure OpenAI Embeddings](https://learn.microsoft.com/azure/ai-services/openai/how-to/embeddings)
