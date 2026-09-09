import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root=path.dirname(fileURLToPath(import.meta.url)),source=path.join(root,'public'),output=path.join(root,'dist');
const manifest=JSON.parse(await fs.readFile(path.join(root,'public-manifest.json'),'utf8'));
const seen=new Set();
async function check(directory){
  for(const entry of await fs.readdir(directory,{withFileTypes:true})){
    const file=path.join(directory,entry.name),relative=path.relative(source,file);
    assert.ok(!entry.isSymbolicLink(),`Symlink rejected: ${relative}`);
    assert.ok(!/\.(pdf|dwg|dxf|zip|docx|xlsx|heic)$/i.test(entry.name),`Document rejected: ${relative}`);
    if(entry.isDirectory()){await check(file);continue;}
    assert.ok(Object.hasOwn(manifest,relative),`Unreviewed file: ${relative}`);
    const bytes=await fs.readFile(file);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),manifest[relative],`Changed file requires privacy review: ${relative}`);
    seen.add(relative);
    if(!relative.startsWith('vendor/')&&/\.(js|json|html|css|txt|gltf)$/.test(file)){
      assert.ok(!/\/Users\/|drive\.google\.com|OneDrive|WhatsApp|reference\/|specifications\.json|\.pdf|\.dwg|blueprint/i.test(bytes.toString()),`Private reference: ${relative}`);
    }
  }
}
await check(source);
assert.equal(seen.size,Object.keys(manifest).length,'Manifest files missing');
await fs.rm(output,{recursive:true,force:true});
await fs.cp(source,output,{recursive:true});
console.log(`Static walkthrough built: ${seen.size} reviewed files. No private documents.`);
