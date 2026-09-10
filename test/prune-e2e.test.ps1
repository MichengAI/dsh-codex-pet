[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = 'Stop'
$fixture = Join-Path ([IO.Path]::GetTempPath()) ('dsh-prune-test-' + [Guid]::NewGuid().ToString('N'))
$preview = Join-Path $fixture '.preview'
$outside = Join-Path $fixture 'outside'
$old = Join-Path $preview 'e2e-latest-old'
$junction = Join-Path $old 'linked'
try {
    foreach ($dir in @($outside, $old, (Join-Path $preview 'e2e-latest-new'), (Join-Path $preview 'e2e-latest-running'), (Join-Path $preview 'e2e-latest-legacy'), (Join-Path $preview 'e2e-latest-pinned'))) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    Set-Content -LiteralPath (Join-Path $outside 'sentinel.txt') -Value 'preserve' -Encoding UTF8
    $linkType = if ($env:OS -eq 'Windows_NT') { 'Junction' } else { 'SymbolicLink' }
    New-Item -ItemType $linkType -Path $junction -Target $outside | Out-Null
    foreach ($name in @('old', 'new', 'running', 'pinned')) {
        $record = @{ owner = 'dsh-codex-pet-e2e-v1'; state = 'finished'; finishedAt = '2026-09-10T01:00:00Z' }
        if ($name -eq 'new') { $record.finishedAt = '2026-09-10T02:00:00Z' }
        if ($name -eq 'running') { $record.state = 'running' }
        $path = Join-Path (Join-Path $preview ('e2e-latest-' + $name)) 'retention.json'
        $record | ConvertTo-Json | Set-Content -LiteralPath $path -Encoding UTF8
    }
    Set-Content -LiteralPath (Join-Path $preview 'e2e-latest-pinned/.keep') -Value '' -Encoding UTF8
    & (Join-Path $PSScriptRoot '..\scripts\prune-e2e.ps1') -PreviewRoot $preview -Keep 1
    if (Test-Path -LiteralPath $old) { throw '旧运行未回收' }
    if (-not (Test-Path -LiteralPath (Join-Path $outside 'sentinel.txt'))) { throw '链接目标被误删' }
    foreach ($name in @('new', 'running', 'legacy', 'pinned')) {
        if (-not (Test-Path -LiteralPath (Join-Path $preview ('e2e-latest-' + $name)))) { throw ('受保护目录被误删：' + $name) }
    }
} finally {
    # 精确解除本测试创建的链接后，才清理已核对的独立临时目录。
    if (Test-Path -LiteralPath $junction) { [IO.Directory]::Delete($junction, $false) }
    $resolved = [IO.Path]::GetFullPath($fixture)
    $expected = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
    if (-not $resolved.StartsWith($expected) -or [IO.Path]::GetFileName($resolved) -notlike 'dsh-prune-test-*') { throw '临时目录范围校验失败' }
    if (Test-Path -LiteralPath $resolved) { Remove-Item -LiteralPath $resolved -Recurse -Force }
}
