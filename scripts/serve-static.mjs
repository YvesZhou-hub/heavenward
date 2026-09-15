// Copyright 2026 Ye Zhou
// SPDX-License-Identifier: Apache-2.0

import { createServer } from 'node:http';
import { readFile,stat } from 'node:fs/promises';
import { resolve,extname } from 'node:path';
const root=resolve('out');const port=Number(process.argv[2]??3211);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8'};
createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');let file=resolve(root,'.'+decodeURIComponent(url.pathname));if(!file.startsWith(root+'/')&&file!==root){res.writeHead(403).end();return;}if((await stat(file)).isDirectory())file=resolve(file,'index.html');const body=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]??'application/octet-stream','Content-Length':body.length,'X-Content-Type-Options':'nosniff'});res.end(body);}catch{res.writeHead(404).end('Not found');}}).listen(port,'127.0.0.1',()=>console.log(`Production static build: http://127.0.0.1:${port}`));
