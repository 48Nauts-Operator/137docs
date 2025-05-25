import React from 'react';
import { Circle, Database } from 'lucide-react';
import { useHealth } from '../../services/api';

const dot = (status:string)=>{
  const color = status.startsWith('ok')? 'text-green-500' : 'text-red-500';
  return <Circle size={10} className={color} fill="currentColor" />;
};

const HealthStatus: React.FC = () => {
  const health = useHealth();
  if(!health) return null;
  return (
    <div className="hidden md:flex items-center gap-4 text-xs text-secondary-500 dark:text-secondary-400">
      <span className="flex items-center gap-1">{dot(health.backend)}API</span>
      <span className="flex items-center gap-1">{dot(health.db)}DB</span>
      <span className="flex items-center gap-1"><Database size={10}/> {health.llm_model}</span>
    </div>
  );
};
export default HealthStatus; 