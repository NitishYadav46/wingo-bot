const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// 1. SUPABASE DATABASE SETUP
const supabaseUrl = "https://mjoqhqruzocmbhhjkjtv.supabase.co"; 
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qb3FocXJ1em9jbWJoaGpranR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2NDg2NjYsImV4cCI6MjEwMjIyNDY2Nn0.MU1awKKiUp3x0laQvazM_nMuj96vyXmw2uG7qEZIR7M";
const supabase = createClient(supabaseUrl, supabaseKey);

// 2. SCRAPER API SETUP - Yahan apni active Scraper API Key daalein
const SCRAPER_API_KEY = "7d42ad5fd65d06c53dce77500f0745c9"; 

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: "Sirf GET request allowed hai" });
    }

    try {
        console.log("🚀 Fetching Latest 1 Page via ScraperAPI...");
        
        const timestamp = new Date().getTime();
        const API_URL = "https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json";
        
        // Target URL ko encode karna zaroori hai ScraperAPI ke liye
        const targetUrl = encodeURIComponent(`${API_URL}?pageNo=1&ts=${timestamp}`);
        
        // ScraperAPI ka Proxy URL
        const proxyUrl = `http://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${targetUrl}&keep_headers=true`;
        
        const response = await axios.get(proxyUrl);
        const records = response.data.data?.list || [];

        if (records.length === 0) {
            return res.status(200).json({ success: false, message: "ScraperAPI se data nahi aaya." });
        }

        console.log(`📡 ScraperAPI Hit Success! ${records.length} records mile. Saving...`);

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
            message: "Successfully scraped via ScraperAPI and saved!", 
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
