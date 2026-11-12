import { Text, View } from 'react-native';
import { useContext } from 'react';
import { ThemeContext } from '../styles/theme';

const TOPICS = [
  ['1. Acesso e perfil', 'Informe seu e-mail e senha e toque em Entrar, ou use Google. O sistema identifica automaticamente se sua conta é de administrador ou usuário e abre a área correspondente. No perfil, atualize nome, telefone, senha e tema. A sessão pode pedir confirmação biométrica do aparelho.'],
  ['2. Organizações', 'Pesquise organizações aprovadas e solicite acesso. Se você é proprietário, cadastre a organização, aguarde a aprovação e gerencie os integrantes na tela Minha organização.'],
  ['3. Comissões', 'O proprietário cria comissões e gerencia seus integrantes. O coordenador da comissão organiza as reuniões e as votações.'],
  ['4. Reuniões e presença', 'Abra Nova reunião para agendar; escolha data e hora ou Dia todo, pauta, local e detalhes. Erros aparecem junto aos campos. Uma reunião futura sem presença pode ser editada e os convidados devem confirmar de novo. Não são aceitos agendamentos no passado nem convites após o término. Abra um cartão e escolha Presença, Arquivos, Votações ou Ata.'],
  ['4.1 Registrar presença', 'Durante a reunião, aceite o convite e registre entrada/saída com a biometria do aparelho. Como alternativa, informe o código temporário emitido pelo presidente na aba Arquivos. O presidente também pode registrar a presença de convidados aceitos. Os horários e o responsável são registrados no servidor. Biometria é uma confirmação local.'],
  ['4.2 Arquivos e lista em PDF', 'Na aba Arquivos, o gestor pode anexar até dez arquivos PDF, PNG, JPEG ou TXT de até 5 MB cada. Convidados podem baixá-los. Baixar lista de presença em PDF não exige ata e inclui convidados, entradas e saídas. Os links de download expiram; gere outro ao precisar.'],
  ['5. Votações', 'O presidente abre uma votação com uma pergunta e pelo menos duas opções. Quem registrou entrada pode escolher uma opção e alterar o voto enquanto a votação estiver aberta. O presidente encerra a votação; depois disso, os resultados não mudam.'],
  ['6. Atas', 'O presidente escreve e salva o rascunho da ata e depois envia para aprovação. Cada participante com entrada registrada na submissão pode aprovar ou rejeitar a versão. A aprovação da ata é diferente de uma votação da reunião.'],
  ['7. Meu relatório de participação', 'Abra Meu relatório para consultar as reuniões em que sua entrada foi registrada, com organização, comissão, horários de entrada e saída e situação da ata. Use Atualizar relatório para buscar os dados mais recentes.'],
  ['8. Ajuda e conexão', 'As alterações são confirmadas pelo servidor. Se uma operação falhar, confira a conexão, atualize os dados e tente novamente. O guia de inicialização da equipe contém os passos para configurar o ambiente de desenvolvimento.'],
];

export function ManualScreen() {
  const { styles } = useContext(ThemeContext);
  return (
    <>
      <Text style={styles.sectionTitle}>Manual de utilização</Text>
      <Text style={styles.hint}>Consulte as orientações abaixo para usar as principais áreas do Synple.</Text>
      {TOPICS.map(([title, content]) => (
        <View key={title} style={styles.card}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.memberDetail}>{content}</Text>
        </View>
      ))}
    </>
  );
}
