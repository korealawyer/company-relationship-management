import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

// Constants
const MOCK_PRIVACY_TEXT = `[개인정보 처리방침 및 중요 고지사항]
1. 본 개인정보처리방침은 서비스 이용자가 안심하고 서비스를 이용할 수 있도록 제정되었습니다.
2. 수집하는 개인정보: 이메일, 이름, 연락처, 회사명 및 직책 등
3. 개인정보 수집 목적: 계약 이행 및 전자서명 내역 증명을 위한 안전한 보관.
4. 보유 및 이용 기간: 전자문서 및 전자거래 기본법 등 관련 법령에 의거하여 최장 5년간 보관.
5. 이용자는 개인정보 수집 및 이용에 대한 동의를 거부할 권리가 있으나, 거부 시 본 전자서명 서비스 제약이 발생합니다.`;

const PLANS = {
    basic: { name: 'Basic 플랜', price: '500,000' },
    pro: { name: 'Pro 플랜', price: '1,000,000' },
    premium: { name: 'Premium 플랜', price: '2,000,000' }
};

export type PlanType = keyof typeof PLANS;

interface ContractPDFProps {
    companyName: string;
    businessNumber: string;
    address: string;
    ceoName: string;
    selectedPlan: PlanType;
    effectiveDateStr: string;
    signatureDataUrl: string; // Base64 signature from customer
    ibsSealDataUrl?: string; // Base64 seal image of IBS from secure storage
    fontPath: string; // Absolute path to NanumGothic.ttf
}

let fontRegistered = false;

export const ContractPDF = ({
    companyName,
    businessNumber,
    address,
    ceoName,
    selectedPlan,
    effectiveDateStr,
    signatureDataUrl,
    ibsSealDataUrl,
    fontPath,
}: ContractPDFProps) => {
    // Register font if not already registered (to avoid duplicate registration errors)
    if (!fontRegistered) {
        Font.register({
            family: 'NanumGothic',
            src: fontPath,
        });
        fontRegistered = true;
    }

    const styles = StyleSheet.create({
        page: {
            flexDirection: 'column',
            backgroundColor: '#FFFFFF',
            padding: 50,
            fontFamily: 'NanumGothic',
            fontSize: 12,
            lineHeight: 1.8,
        },
        title: {
            fontSize: 22,
            textAlign: 'center',
            marginBottom: 30,
            fontWeight: 'bold',
        },
        section: {
            marginBottom: 15,
        },
        boldText: {
            fontWeight: 'bold',
        },
        signatureSection: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 40,
            paddingTop: 20,
            borderTop: '1px solid #CCCCCC', // Removed CSS shorthand that throws error in react-pdf
        },
        partyBlock: {
            width: '45%',
        },
        sealBox: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 10,
        },
        signatureImage: {
            width: 80,
            height: 40,
            marginLeft: 10,
        },
        sealImage: {
            width: 40,
            height: 40,
            marginLeft: 5,
        },
        dateObj: {
            textAlign: 'center',
            marginTop: 30,
            marginBottom: 20,
            fontSize: 14,
        },
        footerNotes: {
            marginTop: 40,
            paddingTop: 10,
            borderTop: '1px solid #EEEEEE', // Update string format for react-pdf compatibility
            fontSize: 9,
            color: '#666666',
        }
    });

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <Text style={styles.title}>법률 자문 계약서</Text>

                <View style={styles.section}>
                    <Text>
                        {companyName} (이하 “갑”이라 한다)과(와) IBS법률사무소 (변호사 유정훈, 이하 “을”이라 한다)은 상호 이해와 협력으로 아래와 같이 합의하여 법률 자문계약(이하 “본 계약”이라 한다)을 체결한다.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text>제1조 (계약의 목적)</Text>
                    <Text>
                        본 계약은 갑의 프랜차이즈 비즈니스 모델에 대응 전략을 수립에 필요한 법률자문, 의사결정 파트너로서의 경영 및 법률, 협상심리 조언, 가맹점주와의 사전 분쟁을 검토하고, 통계적으로 경영에 반영할 수 있는 법률프로세스와 소송 등 분쟁에 대응하는 서비스를 제공하는 것을 목적으로 한다.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text>제2조 (위임사무의 범위)</Text>
                    <Text>① 을은 갑에게 제2조 2항의 서비스를 제공하고, 그 외 사안은 개별적으로 협의하여 별도 계약을 체결한다.</Text>
                    <Text>② 갑의 프랜차이즈 비즈니스 모델에 대응 전략을 수립에 필요한 법률자문, 의사결정 파트너로서의 경영, 법률 및 협상심리 조언, 임직원 및 가맹점주 개개인의 법률상담 자문을 제공한다.</Text>
                </View>

                <View style={styles.section}>
                    <Text>제3조 (기간)</Text>
                    <Text>① 을은 제2조의 위임사무를 갑에게 계약일({effectiveDateStr})로부터 1년간 제공한다.</Text>
                    <Text>② 계약만료일 전 1개월 전에 별도의 서면에 의한 의사표시가 없으면 묵시적으로 연장된 것으로 한다.</Text>
                </View>

                <View style={styles.section}>
                    <Text>제4조 (보수)</Text>
                    <Text>
                        갑은 을에게 제2조의 위임업무를 처리함에 있어 매월 {PLANS[selectedPlan]?.price || '0'}원을 보수로 기업은행 233-094886-01-019 유정훈 : IBS법률사무소 계좌로 입금한다.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text>제5조 (계약서 작성 등)</Text>
                    <Text>
                        본 계약서는 갑과 을 중 어느 당사자가 작성하였는지 관계없이 공정하게 해석되어야 하고, 갑과 을은 본 계약의 준비와 작성에 있어 각각 중대하고 필수적인 역할을 하였음을 인정하고 이에 동의한다.
                    </Text>
                    <Text>
                        본 계약이 체결되었음을 증명하기 위하여 갑과 을은 본 계약서 2부 작성하도록 한 다음 서명 또는 기명날인하고, 각 1부씩 보관한다.
                    </Text>
                </View>

                <Text style={styles.dateObj}>{effectiveDateStr}</Text>

                <View style={styles.signatureSection}>
                    <View style={styles.partyBlock}>
                        <Text>(갑) {companyName}</Text>
                        <Text>사업자번호: {businessNumber}</Text>
                        <Text>주 소: {address}</Text>
                        <View style={styles.sealBox}>
                            <Text>대표이사 {ceoName} (인)</Text>
                            {signatureDataUrl && (
                                <Image source={signatureDataUrl} style={styles.signatureImage} />
                            )}
                        </View>
                    </View>

                    <View style={styles.partyBlock}>
                        <Text>(을) IBS법률사무소</Text>
                        <Text>사업자번호: 313-19-00140</Text>
                        <Text>주 소: 서울시 서초구 서초대로 272 IBS빌딩</Text>
                        <View style={styles.sealBox}>
                            <Text>대표변호사 유정훈 (직인)</Text>
                            {ibsSealDataUrl && (
                                <Image source={ibsSealDataUrl} style={styles.sealImage} />
                            )}
                        </View>
                    </View>
                </View>

                <View style={styles.footerNotes}>
                    <Text>{MOCK_PRIVACY_TEXT}</Text>
                </View>
            </Page>
        </Document>
    );
};
