import { useContext, useState } from 'react';
import { Text, View, Switch } from 'react-native';
import { Field, DateTimeField, Choice } from './FormControls';
import { Pressable } from './ActionPressable';
import { ThemeContext } from '../styles/theme';
import { buildMeetingPayload } from '../services/meetings';
import { meetingRequest } from '../services/api';

const format = value => { const d = new Date(value); const p = n => String(n).padStart(2, '0'); return `${p(d.getDate())}/${p(d.getMonth()+1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`; };

export function MeetingEditor({ meeting, commissionId, inviteeIds = [], invitees = [], onSaved, onCancel }) {
  const { styles } = useContext(ThemeContext);
  const [form, setForm] = useState(() => meeting ? { ...meeting, startsAt:format(meeting.startsAt), endsAt:format(meeting.allDay ? new Date(new Date(meeting.endsAt).getTime()-1) : meeting.endsAt) } : { title:'', agenda:'', startsAt:'', endsAt:'', allDay:false, location:'', details:'' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState(inviteeIds);
  const change = key => value => setForm(current => ({...current, [key]:value}));
  async function save() {
    const payload = buildMeetingPayload(form, commissionId, selectedIds);
    setErrors(payload.fields || {}); setError('');
    if (payload.error) return;
    setSaving(true);
    try {
      const result = await meetingRequest(meeting ? `/${meeting.id}` : '', meeting ? 'PATCH' : 'POST', payload.meeting);
      if (!result.success) { setErrors(result.fields || {}); setError(result.error); return; }
      await onSaved?.();
    } finally { setSaving(false); }
  }
  return <View style={styles.card}>
    <Text style={styles.cardTitle}>{meeting ? 'Editar reunião' : 'Agendar reunião'}</Text>
    <Field label="Título" value={form.title} onChangeText={change('title')} maxLength={160} error={errors.title} editable={!saving} />
    <Text style={styles.label}>Dia todo</Text><Switch accessibilityLabel="Reunião de dia todo" value={form.allDay} onValueChange={change('allDay')} disabled={saving} />
    <DateTimeField label="Início" value={form.startsAt} onChangeText={change('startsAt')} dateOnly={form.allDay} error={errors.startsAt} editable={!saving} />
    <DateTimeField label="Término" value={form.endsAt} onChangeText={change('endsAt')} dateOnly={form.allDay} error={errors.endsAt} editable={!saving} />
    <Text style={styles.hint}>{form.allDay ? 'Selecione o primeiro e o último dia. A reunião termina à meia-noite do dia seguinte, no fuso do aparelho.' : 'Horários no fuso local do aparelho. Escolha um início futuro.'}</Text>
    <Field label="Pauta" value={form.agenda} onChangeText={change('agenda')} multiline maxLength={10000} error={errors.agenda} editable={!saving} />
    <Field label="Local (opcional)" value={form.location} onChangeText={change('location')} maxLength={300} error={errors.location} editable={!saving} />
    <Field label="Detalhes (opcional)" value={form.details} onChangeText={change('details')} multiline maxLength={4000} error={errors.details} editable={!saving} />
    {!meeting && <><Text style={styles.label}>Convidados da comissão</Text><View style={styles.actionRow}>{invitees.map(person=><Choice key={person.id} label={person.name} active={selectedIds.includes(person.id)} onPress={()=>{if(!saving)setSelectedIds(ids=>ids.includes(person.id)?ids.filter(id=>id!==person.id):[...ids,person.id]);}} />)}</View><Text style={styles.hint}>Toque para incluir ou retirar. O organizador participa automaticamente.</Text></>}
    {meeting && <Text style={styles.hint}>Ao editar, os convidados precisarão confirmar novamente o convite.</Text>}
    {!!error && <Text accessibilityRole="alert" style={styles.hint}>{error}</Text>}
    <Pressable disabled={saving} style={styles.primaryButton} onPress={save}><Text style={styles.primaryButtonText}>{saving ? 'Salvando…' : 'Salvar reunião'}</Text></Pressable>
    <Pressable disabled={saving} style={styles.secondaryButton} onPress={onCancel}><Text style={styles.secondaryButtonText}>Cancelar</Text></Pressable>
  </View>;
}
