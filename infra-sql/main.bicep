metadata description = 'Vector search infrastructure with Azure SQL Database and Azure OpenAI.'

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

// Azure SQL Database parameters
@description('Name of the Azure SQL Database')
param databaseName string = 'vectordb'

@description('Administrator username for the SQL server')
param sqlAdministratorLogin string = 'sqladmin'

@description('Administrator password for the SQL server')
@secure()
param sqlAdministratorPassword string

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

// User-assigned managed identity for SQL Server
module managedIdentity 'br/public:avm/res/managed-identity/user-assigned-identity:0.4.0' = {
  name: 'sqlServerIdentity'
  scope: resourceGroup
  params: {
    name: '${resourceToken}-sql-identity'
    location: location
    tags: tags
  }
}

// Azure SQL Server with database
module sqlServer 'br/public:avm/res/sql/server:0.9.1' = {
  name: 'sql-server'
  scope: resourceGroup
  params: {
    name: 'sqlserver${resourceToken}'
    location: location
    tags: tags
    administratorLogin: sqlAdministratorLogin
    administratorLoginPassword: sqlAdministratorPassword
    managedIdentities: {
      systemAssigned: true
      userAssignedResourceIds: [
        managedIdentity.outputs.resourceId
      ]
    }
    primaryUserAssignedIdentityResourceId: managedIdentity.outputs.resourceId
    minimalTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled'
    databases: [
      {
        name: databaseName
        sku: {
          name: 'Basic'
          tier: 'Basic'
        }
        maxSizeBytes: 2147483648
        collation: 'SQL_Latin1_General_CP1_CI_AS'
        availabilityZone: -1
        zoneRedundant: false
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

// Azure SQL Database
output AZURE_SQL_SERVER_NAME string = sqlServer.outputs.name
output AZURE_SQL_DATABASE_NAME string = databaseName
output AZURE_SQL_SERVER_FQDN string = sqlServer.outputs.fullyQualifiedDomainName

// Source code
output ENV_PATH string = '../'
