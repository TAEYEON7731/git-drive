/**
 * 인허가 정보 수집 시스템 - Phase 1 MVP
 * 식품안전나라 공공데이터 포털 API를 활용하여 음식점 정보를 수집하고 구글 시트에 저장
 */

// ========================================
// 설정 및 상수
// ========================================

const CONFIG = {
  API_BASE_URL: 'http://openapi.foodsafetykorea.go.kr/api',
  SERVICE_ID: 'I2500',
  DATA_TYPE: 'json',
  DEFAULT_START_IDX: 1,
  DEFAULT_END_IDX: 100,
  SCRIPT_PROPERTY_KEY: 'FOOD_SAFETY_API_KEY'
};

// 데이터 필드 매핑
const DATA_FIELDS = {
  LCNS_NO: 'B',      // 영업고유구분번호
  INDUTY_CD_NM: 'C', // 업종
  BSSH_NM: 'D',      // 업소명
  PRSDNT_NM: 'E',    // 대표자명
  TELNO: 'F',        // 전화번호
  PRMS_DT: 'G',      // 허가일자
  ADDR: 'H'          // 주소
};

// ========================================
// 메뉴 및 UI 함수
// ========================================

/**
 * 스프레드시트가 열릴 때 자동으로 실행되어 커스텀 메뉴를 추가
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🍽️ 인허가정보')
    .addItem('API 키 설정', 'showApiKeyDialog')
    .addSeparator()
    .addItem('데이터 가져오기 (1-100)', 'fetchAndSaveData')
    .addSeparator()
    .addItem('API 키 확인', 'checkApiKey')
    .addToUi();
}

/**
 * API 키 입력 다이얼로그 표시
 */
function showApiKeyDialog() {
  const ui = SpreadsheetApp.getUi();
  const currentKey = getApiKey();
  const promptText = currentKey
    ? 'API 키가 이미 설정되어 있습니다.\n새로운 API 키를 입력하시겠습니까?'
    : 'API 키를 입력해주세요:';

  const response = ui.prompt('API 키 설정', promptText, ui.ButtonSet.OK_CANCEL);

  if (response.getSelectedButton() === ui.Button.OK) {
    const apiKey = response.getResponseText().trim();

    if (apiKey) {
      saveApiKey(apiKey);
      ui.alert('✅ 성공', 'API 키가 저장되었습니다.', ui.ButtonSet.OK);
    } else {
      ui.alert('⚠️ 경고', 'API 키가 입력되지 않았습니다.', ui.ButtonSet.OK);
    }
  }
}

/**
 * 현재 저장된 API 키 확인
 */
function checkApiKey() {
  const ui = SpreadsheetApp.getUi();
  const apiKey = getApiKey();

  if (apiKey) {
    const maskedKey = apiKey.substring(0, 8) + '***' + apiKey.substring(apiKey.length - 4);
    ui.alert('API 키 확인', `현재 저장된 API 키: ${maskedKey}`, ui.ButtonSet.OK);
  } else {
    ui.alert('⚠️ API 키 없음', 'API 키가 설정되어 있지 않습니다.\n"API 키 설정" 메뉴를 사용하여 설정해주세요.', ui.ButtonSet.OK);
  }
}

// ========================================
// API 키 관리 함수
// ========================================

/**
 * API 키를 Script Properties에 저장
 * @param {string} apiKey - 저장할 API 키
 */
function saveApiKey(apiKey) {
  const scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperty(CONFIG.SCRIPT_PROPERTY_KEY, apiKey);
}

/**
 * 저장된 API 키 가져오기
 * @returns {string|null} 저장된 API 키 또는 null
 */
function getApiKey() {
  const scriptProperties = PropertiesService.getScriptProperties();
  return scriptProperties.getProperty(CONFIG.SCRIPT_PROPERTY_KEY);
}

// ========================================
// API 호출 함수
// ========================================

/**
 * 식품안전나라 API 호출
 * @param {number} startIdx - 시작 인덱스 (기본값: 1)
 * @param {number} endIdx - 종료 인덱스 (기본값: 100)
 * @returns {Object} API 응답 데이터
 */
function callFoodSafetyApi(startIdx = CONFIG.DEFAULT_START_IDX, endIdx = CONFIG.DEFAULT_END_IDX) {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error('API 키가 설정되지 않았습니다. "API 키 설정" 메뉴를 사용하여 먼저 설정해주세요.');
  }

  // API URL 구성
  const url = `${CONFIG.API_BASE_URL}/${apiKey}/${CONFIG.SERVICE_ID}/${CONFIG.DATA_TYPE}/${startIdx}/${endIdx}`;

  try {
    Logger.log(`API 호출: ${url}`);

    const response = UrlFetchApp.fetch(url, {
      method: 'get',
      muteHttpExceptions: true
    });

    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    if (responseCode !== 200) {
      throw new Error(`API 호출 실패 (HTTP ${responseCode}): ${responseText}`);
    }

    const data = JSON.parse(responseText);

    // API 에러 체크
    if (data[CONFIG.SERVICE_ID] && data[CONFIG.SERVICE_ID].RESULT) {
      const result = data[CONFIG.SERVICE_ID].RESULT;
      if (result.CODE !== 'INFO-000') {
        throw new Error(`API 에러: ${result.MSG} (${result.CODE})`);
      }
    }

    return data;

  } catch (error) {
    Logger.log(`API 호출 중 에러 발생: ${error.message}`);
    throw error;
  }
}

