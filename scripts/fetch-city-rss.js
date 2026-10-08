/**
 * scripts/fetch-city-rss.js
 * ?ëÏ£º??Í≥µÏãù RSS Í≥µÌÜµ ?µÌï© ?òÏßë ?îÏßÑ
 * 
 * ?åÎ≤ï ??Ï°?3.1??[?úÏ? ¬∑ Î≤îÏö© ¬∑ ÏΩ§Ìå©??¬∑ ?µÌï© ¬∑ Í≥µÏú† ¬∑ Í≥µÌÜµ] Ï§Ä?? * ?∏Î? ?òÏ°¥???ÜÏù¥ Node.js ?úÏ? fetch?Ä ?ïÍ∑ú?ùÏúºÎ°?5Í∞??ºÎìú ?ºÍ¥Ñ ?åÏã± Î∞?Ï§ëÎ≥µ ?ÑÌÑ∞Îß? */

'use strict';

const fs = require('fs');
const path = require('path');
const { generateSourceId, getExistingSourceIds, getExistingSourceLinks, isDuplicatePost, isFallbackOrEmptyUrl } = require('./post-utils');
const { safeFetch, sleep } = require('./pipeline-utils');

const CITY_RSS_FILE = path.join(process.cwd(), 'public/data/city-rss.json');

// ?Ä?Ä ?òÏ†ïÎ∂Ä?úÏ≤≠ Í≥µÏãù RSS 4Ï¢??îÎìú?¨Ïù∏??Î∞?ÏßÅÍ???Ïπ¥ÌÖåÍ≥†Î¶¨ Îß§Ìïë ?§Ï†ï (?®Ïàú?ÖÏ∞∞ ?ºÎìú ?ÅÍµ¨ ?úÏô∏) ?Ä?Ä
const RSS_CONFIGS = [
  {
    name: '?ëÏ£º?úÍ≥µ?ùÎ∏îÎ°úÍ∑∏',
    url: 'https://rss.blog.naver.com/yangju619.xml',
    category: '?úÏ†ï?åÏãù',
  },
];

/**
 * Í∏∞Ìïú ÎßåÎ£å Î∞?Í≥ºÍ±∞ ?∞ÎèÑ ?ïÎ≥¥ ?êÎèô Î∞∞Ï†ú ?ÑÌÑ∞ (2026??Í∏∞Ï?)
 */
