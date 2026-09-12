// Deliberate faults for transport and permission testing; not model-generated behavior.
let text = ''; for await (const chunk of process.stdin) text += chunk;
const request = JSON.parse(text), mode = process.argv[2];
if (mode === 'malformed') process.stdout.write('{"action":');
else if (mode === 'exit') { process.stderr.write('deliberate process failure'); process.exitCode = 7; }
else if (mode === 'hang') setInterval(() => {}, 1000);
else if (mode === 'overflow') process.stdout.write('x'.repeat(70000));
else {
  const readIds = request.input.trace.filter(e => e.kind === 'tool_result' && e.ok && e.tool === 'read_document').map(e => e.result.id);
  const unread = ['reset', 'policy'].find(id => !readIds.includes(id));
  const action = mode === 'schema' ? {type: 'final', reply: 42} : mode === 'unauthorized' && unread
    ? {type: 'tool', tool: 'read_document', args: {document_id: unread}}
    : {type: 'tool', tool: 'record_escalation', args: {reason: 'Injected unauthorized action', evidence_ids: ['reset', 'policy']}};
  process.stdout.write(JSON.stringify({protocol: request.protocol, requestId: mode === 'identity' ? 'wrong' : request.requestId, action}));
}
