import * as fs from 'fs';
import * as path from 'path';

const queriesPath = path.resolve('src/lib/queries.ts');
let content = fs.readFileSync(queriesPath, 'utf8');

const mutations = [
  'upsertAgency',
  'deleteAgency', 
  'updateAgencyDetails',
  'upsertSubAccount',
  'deleteSubAccount',
  'upsertFunnel',
  'deleteFunnel',
  'upsertPipeline',
  'deletePipeline',
  'upsertLane',
  'deleteLane',
  'upsertTicket',
  'deleteTicket',
  'updateTicketsOrder',
  'upsertContact',
  'deleteMedia',
  'createMedia',
  'upsertFunnelPage',
  'deleteFunnelePage', // typo existing in code maybe
  'updateFunnelProducts'
];

mutations.forEach((mutation) => {
  // Try to find the exact function declaration: `export const upsertFunnel = `
  const signature = `export const ${mutation} =`;
  const startIndex = content.indexOf(signature);
  if (startIndex === -1) return;

  // Find the closing brace of the function block.
  // Actually, I can just find the *next* `return response;` or `return ` after the `const response = await ...`
  // To be safe, look for `return response;` between startIndex and the *next* `export const`
  const nextExportIndex = content.indexOf('export const', startIndex + 1);
  const searchSpaceEnd = nextExportIndex !== -1 ? nextExportIndex : content.length;
  
  const functionBody = content.substring(startIndex, searchSpaceEnd);
  
  // if already contains revalidatePath, skip
  if (functionBody.includes('revalidatePath')) return;

  const replaceTarget = functionBody.replace(/return response;/g, 'revalidatePath("/", "layout");\n    return response;');
  
  content = content.substring(0, startIndex) + replaceTarget + content.substring(searchSpaceEnd);
});

fs.writeFileSync(queriesPath, content, 'utf8');
console.log('Script completed.');
