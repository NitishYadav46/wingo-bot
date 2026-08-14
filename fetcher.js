const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// GitHub Secrets se Supabase details
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Aapki Daman Game ki API
const API_URL = "https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json";

async function fetchAndSaveData() {
    try {
        const timestamp = new Date().getTime();
        // 🚀 Target URL banaya
        const targetUrl = encodeURIComponent(`${API_URL}?ts=${timestamp}`);
        
        // 🚀 JUGAD: AllOrigins Free Proxy (Bicholiya) use kar rahe hain
        const proxyUrl = `https://api.allorigins.win/raw?url=${targetUrl}`;

        // Proxy ke through request bhejna
        const response = await axios.get(proxyUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
            },
            timeout: 10000 // 10 second wait karega
        });
        
        // Data nikalna
        const records = response.data.data.list || [];

        console.log(`📡 API Hit Success! Found ${records.length} records. Saving...`);

        for (let item of records) {
            let period = item.issueNumber;
            let number = parseInt(item.number);
            let color = item.color;
            let premium = parseInt(item.premium);
            
            // Logic: 0-4 = small, 5-9 = big
            let result_type = number >= 5 ? 'big' : 'small';

            // Supabase me save karna
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
        console.log("✅ Rounds Successfully Saved to Supabase!");
    } catch (error) {
        console.error("❌ API Fetch Error:", error.message);
    }
}

fetchAndSaveData();
