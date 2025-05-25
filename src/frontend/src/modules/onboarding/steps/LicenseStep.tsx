import React, { useState } from 'react';

const licenceText = `
## 137Docs Self-Hosted Licence (excerpt)

• Self-hosted – no SLA
• No support / no warranty
• You pay all LLM costs
• Non-commercial use only

Full text available in the /docs folder of the installation.`;

const LicenseStep: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  const [checked, setChecked] = useState(false);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Licence Agreement</h2>
      <div className="border h-60 overflow-y-auto p-3 mb-4 prose text-sm" dangerouslySetInnerHTML={{ __html: licenceText }} />
      <label className="flex items-center gap-2 mb-4 text-sm">
        <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} /> I accept the terms above
      </label>
      <button className="btn-primary" disabled={!checked} onClick={onNext}>Continue</button>
    </div>
  );
};
export default LicenseStep; 