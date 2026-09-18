import {
  Stethoscope, HeartPulse, Scissors, Microscope, Ear,
  Baby, Droplet, Brain, Bone, Activity, LucideIcon,
} from "lucide-react";

export interface Specialty {
  slug: string;
  name: string;
  frequency: string;
  description: string;
  icon: LucideIcon;
}

/**
 * Dados reais de especialidades do hospital, fornecidos diretamente
 * pelo usuario (conteudo proprio da instituicao, nao terceiro). Sem
 * fotos reais disponiveis - usamos icones (lucide-react) em vez de
 * imagens, evitando inserir URLs externas aleatorias.
 */
export const SPECIALTIES: Specialty[] = [
  {
    slug: "aparelho-digestivo-e-cirurgia",
    name: "Aparelho Digestivo e Cirurgia",
    frequency: "Atendimento mensal",
    description:
      "Trata doenças benignas e malignas que afetam o trato gastrointestinal, desde o esôfago até o reto, através de procedimentos cirúrgicos. Dentre as cirurgias realizadas: bariátrica, laparoscopia, hemiorrafia (hérnia abdominal) e colecistectomia (vesícula biliar).",
    icon: Stethoscope,
  },
  {
    slug: "cardiologia",
    name: "Cardiologia",
    frequency: "Atendimento semanal",
    description:
      "Cuida da prevenção, diagnóstico e tratamento das patologias do coração e das doenças relacionadas ao sistema circulatório. O exame clínico é aliado a eletrocardiograma, ecocardiograma, teste ergométrico e Holter de 24 horas, entre outros.",
    icon: HeartPulse,
  },
  {
    slug: "cirurgia-geral",
    name: "Cirurgia Geral",
    frequency: "Atendimento semanal",
    description:
      "Atua no diagnóstico e tratamento por procedimentos cirúrgicos, compreendendo cirurgia abdominal, videolaparoscopia e cirurgia do trauma, em situações de urgência e emergência.",
    icon: Scissors,
  },
  {
    slug: "cirurgiao-oncologico",
    name: "Cirurgião Oncológico",
    frequency: "Atendimento semanal",
    description:
      "Focada no diagnóstico, tratamento e cuidado de pacientes com câncer. Os especialistas identificam o tipo e estágio da doença e desenvolvem planos de tratamento personalizados, visando também a qualidade de vida do paciente.",
    icon: Microscope,
  },
  {
    slug: "fonoaudiologia",
    name: "Fonoaudiologia",
    frequency: "Atendimento conforme demanda",
    description:
      "Realiza testes da orelhinha e da linguinha quando solicitados, além de avaliações fonoaudiológicas. Atua na prevenção, avaliação, diagnóstico e tratamento de distúrbios relacionados à comunicação humana: fala, linguagem, voz, audição e funções orofaciais.",
    icon: Ear,
  },
  {
    slug: "ginecologia-e-obstetricia",
    name: "Ginecologia e Obstetrícia",
    frequency: "Atendimento quinzenal",
    description:
      "A obstetrícia acompanha a gestação, o parto e o puerpério em seus aspectos fisiológicos e patológicos. A ginecologia é responsável pelo estudo, diagnóstico e tratamento das doenças da mulher, abrangendo todos os aspectos da saúde feminina.",
    icon: Baby,
  },
  {
    slug: "nefrologia",
    name: "Nefrologia",
    frequency: "Atendimento mensal",
    description:
      "Estuda os rins e vias urinárias, buscando o diagnóstico e tratamento precoce das doenças, evitando a evolução para cronicidade e falência renal.",
    icon: Droplet,
  },
  {
    slug: "neurologia",
    name: "Neurologia",
    frequency: "Atendimento quinzenal",
    description:
      "Dedica-se ao estudo, diagnóstico e tratamento das doenças que afetam o sistema nervoso central (cérebro e medula espinhal), o sistema nervoso periférico e o sistema nervoso autônomo.",
    icon: Brain,
  },
  {
    slug: "ortopedia",
    name: "Ortopedia",
    frequency: "Atendimento semanal",
    description:
      "Atua no diagnóstico, tratamento e prevenção de disfunções e lesões ligadas a ossos, músculos, articulações e ligamentos. Composta por subespecialidades: mão, pé, coluna, ombro, joelho e quadril.",
    icon: Bone,
  },
  {
    slug: "urologia",
    name: "Urologia",
    frequency: "Atendimento quinzenal",
    description:
      "Trata as doenças do trato urinário de homens e mulheres, bem como o sistema reprodutor masculino. Engloba desde tratamento clínico até procedimentos cirúrgicos, quando indicado.",
    icon: Activity,
  },
];