import { useContext, useEffect, useState } from 'react';
import { Linking, Platform, Text, View } from 'react-native';
import { requireOptionalNativeModule } from 'expo';
import { ThemeContext } from '../styles/theme';
import { meetingRequest, authorizePdfDownload, getApiBaseUrl } from '../services/api';
import { Field } from './FormControls';
import { Pressable } from './ActionPressable';

export function MeetingResources({ meeting, isManager, onRefresh }) {
  const { styles } = useContext(ThemeContext);
  const [files, setFiles] = useState([]), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const [code, setCode] = useState(''), [issued, setIssued] = useState(null);
  const root = `/${meeting.id}`;
  async function load() { const r = await meetingRequest(root+'/attachments'); if(r.success) setFiles(r.data); else setError(r.error); }
  useEffect(() => { load(); }, [meeting.id]);
  async function perform(fn) { if(busy) return; setBusy(true); setError(''); try { await fn(); } catch(e) {setError(e.message || 'Operação não concluída.');} finally {setBusy(false);} }
  async function upload() {
    if (Platform.OS !== 'web' && (!requireOptionalNativeModule('ExpoDocumentPicker') || !requireOptionalNativeModule('FileSystem'))) {
      setError('Instale o novo build do Synple para selecionar arquivos.'); return;
    }
    const picker = require('expo-document-picker');
    const selected = await picker.getDocumentAsync({ type:['application/pdf','image/png','image/jpeg','text/plain'], copyToCacheDirectory:true });
    if(selected.canceled) return;
    const asset = selected.assets[0];
    if(asset.size > 5242880) {setError('O arquivo pode ter no máximo 5 MB.'); return;}
    let base64;
    if (Platform.OS === 'web') {
      const bytes = new Uint8Array(await asset.file.arrayBuffer());
      if (bytes.length > 5242880) {setError('O arquivo pode ter no máximo 5 MB.'); return;}
      let binary = ''; for (let i=0; i<bytes.length; i+=8192) binary += String.fromCharCode(...bytes.subarray(i,i+8192));
      base64 = global.btoa(binary);
    } else {
      const { File } = require('expo-file-system');
      const file = new File(asset.uri);
      if (file.size > 5242880) {setError('O arquivo pode ter no máximo 5 MB.'); return;}
      base64 = await file.base64();
    }
    const r = await meetingRequest(root+'/attachments','POST',{name:asset.name,mimeType:asset.mimeType,base64});
    if(!r.success) setError(r.error); else await load();
  }
  async function open(path) { await Linking.openURL(await authorizePdfDownload(getApiBaseUrl()+root+path)); }
  async function useCode(action) {
    const r = await meetingRequest(root+'/attendance','PATCH',{action,code});
    if(!r.success) setError(r.error); else {setCode(''); await onRefresh();}
  }
  return <View>
    <Text style={styles.label}>Arquivos da reunião</Text>
    {files.length === 0 && <Text style={styles.hint}>Nenhum anexo.</Text>}
    {files.map(file => <Pressable key={file.id} disabled={busy} style={styles.secondaryButton} onPress={() => perform(()=>open('/attachments/'+file.id))}><Text style={styles.secondaryButtonText}>{file.name} · {Math.ceil(file.size/1024)} KB</Text></Pressable>)}
    {isManager && <Pressable disabled={busy} style={styles.secondaryButton} onPress={() => perform(upload)}><Text style={styles.secondaryButtonText}>Anexar PDF, imagem ou texto</Text></Pressable>}
    <Text style={styles.hint}>Até 10 arquivos por reunião, 5 MB cada. Downloads disponíveis aos convidados.</Text>
    <Pressable disabled={busy} style={styles.secondaryButton} onPress={() => perform(()=>open('/attendance/pdf'))}><Text style={styles.secondaryButtonText}>Baixar lista de presença em PDF</Text></Pressable>
    <Text style={styles.label}>Presença por código</Text>
    <Text style={styles.hint}>Use o código informado pelo presidente durante a reunião, como alternativa ao registro com biometria.</Text>
    <Field label="Código de 6 dígitos" value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} />
    <View style={styles.actionRow}>{['ENTER','EXIT'].map(action => <Pressable key={action} disabled={busy || code.length !== 6} style={styles.secondaryButton} onPress={() => perform(()=>useCode(action))}><Text style={styles.secondaryButtonText}>{action === 'ENTER' ? 'Entrada com código' : 'Saída com código'}</Text></Pressable>)}</View>
    {isManager && <Pressable disabled={busy} style={styles.secondaryButton} onPress={() => perform(async()=>{const r=await meetingRequest(root+'/attendance-code','POST',{}); if(r.success) setIssued(r.data); else setError(r.error);})}><Text style={styles.secondaryButtonText}>Gerar código válido por até 10 minutos</Text></Pressable>}
    {issued && <Text selectable style={styles.cardTitle}>Código: {issued.code} · até {new Date(issued.expiresAt).toLocaleTimeString('pt-BR')}</Text>}
    {!!error && <Text accessibilityRole="alert" style={styles.hint}>{error}</Text>}
  </View>;
}
