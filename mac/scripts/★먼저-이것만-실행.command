#!/bin/bash
# Apple 개발자 계정 없이 GitHub에서 받은 TypingPet 실행용
# .app 을 직접 열지 말고, 이 파일을 우클릭 → 열기 하세요.

# CRLF 로 받아도 죽지 않게
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR" || exit 1

echo "폴더: $DIR"
xattr -cr "$DIR" 2>/dev/null || true

APP=""
if [ -d "$DIR/TypingPet.app" ]; then
  APP="$DIR/TypingPet.app"
elif [ -d "$DIR/타이핑펫.app" ]; then
  APP="$DIR/타이핑펫.app"
fi

if [ -z "$APP" ]; then
  echo "같은 폴더에 TypingPet.app 이 없습니다. ZIP을 한 번 더 풀어 주세요."
  osascript -e 'display dialog "같은 폴더에 TypingPet.app 이 없습니다.\nZIP을 한 번 더 풀어 주세요." buttons {"확인"} default button 1 with icon stop' || true
  read -r -p "엔터를 누르면 닫힙니다..."
  exit 1
fi

xattr -cr "$APP" 2>/dev/null || true

# 관리자 암호 없이 설치 (사용자 Applications)
DEST="$HOME/Applications/TypingPet.app"
mkdir -p "$HOME/Applications" || true
rm -rf "$DEST" 2>/dev/null || true
if cp -R "$APP" "$DEST"; then
  xattr -cr "$DEST" 2>/dev/null || true
  echo "설치 위치: $DEST"
  open "$DEST"
else
  echo "홈 폴더 설치 실패. 이 폴더에서 바로 실행합니다."
  open "$APP"
fi

echo ""
echo "실행했습니다."
echo "- 큰 창은 안 뜹니다. 화면 오른쪽 아래 작은 캐릭터를 보세요."
echo "- 위쪽 메뉴 막대에도 아이콘이 있습니다."
echo "- 키보드 반응이 없으면: 시스템 설정 → 개인정보 보호 및 보안 → 손쉬운 사용 → TypingPet 허용"
echo ""
read -r -p "엔터를 누르면 이 창이 닫힙니다..."
