<#
.SYNOPSIS
  Cadastra cliente indicado no BKO LORD NUTRI sem Asaas e sem Resend.
.DESCRIPTION
  Entra com credenciais do BKO, cria uma indicacao e imprime UM link de
  ativacao. Envie-o apenas ao cliente indicado (ex.: mensagem privada).
  Para gerar outro link para um registro existente, use -IndicationId.
  A senha do BKO e solicitada de forma interativa, nunca por argumento.
.EXAMPLE
  .\scripts\criar-cliente-indicado.ps1 -BaseUrl "https://painel.seudominio.com.br" `
    -Nome "Maria Silva" -Email "maria@exemplo.com" -Telefone "11999999999" `
    -Canal "WhatsApp" -Responsavel "Atendimento"
.EXAMPLE
  .\scripts\criar-cliente-indicado.ps1 -BaseUrl "https://painel.seudominio.com.br" `
    -IndicationId "COLE-O-ID-DO-REGISTRO"
#>
[CmdletBinding(DefaultParameterSetName = 'Create')]
param(
  [Parameter(Mandatory = $true)] [string] $BaseUrl,
  [Parameter(Mandatory = $true, ParameterSetName = 'Create')] [string] $Nome,
  [Parameter(Mandatory = $true, ParameterSetName = 'Create')] [string] $Email,
  [Parameter(Mandatory = $true, ParameterSetName = 'Create')] [string] $Telefone,
  [Parameter(Mandatory = $true, ParameterSetName = 'Create')] [string] $Canal,
  [Parameter(Mandatory = $true, ParameterSetName = 'Create')] [string] $Responsavel,
  [Parameter(Mandatory = $true, ParameterSetName = 'Renew')] [string] $IndicationId
)
$ErrorActionPreference = 'Stop'
$BaseUrl = $BaseUrl.TrimEnd('/')
try { $u = [System.Uri]::new($BaseUrl, [System.UriKind]::Absolute) }
catch { throw 'BaseUrl deve ser uma URL absoluta HTTPS do painel.' }
if ($u.Scheme -ne 'https' -and -not ($u.Scheme -eq 'http' -and $u.Host -in @('localhost','127.0.0.1'))) {
  throw 'Use o endereço HTTPS do painel; HTTP só é permitido em localhost.'
}
if ($u.UserInfo -or $u.Query -or $u.Fragment -or $u.AbsolutePath -ne '/') {
  throw 'BaseUrl deve conter apenas a origem do painel, sem senha, caminho, consulta ou fragmento.'
}
$credential = Get-Credential -Message 'Entre com a conta BKO/Admin LORD NUTRI (nao use senha de revendedor)'
if (-not $credential) { throw 'Autenticacao cancelada.' }
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$loggedIn = $false
try {
  $loginJson = @{ email = $credential.UserName; password = $credential.GetNetworkCredential().Password } | ConvertTo-Json -Compress
  $login = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method Post -ContentType 'application/json' -Body $loginJson -WebSession $session
  $loginJson = $null
  if ($login.role -ne 'admin') { throw 'A conta informada nao possui permissao BKO/Admin.' }
  $loggedIn = $true

  if ($PSCmdlet.ParameterSetName -eq 'Create') {
    $body = @{ name = $Nome; email = $Email; phone = $Telefone; channel = $Canal; responsible = $Responsavel } | ConvertTo-Json -Compress
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/admin/indicated" -Method Post -ContentType 'application/json' -Body $body -WebSession $session
    Write-Host "Indicacao criada. ID: $($response.id)"
  } else {
    $body = @{ id = $IndicationId } | ConvertTo-Json -Compress
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/admin/indicated/invite" -Method Post -ContentType 'application/json' -Body $body -WebSession $session
    Write-Host "Novo link gerado para a indicacao $IndicationId (links antigos invalidados)."
  }
  if (-not $response.activationPath -or -not $response.activationPath.StartsWith('/ativar-cliente?token=')) {
    throw "O cadastro pode ter sido criado, mas o link de ativacao nao foi gerado. Consulte BKO > Acessos. $($response.error)"
  }
  $activationUrl = [System.Uri]::new($u, [string]$response.activationPath).AbsoluteUri
  Write-Host ''
  Write-Host 'LINK DE ATIVACAO (uso unico, 24 horas; copie e envie em canal privado):'
  Write-Output $activationUrl
  Write-Host "Expira em: $($response.expiresAt)"
  Write-Host 'Nao publique esse link, nao grave em arquivos de log e nao o entregue a terceiros.'
} finally {
  if ($loggedIn) {
    try { Invoke-RestMethod -Uri "$BaseUrl/api/auth/logout" -Method Post -WebSession $session | Out-Null } catch {}
  }
  $credential = $null
  $loginJson = $null
}
