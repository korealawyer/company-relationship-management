import { NextResponse } from 'next/server';
import React from 'react';
import { getServiceSupabase } from '@/lib/supabase';
import { renderToStream } from '@react-pdf/renderer';
import { ContractPDF } from '@/components/pdf/ContractPDF';
import fs from 'fs/promises';
import path from 'path';

// Helper to convert readable stream to buffer
async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { companyName, businessNumber, address, ceoName, selectedPlan, signatureDataUrl, companyId } = body;

        if (!companyId || !signatureDataUrl) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabase = getServiceSupabase();
        if (!supabase) {
            return NextResponse.json({ error: 'Supabase configuration error' }, { status: 500 });
        }

        // 1. Fetch IBS Seal (Secure local asset)
        // Note: The actual seal should be placed in `src/server_assets/ibs_seal.png`
        let ibsSealDataUrl = '';
        try {
            const sealPath = path.join(process.cwd(), 'src/server_assets/ibs_seal.png');
            const sealBuffer = await fs.readFile(sealPath);
            ibsSealDataUrl = `data:image/png;base64,${sealBuffer.toString('base64')}`;
        } catch (e) {
            console.warn('IBS Seal image not found in src/server_assets/ibs_seal.png, skipping seal.');
        }

        // 2. Fetch Korean Font (NanumGothic)
        const fontPath = path.join(process.cwd(), 'NanumGothic.ttf');

        // 3. Render PDF
        const pdfDate = new Date();
        const effectiveDateStr = `${pdfDate.getFullYear()}년 ${pdfDate.getMonth() + 1}월 ${pdfDate.getDate()}일`;
        
        const stream = await renderToStream(
            React.createElement(ContractPDF, {
                companyName: companyName,
                businessNumber: businessNumber,
                address: address,
                ceoName: ceoName,
                selectedPlan: selectedPlan,
                effectiveDateStr: effectiveDateStr,
                signatureDataUrl: signatureDataUrl,
                ibsSealDataUrl: ibsSealDataUrl,
                fontPath: fontPath
            }) as any
        );

        const pdfBuffer = await streamToBuffer(stream);

        // 4. Upload PDF to Supabase Storage
        const fileName = `${companyId}-contract-${Date.now()}.pdf`;
        
        // Ensure bucket exists. Try to upload. If bucket doesn't exist, this will fail. Let's assume 'documents' bucket.
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('documents')
            .upload(`contracts/${fileName}`, pdfBuffer, {
                contentType: 'application/pdf',
                upsert: false
            });

        if (uploadError) {
             console.error('Storage Upload Error:', uploadError);
             return NextResponse.json({ error: 'Failed to upload PDF document' }, { status: 500 });
        }

        // Get public URL (or signed URL depending on policy)
        const { data: publicUrlData } = supabase.storage
            .from('documents')
            .getPublicUrl(`contracts/${fileName}`);
            
        const documentUrl = publicUrlData.publicUrl;

        // 5. Update Database
        const contractId = crypto.randomUUID();
        const { data: contractData, error: dbError } = await supabase
            .from('contracts')
            .insert({
                id: contractId,
                title: `법률자문 계약 (${selectedPlan})`,
                template: '자문 계약서 (PDF)',
                party_a_name: companyName,
                party_a_signed: true,
                party_b_name: 'IBS법률사무소',
                party_b_signed: true,
                content: `PDF 저장됨: ${documentUrl}`,
                company_id: companyId,
                document_url: documentUrl,
                status: 'both_signed'
            })
            .select()
            .single();

        if (dbError) {
            console.error('Database Error:', dbError);
            return NextResponse.json({ error: 'Failed to save contract record' }, { status: 500 });
        }

        return NextResponse.json({ success: true, contract: contractData, documentUrl });

    } catch (error: any) {
        console.error('Finalize Contract API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
