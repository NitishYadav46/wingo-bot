const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const API_URL = "https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json";

async function fetchAndSaveData() {
    try {
        const timestamp = new Date().getTime();
        const targetUrl = encodeURIComponent(`${API_URL}?ts=${timestamp}`);
        
        // 🚀 NAYA JUGAAD: CORSProxy.io (Yeh strict blocks todta hai)
        const proxyUrl = `https://corsproxy.io/?${targetUrl}`;

        const response = await axios.get(proxyUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'application/json'
            }
        });
        
        const records = response.data.data?.list || [];

        console.log(`📡 API Hit Success! Found ${records.length} records. Saving...`);

        for (let item of records) {
            let period = item.issueNumber;
            let number = parseInt(item.number);
            let color = item.color;
            let premium = parseInt(item.premium);
            
            let result_type = number >= 5 ? 'big' : 'small';

            const { error } = await supabase
                .from('daman_history')
                .upsert(
                    [{ period, number, color, premium, result_type }], 
                    { onConflict: 'period', ignoreDuplicates: true }
                );

            if (error) console.error(`❌ Error saving ${period}:`, error.message);
        }
        console.log("✅ Rounds Successfully Saved!");
    } catch (error) {
        console.error("❌ API Fetch Error:", error.message);
    }
}

fetchAndSaveData();
