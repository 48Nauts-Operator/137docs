import { useEffect, useState } from 'react';
import { http } from '../../services/api';

export const useOnboardingStatus = () => {
  const [loading, setLoading] = useState(true);
  const [accepted, setAccepted] = useState<boolean | null>(null);

  const refresh = () => {
    setLoading(true);
    http
      .get<{ tosAccepted: boolean }>('/onboarding/status')
      .then((res) => setAccepted(res.data.tosAccepted))
      .catch(() => setAccepted(false))
      .then(() => setLoading(false));
  };

  useEffect(refresh, []);

  const accept = async () => {
    await http.post('/onboarding/accept-tos');
    refresh();
  };

  const [hasUser, setHasUser] = useState<boolean | null>(null);

  useEffect(() => {
    http
      .get('/users')
      .then((res) => setHasUser((res.data as any[]).length > 0))
      .catch(() => setHasUser(false));
  }, []);

  return { loading, accepted, accept, hasUser };
}; 