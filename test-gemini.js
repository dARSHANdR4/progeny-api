const fetch = require('node-fetch');

const KEY = 'AIzaSyDdlMu88OEUlb5vBYO56XGJyJ5e6I7yGWY';
const MODELS = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];

async function testModel(model) {
    console.log(`Testing model: ${model}...`);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${KEY}`;

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: 'Hi' }] }]
            })
        });
        const data = await res.json();
        console.log(`Status ${model}: ${res.status}`);
        if (res.ok) {
            console.log(`SUCCESS with ${model}!`);
        } else {
            console.log(`ERROR with ${model}:`, JSON.stringify(data).substring(0, 500));
        }
    } catch (e) {
        console.log(`FETCH ERROR with ${model}:`, e.message);
    }
}

async function run() {
    for (const m of MODELS) {
        await testModel(m);
    }
}

run();
