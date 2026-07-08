Get-ChildItem -Recurse -File |
Where-Object {
    $_.FullName -notmatch "node_modules|\.git|venv|dist|build|_pycache_|.pytest_cache|.ruff_cache"
} |
ForEach-Object {
    $_.FullName.Replace((Get-Location).Path, "")
} | clip