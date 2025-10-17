# CLAUDE.md

이 파일은 Claude Code (claude.ai/code)가 이 저장소에서 작업할 때 참고하는 가이드입니다.

## 프로젝트 개요

인허가정보 관리를 위한 Google Apps Script 프로젝트입니다. Clasp(Command Line Apps Script Projects)를 사용하여 Google Apps Script 환경에 배포합니다.

## 프로젝트 구조

```
git-drive/
├── README.md                       # 프로젝트 문서
└── 인허가정보/                     # 메인 Google Apps Script 프로젝트
    ├── Code.js                    # 메인 스크립트 파일
    ├── .clasp.json                # Clasp 배포 설정
    └── appsscript.json            # Google Apps Script 매니페스트
```

- **인허가정보/**: Google Apps Script 프로젝트 파일들이 있는 디렉토리
- **Code.js**: Apps Script 함수가 포함된 메인 JavaScript 파일
- **.clasp.json**: Clasp CLI 설정 파일 (스크립트 ID: 1F4ORXCvTptOOvxkA9_JLrXq6wCd2v8tERNGCauvlLN9p7CoY0we7CNxx)
- **appsscript.json**: 타임존(Asia/Seoul), 런타임(V8), 로깅 설정이 포함된 매니페스트 파일

## 개발 워크플로우

### Google Apps Script에 배포하기

```bash
# 로컬 변경사항을 Google Apps Script에 푸시
cd 인허가정보
clasp push

# Google Apps Script의 원격 변경사항 가져오기
clasp pull

# Apps Script 에디터에서 스크립트 열기
clasp open
```

### 파일 관리

- 모든 스크립트 파일은 `인허가정보/` 디렉토리에 위치해야 함
- 지원되는 파일 확장자: `.js`, `.gs`, `.html`, `.json`
- V8 런타임을 사용하는 JavaScript (최신 ES6+ 문법 지원)

## 기술 스택

- **Google Apps Script**: 런타임 환경
- **Clasp**: 배포 도구
- **JavaScript (V8 런타임)**: 프로그래밍 언어
- **Git/GitHub**: 버전 관리 (https://github.com/TAEYEON7731/git-drive)

## 설정

- **타임존**: Asia/Seoul (한국 표준시)
- **예외 로깅**: STACKDRIVER (Google Cloud Logging)
- **런타임**: V8 (최신 JavaScript 기능 지원)

## 중요 참고사항

- 이 프로젝트는 Google Drive/Sheets 서비스와 연동됨
- 로컬 파일의 변경사항은 `clasp push`로 배포해야 Apps Script 환경에 반영됨
- Apps Script 에디터에서 직접 변경한 내용은 `clasp pull`로 로컬 저장소와 동기화해야 함

## 배포 규칙

**중요**: `git push`가 완료되면 반드시 `clasp push`도 함께 실행해야 합니다.

```bash
# Git 커밋 및 푸시 후 자동으로 Clasp 배포
git add .
git commit -m "커밋 메시지"
git push
cd 인허가정보
clasp push
```

이 규칙을 준수하여 Git 저장소와 Google Apps Script 환경이 항상 동기화되도록 유지하세요.
