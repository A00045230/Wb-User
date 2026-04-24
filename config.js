// Supabase Configuration
const SUPABASE_URL = 'https://bspcvunobciockysitpk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_wxJlcR4wTDfN_2PaYJqY_g_kIWgNPD0';

// Initialize Supabase client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Show message function
function showMessage(message, isError = false) {
    const existingMsg = document.querySelector('.flash-message');
    if (existingMsg) existingMsg.remove();
    
    const msgDiv = document.createElement('div');
    msgDiv.className = 'flash-message';
    msgDiv.textContent = message;
    msgDiv.style.background = isError ? '#e74c3c' : '#27ae60';
    msgDiv.style.color = 'white';
    document.body.appendChild(msgDiv);
    
    setTimeout(() => {
        msgDiv.style.opacity = '0';
        setTimeout(() => msgDiv.remove(), 300);
    }, 3000);
}