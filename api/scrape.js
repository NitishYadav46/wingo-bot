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
        console.log("🚀 Fetching Latest 1 Page Directly with Headers...");
        
        const timestamp = new Date().getTime();
        const targetUrl = `https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json?pageNo=1&ts=${timestamp}`;
        
        // ⚡ Yahan humne Headers add kiye hain taaki real browser jaisa lage
        const response = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://ar-lottery01.com/',
                'Connection': 'keep-alive'
            }
        });
        
        const records = response.data.data?.list || [];

        if (records.length === 0) {
            return res.status(200).json({ success: false, message: "API se data nahi aaya." });
        }

        console.log(`📡 Direct API Hit Success! ${records.length} records mile. Saving...`);

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

        const { error } = await supabase
            .from('daman_history')
            .upsert(formattedData, { onConflict: 'period', ignoreDuplicates: true });

        if (error) throw error;

        return res.status(200).json({ 
            success: true, 
            message: "Successfully scraped directly and saved!", 
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
