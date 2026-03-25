import * as xlsx from 'xlsx';

export interface ColumnDef<T> {
    header: string;
    key: keyof T | ((row: T) => any);
}

/**
 * 범용 엑셀 다운로드 유틸리티 함수
 * @param data 엑셀로 변환할 객체 배열
 * @param columns 엑셀 헤더 및 데이터 매핑 설정
 * @param filename 생성될 파일 이름 (확장자 제외)
 */
export function exportToExcel<T>(data: T[], columns: ColumnDef<T>[], filename: string) {
    if (!data || data.length === 0) {
        console.warn('엑셀로 다운로드할 데이터가 없습니다.');
        return;
    }

    // 1. 컬럼 매핑을 통해 엑셀용 데이터 배열 생성
    const exportData = data.map(item => {
        const rowData: Record<string, any> = {};
        columns.forEach(col => {
            const val = typeof col.key === 'function' ? col.key(item) : item[col.key];
            rowData[col.header] = val ?? '';
        });
        return rowData;
    });

    try {
        // 2. 워크시트 및 워크북 생성
        const worksheet = xlsx.utils.json_to_sheet(exportData);
        
        // 열 너비 자동 조정 (간단한 구현)
        const colWidths = columns.map(col => ({ wch: Math.max(col.header.length, 12) + 5 }));
        worksheet['!cols'] = colWidths;

        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Data');

        // 3. 엑셀 파일 다운로드 트리거
        xlsx.writeFile(workbook, `${filename}.xlsx`, { compression: true });
    } catch (error) {
        console.error('엑셀 파일 생성 중 오류가 발생했습니다:', error);
    }
}
