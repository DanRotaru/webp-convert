$source = Get-Content -Path .\to.js -Raw

$match = [regex]::Match(
  $source,
  "function _0x13bc\(\)\{const _0x170c87=\[(?<items>.*?)\];_0x13bc=function\(\)\{return _0x170c87;\};return _0x13bc\(\);\}"
)
if (-not $match.Success) {
  throw "Could not find obfuscated string table."
}

function Decode-JsString([string] $s) {
  $s = [regex]::Replace($s, '\\x([0-9a-fA-F]{2})', {
    param($m)
    [char][convert]::ToInt32($m.Groups[1].Value, 16)
  })
  $s = [regex]::Replace($s, '\\u([0-9a-fA-F]{4})', {
    param($m)
    [char][convert]::ToInt32($m.Groups[1].Value, 16)
  })
  $s = $s.Replace('\n', "`n").Replace('\r', "`r").Replace('\t', "`t")
  $s = $s.Replace('\b', "`b").Replace('\f', "`f")
  $s = $s.Replace("\'", "'").Replace('\"', '"').Replace('\\', '\')
  return $s
}

function To-JsLiteral([string] $s) {
  $s = $s.Replace('\', '\\')
  $s = $s.Replace("'", "\'")
  $s = $s.Replace("`r", '\r').Replace("`n", '\n').Replace("`t", '\t')
  return "'$s'"
}

$items = New-Object System.Collections.Generic.List[string]
foreach ($m in [regex]::Matches($match.Groups['items'].Value, "'((?:\\.|[^'])*)'")) {
  [void] $items.Add((Decode-JsString $m.Groups[1].Value))
}

function Lookup([int] $n) {
  return $items[$n - 0x1e1]
}

$target = 0x8b464
for ($rotation = 0; $rotation -lt 20000; $rotation++) {
  try {
    $value =
      (Parse-JsInt (Lookup 0x259)) / 1 * (-(Parse-JsInt (Lookup 0x2ab)) / 2) +
      (Parse-JsInt (Lookup 0x22f)) / 3 -
      (Parse-JsInt (Lookup 0x2a0)) / 4 +
      (Parse-JsInt (Lookup 0x29c)) / 5 * (-(Parse-JsInt (Lookup 0x220)) / 6) +
      (Parse-JsInt (Lookup 0x210)) / 7 +
      (Parse-JsInt (Lookup 0x248)) / 8 * ((Parse-JsInt (Lookup 0x27d)) / 9) +
      (Parse-JsInt (Lookup 0x286)) / 10 * ((Parse-JsInt (Lookup 0x23c)) / 11)

    if ([int] $value -eq $target) {
      break
    }
  } catch {
  }

  $first = $items[0]
  $items.RemoveAt(0)
  $items.Add($first)
}

if ($rotation -ge 20000) {
  throw "Could not rotate string table to expected checksum."
}

$deobfuscated = [regex]::Replace($source, '\b_0x[0-9a-fA-F]+\((0x[0-9a-fA-F]+)\)', {
  param($m)
  To-JsLiteral (Lookup ([convert]::ToInt32($m.Groups[1].Value, 16)))
})

$deobfuscated = [regex]::Replace(
  $deobfuscated,
  '^const _0x3d3e81=_0x5346;\(function\([\s\S]*?\}\(_0x13bc,0x8b464\)\);',
  ''
)
$deobfuscated = [regex]::Replace(
  $deobfuscated,
  'function _0x13bc\(\)\{[\s\S]*?return _0x13bc\(\);\}',
  ''
)
$deobfuscated = [regex]::Replace(
  $deobfuscated,
  'function _0x5346\([^)]*\)\{[\s\S]*?\}\s*(?=function getImageSize)',
  ''
)
$deobfuscated = $deobfuscated.Trim()

# Lightweight readability pass. It keeps string substitution intact and separates statements/blocks.
$formatted = $deobfuscated
$formatted = $formatted -replace ';', ";`r`n"
$formatted = $formatted -replace '\{', "{`r`n"
$formatted = $formatted -replace '\}', "`r`n}`r`n"
$formatted = $formatted -replace ',(?=(?:[^'']*''[^'']*'')*[^'']*$)', ", "
$formatted = $formatted -replace "[ \t]+`r?`n", "`r`n"
Set-Content -Path .\to.clear.js -Value $formatted -Encoding UTF8
Write-Output "Created to.clear.js with $($items.Count) resolved strings after $rotation rotations."


