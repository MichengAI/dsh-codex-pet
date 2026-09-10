param(
    [string]$PreviewRoot = (Join-Path $PSScriptRoot '..\.preview'),
    [ValidateRange(1, 100)][int]$Keep = 5
)
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = 'Stop'
# 仅回收新脚本明确标记为已结束的运行；历史证据和 .keep 永久保留。
$root = Get-Item -LiteralPath $PreviewRoot -Force
if ($root.Name -ne '.preview' -or ($root.Attributes -band [IO.FileAttributes]::ReparsePoint)) {
    throw '证据根目录必须是实际的 .preview 目录'
}
$prefix = $root.FullName.TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
function Remove-OwnedTree([string]$Path) {
    $full = [IO.Path]::GetFullPath($Path)
    if (-not $full.StartsWith($prefix, [StringComparison]::OrdinalIgnoreCase)) { throw '拒绝越界清理' }
    $item = Get-Item -LiteralPath $full -Force
    # 不遍历 junction/symlink；仅删除链接自身。
    if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) {
        if ($item.PSIsContainer) { [IO.Directory]::Delete($full, $false) }
        else { [IO.File]::Delete($full) }
    } elseif ($item.PSIsContainer) {
        foreach ($child in Get-ChildItem -LiteralPath $full -Force) { Remove-OwnedTree $child.FullName }
        [IO.Directory]::Delete($full, $false)
    } else { [IO.File]::Delete($full) }
}
$runs = @(
    foreach ($dir in Get-ChildItem -LiteralPath $root.FullName -Directory -Filter 'e2e-latest-*') {
        if ($dir.Attributes -band [IO.FileAttributes]::ReparsePoint) { continue }
        if (Test-Path -LiteralPath (Join-Path $dir.FullName '.keep')) { continue }
        $marker = Join-Path $dir.FullName 'retention.json'
        if (-not (Test-Path -LiteralPath $marker)) { continue }
        if ((Get-Item -LiteralPath $marker -Force).Attributes -band [IO.FileAttributes]::ReparsePoint) { continue }
        $record = Get-Content -LiteralPath $marker -Raw -Encoding UTF8 | ConvertFrom-Json
        if ($record.owner -ne 'dsh-codex-pet-e2e-v1' -or $record.state -ne 'finished') { continue }
        [pscustomobject]@{ Path = $dir.FullName; Finished = [DateTimeOffset]::Parse($record.finishedAt) }
    }
)
foreach ($run in ($runs | Sort-Object Finished -Descending | Select-Object -Skip $Keep)) {
    Remove-OwnedTree $run.Path
    Write-Output ('已回收：' + [IO.Path]::GetFileName($run.Path))
}
