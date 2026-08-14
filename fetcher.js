const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const { createClient } = require('@supabase/supabase-js');

// Supabase Connection
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const API_URL = "https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json";

async function fetchAndSaveData() {
    console.log("🚀 Starting Advanced Stealth Browser...");
    
    // GitHub ke andar ek invisible Chrome Browser start karna
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-dev-shm-usage',
            '--window-size=1280,720' // Insaan jaisi screen size
        ]
    });

    try {
        const page = await browser.newPage();
        
        // Browser ko ekdum asli banne ke liye English language set ki hai
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9'
        });

        const timestamp = new Date().getTime();
        const finalUrl = `${API_URL}?ts=${timestamp}`;
        console.log(`🔗 Visiting URL: ${finalUrl}`);

        // Website par jana aur data aane ka wait karna
        await page.goto(finalUrl, { waitUntil: 'networkidle2', timeout: 60000 });
        
        // 🚀 MAIN JUGAAD: Cloudflare ka timer pass hone ke liye 5 second rukenge
        console.log("⏳ Cloudflare bypass ke liye 5 second ruka ja raha hai...");
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Browser ki screen se data nikalna
        const rawData = await page.evaluate(() => {
            return document.body.innerText; 
        });

        // 🔍 RADAR SCAN: Website ne humein chori-chupe kya text bheja? 
        // Yeh line kaali screen me sachayi print karegi (Top 100 letters)
        console.log("🔍 Website Ne Yeh Jawaab Bheja Hai: ", rawData.substring(0, 100));

        // Ab JSON mein convert karke data nikalenge
        const parsedData = JSON.parse(rawData);
        const records = parsedData.data?.list || [];

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
        console.error("❌ Stealth Bot Error:", error.message);
    } finally {
        await browser.close();
        console.log("🛑 Browser Closed.");
    }
}

fetchAndSaveData();
