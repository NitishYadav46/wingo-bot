const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// 1. SUPABASE DATABASE SETUP (Direct Keys Set)
const supabaseUrl = "https://mjoqhqruzocmbhhjkjtv.supabase.co"; 
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qb3FocXJ1em9jbWJoaGpranR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2NDg2NjYsImV4cCI6MjEwMjIyNDY2Nn0.MU1awKKiUp3x0laQvazM_nMuj96vyXmw2uG7qEZIR7M";
const supabase = createClient(supabaseUrl, supabaseKey);

const API_URL = "https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json";
// Aapki active ScraperAPI Key
const SCRAPER_API_KEY = "a555d17058e1ff05c406d9751e8b7b41"; 

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: "Sirf GET request allowed hai" });
    }

    try {
        console.log("🚀 Fetching Latest 5 Pages (50 Records) using ScraperAPI...");
        
        const timestamp = new Date().getTime();
        let allRecords = [];
        const fetchPromises = [];
        
        // ⚡ Limit set to 5 Pages (50 latest rounds)
        for (let page = 1; page <= 5; page++) {
            // Target URL ko encode karna zaroori hai ScraperAPI ke liye
            const targetUrl = encodeURIComponent(`${API_URL}?pageNo=${page}&ts=${timestamp}`);
            const proxyUrl = `http://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${targetUrl}&keep_headers=true`;
            
            // ScraperAPI ke through request bhej rahe hain
            const request = axios.get(proxyUrl)
                .then(response => response.data.data?.list || [])
                .catch(err => {
                    console.error(`❌ Page ${page} Fetch Error:`, err.message);
                    return []; 
                });
                
            fetchPromises.push(request);
        }

        // 🚀 5 pages ko ek hi sath fetch karna Vercel Timeout bachane ke liye
        const pagesData = await Promise.all(fetchPromises);
        
        // Data ko ek single array mein joddna
        pagesData.forEach(pageRecords => {
            allRecords = allRecords.concat(pageRecords);
        });

        console.log(`📡 API Hit Success! Total ${allRecords.length} records mile. Saving...`);

        if (allRecords.length === 0) {
            return res.status(200).json({ success: false, message: "ScraperAPI se bhi data nahi aaya. API key ki limit check karein." });
        }

        // Supabase ke hisaab se data format karna
        const formattedData = allRecords.map(item => {
            let number = parseInt(item.number);
            return {
                period: item.issueNumber,
                number: number,
                color: item.color,
                premium: parseInt(item.premium),
                result_type: number >= 5 ? 'big' : 'small' 
            };
        });

        // ⚡ Ek hi baar mein Bulk Upsert
        const { error } = await supabase
            .from('daman_history')
            .upsert(formattedData, { onConflict: 'period', ignoreDuplicates: true });

        if (error) {
            throw error;
        }

        console.log(`✅ ${formattedData.length} Rounds Successfully Saved to Supabase!`);
        
        return res.status(200).json({ 
            success: true, 
            message: "Data successfully scraped (via ScraperAPI) and saved!", 
            totalFetched: allRecords.length
        });

    } catch (error) {
        console.error("❌ Main Error:", error.message);
        return res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
}