/**
 * API 응답에서 데이터 배열 추출
 * @param {Object} apiResponse - API 응답 객체
 * @returns {Array} 음식점 데이터 배열
 */
function extractDataFromResponse(apiResponse) {
  if (!apiResponse || !apiResponse[CONFIG.SERVICE_ID]) {
    throw new Error('잘못된 API 응답 형식입니다.');
  }

  const serviceData = apiResponse[CONFIG.SERVICE_ID];

  // row 배열 반환 (데이터가 없으면 빈 배열)
  return serviceData.row || [];
}

// ========================================
// 데이터 처리 함수
// ========================================

/**
 * API 데이터를 스프레드시트 행 형식으로 변환
 * @param {Array} dataArray - API에서 받은 데이터 배열
 * @returns {Array} 2차원 배열 (스프레드시트 행 형식)
 */
function convertDataToRows(dataArray) {
  const rows = [];

  dataArray.forEach((item, index) => {
    const row = [
      index + 1,                    // A열: 번호 (자동 생성)
      item.LCNS_NO || '',           // B열: 영업고유구분번호
      item.INDUTY_CD_NM || '',      // C열: 업종
      item.BSSH_NM || '',           // D열: 업소명
      item.PRSDNT_NM || '',         // E열: 대표자명
      item.TELNO || '',             // F열: 전화번호
      item.PRMS_DT || '',           // G열: 허가일자
      item.ADDR || ''               // H열: 주소
    ];
    rows.push(row);
  });

  return rows;
}

// ========================================
// 스프레드시트 함수
// ========================================

/**
 * 스프레드시트에 헤더 행 추가
 * @param {Sheet} sheet - 대상 시트
 */
function addHeaderRow(sheet) {
  const headers = [
    '번호',
    '영업고유구분번호(인허가번호)',
    '업종',
    '업소명',
    '대표자명',
    '전화번호',
    '허가일자',
    '주소'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // 헤더 스타일 적용
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold')
             .setBackground('#4285f4')
             .setFontColor('#ffffff')
             .setHorizontalAlignment('center');
}

/**
 * 데이터를 스프레드시트에 저장
 * @param {Array} rows - 저장할 데이터 행
 * @param {Sheet} sheet - 대상 시트 (선택사항)
 */
function saveDataToSheet(rows, sheet = null) {
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  }

  // 시트 초기화 (기존 데이터 삭제)
  sheet.clear();

  // 헤더 추가
  addHeaderRow(sheet);

  // 데이터 추가
  if (rows.length > 0) {
    const startRow = 2; // 헤더 다음 행부터
    sheet.getRange(startRow, 1, rows.length, rows[0].length).setValues(rows);

    // 열 너비 자동 조정
    for (let i = 1; i <= 8; i++) {
      sheet.autoResizeColumn(i);
    }
  }

  Logger.log(`${rows.length}개의 데이터 행이 저장되었습니다.`);
}

// ========================================
// 메인 실행 함수
// ========================================

/**
 * 데이터 가져오기 및 저장 (Phase 1 MVP)
 * 1-100번 데이터를 가져와서 현재 시트에 저장
 */
function fetchAndSaveData() {
  const ui = SpreadsheetApp.getUi();

  try {
    // API 호출
    ui.alert('⏳ 데이터 수집 중', '데이터를 가져오고 있습니다. 잠시만 기다려주세요...', ui.ButtonSet.OK);

    const apiResponse = callFoodSafetyApi();
    const dataArray = extractDataFromResponse(apiResponse);

    if (dataArray.length === 0) {
      ui.alert('ℹ️ 알림', '가져올 데이터가 없습니다.', ui.ButtonSet.OK);
      return;
    }

    // 데이터 변환
    const rows = convertDataToRows(dataArray);

    // 스프레드시트에 저장
    saveDataToSheet(rows);

    // 성공 메시지
    ui.alert(
      '✅ 완료',
      `총 ${dataArray.length}개의 음식점 정보를 성공적으로 가져왔습니다.\n\n` +
      `- 수집 시간: ${new Date().toLocaleString('ko-KR')}\n` +
      `- 데이터 범위: 1-100`,
      ui.ButtonSet.OK
    );

  } catch (error) {
    Logger.log(`에러 발생: ${error.message}`);
    ui.alert('❌ 오류', `데이터 수집 중 오류가 발생했습니다:\n\n${error.message}`, ui.ButtonSet.OK);
  }
}

// ========================================
// 테스트 함수
// ========================================

/**
 * API 연결 테스트 (개발용)
 */
function testApiConnection() {
  try {
    const response = callFoodSafetyApi(1, 5);
    Logger.log('API 테스트 성공:');
    Logger.log(JSON.stringify(response, null, 2));
    return true;
  } catch (error) {
    Logger.log('API 테스트 실패:');
    Logger.log(error.message);
    return false;
  }
}
