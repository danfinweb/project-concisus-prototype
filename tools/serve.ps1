# Dev server: static files for the game, tools and tests, plus a dev-only write endpoint for the tools.
# Windows PowerShell, no installs needed (the project uses no Node.js).
# Usage, from the repo root:  powershell -ExecutionPolicy Bypass -File tools/serve.ps1 [port]
#   Game:      http://localhost:8080/game/
#   Test Lab:  http://localhost:8080/tools/test-lab/
# Write endpoint (used by tools/io/client.js):
#   PUT /__io/write?path=<repo-relative path>   body = JSON text
#   Allowed targets only: data/**/*.json and modules/<name>/test/fixtures/**/*.json.
#   The JSON is parsed before writing; anything else is refused. Listens on localhost only.
param([int]$Port = 8080)
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..')).TrimEnd('\')
$utf8 = New-Object Text.UTF8Encoding $false
$types = @{
  '.html' = 'text/html; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'; '.mjs' = 'text/javascript; charset=utf-8'
  '.css' = 'text/css; charset=utf-8'; '.json' = 'application/json; charset=utf-8'; '.md' = 'text/plain; charset=utf-8'
  '.png' = 'image/png'; '.jpg' = 'image/jpeg'; '.svg' = 'image/svg+xml'; '.glb' = 'model/gltf-binary'; '.wav' = 'audio/wav'; '.ogg' = 'audio/ogg'
}

function Send-Text($ctx, [int]$status, [string]$text) {
  $ctx.Response.StatusCode = $status
  $ctx.Response.ContentType = 'application/json; charset=utf-8'
  $bytes = $utf8.GetBytes($text)
  $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
}

function Invoke-Write($ctx) {
  $rel = $ctx.Request.QueryString['path']
  if (-not $rel) { return Send-Text $ctx 400 '{"ok":false,"error":"missing path"}' }
  $rel = $rel.Replace('\', '/').TrimStart('/')
  if ($rel -notmatch '^(data/([\w.-]+/)*[\w.-]+\.json|modules/[\w-]+/test/fixtures/([\w.-]+/)*[\w.-]+\.json)$' -or $rel -match '\.\.') {
    return Send-Text $ctx 403 '{"ok":false,"error":"path not allowed: only data/**.json and modules/*/test/fixtures/**.json"}'
  }
  $file = [IO.Path]::GetFullPath((Join-Path $root $rel))
  if (-not $file.StartsWith($root + '\')) { return Send-Text $ctx 403 '{"ok":false,"error":"outside the repo"}' }
  $reader = New-Object IO.StreamReader($ctx.Request.InputStream, $utf8)
  $body = $reader.ReadToEnd()
  try { $null = $body | ConvertFrom-Json } catch { return Send-Text $ctx 400 '{"ok":false,"error":"body is not valid JSON"}' }
  $dir = Split-Path $file
  if (-not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
  if (-not $body.EndsWith("`n")) { $body += "`n" }
  [IO.File]::WriteAllText($file, $body, $utf8)
  Write-Host "io: wrote $rel ($($body.Length) chars)"
  Send-Text $ctx 200 ('{"ok":true,"path":"' + $rel + '"}')
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Serving $root at http://localhost:$Port/  (Test Lab: /tools/test-lab/)  Ctrl+C to stop."
try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    try {
      $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/'))
      if ($path -eq '__io/write') {
        if ($ctx.Request.HttpMethod -eq 'PUT') { Invoke-Write $ctx } else { Send-Text $ctx 405 '{"ok":false,"error":"use PUT"}' }
        continue
      }
      if ($path -eq '' -or $path.EndsWith('/')) { $path = $path + 'index.html' }
      $file = [IO.Path]::GetFullPath((Join-Path $root $path))
      if ($file.StartsWith($root) -and (Test-Path -LiteralPath $file -PathType Container)) {
        # Folder without trailing slash: redirect so relative URLs resolve
        $ctx.Response.Redirect('/' + $path + '/')
      } elseif ($file.StartsWith($root) -and (Test-Path -LiteralPath $file -PathType Leaf)) {
        $ext = [IO.Path]::GetExtension($file).ToLower()
        $ctx.Response.ContentType = if ($types[$ext]) { $types[$ext] } else { 'application/octet-stream' }
        $ctx.Response.Headers.Add('Cache-Control', 'no-store')
        if ($ctx.Request.HttpMethod -ne 'HEAD') {
          $bytes = [IO.File]::ReadAllBytes($file)
          $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
        }
      } else {
        $ctx.Response.StatusCode = 404
      }
    } catch {
      Write-Host "Request failed: $($_.Exception.Message)"
    } finally {
      try { $ctx.Response.Close() } catch { }
    }
  }
} finally {
  $listener.Stop()
}
