import { useEffect, useRef, useState } from 'react'
import type Phaser from 'phaser'
import type { CommunicationSnapshot, Exchange } from './model'

type Props = { immersive?: boolean; focusedMember?: string; snapshot: CommunicationSnapshot; image: string; selected?: Exchange; onSelect: (id: string) => void; onMember: (id: string) => void }
type Controls = { fit: () => void; zoom: (factor: number) => void }
/** A scene is a view of evidence. No simulation, transport, or state inference lives here. */
export function OfficeWorld(props: Props) {
  const host = useRef<HTMLDivElement>(null)
  const latest = useRef(props); latest.current = props
  const refresh = useRef<() => void>(() => {})
  const controls = useRef<Controls | null>(null)
  const [error, setError] = useState('')
  useEffect(() => { refresh.current() }, [props.snapshot, props.selected, props.focusedMember])
  useEffect(() => {
    let disposed = false, game: Phaser.Game | undefined
    const mount = host.current
    if (!mount) return
    void import('phaser').then(({ default: P }) => {
      if (disposed) return
      class Office extends P.Scene {
        private ready = false
        private width = 1000
        private height = 620
        private topology = ''
        private focused = ''
        private seen = new Set<string>()
        private initialized = false
        private reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        preload() { this.load.image('desk', latest.current.image) }
        create() {
          this.ready = true
          this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
            if (p.isDown && p.getDistance() > 5) {
              this.cameras.main.scrollX -= (p.x - p.prevPosition.x) / this.cameras.main.zoom
              this.cameras.main.scrollY -= (p.y - p.prevPosition.y) / this.cameras.main.zoom
            }
          })
          this.scale.on('resize', () => this.fit())
          controls.current = { fit: () => this.fit(), zoom: factor => this.cameras.main.setZoom(P.Math.Clamp(this.cameras.main.zoom * factor, .25, 2)) }
          refresh.current = () => this.draw()
          this.draw()
        }
        fit() {
          if (!this.ready) return
          const immersive=latest.current.immersive
          const top=immersive?(this.scale.height<600?100:155):0, bottom=immersive?115:0
          const zoom=Math.min(this.scale.width / this.width, Math.max(120,this.scale.height-top-bottom) / this.height) * .94
          this.cameras.main.setZoom(zoom)
          this.cameras.main.centerOn(this.width / 2, this.height / 2 - (top-bottom)/(2*zoom))
        }
        draw() {
          if (!this.ready) return
          this.tweens.killAll()
          this.children.removeAll(true)
          const { snapshot, selected, onSelect, onMember } = latest.current
          const groups = new Map<string, typeof snapshot.members>()
          for (const m of snapshot.members) {
            // One physical actor; all its memberships stay on the evidence side.
            const primary = m.memberships[0]
            const key = primary ? primary.organization + ' / ' + (primary.domain ?? 'Outside domains') : 'Unresolved membership'
            groups.set(key, [...(groups.get(key) ?? []), m])
          }
          const rooms = [...groups].sort(([a], [b]) => a.localeCompare(b))
          const columns = Math.min(3, Math.max(1, rooms.length))
          const roomW = 340, gap = 58, margin = 38
          const rowHeights: number[] = []
          rooms.forEach(([, members], i) => { const row = Math.floor(i / columns); rowHeights[row] = Math.max(rowHeights[row] ?? 0, 120 + Math.ceil(members.length / 2) * 170) })
          this.width = margin * 2 + columns * roomW + (columns - 1) * gap
          this.height = margin * 2 + rowHeights.reduce((a,b) => a+b, 0) + Math.max(0, rowHeights.length - 1) * gap
          const g = this.add.graphics()
          g.fillStyle(0x141e27).fillRoundedRect(0, 0, this.width, this.height, 20)
          g.lineStyle(1, 0x24313c, .65)
          for (let x = 16; x < this.width; x += 28) g.lineBetween(x, 0, x, this.height)
          for (let y = 16; y < this.height; y += 28) g.lineBetween(0, y, this.width, y)
          const points = new Map<string, { x: number; y: number }>()
          const text = (x: number, y: number, s: string, size = 13, color = '#b2c0c9') => this.add.text(x, y, s, { fontFamily: 'Arial, sans-serif', fontSize: size, color, resolution: 2 })
          rooms.forEach(([name, members], i) => {
            const row = Math.floor(i / columns), x = margin + (i % columns) * (roomW + gap)
            const y = margin + rowHeights.slice(0, row).reduce((a,b) => a+b+gap, 0), h = rowHeights[row]
            g.fillStyle(0x080e14, .6).fillRoundedRect(x+8, y+12, roomW, h, 10)
            g.fillStyle(0x283840).fillRoundedRect(x, y, roomW, h, 10)
            g.lineStyle(1, 0x3b4d55).strokeRoundedRect(x, y, roomW, h, 10)
            g.fillStyle(0x4b6067).fillRect(x+12, y+8, roomW-24, 5)
            g.lineStyle(1, 0x32454d, .8)
            for (let yy=y+54; yy<y+h-10; yy+=24) g.lineBetween(x+10, yy, x+roomW-10, yy)
            text(x+18, y+24, name.toUpperCase(), 12, '#d6ddd9')
            // Inert decor establishes space; it carries no health meaning.
            for (const px of [x+17, x+roomW-20]) {
              g.fillStyle(0x695749).fillRoundedRect(px, y+h-29, 14, 17, 3)
              g.fillStyle(0x688675).fillCircle(px+7, y+h-30, 10)
            }
            members.forEach((m, j) => {
              const px=x+88+(j%2)*164, py=y+108+Math.floor(j/2)*170
              points.set(m.id, {x:px, y:py})
              const related = selected?.from === m.id || selected?.to === m.id
              if (related) g.lineStyle(2, 0xb7d4cb, .8).strokeEllipse(px,py+20,132,80)
              const sprite = this.add.image(px, py, 'desk').setDisplaySize(132,108).setInteractive({useHandCursor:true})
              sprite.on('pointerup', (p: Phaser.Input.Pointer) => { if (p.getDistance() < 5) onMember(m.id) })
              const short = m.label.length > 22 ? m.label.slice(0,21)+'…' : m.label
              text(px,py+65,short,14,'#edf0e9').setOrigin(.5,0)
              text(px,py+86,m.activity ? m.activity.label : 'Activity unknown',11,'#a1b1b9').setOrigin(.5,0)
              const role = m.memberships.map(s => s.role).includes('temporary') ? 'TEMP' : m.memberships[0]?.role.toUpperCase() ?? '?'
              text(px-56,py-49,role,9,'#b8c8cb')
              if (m.memberships.length>1) text(px+55,py-49,'+'+(m.memberships.length-1)+' seats',9).setOrigin(1,0)
            })
          })
          // Only the focused relationship is drawn, avoiding an unreadable web of glowing lines.
          if (selected) {
            const a = points.get(selected.from ?? ''), b = points.get(selected.to ?? '')
            if (a && b) {
              const line = this.add.graphics().setDepth(10)
              const blocked = selected.issue != null
              const color = blocked ? 0xebad77 : 0xa3c5c0
              const curve = new P.Curves.QuadraticBezier(new P.Math.Vector2(a.x,a.y-46),new P.Math.Vector2((a.x+b.x)/2,Math.min(a.y,b.y)-100),new P.Math.Vector2(b.x,b.y-46))
              line.lineStyle(blocked ? 3 : 2,color,.85)
              const ps=curve.getPoints(40)
              // Dashed relation means a request, never an invented in-flight delivery.
              for(let n=1;n<ps.length;n++) if(selected.stages.delivered || n%3!==0) line.lineBetween(ps[n-1].x,ps[n-1].y,ps[n].x,ps[n].y)
              const mid=curve.getPoint(.5)
              const tag=text(mid.x,mid.y-20,blocked ? '!  '+selected.issue!.label : selected.label,12,blocked ? '#ffd3ad' : '#e5eee9').setOrigin(.5).setDepth(13)
              tag.setBackgroundColor(blocked ? '#563c2c' : '#233a40').setPadding(10,6).setInteractive({useHandCursor:true})
              tag.on('pointerup',()=>onSelect(selected.channel+':'+selected.id))
              // Each newly supplied evidence record gets one finite motion, never a historical loop.
              for (const [stage, evidence] of Object.entries(selected.stages)) for (const e of evidence ?? []) {
                const key=selected.channel+':'+selected.id+':'+stage+':'+e.id
                if (!this.initialized || this.seen.has(key) || this.reduced) continue
                if (stage==='delivered') {
                  const parcel=this.add.rectangle(a.x,a.y-46,12,8,0xd7dfc9).setStrokeStyle(1,0x243e45).setDepth(12)
                  const progress={t:0}
                  this.tweens.add({targets:progress,t:1,duration:1800,ease:'Sine.easeInOut',onUpdate:()=>{const p=curve.getPoint(progress.t); parcel.setPosition(p.x,p.y)},onComplete:()=>parcel.destroy()})
                } else {
                  const p=stage==='sent'?a:b
                  const marker=this.add.circle(p.x,p.y-46,10,color,.25).setStrokeStyle(2,color).setDepth(12)
                  this.tweens.add({targets:marker,scale:1.8,alpha:0,duration:1400,onComplete:()=>marker.destroy()})
                }
              }
              text(b.x,b.y+108,selected.stages.acknowledged?'ACK recorded':selected.stages.delivered?'Delivered':'Delivery unknown',11).setOrigin(.5).setDepth(12)
            }
          }
          this.seen = new Set(snapshot.exchanges.flatMap(x=>Object.entries(x.stages).flatMap(([stage,es])=>(es??[]).map(e=>x.channel+':'+x.id+':'+stage+':'+e.id))))
          this.initialized=true
          const topology=rooms.map(([key,ms])=>key+':'+ms.map(m=>m.id).join(',')).join('|')
          if(topology!==this.topology){this.topology=topology;this.fit()}
          const focus=latest.current.focusedMember??''
          if(focus!==this.focused){this.focused=focus;const p=points.get(focus);if(p){this.cameras.main.setZoom(Math.min(1.4,this.scale.height/360));this.cameras.main.centerOn(p.x+(this.scale.width>650?140:0),p.y)}else this.fit()}
          if(!rooms.length) text(this.width/2,this.height/2,'No members observed',18).setOrigin(.5)
        }
      }
      game=new P.Game({type:P.AUTO,parent:mount,backgroundColor:'#101922',banner:false,antialias:true,scene:new Office(),scale:{mode:P.Scale.RESIZE,width:'100%',height:'100%'},fps:{target:30},audio:{noAudio:true}})
    }).catch(e=>{if(!disposed)setError(e instanceof Error?e.message:'Scene unavailable')})
    return ()=>{disposed=true;refresh.current=()=>{};controls.current=null;game?.destroy(true)}
  }, [props.image])
  return <div className="comm-world"><div className="comm-world-head"><div><strong>COLLABORATION FLOOR</strong><span>Drag to explore · select a member or exchange</span></div><div><button aria-label="Zoom out" onClick={()=>controls.current?.zoom(.8)}>−</button><button onClick={()=>controls.current?.fit()}>Fit</button><button aria-label="Zoom in" onClick={()=>controls.current?.zoom(1.25)}>+</button></div></div><div ref={host} className="comm-world-canvas" role="img" aria-label="Spatial view of members and the selected communication. Equivalent records are available through the observation controls." />{error&&<p role="alert">Scene unavailable: {error}. Use Ledger for the same evidence.</p>}<div className="comm-world-legend"><span>― Recorded delivery</span><span>┄ Request · delivery unknown</span><span>! Source-reported issue</span><span>No ambient activity is fabricated</span></div></div>
}
