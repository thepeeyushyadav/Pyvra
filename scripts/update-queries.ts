import fs from 'fs';
import path from 'path';

const queriesPath = path.resolve('src/lib/queries.ts');
let content = fs.readFileSync(queriesPath, 'utf8');

const mutations = [
  'upsertAgency',
  'deleteAgency', 
  'updateAgencyDetails',
  'saveActivityLogsNotification',
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
  'upsertContact',
  'deleteMedia',
  'createMedia',
  'upsertFunnelPage',
  'deleteFunnelePage'
];

mutations.forEach((mutation) => {
  const regex = new RegExp(`(export const ${mutation} = async[\\s\\S]*?)(return [\\s\\S]*?;\\s*\\n?\\s*})`, 'g');
  content = content.replace(regex, (match, prefix, returnStatement) => {
    // Check if it already has a revalidatePath call at the end
    if (prefix.includes('revalidatePath')) return match;
    
    // Some functions might have early returns. The regex above finds the *last* return statement because of how regex engines match lazily or greedily. Wait, [\s\S]*? is lazy, so it might match the FIRST return statement!
    // Instead of regex, let's just do a simple replacement.
    return match;
  });
});

console.log("Script setup. Actually, let's do a reliable string replace instead.");
