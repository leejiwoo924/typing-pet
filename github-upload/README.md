# 타이핑펫

Windows 전역 키보드 입력에 반응하는 오버레이 캐릭터 앱입니다.

## 개발

```powershell
npm.cmd install
npm.cmd run dev
```

## Windows 배포 파일 만들기

```powershell
npm.cmd run dist:win
```

결과물:

- `release/타이핑펫-0.2.0-portable.exe` — 다른 PC에 복사해서 실행
- `배포/` — 배포용으로 정리된 폴더 (빌드 후 생성)

## Mac 배포 (Windows만 있어도 가능)

소스만 [`mac/`](mac/README.md) 에 두고, **실제 .dmg는 GitHub Actions** 가 만듭니다.

1. 저장소를 GitHub에 push  
2. Actions → **Build Mac** → Run workflow  
3. Artifacts에서 `.dmg` / `.zip` 다운로드 → 드라이브 등에 공유  

안내 파일: [`mac/Windows에서-배포파일받기.txt`](mac/Windows에서-배포파일받기.txt)

## 주요 기능

- 전역 타이핑 감지 → 캐릭터 애니메이션
- 기본 이미지 (`basic` / `right` / `left`) 교체
- 단축키 이미지 추가
- 드래그로 위치 이동 / 고정 모드
- 트레이 아이콘에서 설정·종료
