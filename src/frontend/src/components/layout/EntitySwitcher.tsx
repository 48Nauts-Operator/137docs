import React from 'react';
import { useEntity } from '../../modules/entity/EntityContext';
import { Select } from '../ui/select';

const EntitySwitcher: React.FC = () => {
  const { entities, activeId, setActiveId } = useEntity();

  if (entities.length <= 1) return null;

  return (
    <select
      className="border bg-background dark:bg-secondary-800 text-sm rounded px-2 py-1"
      value={activeId ?? ''}
      onChange={(e) => setActiveId(Number(e.target.value) || null)}
    >
      {entities.map((ent) => (
        <option key={ent.id} value={ent.id}>
          {ent.name}
        </option>
      ))}
      <option value="">All</option>
    </select>
  );
};
export default EntitySwitcher; 