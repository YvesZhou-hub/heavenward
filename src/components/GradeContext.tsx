// Copyright 2026 Ye Zhou
// SPDX-License-Identifier: Apache-2.0

'use client';
import { createContext, useContext } from 'react';
import type { GradeDisplay } from '@/game/grades';
export const GradeContext=createContext<GradeDisplay>('numeric');
export const useGradeDisplay=()=>useContext(GradeContext);
