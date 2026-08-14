const cloudscraper = require('cloudscraper');
const { createClient } = require('@supabase/supabase-js');

// Supabase Setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Vercel Serverless API Handler
export default async function handler(req, res) {
    // Sirf GET requests allow karenge (cron-job.org se aayengi)
    if (req.method !== 'GET') {
        return res.status(405).json({ error: "Sirf GET request allowed hai" });
    }

    try {
        console.log("🚀 Data Fetching Start ho rahi hai...");

        // ⚠️ YAHAN APNA DAMAN API KA ASLI LINK DALIYE
        const apiUrl = "https://daman-game-api-link-here.com/api/getRecords?limit=50"; 

        // Cloudscraper se request bhej rahe hain (Cloudflare Bypass ke liye)
        const responseString = await cloudscraper.get(apiUrl);
        const data = JSON.parse(responseString); // String ko JSON mein convert kiya

        // Yahan aap apne hisaab se data ko format kar sakte hain
        // Misaal ke taur par:
        const formattedData = data.data.list.map(item => ({
            period_id: String(item.issueNumber),
            number: item.number,
            // ... baaki aapke variables
        }));

        // Supabase mein Data Save karna
        const { data: dbData, error } = await supabase
            .from('daman_records') // Apne table ka naam yahan likhein
            .insert(formattedData);

        if (error) {
            throw error;
        }

        console.log("✅ Data Supabase mein save ho gaya!");
        
        // Cron-job ko 'Success' ka message bhejna
        return res.status(200).json({ 
            success: true, 
            message: "Data successfully scraped and saved!", 
            recordsSaved: formattedData.length 
        });

    } catch (error) {
        console.error("❌ Error aagaya:", error.message);
        
        // Cron-job ko 'Failed' ka message bhejna
        return res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
}
