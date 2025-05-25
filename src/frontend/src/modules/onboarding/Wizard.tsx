import React, { useState } from 'react';
import RegisterStep from './steps/RegisterStep';
import LicenseStep from './steps/LicenseStep';
import IntentStep from './steps/IntentStep';
import CompanyStep from './steps/CompanyStep';
import ReviewStep from './steps/ReviewStep';
import { useOnboardingStatus } from './useOnboarding';
import { Navigate } from 'react-router-dom';

const Wizard: React.FC = () => {
  const { loading, accepted, hasUser } = useOnboardingStatus();
  const [step, setStep] = useState(0);
  const [plan, setPlan] = useState<'personal' | 'business' | 'mixed'>('personal');
  const [company, setCompany] = useState<Record<string, any>>({});

  if (!loading && accepted) return <Navigate to="/login" replace />;

  const next = () => setStep((s) => s + 1);
  const prev = () => setStep((s) => s - 1);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-secondary-50 dark:bg-secondary-900">
      <div className="w-full max-w-lg bg-white dark:bg-secondary-800 rounded-lg shadow p-6">
        {step === 0 && hasUser===false && <RegisterStep onNext={next} />}
        {step === 0 && hasUser===true && <LicenseStep onNext={next} />}
        {step === 1 && hasUser===false && <LicenseStep onNext={next} />}
        {step === 2 && hasUser===false && <IntentStep plan={plan} setPlan={setPlan} onNext={next} onPrev={prev} />}
        {step === 3 && plan !== 'personal' && (
          <CompanyStep data={company} setData={setCompany} onNext={next} onPrev={prev} />
        )}
        {step === 3 && plan === 'personal' && <ReviewStep plan={plan} company={null} onPrev={prev} />}
        {step === 4 && plan !== 'personal' && <ReviewStep plan={plan} company={company} onPrev={prev} />}
      </div>
    </div>
  );
};
export default Wizard; 