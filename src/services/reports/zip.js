// Minimal ZIP writer (stored entries, no compression) for browser-generated Office files.
function crc32(bytes) {
  let c = 0xffffffff;
  for (let i=0;i<bytes.length;i++) {
    c ^= bytes[i];
    for (let k=0;k<8;k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (c ^ 0xffffffff) >>> 0;
}
const u16 = n => new Uint8Array([n & 255, (n>>>8)&255]);
const u32 = n => new Uint8Array([n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255]);
const cat = (...arrs) => { const out = new Uint8Array(arrs.reduce((n,a)=>n+a.length,0)); let o=0; arrs.forEach(a=>{out.set(a,o);o+=a.length}); return out; };
export function xml(s) { return new TextEncoder().encode(s); }
export function makeZip(entries) {
  const locals=[]; const centrals=[]; let offset=0;
  for (const e of entries) {
    const name = new TextEncoder().encode(e.name); const data = typeof e.data === 'string' ? xml(e.data) : e.data; const crc = crc32(data);
    const local = cat(new Uint8Array([0x50,0x4b,0x03,0x04]), u16(20), u16(0x800), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), name, data);
    locals.push(local);
    const central = cat(new Uint8Array([0x50,0x4b,0x01,0x02]), u16(20), u16(20), u16(0x800), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), name);
    centrals.push(central); offset += local.length;
  }
  const centralData = cat(...centrals); const localData = cat(...locals); const end = cat(new Uint8Array([0x50,0x4b,0x05,0x06]), u16(0),u16(0),u16(entries.length),u16(entries.length),u32(centralData.length),u32(localData.length),u16(0));
  return cat(localData, centralData, end);
}
