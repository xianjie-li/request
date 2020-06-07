export default function hashFnv32a(str: string): string {
  let i;
  let l;
  let hval = 0x811c9dc5;

  for (i = 0, l = str.length; i < l; i++) {
    hval ^= str.charCodeAt(i);
    hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
  }
  return `0000000${(hval >>> 0).toString(16)}`.substr(-8);
}
