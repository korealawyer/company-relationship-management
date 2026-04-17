import { toCanvas } from 'html-to-image';
import { jsPDF } from 'jspdf';

// 팩토리 패턴 추상 인터페이스
export interface IReportGenerator {
    generate(elements?: HTMLElement[], data?: Record<string, any>[]): Promise<void>;
}

// 메인 스레드 블로킹 방지를 위한 비동기 청크 지연 함수
const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 30));

/**
 * html2canvas와 jspdf를 활용한 PDF 생성기
 */
export class PDFReportGenerator implements IReportGenerator {
    private filename: string;

    constructor(filename: string = 'report.pdf') {
        this.filename = filename;
    }

    async generate(elements?: HTMLElement[]): Promise<void> {
        if (!elements || elements.length === 0) {
            throw new Error('PDF 생성에는 최소 하나 이상의 HTML 요소가 필요합니다.');
        }

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        for (let i = 0; i < elements.length; i++) {
            const el = elements[i];

            // 1. html2canvas 실행 전 UI 업데이트(로딩 스피너 등)를 위해 제어권 양보
            await yieldToMain();

            // 2. DOM을 캔버스로 변환 (html-to-image 최적화)
            const canvas = await toCanvas(el, {
                pixelRatio: Math.min(window.devicePixelRatio || 1, 2), // 고해상도 메모리 관리
                backgroundColor: '#f8f9fc',
                skipFonts: false, // 폰트 직렬화 오류 방지
                cacheBust: true   // Tainted canvas 방어용
            });

            // 3. 캔버스 데이터를 이미지로 추출 전 제어권 양보
            await yieldToMain();
            
            const imgData = canvas.toDataURL('image/png');
            const imgProps = pdf.getImageProperties(imgData);
            
            // 너비를 A4 사이즈에 맞추고, 높이는 비율에 맞게 조정
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

            let heightLeft = imgHeight;
            let position = 0;

            // 4. PDF에 이미지 추가
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfHeight;

            // 내용이 한 페이지를 넘어갈 경우 여러 페이지로 분할
            while (heightLeft > 0) {
                await yieldToMain();
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
                heightLeft -= pdfHeight;
            }

            // 다음 요소가 있다면 새 페이지를 추가
            if (i < elements.length - 1) {
                pdf.addPage();
            }
        }

        // 5. 파일 저장 전 제어권 양보 (이벤트 루프 해방)
        await yieldToMain();
        pdf.save(this.filename);
    }
}

/**
 * 청크 기반 동적 CSV 생성기
 */
export class CSVReportGenerator implements IReportGenerator {
    private filename: string;

    constructor(filename: string = 'report.csv') {
        this.filename = filename;
    }

    async generate(_?: HTMLElement[], data?: Record<string, any>[]): Promise<void> {
        if (!data || data.length === 0) {
            throw new Error('CSV 생성에는 데이터가 필요합니다.');
        }

        await yieldToMain();

        const CHUNK_SIZE = 1000;
        let csvContent = '\uFEFF'; // Excel 호환용 UTF-8 BOM
        
        const headers = Object.keys(data[0]);
        csvContent += headers.join(',') + '\n';

        // 배열 데이터를 청크 단위로 잘라 비동기 처리하여 브라우저 멈춤 현상(Freezing) 방지
        for (let i = 0; i < data.length; i += CHUNK_SIZE) {
            await yieldToMain();
            const chunk = data.slice(i, i + CHUNK_SIZE);
            const chunkStr = chunk.map(row => {
                return headers.map(header => {
                    const cell = row[header] === null || row[header] === undefined ? '' : String(row[header]);
                    // 이스케이프 처리
                    return `"${cell.replace(/"/g, '""')}"`;
                }).join(',');
            }).join('\n');
            
            csvContent += chunkStr + '\n';
        }

        await yieldToMain();

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', this.filename);
        document.body.appendChild(link);
        link.click();
        
        // 메모리 정리
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

export type ReportType = 'PDF' | 'CSV';

/**
 * 팩토리 패턴을 사용한 리포트 생성기 호출
 */
export class ReportGeneratorFactory {
    static create(type: ReportType, filename?: string): IReportGenerator {
        switch (type) {
            case 'PDF':
                return new PDFReportGenerator(filename || 'report.pdf');
            case 'CSV':
                return new CSVReportGenerator(filename || 'report.csv');
            default:
                throw new Error('지원하지 않는 리포트 타입입니다.');
        }
    }
}
