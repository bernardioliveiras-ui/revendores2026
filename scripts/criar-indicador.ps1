<#
.SYNOPSIS
  Cria conta de INDICADOR(A) independente de revendedores e Asaas.
.DESCRIPTION
  Use as credenciais BKO/Admin da LORD NUTRI. Não utiliza banco direto,
  Resend ou senhas temporárias enviadas ao cliente. Gera convite privado
  para ativação individual; reenvio revoga convites anteriores.
.EXAMPLE
  .\scripts\criar-indicador.ps1 -BaseUrl 'https://revendedores.mix10pro.com.br' `
    -Nome 'Isabella' -Email 'isabella@example.com' -Telefone '11999999999'
.EXAMPLE
  .\scripts\criar-indicador.ps1 -BaseUrl 'https://revendedores.mix10pro.com.br' `
    -Nome 'Isabella' -Email 'isabella@example.com' -Telefone '11999999999' -ConverterClienteExistente
.EXAMPLE
  .\scripts\criar-indicador.ps1 -BaseUrl 'https://revendedores.mix10pro.com.br' `
    -IndicadorId 'COLE-AQUI-O-ID'
#>
[CmdletBinding(DefaultParameterSetName='Criar')]
param(
  [Parameter(Mandatory=$true)] [string] $BaseUrl,
  [Parameter(Mandatory=$true,ParameterSetName='Criar')] [string] $Nome,
  [Parameter(Mandatory=$true,ParameterSetName='Criar')] [string] $Email,
  [Parameter(Mandatory=$true,ParameterSetName='Criar')] [string] $Telefone,
  [Parameter(ParameterSetName='Criar')] [switch] $ConverterClienteExistente,
  [Parameter(Mandatory=$true,ParameterSetName='Reenviar')] [string] $IndicadorId
)
$ErrorActionPreference='Stop'
$BaseUrl=$BaseUrl.TrimEnd('/')
try {$u=[Uri]::new($BaseUrl,[UriKind]::Absolute)}catch{throw 'BaseUrl deve ser URL absoluta HTTPS.'}
if ($u.Scheme -ne 'https' -and -not ($u.Scheme -eq 'http' -and $u.Host -in @('localhost','127.0.0.1'))) {
  throw 'Utilize HTTPS. HTTP permitido apenas no ambiente local.'
}
if ($u.UserInfo -or $u.Query -or $u.Fragment -or $u.AbsolutePath -ne '/') {
  throw 'BaseUrl deve ser somente a origem HTTPS, sem /painel, query ou credenciais.'
}
$credential=Get-Credential -Message 'Login BKO/Admin LORD NUTRI (NÃO use o login de revendedor)'
if (-not $credential) {throw 'Operação cancelada.'}
$session=New-Object Microsoft.PowerShell.Commands.WebRequestSession
$loggedIn=$false
try {
  $body=@{email=$credential.UserName;password=$credential.GetNetworkCredential().Password} | ConvertTo-Json -Compress
  $login=Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method Post -ContentType 'application/json' -Body $body -WebSession $session
  $body=$null
  if ($login.role -ne 'admin') {throw 'Sua conta não tem permissão BKO/Admin.'}
  $loggedIn=$true
  if ($PSCmdlet.ParameterSetName -eq 'Criar') {
    $body=@{name=$Nome;email=$Email;phone=$Telefone;convertExisting=[bool]$ConverterClienteExistente} | ConvertTo-Json -Compress
    $response=Invoke-RestMethod -Uri "$BaseUrl/api/admin/indicators" -Method Post -ContentType 'application/json' -Body $body -WebSession $session
    Write-Host "Indicador(a) cadastrado(a). ID: $($response.userId)"
  } else {
    $body=@{userId=$IndicadorId} | ConvertTo-Json -Compress
    $response=Invoke-RestMethod -Uri "$BaseUrl/api/admin/indicators/invite" -Method Post -ContentType 'application/json' -Body $body -WebSession $session
    Write-Host 'Novo convite gerado. Convites anteriores foram revogados.'
  }
  $body=$null
  if (-not $response.activationPath -or -not $response.activationPath.StartsWith('/ativar-cliente?token=')) {
    throw "Cadastro salvo sem link. Gere outro pelo BKO > Indicadores. $($response.error)"
  }
  $activationUrl=[Uri]::new($u,[string]$response.activationPath).AbsoluteUri
  Write-Host ''
  Write-Host 'LINK PRIVADO DE ATIVAÇÃO (24 horas, uso único):'
  Write-Output $activationUrl
  Write-Host "Expira em UTC: $($response.expiresAt)"
  Write-Host 'Envie somente ao indicador(a) por WhatsApp privado; não publique o token.'
} finally {
  if ($loggedIn) {try {Invoke-RestMethod -Uri "$BaseUrl/api/auth/logout" -Method Post -WebSession $session | Out-Null}catch{}}
  $body=$null
  $credential=$null
}
