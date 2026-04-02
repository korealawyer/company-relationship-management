import fs from 'fs';

// To keep it simple, we don't really need a valid audio file, just a tiny valid file to trigger Whisper 
// or at least test if the backend tries to call OpenAI.
// However, OpenAI's Whisper API requires a valid audio or video file.
// If we send a text file disguised as webm, OpenAI might reject it, but the endpoint should at least try and not crash the server.
// For a real test, let's just make a small buffer with webm header or dummy data.
// Wait, OpenAI might return 400. That's fine, we want to see if the API flow works.

async function run() {
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    
    // Create dummy 10-byte audio file
    const audioData = Buffer.from('RIFF$dummyWAVEfmt dummydata', 'utf-8');
    
    let body = '';
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="audio"; filename="test.webm"\r\n`;
    body += `Content-Type: audio/webm\r\n\r\n`;
    body += audioData.toString('binary') + '\r\n';

    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="company_id"\r\n\r\n`;
    body += `c1\r\n`;

    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="duration_seconds"\r\n\r\n`;
    body += `5\r\n`;
    
    body += `--${boundary}--\r\n`;

    try {
        console.log('Sending POST to /api/call-recordings...');
        const res = await fetch('http://localhost:3000/api/call-recordings', {
            method: 'POST',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Cookie': 'ibs_session=mock_session; ibs_role=super_admin'
            },
            // fetch doesn't support binary string body directly, so we convert to buffer
            body: Buffer.from(body, 'binary')
        });

        console.log(`Status: ${res.status}`);
        const data = await res.json();
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Fetch error:', e);
    }
}

run();
