param(
    [string]$dbHost = "localhost"
)

# Define as variáveis de ambiente
$env:APP_NOME="saude-indigena"
$env:APP_VERSION="1.0"
$env:APP_AMBIENTE="DEV"
$env:APP_CONTEXTO="/api/v1"
$env:APP_PORT="8080"
$env:JWT_SECRET="my-secret-key"
$env:DATABASE_URL="jdbc:postgresql://$dbHost:5433/saude_indigena"
$env:DATABASE_SCHEMA="saude"
$env:DATABASE_USERNAME="postgres"
$env:DATABASE_PASSWORD="123"

Write-Host "Variáveis de ambiente definidas. Iniciando o backend..."

# Inicia a aplicação Spring Boot
java -jar target/saude-indigena-0.0.1-SNAPSHOT.jar