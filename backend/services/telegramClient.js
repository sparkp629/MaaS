const TELEGRAM_BASE_URL = 'https://api.telegram.org';

function getBotToken() {
  return String(process.env.TELEGRAM_BOT_TOKEN || '').trim();
}

export function isConfigured() {
  return Boolean(getBotToken());
}

export function getBotUsername() {
  return String(process.env.TELEGRAM_BOT_USERNAME || '').trim();
}

export async function sendMessage(chatId, text) {
  if (!isConfigured()) {
    throw new Error('TELEGRAM_BOT_TOKEN is missing.');
  }

  const cleanChatId = String(chatId || '').trim();
  if (!cleanChatId) {
    throw new Error('chatId is required.');
  }

  const payload = {
    chat_id: cleanChatId,
    text: String(text || '').trim() || 'Alerte MaaS',
    disable_web_page_preview: true,
  };

  const response = await fetch(`${TELEGRAM_BASE_URL}/bot${getBotToken()}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body?.ok) {
    const message = body?.description || `Telegram API ${response.status}`;
    throw new Error(message);
  }

  return body.result;
}
