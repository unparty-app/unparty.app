// Prints the unparty logo banner at the start of `npm run build`.
import { showUnpartyHeader } from './lib/unparty-cli-brand.js';

await showUnpartyHeader({
  title: 'theunpartyapp — production build',
  subtitle: 'WHERE INNOVATION MEETS EXECUTION',
});
