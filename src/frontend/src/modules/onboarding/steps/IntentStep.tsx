import React from 'react';

const IntentStep: React.FC<{ plan: 'personal' | 'business' | 'mixed'; setPlan: any; onNext: () => void; onPrev: () => void }> = ({ plan, setPlan, onNext, onPrev }) => (
  <div>
    <h2 className="text-lg font-semibold mb-4">How will you use 137Docs?</h2>
    <div className="space-y-2">
      {(['personal','business','mixed'] as const).map(p=> (
        <label key={p} className="flex items-center gap-2">
          <input type="radio" value={p} checked={plan===p} onChange={()=>setPlan(p)} /> {p.charAt(0).toUpperCase()+p.slice(1)}
        </label>
      ))}
    </div>
    <div className="mt-6 flex justify-between">
      <button className="btn-secondary" onClick={onPrev}>Back</button>
      <button className="btn-primary" onClick={onNext}>Continue</button>
    </div>
  </div>
);
export default IntentStep; 