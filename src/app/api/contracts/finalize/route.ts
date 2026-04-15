import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

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

        // 1. Generate path
        const fileName = `${companyId}-contract-${Date.now()}.pdf`;
        const filePath = `contracts/${fileName}`;

        // 2. Create Signed Upload URL
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('documents')
            .createSignedUploadUrl(filePath);

        if (uploadError || !uploadData) {
            console.error('Storage createSignedUploadUrl Error:', uploadError);
            return NextResponse.json({ error: 'Failed to create signed upload url' }, { status: 500 });
        }

        // Get public URL (or signed URL depending on policy)
        const { data: publicUrlData } = supabase.storage
            .from('documents')
            .getPublicUrl(filePath);
            
        const documentUrl = publicUrlData.publicUrl;

        // 3. Update Database
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

        return NextResponse.json({ 
            success: true, 
            contract: contractData, 
            documentUrl, 
            signedUploadUrl: uploadData.signedUrl 
        });

    } catch (error: any) {
        console.error('Finalize Contract API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
