# CLAUDE.md

이 파일은 Claude Code (claude.ai/code)가 이 저장소에서 작업할 때 참고하는 가이드입니다.

## 프로젝트 개요

식품안전나라 공공데이터 포털 API를 활용하여 음식점 인허가 정보를 자동으로 수집하고, Google 스프레드시트에 저장하는 Google Apps Script 프로젝트입니다. Clasp(Command Line Apps Script Projects)를 사용하여 로컬 개발 및 배포를 수행합니다.

## 프로젝트 구조

```
인허가정보/
├── Code.js                    # 메인 스크립트 파일
├── PRD.md                     # 제품 요구사항 문서
├── .clasp.json                # Clasp 배포 설정
└── appsscript.json            # Google Apps Script 매니페스트
```

- **Code.js**: Apps Script 함수가 포함된 메인 JavaScript 파일
- **.clasp.json**: Clasp CLI 설정 파일 (스크립트 ID: 1F4ORXCvTptOOvxkA9_JLrXq6wCd2v8tERNGCauvlLN9p7CoY0we7CNxx)
- **appsscript.json**: 타임존(Asia/Seoul), 런타임(V8), 로깅 설정이 포함된 매니페스트 파일
- **PRD.md**: API 명세, 스프레드시트 설계, 구현 단계 등 상세 요구사항

## 개발 워크플로우

### Google Apps Script에 배포하기

```bash
clasp push    # 로컬 변경사항을 Google Apps Script에 푸시
clasp pull    # Google Apps Script의 원격 변경사항 가져오기
clasp open    # Apps Script 에디터에서 스크립트 열기
```

### Git과 배포 워크플로우

**중요**: `git push` 완료 후 반드시 `clasp push`도 함께 실행하여 두 저장소를 동기화해야 합니다.

```bash
# 표준 워크플로우
git add .
git commit -m "커밋 메시지"
git push
clasp push
```

### 파일 관리

- 모든 스크립트 파일은 이 프로젝트 디렉토리에 위치해야 함
- 지원되는 파일 확장자: `.js`, `.gs`, `.html`, `.json`
- V8 런타임 사용 (최신 ES6+ 문법 지원)

## 기술 스택

- **Google Apps Script**: 런타임 환경
- **Clasp**: 배포 도구
- **JavaScript (V8 Runtime)**: 프로그래밍 언어
- **Git/GitHub**: 버전 관리 (https://github.com/TAEYEON7731/git-drive)
- **식품안전나라 API**: 외부 데이터 소스
- **Google Sheets**: 데이터 저장소

## 설정

- **타임존**: Asia/Seoul (한국 표준시)
- **예외 로깅**: STACKDRIVER (Google Cloud Logging)
- **런타임**: V8 (최신 JavaScript 기능 지원)

## API 연동 세부사항

### 식품안전나라 API 명세

**서비스명**: 인허가 업소 정보 조회 서비스 (I2500)
**제공기관**: 식품안전나라 (foodsafetykorea.go.kr)
**인증방식**: API Key 인증

**URL 구조**:
```
http://openapi.foodsafetykorea.go.kr/api/{API_KEY}/I2500/json/{START_IDX}/{END_IDX}
```

**7개 핵심 데이터 필드**:
1. LCNS_NO - 영업고유구분번호 (인허가번호)
2. INDUTY_CD_NM - 업종 (음식점 분류)
3. BSSH_NM - 업소명 (상호명)
4. PRSDNT_NM - 대표자명 (사업자명)
5. TELNO - 전화번호 (연락처)
6. PRMS_DT - 허가일자 (YYYYMMDD 형식)
7. ADDR - 주소 (전체 주소)

### Google Sheets 스키마

**열 구성** (A-H):
- A열: 번호 (자동 생성)
- B열: 영업고유구분번호 (LCNS_NO)
- C열: 업종 (INDUTY_CD_NM)
- D열: 업소명 (BSSH_NM)
- E열: 대표자명 (PRSDNT_NM)
- F열: 전화번호 (TELNO)
- G열: 허가일자 (PRMS_DT)
- H열: 주소 (ADDR)

## 구현 단계 (PRD.md 기준)

### Phase 1: MVP
- API 키 입력 및 저장
- 기본 API 호출 (고정 범위: 1-100)
- JSON 파싱 및 7개 필드 추출
- 스프레드시트 기본 입력
- A열 자동 번호 생성

### Phase 2: 핵심 기능
- 사용자 정의 데이터 범위
- 1000건 이상 페이지네이션 처리
- 선택적 필터 적용 (업종, 업소명)
- 진행 상황 표시
- 에러 핸들링 및 재시도 로직

### Phase 3: 사용성 개선
- 중복 데이터 확인
- 추가 입력 모드 (기존 데이터 보존)
- 수집 이력 로그
- 데이터 내보내기 (CSV, Excel)

### Phase 4: 고급 기능
- 예약 실행 (스케줄링)
- 여러 시트 동시 관리
- 대시보드 (통계 및 시각화)
- API 사용량 모니터링

## 중요 참고사항

- 이 프로젝트는 Google Drive/Sheets 서비스와 연동됨
- 로컬 파일 변경사항은 `clasp push`로 배포해야 Apps Script 환경에 반영됨
- Apps Script 에디터에서 직접 변경한 내용은 `clasp pull`로 로컬과 동기화해야 함
- **개인정보 처리**: 대표자명, 전화번호 등 개인정보 포함 - 취급 주의
- API 호출 제한 및 일일 할당량 적용 (공공데이터 포털 정책 확인 필요)
- API 호출당 최대 1,000건 조회 가능 (endIdx - startIdx 제한)
- 성능 목표: 100건 10초 이내, 1000건 60초 이내
