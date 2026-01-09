metadata description = 'Vector search infrastructure with Azure Database for PostgreSQL and Azure OpenAI.'

targetScope = 'subscription'

@minLength(1)
@maxLength(64)
@description('Name of the environment that can be used as part of naming resource convention.')
param environmentName string

@minLength(1)
@description('Location for the OpenAI resource')
// https://learn.microsoft.com/azure/ai-services/openai/concepts/models?tabs=python-secure%2Cglobal-standard%2Cstandard-chat-completions#models-by-deployment-type
@allowed([
  'eastus2'
  'swedencentral'
])
@metadata({
  azd: {
    type: 'location'
  }
})
param location string

// Embedding model parameters
@description('Name of the embedding model to deploy')
param embeddingModelName string = 'text-embedding-3-small'

@description('Version of the embedding model to deploy')
param embeddingModelVersion string = '1'
param embeddingApiVersion string = '2023-05-15'

@description('Capacity of the embedding model deployment')
param embeddingDeploymentCapacity int = 50

// Azure Database for PostgreSQL parameters
@description('Name of the PostgreSQL database')
param databaseName string = 'vectordb'

@description('Administrator username for the PostgreSQL server')
param postgresqlAdministratorLogin string = 'pgadmin'

@description('Administrator password for the PostgreSQL server')
@secure()
param postgresqlAdministratorPassword string

var principalType = 'User'
@description('Id of the user or app to assign application roles')
param principalId string = ''

var resourceToken = toLower(uniqueString(subscription().id, environmentName, location))
var tags = { 'azd-env-name': environmentName }

// Organize resources in a resource group
resource resourceGroup 'Microsoft.Resources/resourceGroups@2021-04-01' = {
  name: '${environmentName}-${resourceToken}-rg'
  location: location
  tags: tags
}

// Log Analytics Workspace
module logAnalytics 'br/public:avm/res/operational-insights/workspace:0.9.1' = {
  name: 'logAnalytics'
  scope: resourceGroup
  params: {
    name: '${resourceToken}-logs'
    location: location
    tags: tags
    skuName: 'PerGB2018'
    dataRetention: 30
  }
}

// User-assigned managed identity for PostgreSQL Server
module managedIdentity 'br/public:avm/res/managed-identity/user-assigned-identity:0.4.0' = {
  name: 'postgresqlServerIdentity'
  scope: resourceGroup
  params: {
    name: '${resourceToken}-pg-identity'
    location: location
    tags: tags
  }
}

// Azure Database for PostgreSQL Flexible Server
module postgresqlServer 'br/public:avm/res/db-for-postgre-sql/flexible-server:0.5.3' = {
  name: 'postgresql-server'
  scope: resourceGroup
  params: {
    name: 'pgserver${resourceToken}'
    location: location
    tags: tags
    skuName: 'Standard_B1ms'
    tier: 'Burstable'
    availabilityZone: -1
    administratorLogin: postgresqlAdministratorLogin
    administratorLoginPassword: postgresqlAdministratorPassword
    authConfig: {
      activeDirectoryAuth: 'Disabled'
      passwordAuth: 'Enabled'
    }
    managedIdentities: {
      systemAssigned: true
      userAssignedResourceIds: [
        managedIdentity.outputs.resourceId
      ]
    }
    version: '16'
    storageSizeGB: 32
    backupRetentionDays: 7
    geoRedundantBackup: 'Disabled'
    highAvailability: 'Disabled'
    publicNetworkAccess: 'Enabled'
    databases: [
      {
        name: databaseName
        charset: 'UTF8'
        collation: 'en_US.utf8'
      }
    ]
    firewallRules: [
      {
        name: 'AllowAllWindowsAzureIps'
        startIpAddress: '0.0.0.0'
        endIpAddress: '0.0.0.0'
      }
    ]
  }
}

var openAiServiceName = '${resourceToken}-openai'
module openAi 'br/public:avm/res/cognitive-services/account:0.7.1' = {
  name: 'openai'
  scope: resourceGroup
  params: {
    name: openAiServiceName
    location: location
    tags: tags
    kind: 'OpenAI'
    sku: 'S0'
    disableLocalAuth: false
    customSubDomainName: openAiServiceName
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
    deployments: [
      {
        name: embeddingModelName
        model: {
          format: 'OpenAI'
          name: embeddingModelName
          version: embeddingModelVersion
        }
        sku: {
          name: 'GlobalStandard'
          capacity: embeddingDeploymentCapacity
        }
      }
    ]
    roleAssignments: !empty(principalId) ? [
      {
        principalId: principalId
        roleDefinitionIdOrName: 'Cognitive Services OpenAI User'
        principalType: principalType
      }
      {
        principalId: managedIdentity.outputs.principalId
        roleDefinitionIdOrName: 'Cognitive Services OpenAI User'
        principalType: 'ServicePrincipal'
      }
    ] : [
      {
        principalId: managedIdentity.outputs.principalId
        roleDefinitionIdOrName: 'Cognitive Services OpenAI User'
        principalType: 'ServicePrincipal'
      }
    ]
  }
}

// Resources
output AZURE_LOCATION string = location
output AZURE_TENANT_ID string = tenant().tenantId
output AZURE_PRINCIPAL_ID string = managedIdentity.outputs.principalId
output AZURE_RESOURCE_GROUP string = resourceGroup.name

// OpenAI Resource
output AZURE_OPENAI_API_INSTANCE_NAME string = openAi.outputs.name
output AZURE_OPENAI_ENDPOINT string = openAi.outputs.endpoint
output AZURE_OPENAI_BASE_PATH string = 'https://${openAi.outputs.name}.openai.azure.com'

// Embedding resource
output AZURE_OPENAI_EMBEDDING_DEPLOYMENT string = embeddingModelName
output AZURE_OPENAI_EMBEDDING_MODEL string = embeddingModelName
output AZURE_OPENAI_EMBEDDING_API_VERSION string = embeddingApiVersion

// Azure Database for PostgreSQL
output AZURE_POSTGRESQL_HOST string = postgresqlServer.outputs.fqdn
output AZURE_POSTGRESQL_DATABASE string = databaseName
output AZURE_POSTGRESQL_SERVER_NAME string = postgresqlServer.outputs.name

// Source code
output ENV_PATH string = '../'
