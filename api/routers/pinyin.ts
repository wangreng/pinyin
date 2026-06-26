import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";

/**
 * Baidu Hanyu API response type
 */
interface BaiduApiResponse {
  ret_array?: Array<{
    name: string[];
    pinyin?: string[];
    definition?: string[];
    mean_list?: Array<{
      pinyin?: string[];
      definition?: string[];
    }>;
    ret_type?: string;
  }>;
  ret_type?: string;
}

/**
 * Fetch pinyin from Baidu Hanyu API via backend proxy.
 * This avoids CORS issues since the backend makes the request server-side.
 */
async function fetchBaiduPinyin(
  text: string
): Promise<BaiduApiResponse | null> {
  try {
    const url = `https://hanyu.baidu.com/hanyu/ajax/search_list?wd=${encodeURIComponent(text)}&from=zici&pn=1`;
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://hanyu.baidu.com/",
      },
    });
    if (!response.ok) return null;
    return (await response.json()) as BaiduApiResponse;
  } catch {
    return null;
  }
}

/**
 * Split Baidu's space-separated pinyin string into per-character mapping.
 */
function splitPinyinToChars(
  hanzi: string,
  pinyinStr: string
): Array<{ hanzi: string; pinyin: string }> | null {
  const chars = [...hanzi];
  const pys = pinyinStr.trim().split(/\s+/);
  if (pys.length !== chars.length) {
    const cleanPys = pys.filter((p) => p.length > 0);
    if (cleanPys.length !== chars.length) return null;
    return chars.map((c, i) => ({ hanzi: c, pinyin: cleanPys[i] }));
  }
  return chars.map((c, i) => ({ hanzi: c, pinyin: pys[i] }));
}

/**
 * Parse Baidu API result into per-character pinyin data.
 */
function parseBaiduResult(
  text: string,
  baiduResult: NonNullable<BaiduApiResponse["ret_array"]>[number]
): Array<{ hanzi: string; pinyin: string }> | null {
  const baiduPinyins = baiduResult.pinyin || [];

  for (const pyStr of baiduPinyins) {
    const parsed = splitPinyinToChars(text, pyStr);
    if (parsed) return parsed;
  }

  if (baiduResult.mean_list) {
    for (const mean of baiduResult.mean_list) {
      if (mean.pinyin) {
        for (const pyStr of mean.pinyin) {
          const parsed = splitPinyinToChars(text, pyStr);
          if (parsed) return parsed;
        }
      }
    }
  }

  return null;
}

/**
 * tRPC router for pinyin queries.
 */
export const pinyinRouter = createRouter({
  lookup: publicQuery
    .input(z.object({ text: z.string().min(1).max(100) }))
    .query(async ({ input }) => {
      const text = input.text.trim();

      const baiduData = await fetchBaiduPinyin(text);

      if (baiduData?.ret_array && baiduData.ret_array.length > 0) {
        const exactMatch = baiduData.ret_array.find(
          (item) => item.name && item.name[0] === text
        );
        const bestMatch = exactMatch || baiduData.ret_array[0];

        const parsed = parseBaiduResult(text, bestMatch);

        if (parsed && parsed.length > 0) {
          return {
            source: "baidu" as const,
            results: parsed,
            rawPinyin: bestMatch.pinyin?.[0] || "",
          };
        }
      }

      return {
        source: "local" as const,
        results: [] as Array<{ hanzi: string; pinyin: string }>,
        rawPinyin: "",
      };
    }),
});
