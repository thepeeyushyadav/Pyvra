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

  // Replace type Props = { params: { ... }; searchParams?: ... } with Promise
  c = c.replace(/params([ \n]*):([ \n]*)\{([^\}]*)\}/g, (match, p1, p2, inner) => {
    if (inner.includes('Promise')) return match; // already fixed
    return `params${p1}:${p2}Promise<{${inner}}>`;
  });
  
  c = c.replace(/searchParams([ \n]*):([ \n]*)\{([^\}]*)\}/g, (match, p1, p2, inner) => {
    if (inner.includes('Promise')) return match; // already fixed
    return `searchParams${p1}:${p2}Promise<{${inner}}>`;
  });

  // Ensure params is awaited in the component
  c = c.replace(/(const|function) (\w+) = async \(\{([\s\S]*?)\}: Props\)([\s\S]*?)\{/g, (match, k, name, propsDestruct, arrow) => {
    return `${k} ${name} = async (props: Props)${arrow}{\n    const { ${propsDestruct} } = props;\n    const params = await props.params;\n    const searchParams = props.searchParams ? await props.searchParams : undefined;`;
  });

  // some functions directly take props
  c = c.replace(/async function (\w+)\(\{([\s\S]*?)\}: Props\)([\s\S]*?)\{/g, (match, name, propsDestruct, arrow) => {
    return `async function ${name}(props: Props)${arrow}{\n    const { ${propsDestruct} } = props;\n    const params = await props.params;\n    const searchParams = props.searchParams ? await props.searchParams : undefined;`;
  });

  fs.writeFileSync(f, c);
});
console.log('Fixed async params');
