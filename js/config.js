const SUPABASE_URL = "https://bspcvunobciockysitpk.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_wxJlcR4wTDfN_2PaYJqY_g_kIWgNPD0";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function showMessage(message, isError = false) {
  const existingMsg = document.querySelector(".flash-message");
  if (existingMsg) existingMsg.remove();

  const msgDiv = document.createElement("div");
  msgDiv.className = "flash-message";
  msgDiv.textContent = message;
  msgDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 24px;
        background: ${isError ? "#e74c3c" : "#27ae60"};
        color: white;
        border-radius: 8px;
        z-index: 2000;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease;
    `;
  document.body.appendChild(msgDiv);
  setTimeout(() => {
    msgDiv.style.opacity = "0";
    setTimeout(() => msgDiv.remove(), 300);
  }, 3000);
}

if (!document.querySelector("#message-styles")) {
  const style = document.createElement("style");
  style.id = "message-styles";
  style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
  document.head.appendChild(style);
}
