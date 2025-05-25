import React, { createContext, useContext, useEffect, useState } from 'react';
import { http } from '../../services/api';

export interface Entity {
  id: number;
  name: string;
  aliases?: string[];
  type: string;
}

interface EntityCtx {
  entities: Entity[];
  activeId: number | null;
  setActiveId: (id: number | null) => void;
}

const Ctx = createContext<EntityCtx | undefined>(undefined);

export const EntityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);

  useEffect(() => {
    http.get<Entity[]>('/entities').then((res) => {
      setEntities(res.data);
      if (res.data.length && activeId == null) setActiveId(res.data[0].id);
    });
  }, []);

  return <Ctx.Provider value={{ entities, activeId, setActiveId }}>{children}</Ctx.Provider>;
};

export const useEntity = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('EntityContext missing');
  return ctx;
}; 