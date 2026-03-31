import fs from 'fs';
import path from 'path';

const queriesPath = path.join(process.cwd(), 'src', 'lib', 'queries.ts');
let content = fs.readFileSync(queriesPath, 'utf8');

const regex = /(export const (upsert|create|delete|update)[A-Za-z0-9]+\s*=\s*async[^{]*{(?:[^{}]*|{[^{}]*})*)(return\s+response;)/g;

let matchesCount = 0;

content = content.replace(regex, (match, prefix, type, ret) => {
    // If it already contains revalidatePath, skip
    if (prefix.includes('revalidatePath')) return match;
    matchesCount++;
    return prefix + 'revalidatePath("/", "layout");\n    ' + ret;
});

// Also handle the ones that do not have `return response;` but maybe `return { success: ... }` ?
// Actually, `upsertFunnel` has `return response;`
// `upsertLane` has `return response;`
// We can just add revalidatePath globally in Next.js Server Actions? No, we must call it per action.

fs.writeFileSync(queriesPath, content, 'utf8');
console.log(`Updated ${matchesCount} mutations with revalidatePath`);
