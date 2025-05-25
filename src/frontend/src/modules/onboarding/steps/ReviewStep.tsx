import React, { useState } from 'react';
import { http } from '../../../services/api';

interface Props {
  plan: 'personal' | 'business' | 'mixed';
  company: Record<string, any> | null;
  onPrev: () => void;
}

const ReviewStep: React.FC<Props> = ({ plan, company, onPrev }) => {
  const [submitting, setSubmitting] = useState(false);

  const finish = async () => {
    setSubmitting(true);
    try {
      await http.post('/onboarding/accept-tos');
      if (plan !== 'personal' && company?.name) {
        await http.post('/entities', {
          name: company.name,
          type: 'company',
          vat_id: company.vat_id,
          address_json: company.address,
          iban: company.iban,
          aliases: company.aliases?.split(',').map((a: string)=>a.trim()).filter(Boolean),
        });
      }
      window.location.href = '/login';
    } catch (e) {
      console.error(e);
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Review & Finish</h2>
      <p className="mb-4 text-sm">Plan: <strong>{plan}</strong></p>
      {company && (
        <div className="text-sm mb-4">
          <p><strong>Company:</strong> {company.name}</p>
          {company.vat_id && <p>VAT: {company.vat_id}</p>}
        </div>
      )}
      <div className="mt-6 flex justify-between">
        <button className="btn-secondary" onClick={onPrev}>Back</button>
        <button className="btn-primary" disabled={submitting} onClick={finish}>Finish</button>
      </div>
    </div>
  );
};
export default ReviewStep; 