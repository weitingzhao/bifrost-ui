import { useEffect, useRef, useState } from 'react'
import type Phaser from 'phaser'
import { meterText, type Path } from '../city/places'
import { objectsIn, pathKey, readQuality, type ObservationSnapshot } from './model'

type Props = { snapshot: ObservationSnapshot; selected: Path; metrics: boolean; alerts: boolean; onSelect: (path: Path) => void }
/** Uses the same Phaser runtime as City and Agents. Geometry is presentation, never topology evidence. */
export function RuntimeScene(props: Props) {
  const host = useRef<HTMLDivElement>(null)
  const latest = useRef(props); latest.current = props
  const redraw = useRef<() => void>(() => {})
  const camera = useRef<{ fit: () => void; zoom: (n: number) => void } | null>(null)
  const [error, setError] = useState('')
  const quality = Object.values(props.snapshot.evidence).map(reads => readQuality(reads, props.snapshot.capturedAt)).join('|')
  useEffect(() => { redraw.current() }, [quality, props.snapshot.content, props.snapshot.evidence, props.selected, props.metrics, props.alerts])
  useEffect(() => {
    let disposed = false, game: Phaser.Game | undefined
    let idle: ReturnType<typeof setTimeout> | undefined
    // A static observation scene only needs frames after input or a new snapshot.
    // Wake before destroy too: Phaser defers destruction until the next frame.
    const wake = () => {
      if (!game || disposed || document.hidden) return
      game.loop.wake()
      if (host.current) host.current.dataset.renderState = 'active'
      clearTimeout(idle)
      idle = setTimeout(() => { game?.loop.sleep(); if(host.current)host.current.dataset.renderState='idle' }, 150)
    }
    const visibility = () => { if (document.hidden) { clearTimeout(idle); game?.loop.sleep(); if(host.current)host.current.dataset.renderState='hidden' } else wake() }
    const mount = host.current
    if (!mount) return
    const inputs = ['pointerdown', 'pointermove', 'pointerup', 'wheel'] as const
    inputs.forEach(event => mount.addEventListener(event, wake, { passive: true }))
    document.addEventListener('visibilitychange', visibility)
    void import('phaser').then(({ default: P }) => {
      if (disposed) return
      class Station extends P.Scene {
        private extent = 1100
        private breadth = 1500
        create() {
          this.input.on('pointermove', (p: Phaser.Input.Pointer) => { if (p.isDown && p.getDistance() > 6) { this.cameras.main.scrollX -= (p.x-p.prevPosition.x)/this.cameras.main.zoom; this.cameras.main.scrollY -= (p.y-p.prevPosition.y)/this.cameras.main.zoom } })
          this.scale.on('resize', () => { this.fit(); wake() })
          camera.current = { fit: () => { this.fit(); wake() }, zoom: n => { this.cameras.main.setZoom(P.Math.Clamp(this.cameras.main.zoom*n,.35,2)); wake() } }
          redraw.current = () => { this.draw(); wake() }
          this.draw(); this.fit(); wake()
        }
        fit() { const z=Math.min(this.scale.width/this.breadth,Math.max(240,this.scale.height)/this.extent); this.cameras.main.setZoom(z); this.cameras.main.centerOn(this.breadth/2,this.extent/2+15) }
        draw() {
          mount!.dataset.draws = String(Number(mount!.dataset.draws??0)+1)
          this.children.removeAll(true)
          const {snapshot, selected, metrics, alerts, onSelect}=latest.current
          const devices=objectsIn(snapshot.content.tree).filter(r=>r.place.kind==='building')
          const columns=devices.length>8?7:4
          this.breadth=columns*335+160
          this.extent=Math.max(810,Math.ceil(devices.length/columns)*285+230)
          const g=this.add.graphics()
          const polygon=(points:number[],color:number,alpha=1)=>{g.fillStyle(color,alpha);g.fillPoints(points.reduce<Phaser.Math.Vector2[]>((a,v,i)=>{if(i%2===0)a.push(new P.Math.Vector2(v,points[i+1]));return a},[]),true)}
          const line=(x:number,y:number,x2:number,y2:number,color:number,alpha=1)=>{g.lineStyle(1,color,alpha);g.lineBetween(x,y,x2,y2)}
          const text=(x:number,y:number,s:string,size=12,color='#9cbdc9')=>this.add.text(x,y,s,{fontFamily:'ui-monospace, SFMono-Regular, monospace',fontSize:size,color})
          // Architectural floor grid, deliberately not a network map.
          for(let y=50;y<this.extent;y+=38)line(50,y,this.breadth-50,y,0x183344,.55)
          for(let x=50;x<this.breadth;x+=50)line(x,50,x,this.extent-15,0x183344,.35)
          polygon([85,135,this.breadth-100,135,this.breadth-50,185,this.breadth-50,this.extent-65,this.breadth-100,this.extent-15,85,this.extent-15,35,this.extent-65,35,185],0x142b3a)
          polygon([85,115,this.breadth-100,115,this.breadth-50,165,this.breadth-50,this.extent-85,this.breadth-100,this.extent-35,85,this.extent-35,35,this.extent-85,35,165],0x203c4b)
          polygon([90,122,this.breadth-105,122,this.breadth-62,166,this.breadth-62,this.extent-88,this.breadth-105,this.extent-46,90,this.extent-46,48,this.extent-88,48,166],0x102633)
          line(90,150,this.breadth-105,150,0x74c6c0,.5)
          text(100,75,'01 / RUNTIME DECK',20,'#d6f3ed')
          text(this.breadth-100,82,`${devices.length.toString().padStart(2,'0')} OBSERVED DEVICES`,12).setOrigin(1,0)
          if(!devices.length)text(750,350,'No device inventory available · inspect source coverage',18).setOrigin(.5)
          devices.forEach(({place,path},i)=>{
            const x=205+(i%columns)*335, y=240+Math.floor(i/columns)*285
            const chosen=pathKey(selected)===pathKey(path)||pathKey(selected).startsWith(pathKey(path)+'/')
            const reported=snapshot.content.alerts?.alerts?.filter(a=>a.at&&pathKey(a.at).startsWith(pathKey(path)))??[]
            const quality=readQuality(snapshot.evidence[pathKey(path)]??[],snapshot.capturedAt)
            const c=alerts&&reported.length?0xffb367:place.state==='online'&&quality==='Within refresh window'?0x6ce2c0:0x7b919d
            const hex='#'+c.toString(16).padStart(6,'0')
            // A raised machine plinth, cabinet sides and resource blades.
            g.fillStyle(0x000711,.45);g.fillEllipse(x+16,y+47,220,72)
            polygon([x-102,y+17,x+43,y-18,x+111,y+17,x-32,y+57],chosen?0x3d817c:0x294857)
            polygon([x-102,y+17,x-32,y+57,x-32,y+70,x-102,y+30],0x172f40)
            polygon([x-32,y+57,x+111,y+17,x+111,y+30,x-32,y+70],0x1d3948)
            for(let b=0;b<3;b++){
              const bx=x-60+b*45, by=y-b*11, h=80+b*10
              polygon([bx,by-h,bx+31,by-h-8,bx+49,by-h+4,bx+17,by-h+13],0x547582)
              polygon([bx,by-h,bx+17,by-h+13,bx+17,by+22,bx,by+9],0x263f50)
              polygon([bx+17,by-h+13,bx+49,by-h+4,bx+49,by+12,bx+17,by+22],0x345564)
              for(let k=0;k<5;k++){line(bx+23,by-h+25+k*12,bx+44,by-h+19+k*12,0x102533);g.fillStyle(c,.8);g.fillCircle(bx+24,by-h+26+k*12,1.4)}
            }
            g.lineStyle(chosen?3:1,c,chosen?1:.5);g.strokeEllipse(x+5,y+27,220,68)
            const hit=this.add.zone(x,y-15,260,170).setInteractive({useHandCursor:true})
            hit.on('pointerup',(p:Phaser.Input.Pointer)=>{if(p.getDistance()<6)onSelect(path)})
            text(x-105,y+82,place.label.length>29?place.label.slice(0,27)+'…':place.label,13,'#deedf1')
            text(x-105,y+102,`${(place.state??'unknown').toUpperCase()} · ${quality}`,10,hex)
            if(alerts&&reported.length)text(x+105,y+102,`${reported.length} ALERT${reported.length===1?'':'S'}`,10,'#ffb367').setOrigin(1,0)
            if(metrics){
              const cpu=place.children.find(p=>p.id==='cpu'),m=cpu?.meter
              const ratio=m&&m.used!==null&&m.of!==null&&m.of>0?Math.min(1,Math.max(0,m.used/m.of)):null
              g.fillStyle(0x294653);g.fillRoundedRect(x-105,y+122,210,4,2)
              if(ratio!==null){g.fillStyle(c);g.fillRoundedRect(x-105,y+122,210*ratio,4,2)}
              text(x-105,y+133,cpu?`CPU  ${meterText(m)??'Not measured'}`:'No CPU measurement',10)
            }
          })
          text(90,this.extent-10,'SPATIAL ARRANGEMENT · NOT PHYSICAL LOCATION OR NETWORK TOPOLOGY',10,'#688c9c')
        }
      }
      game=new P.Game({type:P.CANVAS,parent:mount,backgroundColor:'#091722',banner:false,antialias:true,scene:new Station(),scale:{mode:P.Scale.RESIZE,width:'100%',height:'100%'},fps:{target:20},audio:{noAudio:true}})
      wake()
    }).catch(e=>{if(!disposed)setError(String(e))})
    return()=>{
      disposed=true; clearTimeout(idle)
      inputs.forEach(event => mount.removeEventListener(event, wake))
      document.removeEventListener('visibilitychange', visibility)
      redraw.current=()=>{};camera.current=null
      if(game){game.loop.wake();game.destroy(true)}
    }
  },[])
  return <><div className="rw-canvas" ref={host} role="img" aria-label="Interactive isometric runtime devices. Select a device on the deck or in the accessible device selector."/><div className="rw-camera"><button onClick={()=>camera.current?.zoom(.8)} aria-label="Zoom out">−</button><button onClick={()=>camera.current?.fit()}>Fit deck</button><button onClick={()=>camera.current?.zoom(1.25)} aria-label="Zoom in">+</button></div>{error&&<p role="alert" className="rw-error">Scene unavailable: {error}. Device evidence remains available through the selector.</p>}</>
}
