// Copyright 2026 Ye Zhou
// SPDX-License-Identifier: Apache-2.0

import { GRADE_NAMES } from './i18n';
import { ui } from './ui-copy';
import type { Locale } from './types';
export type GradeDisplay='numeric'|'letters'|'traditional';
export const GRADE_LETTERS=['F','E','D','C','B','A','S','SS'] as const;
export function gradeLabel(grade:number,locale:Locale,style:GradeDisplay='numeric'){
 if(!Number.isInteger(grade)||grade<0||grade>7)return '—';
 return style==='traditional'?GRADE_NAMES[grade][locale]:style==='letters'?GRADE_LETTERS[grade]:ui(locale,'grade',{n:grade+1});
}
