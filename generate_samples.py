import os
from PIL import Image, ImageDraw, ImageFont
from reportlab.pdfgen import canvas
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics

font_path = "NanumGothic.ttf"

def create_image(filename, text, size=(600, 800)):
    img = Image.new('RGB', size, color='white')
    d = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype(font_path, 20)
    except IOError:
        font = ImageFont.load_default()
    d.text((20, 20), text, fill='black', font=font, spacing=10)
    img.save(filename)
    print(f"Created {filename}")

def create_text_pdf(filename, text):
    pdfmetrics.registerFont(TTFont('NanumGothic', font_path))
    c = canvas.Canvas(filename)
    c.setFont("NanumGothic", 16)
    y = 800
    for line in text.split('\n'):
        c.drawString(40, y, line)
        y -= 25
    c.save()
    print(f"Created {filename}")

def create_scan_pdf(filename, text, size=(600, 800)):
    # Create image first, then save as PDF
    img = Image.new('RGB', size, color='white')
    d = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype(font_path, 20)
    except IOError:
        font = ImageFont.load_default()
    d.text((20, 20), text, fill='black', font=font, spacing=10)
    img.save(filename, "PDF", resolution=100.0)
    print(f"Created {filename}")

if __name__ == "__main__":
    if not os.path.exists(font_path):
        print(f"Font file {font_path} not found.")

    complaint_text = "소장\n\n원고: (주)놀부\n청구금액: 50,000,000원\n\n위 원고는 피고 정흥부에게 위 돈을 청구합니다.\n지연손해금은 연 12%의 비율로 계산하여 지급하라."
    create_image("sample_complaint.jpg", complaint_text)

    evidence_text = "증거자료 1호증 (영수증)\n\n결제금액: 50,000원\n결제일시: 2026-03-24 10:30:00\n가맹점명: (주)서울식당\n비고: 원고가 피고에게 대접한 식사 비용"
    create_text_pdf("sample_evidence.pdf", evidence_text)

    contract_text = "물품공급 계약서\n\n제1조 (목적)\n본 계약은 갑과 을 간의 물품 공급에 관한 사항을 정함을 목적으로 한다.\n\n제8조 (손해배상 및 면책)\n본 계약에 따른 모든 책임과 위험은 \"을\"에게 귀속되며,\n\"갑\"은 어떠한 경우에도 민형사상 책임을 지지 아니한다.\n계약 위반시 \"을\"은 \"갑\"에게 위약벌로 1억원을 지급해야 한다."
    create_scan_pdf("sample_contract_scan.pdf", contract_text)

    license_text = "사업자등록증\n\n사업자번호: 123-45-67890\n상호명: (주)테스트컴퍼니\n대표자명: 홍길동\n개업연월일: 2020년 1월 1일\n사업장소재지: 서울특별시 강남구 가짜동 123-4\n업태: 서비스업\n종목: 시스템통합"
    create_image("sample_biz_license.jpg", license_text)
