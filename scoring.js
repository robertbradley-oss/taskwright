export const rubric = [
  { key: 'claim', answer: 'duration', title: 'Catch the unsupported instruction', evidence: 'The draft says 3 seconds resets the timer. §2 says that only checks status; §1 requires 8 seconds. The power-on condition and replacement advice are supported.' },
  { key: 'source', answer: 'reset', title: 'Choose evidence for the correction', evidence: '§1 directly gives the reset procedure: power on, new cartridge installed, hold for 8 seconds. §2 helps expose the error, but does not give the reset procedure.' },
  { key: 'boundary', answer: 'support', title: 'Know when to stop and escalate', evidence: '§3 says to contact support after one unsuccessful 8-second reset. Repeated attempts or another cartridge are not supported by this excerpt.' }
];
export const modelRubric = [
  { key: 'claim', answer: 'wireless', title: 'Match the instruction to the model', evidence: '§1 says the L4 USB has no Wi-Fi radio or wireless button. The draft borrows §2 instructions that apply only to the L4 Air. Its support and eligibility statements are supported.' },
  { key: 'source', answer: 'usb', title: 'Use the source for this exact model', evidence: '§1 establishes the L4 USB connection: the included USB cable and its operating-system-specific driver guide. §2 explains the Air procedure, not what Sam’s USB model supports.' },
  { key: 'boundary', answer: 'discuss', title: 'Offer a supported next step', evidence: '§3 directs wireless requirements to support to discuss compatible models. It does not establish exchange eligibility, availability, stock, or pricing. §1 rules out a USB Wi-Fi adapter workaround.' }
];
export function evaluate(answers, scenario = 'reset') {
  if (!['reset', 'model'].includes(scenario)) throw new Error('Unknown practice scenario');
  const selectedRubric = scenario === 'model' ? modelRubric : rubric;
  const criteria = selectedRubric.map(item => ({ ...item, passed: answers[item.key] === item.answer }));
  return { score: criteria.filter(item => item.passed).length, total: selectedRubric.length, criteria, writingStatus: 'not-assessed' };
}
