const fs = require('fs');
const path = require('path');

const queriesPath = path.join(__dirname, '..', 'src', 'lib', 'queries.ts');
let content = fs.readFileSync(queriesPath, 'utf8');

const funcsToModify = [
    'upsertAgency',
    'deleteAgency',
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
    'deleteFunnelePage',
    'updateFunnelProducts',
    'upsertContact',
    'saveActivityLogsNotification',
    'updateUser',
    'changeUserPermission',
    'createTeamUser'
];

let added = 0;

for (const funcName of funcsToModify) {
    // We look for: export const funcName = async (...) => { ... return something; };
    // This is a bit tricky with regex, let's just insert it blindly if not present.
    // Instead of regex on the whole function, let's find the string: export const funcName =
    // and then find the return statement inside it.
}

// Actually, an easier way is to just literally append revalidatePath internally for all actions.
