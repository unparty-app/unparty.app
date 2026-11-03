import { NextResponse } from 'next/server';
import { palette } from '@/app/constants/colors';
import { getGitHubAppClient } from '@/lib/github';
import { SITE_GITHUB } from '@/app/constants/organization';

export const revalidate = 3600;

// The site owner's GitHub (FoundersConfig.json). Without a theunpartybrand repo
// there, the palette falls back to the local one
const OWNER = SITE_GITHUB;
const REPO = 'theunpartybrand';

export interface PaletteEntry {
  name: string;
  hex: string;
  sources?: number;
  unppp?: string | null;
}

export interface BrandColorsResponse {
  sections: Record<string, PaletteEntry[]>;
  version: string;
  updated: string;
  source: 'release' | 'fallback';
}

function localFallback(): BrandColorsResponse {
  return {
    sections: {
      CORE: Object.entries(palette).map(([name, hex]) => ({ name, hex })),
    },
    version: 'local',
    updated: new Date().toISOString().split('T')[0],
    source: 'fallback',
  };
}

export async function GET() {
  try {
    const octokit = await getGitHubAppClient();

    const { data: release } = await octokit.request(
      'GET /repos/{owner}/{repo}/releases/latest',
      { owner: OWNER, repo: REPO }
    );

    const assets = release.assets as { id: number; name: string }[];
    const paletteAsset = assets.find(a => a.name === 'palette.json');
    if (!paletteAsset) return NextResponse.json(localFallback());

    const assetResponse = await octokit.request(
      'GET /repos/{owner}/{repo}/releases/assets/{asset_id}',
      {
        owner: OWNER,
        repo: REPO,
        asset_id: paletteAsset.id,
        headers: { accept: 'application/octet-stream' },
      }
    );

    const text = Buffer.from(assetResponse.data as unknown as ArrayBuffer).toString('utf8');
    const data = JSON.parse(text) as Record<string, unknown>;

    // Pass through whatever sections exist — forward-compatible with future additions
    const sections = (data.sections ?? { CORE: data.palette }) as Record<string, PaletteEntry[]>;

    const rel = release as { tag_name: string; published_at?: string };
    return NextResponse.json({
      sections,
      version: rel.tag_name.replace('colors-v', ''),
      updated: rel.published_at?.split('T')[0] ?? '',
      source: 'release',
    } as BrandColorsResponse);
  } catch {
    return NextResponse.json(localFallback());
  }
}
