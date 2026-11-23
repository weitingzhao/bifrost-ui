import { Draw, faces, hash, type Sprite } from '../city/kit'
import { HUES, shade, spriteUrl } from '../city/sprites'
// Extend City's native sprite kit. The palette is identity, never health or authority.
export const memberHue=(id:string)=>HUES[hash(id)%HUES.length]
function person(g:Draw,x:number,y:number,hue:string,seed:number) {
  const boots=faces('#53586c','#404456','#303345')
  g.box(x+.06,y+.05,.18,.25,5,boots,2,1.1)
  g.box(x+.32,y+.05,.18,.25,5,boots,2,1.1)
  g.box(x,y,.56,.36,14,faces(shade(hue,.2),hue,shade(hue,-.16)),7,1.4)
  const skin=seed%2?faces('#edc9a2','#dbb58c','#bd956f'):faces('#cba184','#b88b6d','#936b56')
  g.box(x-.04,y-.02,.63,.43,15,skin,23,1.4)
  g.box(x-.06,y-.04,.67,.47,4,faces('#61647c','#484c63','#34384e'),37,1.2)
  g.onLeft(x-.04,y+.41,.13,.19,29,31,'#2f2d3a',.5)
  g.onLeft(x-.04,y+.41,.39,.45,29,31,'#2f2d3a',.5)
  g.box(x-.14,y+.05,.12,.24,10,faces(shade(hue,.2),hue,shade(hue,-.2)),10,1)
  g.box(x+.56,y+.05,.12,.24,10,faces(shade(hue,.2),hue,shade(hue,-.2)),10,1)
}
const cache=new Map<string,string>()
export function memberPortrait(id:string):string {
  if(cache.has(id))return cache.get(id)!
  const g=new Draw(1,1,44);person(g,.2,.2,memberHue(id),hash(id));const url=spriteUrl(g.done());cache.set(id,url);return url
}
export function workstation(id:string):Sprite {
  const g=new Draw(3,3,64),hue=memberHue(id)
  g.shadow(.1,.1,2.8,2.8,.4)
  g.box(.1,.1,2.8,2.8,4,faces('#f4f0e6','#d8d1c2','#c1b9aa'),0,1.5)
  // Two low back edges share the city's cutaway-room language.
  g.box(.1,.1,2.8,.1,16,faces('#f6f4ef','#e9e4da','#d4cec2'),4)
  g.box(.1,.2,.1,2.7,16,faces('#f6f4ef','#e9e4da','#d4cec2'),4)
  g.box(.1,.1,2.8,.1,3,faces(shade(hue,.2),hue,shade(hue,-.15)),20,1)
  g.box(.65,.6,1.6,.7,14,faces('#d9b48a','#c09a70','#a8845c'),4,1.4)
  g.box(1.15,.72,.64,.12,16,faces('#5d6880','#3d475e','#30384b'),18,1.2)
  g.onLeft(1.15,.84,.07,.57,21,31,'#b3dcd7',.6)
  g.box(1.05,1.12,.65,.16,1,faces('#efede7','#d3cdc2','#bbb4a7'),19,1)
  person(g,1.15,1.65,hue,hash(id))
  g.box(2.35,.45,.3,.3,9,faces('#a3b2ad','#7e938b','#657d73'),4,1)
  g.box(2.3,.4,.4,.4,10,faces('#a8d672','#81b156','#669247'),13,1.1)
  return g.done()
}
