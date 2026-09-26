#!/bin/bash
# Apple 개발자 계정 없이 GitHub에서 받은 TypingPet 실행용
# .app 을 직접 열지 말고, 이 파일을 실행하세요.

set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

# 폴더 전체 quarantine 제거 (damaged 오류 원인)
xattr -cr "$DIR" 2>/dev/null || true

APP=""
if [ -d "$DIR/TypingPet.app" ]; then
  APP="$DIR/TypingPet.app"
elif [ -d "$DIR/타이핑펫.app" ]; then
  APP="$DIR/타이핑펫.app"
fi

if [ -z "$APP" ]; then
  osascript -e 'display dialog "같은 폴더에 TypingPet.app 이 없습니다.\nZIP을 먼저 풀어 주세요." buttons {"확인"} default button 1 with icon stop'
  exit 1
fi

# Applications 에 설치 (기존 있으면 교체)
DEST="/Applications/TypingPet.app"
rm -rf "$DEST"
cp -R "$APP" "$DEST"
xattr -cr "$DEST" 2>/dev/null || true

open "$DEST"

osascript -e 'display dialog "TypingPet 을 설치하고 실행했습니다.\n\n키보드 반응이 없으면:\n시스템 설정 → 개인정보 보호 및 보안 → 손쉬운 사용\n에서 TypingPet 을 허용한 뒤 앱을 다시 실행하세요." buttons {"확인"} default button 1 with title "TypingPet"'
