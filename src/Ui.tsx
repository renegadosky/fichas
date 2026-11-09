export const uid = () => crypto.randomUUID()

// Foto do personagem: recorta quadrado, reduz para 200x200 e guarda como JPEG (~10 KB) dentro da própria ficha.
export async function fileToAvatar(f:File): Promise<string> {
  const url = URL.createObjectURL(f)
  try {
    const img = new Image()
    await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error('Imagem inválida')); img.src = url })
    const S = 200, c = document.createElement('canvas'); c.width = c.height = S
    const m = Math.min(img.width, img.height)
    c.getContext('2d')!.drawImage(img, (img.width-m)/2, (img.height-m)/2, m, m, 0, 0, S, S)
    return c.toDataURL('image/jpeg', 0.8)
  } finally { URL.revokeObjectURL(url) }
}

export function Avatar({ src, name, size=48 }: { src?:string; name?:string; size?:number }) {
  return <span className="avt" style={{ width:size, height:size, fontSize:size*0.42 }}>
    {src ? <img src={src} alt={name||'foto'}/> : <b>{(name||'?').trim().charAt(0).toUpperCase() || '?'}</b>}</span>
}
