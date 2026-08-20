/**
 * Dynamic Story Variables & Template Engine
 * Centralized variable interpolation and sanitization for StoryVerse.
 * Variables are evaluated at RENDER TIME (never hardcoded into the DB).
 */

export interface StoryVariable {
  key: string;
  label: string;
  description: string;
  defaultValue: string;
  example: string;
}

export const AVAILABLE_VARIABLES: StoryVariable[] = [
  {
    key: '{{playerName}}',
    label: 'Tên Người Chơi',
    description: 'Tự động thay thế bằng tên nhân vật người chơi đã nhập ở màn hình chào mừng.',
    defaultValue: 'Bạn',
    example: 'Chào mừng {{playerName}} đến với dinh thự!',
  },
  {
    key: '{{playerAge}}',
    label: 'Tuổi Nhân Vật',
    description: 'Biến mở rộng dành cho cốt truyện cần thông số tuổi tác.',
    defaultValue: '25',
    example: 'Ở tuổi {{playerAge}}, bạn chưa từng thấy điều gì kỳ lạ như thế.',
  },
  {
    key: '{{playerMoney}}',
    label: 'Tiền / Tài Sản',
    description: 'Biến mở rộng cho các nhánh quyết định mua sắm hoặc đút lót.',
    defaultValue: '1000',
    example: 'Bạn kiểm tra ví và thấy còn {{playerMoney}} vàng.',
  },
];

/**
 * Safely renders dynamic placeholders (e.g. {{playerName}}) inside story text.
 * XSS-Safe: Text strings are returned as clean primitives for React JSX rendering.
 */
export function renderStoryText(
  text: string | null | undefined,
  variables: Record<string, string | number | undefined | null> = {}
): string {
  if (!text) return '';

  let result = text;

  // 1. Replace {{playerName}}
  const rawPlayerName = variables.playerName ? String(variables.playerName).trim() : '';
  const playerName = rawPlayerName || 'Bạn';
  result = result.replace(/\{\{\s*playerName\s*\}\}/gi, playerName);

  // 2. Replace {{playerAge}}
  const rawPlayerAge = variables.playerAge !== undefined && variables.playerAge !== null ? String(variables.playerAge).trim() : '25';
  result = result.replace(/\{\{\s*playerAge\s*\}\}/gi, rawPlayerAge);

  // 3. Replace {{playerMoney}}
  const rawPlayerMoney = variables.playerMoney !== undefined && variables.playerMoney !== null ? String(variables.playerMoney).trim() : '1000';
  result = result.replace(/\{\{\s*playerMoney\s*\}\}/gi, rawPlayerMoney);

  // 4. Generic dynamic key matcher for any other custom variables
  Object.keys(variables).forEach((key) => {
    if (key !== 'playerName' && key !== 'playerAge' && key !== 'playerMoney') {
      const val = variables[key];
      if (val !== undefined && val !== null) {
        const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi');
        result = result.replace(regex, String(val));
      }
    }
  });

  return result;
}
