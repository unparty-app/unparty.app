import PartyFeed from './PartyFeed';
import { siteReleasesBelt } from '@/lib/project-belt';

// Releases are read on the server (src/lib/releases.ts), so their notes never ship
export default function PartyPage() {
  return <PartyFeed releases={siteReleasesBelt()} />;
}
