import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {join} from 'node:path';
const lock=JSON.parse(await readFile('package-lock.json','utf8'));const rows=[];await mkdir('docs/licenses',{recursive:true});
for(const [location,entry] of Object.entries(lock.packages)){if(!location||entry.dev)continue;try{const p=JSON.parse(await readFile(join(location,'package.json'),'utf8'));let copied=null;for(const file of ['LICENSE','LICENSE.txt','LICENSE.md','license','OFL.txt']){try{const dest=`docs/licenses/${p.name.replaceAll('/','-')}-${p.version}-${file}`;await copyFile(join(location,file),dest);copied=dest;break;}catch{}}
rows.push({name:p.name,version:p.version,license:p.license??entry.license??'review required',licenseFile:copied,repository:p.repository?.url??p.repository??null});}catch{}}
await writeFile('docs/DEPENDENCY_LICENSES.json',JSON.stringify(rows,null,2)+'\n');console.log(`${rows.length} runtime package license records written.`);
