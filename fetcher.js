const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// Supabase Connection
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const API_URL = "https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json";

// 🚀 Aapki ScraperAPI Key (Maine set kar di hai)
const SCRAPER_API_KEY = "A555d17058e1ff05c406d9751e8b7b41";

async function fetchAndSaveData() {
    try {
        const timestamp = new Date().getTime();
        const targetUrl = encodeURIComponent(`${API_URL}?ts=${timestamp}`);
        
        // 🚀 ScraperAPI ka Professional Bypass Link
        const proxyUrl = `http://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${targetUrl}&keep_headers=true`;

        console.log("ScraperAPI ke through request bhej rahe hain...");

        // Request bhejna
        const response = await axios.get(proxyUrl);
        
        const records = response.data.data?.list || [];

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
