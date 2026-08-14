const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// GitHub Secrets se Supabase details uthana
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Aapki Daman Game ki API ka link
const API_URL = "https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json";

async function fetchAndSaveData() {
    try {
        const timestamp = new Date().getTime();
        
        // 🚀 BROWSER BYPASS HEADERS (Yeh website ko bewakoof banayega)
        const response = await axios.get(`${API_URL}?ts=${timestamp}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'en-US,en;q=0.9,hi-IN;q=0.8,hi;q=0.7',
                'Origin': 'https://draw.ar-lottery01.com',
                'Referer': 'https://draw.ar-lottery01.com/',
                'Sec-Ch-Ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"Windows"',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin',
                'Connection': 'keep-alive'
            }
        });
        
        // API se results ka data nikalna
        const records = response.data.data.list || [];

        console.log(`📡 API Hit Success! Found ${records.length} records. Saving...`);

        for (let item of records) {
            let period = item.issueNumber;
            let number = parseInt(item.number);
            let color = item.color;
            let premium = parseInt(item.premium);
            
            // Logic: 0-4 = small, 5-9 = big
            let result_type = number >= 5 ? 'big' : 'small';

            // Supabase me data insert karna
            const { error } = await supabase
                .from('daman_history')
                .upsert(
                    [{ period, number, color, premium, result_type }], 
                    { onConflict: 'period', ignoreDuplicates: true }
                );

            if (error) {
                console.error(`❌ Error saving period ${period}:`, error.message);
            }
        }
        console.log("✅ 10 Rounds Successfully Saved to Supabase!");
    } catch (error) {
        console.error("❌ API Fetch Error:", error.message);
        if (error.response) {
            console.error("Website Status:", error.response.status);
        }
    }
}

fetchAndSaveData();
