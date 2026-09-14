'use client';
import { createContext, useContext } from 'react';
import type { GradeDisplay } from '@/game/grades';
export const GradeContext=createContext<GradeDisplay>('numeric');
export const useGradeDisplay=()=>useContext(GradeContext);