function isItemExpired(title, description) {
  const fullText = title + ' ' + (description || '');

  // 1) 2025???¥Ï†Ñ Í≥ºÍ±∞ ?∞ÎèÑ ?®ÎèÖ ?¨Ìï® ??Î∞∞Ï†ú
  const oldYearMatch = fullText.match(/\b(201[0-9]|202[0-5])\b/);
  if (oldYearMatch && !fullText.includes('2026')) {
    return true;
  }

  // 2) KST ?§Îäò ?êÏ†ï Í∏∞Ï? ÎßåÎ£å??Í≤Ä??  const now = new Date();
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const todayThreshold = new Date(Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate(), 0, 0, 0));

  const regex = /(?:20)?(2[0-9])\s*[.\-/??\s*(\d{1,2})\s*[.\-/??\s*(\d{1,2})/g;
  const dates = [];
  let m;
  while ((m = regex.exec(fullText)) !== null) {
    const year = 2000 + parseInt(m[1], 10);
    const month = parseInt(m[2], 10) - 1;
    const day = parseInt(m[3], 10);
    dates.push(new Date(Date.UTC(year, month, day, 23, 59, 59)));
  }

  if (dates.length > 0) {
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    if (maxDate < todayThreshold) {
      return true; // Í∏∞Ìïú ÎßåÎ£å
    }
  }

  return false;
}

/**
 * ?Ä?àÏßà ?®Ïàú Í≥µÍ≥† Î∞??úÎ? ?ùÌôú Î¨¥Í? ?âÏ†ï ?¥Î??°Î¨¥ Î∞∞Ï†ú ?ÑÌÑ∞
 */
function isLowQualityNotice(title, description) {
  const text = (title + ' ' + (description || '')).toLowerCase();
  const lowQualityKeywords = [
    '?ÖÏ∞∞', 'Í≤¨Ï†Å?úÏ∂ú', '?åÏï°?òÏùò', 'Ï≤?Üå?©Ïó≠', 'Í¥ÄÍ∏âÏûê??, '?êÍ∏∞Î¨?, '?®Í?Í≥ÑÏïΩ', 'Ï∑®ÏÜåÍ≥µÍ≥†',
    'Í≥µÏÇ¨(', '?©Ïó≠(', 'Î¨ºÌíà(', '?¨ÎÇúÍ¥ÄÎ¶¨Í∏∞Í∏?, '?•ÎπÑ?ÑÏ∞®', 'Îß§Í∞Å ?ºÎ∞ò?ÖÏ∞∞', 'Í≥µÏú†?¨ÏÇ∞',
    'Ï£ºÏöî?ÖÎ¨¥Í≥ÑÌöç', '?âÏ†ï?úÎπÑ???åÏû•', 'Í≥µÌëú', 'Íµ??àÎ†®', '?Ä?Ä?ÑÏà†?àÎ†®', '?©Í≥µÎ∞©Í≥µ?àÎ†®',
    '?¨Í≤©?àÎ†®', '?±Ïù∏ÏßÄ ÍµêÏú°', 'Î∞úÎ???, '?òÍ≤Ω?ïÎπÑ', '?§Í≥º?∏Ìä∏ ?ÑÎã¨', '?ôÍ≥µ ÎßåÎì§Í∏?, '?êÏô∏?¨ÌåêÎ∂Ä ?†Ïπò', '?ïÎã¥??,
    'Ï∂îÏ≤ú?ÑÏÑú', 'Ï¢ÖÏù¥?ëÍ∏∞', '?àÏ†Ñ?êÍ?????, 'Ï£ºÍ∞Ñ?çÏÇ¨?ïÎ≥¥', '?çÏÇ¨?ïÎ≥¥'
  ];
  return lowQualityKeywords.some(kw => text.includes(kw));
}

/**
 * Ï¥àÍ≤Ω??XML ?ÑÏù¥???åÏÑú (Í∏∞Ìïú ÎßåÎ£å ?êÎèô Î∞∞Ï†ú)
 */
function parseRssXml(xmlText, defaultCategory, feedName) {
  const items = [];
  const itemMatches = [...xmlText.matchAll(/<item>([\s\S]*?)<\/item>/gi)];

  for (const match of itemMatches) {
    const itemBlock = match[1];

    const titleMatch = itemBlock.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/i) || itemBlock.match(/<title>(.*?)<\/title>/i);
    const linkMatch = itemBlock.match(/<link><!\[CDATA\[(.*?)\]\]><\/link>/i) || itemBlock.match(/<link>(.*?)<\/link>/i);
    const descMatch = itemBlock.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i) || itemBlock.match(/<description>([\s\S]*?)<\/description>/i);
    const dateMatch = itemBlock.match(/<pubDate><!\[CDATA\[(.*?)\]\]><\/pubDate>/i) || itemBlock.match(/<pubDate>(.*?)<\/pubDate>/i);

    const title = titleMatch ? titleMatch[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').trim() : '';
    const link = linkMatch ? linkMatch[1].trim() : '';
    let description = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim() : '';
    const pubDate = dateMatch ? dateMatch[1].trim() : '';

    if (!title || title === feedName || title.includes('RSS?úÎπÑ??)) {
      continue;
    }

    // ?Ä?Ä Í∏∞Ìïú ÎßåÎ£å Î∞?Í≥ºÍ±∞ ?ïÎ≥¥ ?êÎèô Î∞∞Ï†ú ?Ä?Ä
    if (isItemExpired(title, description)) {
      continue;
    }

    // ?Ä?Ä ?Ä?àÏßà ?®Ïàú Í≥µÍ≥† Î∞??âÏ†ï ?¥Î??°Î¨¥ Î∞∞Ï†ú ?Ä?Ä
    if (isLowQualityNotice(title, description)) {
      continue;
    }

    // Ïπ¥ÌÖåÍ≥†Î¶¨ ?§Îßà???∏Î∂Ñ??(?§Ïõå??Í∏∞Î∞ò ÍµêÏ∞® Î≥¥Ï†ï)
    let finalCategory = defaultCategory;
    if (title.includes('Î≥ëÏõê') || title.includes('?ΩÍµ≠') || title.includes('?òÎ£å') || title.includes('Í≤ÄÏß?) || title.includes('Î≥¥Í±¥')) {
      finalCategory = 'Î≥ëÏõê¬∑?ΩÍµ≠';
    } else if (title.includes('Ï∂ïÏ†ú') || title.includes('Í≥µÏó∞') || title.includes('?âÏÇ¨') || title.includes('?òÏä§?Ä') || title.includes('Î¨∏Ìôî')) {
      finalCategory = 'Ï∂ïÏ†ú¬∑?òÎì§??;
    } else if (title.includes('ÏßÄ?êÍ∏à') || title.includes('Î≥µÏ?') || title.includes('?òÎãπ') || title.includes('Î∞îÏö∞Ï≤?) || title.includes('Í∞êÎ©¥') || title.includes('?•Ìïô')) {
      finalCategory = 'Î≥µÏ?¬∑ÏßÄ?êÍ∏à';
    } else if (title.includes('?ºÏûêÎ¶?) || title.includes('Ï±ÑÏö©') || title.includes('Ï∑®ÏóÖ') || title.includes('?åÏÉÅÍ≥µÏù∏') || title.includes('Ï∞ΩÏóÖ')) {
      finalCategory = '?ºÏûêÎ¶?∑ÏÜå?ÅÍ≥µ??;
    }

    items.push({
      title,
      link,
      description,
      pubDate,
      category: finalCategory,
      feedName,
      sourceId: generateSourceId(title),
    });
  }

  return items;
}

async function main() {
  console.log('======================================================');
  console.log('?ì° [?ëÏ£º???¨ÌÑ∏] ?úÏ≤≠ Í≥µÏãù RSS 5Ï¢??µÌï© ?òÏßë ?åÏù¥?ÑÎùº??);
  console.log('?§Ìñâ ?úÍ∞Å:', new Date().toISOString());
  console.log('======================================================\n');

  const existingSourceIds = getExistingSourceIds();
  const existingSourceLinks = getExistingSourceLinks();
  console.log(`Í∏∞Î∞ú??Í≤åÏãúÍ∏Ä: ID ${existingSourceIds.size}Í∞? Link ${existingSourceLinks.size}Í∞??ïÏù∏??`);

  // Í∏∞Ï°¥ city-rss.json???àÏúºÎ©?Î°úÎìú
  let existingRssQueue = [];
  if (fs.existsSync(CITY_RSS_FILE)) {
    try {
      existingRssQueue = JSON.parse(fs.readFileSync(CITY_RSS_FILE, 'utf8'));
    } catch {
      existingRssQueue = [];
    }
  }

  const seenSet = new Set([...existingSourceIds, ...existingSourceLinks]);
  existingRssQueue.forEach(item => {
    if (item.sourceId) seenSet.add(item.sourceId);
    if (item.link && !isFallbackOrEmptyUrl(item.link)) seenSet.add(item.link.trim());
  });

  const allCollectedItems = [];
  let newCollectedCount = 0;

  for (const config of RSS_CONFIGS) {
    try {
      console.log(`\n[?òÏßë Ï§? ${config.name} RSS (${config.category}) -> ${config.url}`);
      const res = await safeFetch(config.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*;q=0.8',
        }
      }, 10000);
      if (!res.ok) {
        console.warn(`  ?†Ô∏è HTTP ?§Î•ò: ${res.status}`);
        continue;
      }

      const xmlText = await res.text();
      const parsedItems = parseRssXml(xmlText, config.category, config.name);
      console.log(`  -> ?êÎ≥∏ ${parsedItems.length}Í∞??ÑÏù¥???åÏã± ?ÑÎ£å.`);

      for (const item of parsedItems) {
        if (!isDuplicatePost(item, seenSet)) {
          if (item.sourceId) seenSet.add(item.sourceId);
          if (item.link && !isFallbackOrEmptyUrl(item.link)) seenSet.add(item.link.trim());
          allCollectedItems.push(item);
          newCollectedCount++;
        }
      }
    } catch (err) {
      console.error(`  ??${config.name} ?òÏßë ?§Ìå®:`, err.message);
    }
    await sleep(500);
  }

  // ??Î≥ëÌï© Î∞?ÎßåÎ£å ?∞Ïù¥???ÑÎ©¥ ?ïÌôî (?†Í∑ú ?òÏßë ??™© + Í∏∞Ï°¥ ÎØ∏Î∞ú????™© Ï§??†Ìö®??Í≤ÉÎßå ?†Ï?)
  const mergedQueue = [...allCollectedItems, ...existingRssQueue];
  const finalQueue = [];
  const recordedSet = new Set([...existingSourceIds, ...existingSourceLinks]);

  for (const item of mergedQueue) {
    if (!item || isDuplicatePost(item, recordedSet)) continue;
    if (isItemExpired(item.title, item.description)) continue;
    if (isLowQualityNotice(item.title, item.description)) continue;
    if (item.sourceId) recordedSet.add(item.sourceId);
    if (item.link && !isFallbackOrEmptyUrl(item.link)) recordedSet.add(item.link.trim());
    finalQueue.push(item);
  }

  // ?Ä???îÎ†â?†Î¶¨ Î≥¥Ïû• Î∞??Ä??  const dir = path.dirname(CITY_RSS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(CITY_RSS_FILE, JSON.stringify(finalQueue, null, 2), 'utf8');

  console.log('\n======================================================');
  console.log(`??[?òÏßë ?ÑÎ£å] ?†Í∑ú ?ÑÏù¥?? ${newCollectedCount}Í∞?);
  console.log(`?ì¶ [Î∞úÌñâ ?ÄÍ∏???Ï¥ùÎüâ (ÎßåÎ£å ??™© ?ÑÎ©¥ Î∞∞Ï†ú)]: ${finalQueue.length}Í∞?(?åÏùº: public/data/city-rss.json)`);
  console.log('======================================================');
}

if (require.main === module) {
  main().catch(err => {
    console.error('ÏπòÎ™Ö???êÎü¨:', err);
    process.exit(1);
  });
}

module.exports = {
  RSS_CONFIGS,
  parseRssXml,
};
