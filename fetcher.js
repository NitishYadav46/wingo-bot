const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// GitHub Secrets se Supabase details uthana
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Aapki Daman Game ki API
const API_URL = "https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json"

async function fetchAndSaveData() {
    try {
        const timestamp = new Date().getTime();
        const response = await axios.get(`${API_URL}?ts=${timestamp}`);
        
        // API se 10 results ka data nikalna
        const records = response.data.data.list || [];

        console.log(`📡 API Hit Success! Found ${records.length} records. Saving...`);

        for (let item of records) {
            let period = item.issueNumber;
            let number = parseInt(item.number);
            let color = item.color;
            let premium = parseInt(item.premium);
            
            // Logic: 0-4 = small, 5-9 = big
            let result_type = number >= 5 ? 'big' : 'small';

            // Supabase me data insert karna (Duplicate period skip karega)
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
    }
}

fetchAndSaveData();
