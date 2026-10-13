import { Station } from '../types';

export interface ParsedM3UStation {
  name: string;
  url: string;
  category: string;
}

export function parseM3UContent(content: string, defaultCategory = '사용자 추가'): ParsedM3UStation[] {
  const lines = content.split(/\r?\n/);
  const results: ParsedM3UStation[] = [];
  let currentCategory = defaultCategory;
  let pendingName = '';

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    if (rawLine === '#EXTM3U') continue;

    // Check for comment-based category marker: e.g. "# ===== 서울 =====" or "===== 서울 ====="
    const catMatch = rawLine.match(/^#?\s*={3,}\s*(.+?)\s*={3,}$/);
    if (catMatch) {
      currentCategory = catMatch[1].trim();
      continue;
    }

    // Check for EXTGRP: Category
    if (rawLine.startsWith('#EXTGRP:')) {
      currentCategory = rawLine.replace('#EXTGRP:', '').trim() || currentCategory;
      continue;
    }

    // Check for EXTINF
    if (rawLine.startsWith('#EXTINF:')) {
      // Look for group-title="XYZ" attribute if present
      const groupMatch = rawLine.match(/group-title="([^"]+)"/);
      if (groupMatch) {
        currentCategory = groupMatch[1].trim();
      }

      const commaIdx = rawLine.indexOf(',');
      if (commaIdx !== -1) {
        pendingName = rawLine.substring(commaIdx + 1).trim();
      } else {
        pendingName = rawLine.replace('#EXTINF:', '').trim();
      }
      continue;
    }

    // Check for URL line
    if (rawLine.startsWith('http://') || rawLine.startsWith('https://')) {
      const stationName = pendingName || `Station ${results.length + 1}`;
      results.push({
        name: stationName,
        url: rawLine,
        category: currentCategory,
      });
      pendingName = '';
    }
  }

  return results;
}

/**
 * Resolves an M3U or PLS playlist URL to the first actual audio stream URL inside.
 */
export async function resolvePlaylistUrl(playlistUrl: string): Promise<string> {
  try {
    const res = await fetch(playlistUrl);
    const text = await res.text();
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (
        (trimmed.startsWith('http://') || trimmed.startsWith('https://')) &&
        !trimmed.startsWith('#')
      ) {
        return trimmed;
      }
      if (trimmed.startsWith('File1=')) {
        const plsUrl = trimmed.substring(6).trim();
        if (plsUrl.startsWith('http://') || plsUrl.startsWith('https://')) {
          return plsUrl;
        }
      }
    }
  } catch (err) {
    console.warn('Failed to resolve playlist URL:', err);
  }
  return playlistUrl;
}

export function generateM3U(stations: Station[], title = 'RADIO HUB Playlist'): string {
  let content = '#EXTM3U\n\n';

  // Group by category to keep neat structure
  const categoryMap = new Map<string, Station[]>();
  stations.forEach((stn) => {
    const cat = stn.category || '기타';
    if (!categoryMap.has(cat)) {
      categoryMap.set(cat, []);
    }
    categoryMap.get(cat)!.push(stn);
  });

  categoryMap.forEach((catStations, category) => {
    content += `# ===== ${category} =====\n`;
    catStations.forEach((stn) => {
      content += `#EXTINF:-1,${stn.name}\n`;
      content += `${stn.url}\n`;
    });
    content += '\n';
  });

  return content;
}

export function downloadTextFile(content: string, filename: string, mimeType = 'text/plain;charset=utf-8') {
  // Prepend UTF-8 BOM so text editors / Korean systems open without encoding issues
  const blob = new Blob(['\uFEFF' + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
