const XLSX = require('xlsx');
const fs = require('fs');

const inputFile = 'final_sales_targets.xlsx';

const wb = XLSX.readFile(inputFile);
const sheetName = wb.SheetNames[0];
const ws = wb.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(ws, { defval: '' });

// 우리가 기대하는 템플릿 열 목록
const expectedHeaders = [
    '기업명',
    '사업자번호',
    '업종',
    '구분 카테고리',
    '홈페이지',
    '이메일',
    '전화번호',
    '담당자',
    '담당자 전화',
    '가맹점수',
    '상태',
    '위험도등급',
    '발견된 법률이슈(건)',
    'AI 분석여부',
    '개인정보처리방침 URL',
    '개인정보처리방침 전문',
    '배정 변호사',
    '영업자',
    '통화 메모',
    '플랜'
];

const modifiedData = data.map(row => {
    const newRow = {};
    
    // 1. 기대하는 헤더 먼저 초기화 및 매핑
    expectedHeaders.forEach(header => {
        newRow[header] = '';
    });
    
    // 기업명
    newRow['기업명'] = row['기업명'] || row['회사명'] || '';
    
    // 사업자번호
    newRow['사업자번호'] = row['사업자번호'] || '';
    
    // 업종
    newRow['업종'] = row['업종'] || '';
    
    // 구분 카테고리
    const oldCat = row['구분'] || row['구분 카테고리'] || '';
    // 기존에 '프랜차이즈'이거나 아니면 적절하게 맵핑할 수도 있는데 여기선 일단 가져옴
    if (oldCat === '일반') {
        newRow['구분 카테고리'] = '중소기업';
    } else {
        newRow['구분 카테고리'] = oldCat;
    }
    
    // 홈페이지
    newRow['홈페이지'] = row['홈페이지'] || '';
    
    // 이메일
    newRow['이메일'] = row['이메일'] || '';
    
    // 전화번호
    newRow['전화번호'] = row['전화번호'] || '';
    
    // 담당자
    newRow['담당자'] = row['담당자'] || '';
    
    // 담당자 전화
    newRow['담당자 전화'] = row['담당자 전화'] || '';
    
    // 가맹점수
    newRow['가맹점수'] = row['가맹점수'] !== undefined && row['가맹점수'] !== '' ? row['가맹점수'] : '';
    
    // 개인정보처리방침 URL
    newRow['개인정보처리방침 URL'] = row['개인정보방침 URL'] || row['개인정보처리방침 URL'] || '';
    
    // 개인정보처리방침 전문
    newRow['개인정보처리방침 전문'] = row['개인정보방침 전문'] || row['개인정보처리방침 전문'] || '';
    
    // 기타 필요한 매핑... 메모 -> 통화 메모
    newRow['통화 메모'] = row['메모'] || row['통화 메모'] || '';
    
    // 2. 나머지 매핑되지 않은 기존 필드들을 뒤에 추가
    const mappedOriginalKeys = [
        '기업명', '회사명', '사업자번호', '업종', '구분', '구분 카테고리',
        '홈페이지', '이메일', '전화번호', '담당자', '담당자 전화', '가맹점수',
        '개인정보방침 URL', '개인정보처리방침 URL',
        '개인정보방침 전문', '개인정보처리방침 전문',
        '메모', '통화 메모'
    ];
    
    Object.keys(row).forEach(key => {
        if (!mappedOriginalKeys.includes(key) && row[key] !== '') {
            newRow[key] = row[key];
        }
    });

    return newRow;
});

const newWs = XLSX.utils.json_to_sheet(modifiedData);
const newWb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(newWb, newWs, 'CRM 기업목록');

// 강제 헤더 폭 설정도 해주면 좋지만 생략..
XLSX.writeFile(newWb, inputFile);
console.log('업데이트 되었습니다.');
