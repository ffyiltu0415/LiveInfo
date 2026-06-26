#!/bin/zsh

set -u

print_line() {
  printf '%s\n' '------------------------------------------------------------'
}

format_mbps() {
  awk 'BEGIN { printf "%.2f", ('"$1"' * 8) / 1000000 }'
}

clear
print_line
echo "macOS 網路速度測試"
echo "時間：$(date '+%Y-%m-%d %H:%M:%S')"
echo "電腦：$(scutil --get ComputerName 2>/dev/null || hostname)"
print_line

echo "目前網路介面："
networksetup -listallhardwareports 2>/dev/null | awk '
  /Hardware Port/ { port=$0 }
  /Device/ { print port " / " $0 }
' || true
print_line

if command -v networkQuality >/dev/null 2>&1; then
  echo "使用 macOS 內建 networkQuality 測試中..."
  echo "這可能需要 30 秒左右。"
  print_line
  networkQuality -v
  status=$?
  print_line
  if [ $status -eq 0 ]; then
    echo "測試完成。"
  else
    echo "networkQuality 測試失敗，錯誤碼：$status"
  fi
elif command -v speedtest >/dev/null 2>&1; then
  echo "使用 speedtest CLI 測試中..."
  print_line
  speedtest
  status=$?
  print_line
  if [ $status -eq 0 ]; then
    echo "測試完成。"
  else
    echo "speedtest 測試失敗，錯誤碼：$status"
  fi
else
  echo "找不到 networkQuality 或 speedtest CLI，改用 curl 做簡易下載測速。"
  echo "注意：這個 fallback 只能粗略估算下載速度，不包含完整上傳測試。"
  print_line

  test_url="https://speed.cloudflare.com/__down?bytes=25000000"
  echo "下載 25 MB 測試檔中..."

  bytes_per_sec=$(curl -L --fail --silent --show-error --output /dev/null --write-out '%{speed_download}' "$test_url")
  status=$?
  print_line

  if [ $status -eq 0 ] && [ -n "$bytes_per_sec" ]; then
    mbps=$(format_mbps "$bytes_per_sec")
    echo "估算下載速度：約 ${mbps} Mbps"
  else
    echo "curl 測速失敗，請確認目前可連上網際網路。"
  fi
fi

print_line
echo "按 Enter 關閉視窗。"
read -r _
