const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// Supabase Connection
const supabaseUrl = "https://mjoqhqruzocmbhhjkjtv.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qb3FocXJ1em9jbWJoaGpranR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2NDg2NjYsImV4cCI6MjEwMjIyNDY2Nn0.MU1awKKiUp3x0laQvazM_nMuj96vyXmw2uG7qEZIR7M";
const supabase = createClient(supabaseUrl, supabaseKey);

const API_URL = "https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json";

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: "Sirf GET request allowed hai" });
    }

    try {
        console.log("🚀 Fetching records with Fake Mobile Headers...");
        const timestamp = new Date().getTime();
        let allRecords = [];
        const fetchPromises = [];

        // Fake Browser/Mobile Headers banaye gaye hain Cloudflare ko bypass karne ke liye
        const customHeaders = {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://draw.ar-lottery01.com/',
            'Origin': 'https://draw.ar-lottery01.com'
        };

        for (let page = 1; page <= 5; page++) {
            const targetUrl = `${API_URL}?pageNo=${page}&ts=${timestamp}`;
            const request = axios.get(targetUrl, { headers: customHeaders })
                .then(response => response.data.data?.list || [])
                .catch(err => {
                    console.error(`❌ Page ${page} Fetch Error:`, err.message);
                    return [];
                });
            fetchPromises.push(request);
        }

        const pagesData = await Promise.all(fetchPromises);
        pagesData.forEach(pageRecords => { allRecords = allRecords.concat(pageRecords); });

        if (allRecords.length === 0) {
            return res.status(200).json({ success: false, message: "Fake headers fail ho gaye. Cloudflare bohot strict hai, wapas ScraperAPI proxy lagana padega!" });
        }

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

        const { error } = await supabase
            .from('daman_history')
            .upsert(formattedData, { onConflict: 'period', ignoreDuplicates: true });

        if (error) throw error;

        return res.status(200).json({
            success: true,
            message: "Data successfully scraped (Bypassed with Headers) and saved!",
            totalFetched: allRecords.length
        });

    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
