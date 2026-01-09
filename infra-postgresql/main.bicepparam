using './main.bicep'

param environmentName = readEnvironmentVariable('AZURE_ENV_NAME', 'development')
param location = readEnvironmentVariable('AZURE_LOCATION', 'eastus2')
param principalId = readEnvironmentVariable('AZURE_PRINCIPAL_ID', '')
param postgresqlAdministratorLogin = readEnvironmentVariable('POSTGRESQL_ADMIN_LOGIN', 'pgadmin')
param postgresqlAdministratorPassword = readEnvironmentVariable('POSTGRESQL_ADMIN_PASSWORD', '')

//param databaseName = 'my-custom-database'
