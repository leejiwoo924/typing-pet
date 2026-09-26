#!/bin/bash
# GitHub 등에서 받은 unsigned TypingPet.app 이
# “damaged and can’t be opened” 로 막힐 때 사용합니다.
# (실제 파일 손상이 아니라 macOS quarantine / Gatekeeper 차단입니다.)

set -e
cd "$(dirname "$0")"

APP=""
if [ -d "TypingPet.app" ]; then
  APP="TypingPet.app"
elif [ -d "타이핑펫.app" ]; then
  APP="타이핑펫.app"
else
  # Applications 에 이미 설치한 경우
  if [ -d "/Applications/TypingPet.app" ]; then
    APP="/Applications/TypingPet.app"
  elif [ -d "/Applications/타이핑펫.app" ]; then
    APP="/Applications/타이핑펫.app"
  fi
fi

if [ -z "$APP" ]; then
  echo "TypingPet.app 을 찾지 못했습니다."
  echo "이 스크립트를 .app 과 같은 폴더에 두거나, Applications 에 설치한 뒤 다시 실행하세요."
  read -r -p "엔터를 누르면 종료합니다..."
  exit 1
fi

echo "quarantine 속성 제거 중: $APP"
xattr -cr "$APP"
echo "실행합니다..."
open "$APP"
