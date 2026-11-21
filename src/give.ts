import { supabase } from './supabase'

// Dá a ficha para outra conta (pelo e-mail). A ficha sai da sua conta e passa a ser da pessoa. Precisa da função transfer_sheet no banco.
export async function giveSheet(id:string, nome:string): Promise<{ done:boolean; error?:string }> {
  const nm = nome || '(sem nome)'
  const email = (window.prompt(`Dar a ficha "${nm}" para quem?\nDigite o e-mail da conta que vai receber.`) ?? '').trim()
  if (!email) return { done:false }
  if (!window.confirm(`Dar "${nm}" para ${email}?\nA ficha sai da sua conta e passa a ser dessa pessoa: você deixa de ver e de editar.`)) return { done:false }
  const { error } = await supabase.rpc('transfer_sheet', { p_sheet:id, p_email:email })
  return error ? { done:false, error:error.message } : { done:true }
}
