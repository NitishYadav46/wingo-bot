const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// 1. SUPABASE DATABASE SETUP
const supabaseUrl = "https://mjoqhqruzocmbhhjkjtv.supabase.co"; 
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qb3FocXJ1em9jbWJoaGpranR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2NDg2NjYsImV4cCI6MjEwMjIyNDY2Nn0.MU1awKKiUp3x0laQvazM_nMuj96vyXmw2uG7qEZIR7M";
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: "Sirf GET request allowed hai" });
    }

    try {
        console.log("🚀 Fetching Latest 1 Page (10 Records) Directly...");
        
        const timestamp = new Date().getTime();
        
        // ⚡ Direct fetch URL (No ScraperAPI)
        const targetUrl = `https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json?pageNo=1&ts=${timestamp}`;
        
        // Direct request mar rahe hain
        const response = await axios.get(targetUrl);
        const records = response.data.data?.list || [];

        if (records.length === 0) {
            return res.status(200).json({ success: false, message: "API se data nahi aaya. Shayad block ho gaya." });
        }

        console.log(`📡 Direct API Hit Success! ${records.length} records mile. Saving...`);

        // Data format karna
        const formattedData = records.map(item => {
            let number = parseInt(item.number);
            return {
                period: item.issueNumber,
                number: number,
                color: item.color,
                premium: parseInt(item.premium),
                result_type: number >= 5 ? 'big' : 'small' 
            };
        });

        // ⚡ Supabase mein upsert karna (Naye add honge, purane ignore honge)
        const { error } = await supabase
            .from('daman_history')
            .upsert(formattedData, { onConflict: 'period', ignoreDuplicates: true });

        if (error) {
            throw error;
        }

        console.log(`✅ ${formattedData.length} Rounds Successfully Saved to Supabase!`);
        
        return res.status(200).json({ 
            success: true, 
            message: "1 Page (10 rounds) successfully scraped directly and saved!", 
            totalFetched: records.length
        });

    } catch (error) {
        console.error("❌ Main Error:", error.message);
        return res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
}
