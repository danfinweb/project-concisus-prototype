# Pre-edit hook: blocks writes to design/ in every session, and, in a module or tools
# session, writes outside that pillar's folder. Reads the tool call as JSON on stdin; exit 2 blocks it.
$in = [Console]::In.ReadToEnd() | ConvertFrom-Json
$path = $in.tool_input.file_path
if (-not $path) { $path = $in.tool_input.notebook_path }
if (-not $path) { exit 0 }
# Repo root from this script's own location, so the hook works in module and tools sessions too
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..')).TrimEnd('\', '/')
$file = [IO.Path]::GetFullPath($path)
if (-not $file.StartsWith($root, [StringComparison]::OrdinalIgnoreCase)) { exit 0 }  # outside the repo (memory, scratch): not ours to police
$rel = $file.Substring($root.Length).TrimStart('\', '/').Replace('\', '/')
if ($rel -match '^design/') {
  [Console]::Error.WriteLine("Blocked: $rel is read-only (design/ is edited only by the user, in the live docs).")
  exit 2
}
# Which pillar is this session in? Derived from the session's working directory.
$cwd = [IO.Path]::GetFullPath($in.cwd).TrimEnd('\', '/')
if ($cwd.StartsWith($root, [StringComparison]::OrdinalIgnoreCase)) {
  $crel = $cwd.Substring($root.Length).TrimStart('\', '/').Replace('\', '/')
  $pillar = $null
  if ($crel -match '^modules/[^/]+') { $pillar = $Matches[0] }
  elseif ($crel -match '^tools(/|$)') { $pillar = 'tools' }
  if ($pillar) {
    $allowed = $rel.StartsWith("$pillar/")
    # Tools may also write content: /data and module test fixtures (normally via tools/io, but allow hand fixes)
    if ($pillar -eq 'tools' -and ($rel -match '^data/' -or $rel -match '^modules/[^/]+/test/fixtures/')) { $allowed = $true }
    if (-not $allowed) {
      [Console]::Error.WriteLine("Blocked: a $pillar session edits only its own folder; $rel belongs to another pillar. Report the need instead.")
      exit 2
    }
  }
}
exit 0
