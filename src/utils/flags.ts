// src/data/flag.ts

export const FLAG: Record<string, string> = {
  "Japan": "🇯🇵",
  "France": "🇫🇷",
  "Switzerland": "🇨🇭",
  "Austria": "🇦🇹",
  "USA": "🇺🇸",
  "United States": "🇺🇸",
  "Canada": "🇨🇦",
  "China": "🇨🇳",
  "Italy": "🇮🇹",
  "Andorra": "🇦🇩",
  "England": "🇬🇧",
  "United Kingdom": "🇬🇧",
  "Germany": "🇩🇪",
  "Norway": "🇳🇴",
  "Sweden": "🇸🇪",
  "Finland": "🇫🇮",
  "New Zealand": "🇳🇿",
  "Australia": "🇦🇺",
  "South Korea": "🇰🇷",
  "Russia": "🇷🇺",
  "Chile": "🇨🇱",
  "Spain": "🇪🇸",
};

/**
 * 给国家名加国旗
 * @param country 原始国家名
 * @returns 带国旗的国家名
 */
export const withFlag = (country: string): string =>
  FLAG[country] ? `${FLAG[country]} ${country}` : country;
