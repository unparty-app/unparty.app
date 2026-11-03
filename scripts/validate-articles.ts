import fs from 'fs';
import { editorialArticleSchema } from '../src/lib/articleSchema';

// Validates every JSON file passed as an argv path against the article schema.
// Invoked by .github/workflows/validate-articles.yml with only the files that
// changed under content/articles/** in the PR diff.
const files = process.argv.slice(2);

if (files.length === 0) {
  console.log('No content/articles/**/*.json files changed — nothing to validate.');
  process.exit(0);
}

let hasError = false;

for (const file of files) {
  if (!fs.existsSync(file)) {
    // File was deleted in this PR — nothing to validate.
    continue;
  }

  try {
    const raw = fs.readFileSync(file, 'utf-8');
    const parsed = JSON.parse(raw);
    const result = editorialArticleSchema.safeParse(parsed);

    if (!result.success) {
      hasError = true;
      console.error(`INVALID: ${file}`);
      console.error(result.error.message);
    } else {
      console.log(`OK: ${file}`);
    }
  } catch (error) {
    hasError = true;
    console.error(`INVALID JSON: ${file}`);
    console.error(error instanceof Error ? error.message : String(error));
  }
}

if (hasError) {
  process.exit(1);
}
