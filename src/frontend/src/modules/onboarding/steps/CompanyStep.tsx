import React, { useState } from 'react';

interface Props {
  data: Record<string, any>;
  setData: (d: Record<string, any>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const CompanyStep: React.FC<Props> = ({ data, setData, onNext, onPrev }) => {
  const [local, setLocal] = useState<Record<string, any>>(data);
  const update = (k: string, v: any) => setLocal({ ...local, [k]: v });

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Company Details</h2>
      <div className="space-y-3">
        <input className="form-input" placeholder="Company name" value={local.name||''} onChange={e=>update('name',e.target.value)} />
        <input className="form-input" placeholder="VAT number" value={local.vat_id||''} onChange={e=>update('vat_id',e.target.value)} />
        <textarea className="form-input" placeholder="Address" value={local.address||''} onChange={e=>update('address',e.target.value)} />
        <input className="form-input" placeholder="Known aliases (comma-separated)" value={local.aliases||''} onChange={e=>update('aliases',e.target.value)} />
        <input className="form-input" placeholder="IBAN (optional)" value={local.iban||''} onChange={e=>update('iban',e.target.value)} />
      </div>
      <div className="mt-6 flex justify-between">
        <button className="btn-secondary" onClick={onPrev}>Back</button>
        <button className="btn-primary" onClick={()=>{ setData(local); onNext(); }}>Continue</button>
      </div>
    </div>
  );
};
export default CompanyStep; 