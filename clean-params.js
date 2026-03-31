const fs = require('fs');

const files = [
  'src/app/(main)/subaccount/[subaccountId]/contacts/page.tsx',
  'src/app/(main)/subaccount/[subaccountId]/funnels/[funnelId]/editor/[funnelPageId]/page.tsx',
  'src/app/(main)/subaccount/[subaccountId]/funnels/[funnelId]/page.tsx',
  'src/app/(main)/subaccount/[subaccountId]/funnels/page.tsx',
  'src/app/(main)/subaccount/[subaccountId]/launchpad/page.tsx',
  'src/app/(main)/subaccount/[subaccountId]/layout.tsx',
  'src/app/(main)/subaccount/[subaccountId]/media/page.tsx',
  'src/app/(main)/subaccount/[subaccountId]/pipelines/[pipelineId]/page.tsx',
  'src/app/(main)/subaccount/[subaccountId]/pipelines/page.tsx',
  'src/app/(main)/subaccount/[subaccountId]/settings/page.tsx',
  'src/app/(main)/subaccount/page.tsx',
];

files.forEach(f => {
  if (!fs.existsSync(f)) return;
  let c = fs.readFileSync(f, 'utf8');

  // Replace duplicate `const { params } = props; \n const params = await props.params;`
  c = c.replace(/const \{[\s\w,]*\} = props;\s*const params = (await props\.params\|\|props\.params|await props\.params);\s*const searchParams = props\.searchParams \? (await props\.searchParams\|\|props\.searchParams|await props\.searchParams) : undefined;/g, (match) => {
     return `const params = props.params ? await props.params : undefined;\n    const searchParams = props.searchParams ? await props.searchParams : undefined;`;
  });
  
  // also handle "await props.params;" if it was generated that way
  c = c.replace(/const \{[\s\w,]*\} = props;\s*const params = await props\.params;\s*const searchParams = props\.searchParams \? await props\.searchParams : undefined;/g, (match) => {
     return `const params = props.params ? await props.params : undefined;\n    const searchParams = props.searchParams ? await props.searchParams : undefined;`;
  });

  fs.writeFileSync(f, c);
});
console.log('Cleaned up params redeclaration');
