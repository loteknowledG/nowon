# PowerShell script to download tree-sitter-javascript.wasm
$dest = "src/tui-ftw/opentui/packages/core/src/lib/tree-sitter/assets/javascript/tree-sitter-javascript.wasm"
$url = "https://github.com/tree-sitter/tree-sitter-javascript/releases/download/v0.25.0/tree-sitter-javascript.wasm"

Invoke-WebRequest -Uri $url -OutFile $dest
Write-Host "Downloaded tree-sitter-javascript.wasm to $dest"