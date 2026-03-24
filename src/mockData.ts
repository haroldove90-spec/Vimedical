export type Role = 'Enfermero' | 'Administrador' | 'Doctor';

export type ClinicalComment = {
  id: string;
  author: string;
  role: Role;
  text: string;
  createdAt: string;
};

export type QuotationItem = {
  id: string;
  description: string;
  quantity: number;
  unitCost: number;
  total: number;
};

export type Quotation = {
  id: string;
  patientId: string;
  patientName: string;
  createdAt: string;
  items: QuotationItem[];
  totalAmount: number;
  status: 'pending' | 'sent' | 'accepted';
  notes?: string;
};

export type TreatmentProposal = {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  program: string;
  numCurations: number;
  materials: string;
  investment: number;
  createdAt: string;
  status: 'pending' | 'accepted' | 'rejected';
  nurseId?: string;
};

export type Diagnostic = {
  id: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  date: string;
  clinicalSummary: string;
  diagnosis: string;
  treatmentPlan: string;
  recommendations: string;
  doctorName: string;
  doctorLicense: string;
  signature?: string;
  createdAt: string;
};

export type Patient = {
  id: string;
  fullName: string;
  dateOfBirth: string;
  phone: string;
  religion: string;
  educationLevel: string;
  familyHistory: string;
  pathologicalHistory: string;
  nonPathologicalHistory: string;
  gender?: string;
  maritalStatus?: string;
  occupation?: string;
  address?: string;
  clinicalComments?: ClinicalComment[];
  privacyNoticeSigned?: boolean;
  privacyNoticeSignature?: string;
  privacyNoticeDate?: string;
  privacyNoticeType?: 'casa' | 'hospital';
  consentFormSigned?: boolean;
  consentFormSignature?: string;
  consentFormDate?: string;
  consentFormType?: 'casa' | 'hospital';
  registeredBy?: string;
  // New fields from PDF
  bloodGroup?: string;
  age?: number;
  pathologicalHistoryDetails?: {
    respiratorio?: { asma: boolean, bronquitis: boolean, neumonia: boolean, tuberculosis: boolean, tiempo: string, tratamiento: string };
    cardiovascular?: { palpitaciones: boolean, fiebreReumatica: boolean, hipertension: boolean, varices: boolean, tiempo: string, tratamiento: string };
    endocrino?: { diabetes: boolean, hipertiroidismo: boolean, hipotiroidismo: boolean, tiempo: string, tratamiento: string };
    digestivas?: { gastritis: boolean, colitis: boolean, tiempo: string, tratamiento: string };
    alergias?: string;
    fracturas?: string;
  };
  nonPathologicalHistoryDetails?: {
    sports: boolean;
    sportsFrequency: string;
    bathFrequency: string;
    dentalFrequency: string;
  };
  gynecoObstetricHistory?: {
    asintomatico: boolean;
    menarche?: string;
    lastMenstrualPeriod?: string;
    partos: string;
    cesareas: string;
    abortos: string;
    embarazos: string;
    hijos: string;
    hormonalesOrales: string;
    hormonalesParenterales: string;
  };
  currentCondition?: string;
  physicalExploration?: {
    peso: string;
    talla: string;
    imc: string;
    imcPercent: string;
    fc: string;
    fr: string;
    ta: string;
    oxygenation: string;
    adicionales: string;
  };
  regionsSegments?: {
    cuello: string;
    toraxPulmonar: string;
    toraxCardiaco: string;
    abdomen: string;
    miembrosToracicos: string;
    miembrosPelvicos: string;
    columnaVertebral: string;
    genitalesExteriores: string;
  };
};

export type WoundStatus = 'pending_admin' | 'pending_doctor' | 'approved' | 'rejected' | 'completed';

export type Wound = {
  id: string;
  patientId: string;
  location: string;
  description: string;
  createdAt: string;
  status: WoundStatus;
  initialPhotos: string[];
  proposedPlan: string;
  doctorComments?: string;
  visitCount: number;
  targetVisits: number;
  // Exploración Física Inicial (legacy fields, keeping for compatibility)
  weight?: string;
  height?: string;
  temp?: string;
  bloodPressureSystolic?: string;
  bloodPressureDiastolic?: string;
  pulse?: string;
  heartRate?: string;
  respiratoryRate?: string;
  oxygenation?: string;
  glycemiaFasting?: string;
  glycemiaPostprandial?: string;
  // New Assessment fields from PDF
  width?: string;
  length?: string;
  depth?: string;
  tunneling?: string;
  sinusTract?: string;
  undermining?: string;
  painLevel?: number;
  shape?: 'Irregular' | 'Oval' | 'Circular' | 'Lineal';
  tissueType?: {
    escara: string;
    necrosis: string;
    esfacelo: string;
    granulacion: string;
    fibrina: string;
    hiperqueratosis: string;
    hipergranulacion: string;
    subcutaneo: string;
    muscular: string;
    tendon: string;
    hueso: string;
    capsula: string;
    frictena: string;
  };
  etiology?: {
    porPresion: boolean;
    venosa: boolean;
    arterial: boolean;
    mixta: boolean;
    diabetica: boolean;
    quemadura: boolean;
    quirurgica: boolean;
    neoplasica: boolean;
  };
  classification?: {
    estadio: string;
    martorell: boolean;
    calcifilaxis: boolean;
    mixta: boolean;
    sinbad: { s: boolean, i: boolean, n: boolean, b: boolean, a: boolean, d: boolean };
    thickness: 'Total' | 'Parcial';
    thicknessDetail?: 'Grado I' | 'Grado II superficial' | 'Grado II profundo' | 'Grado III';
    origin?: 'Primaria' | 'Secundaria';
  };
  characteristics?: {
    borders: 'Regulares' | 'Irregulares' | 'Oblicuo' | 'Excabado' | 'Evertido' | 'Socavado';
    perilesionalSkin: 'Sana' | 'Eritema' | 'Hiperpigmentacion' | 'Maceracion' | 'Eritema no Blanqueable' | 'Deshidratada' | 'Hiperqueratosis';
    exudateType: 'Seroso' | 'Serohematico' | 'Seropurulento' | 'Ematico' | 'Purulento';
    exudateAmount: 'Nulo' | 'Escaso' | 'Moderado' | 'Abundante';
    contaminationGrade: 'Contaminada' | 'Infectada' | 'Colonizada' | 'Biofilm' | 'Infeccion Local';
  };
  // Índice Tobillo - Brazo
  abiArm?: string;
  abiLeftToe?: string;
  abiLeftPedal?: string;
  abiLeftPostTibial?: string;
  abiRightToe?: string;
  abiRightPedal?: string;
  abiRightPostTibial?: string;
};

export type TreatmentLog = {
  id: string;
  woundId: string;
  evaluationDate: string;
  width?: number;
  length?: number;
  fluidLeakage: boolean;
  foreignMaterial: boolean;
  sloughPresence: boolean;
  peripheralTractsMeasurements: string;
  prognosis: 'Favorable' | 'Reservado' | 'Malo';
  photos: string[]; // Hasta 5 fotos (M4)
  prontosanSolution: boolean;
  prontosanGel: boolean;
  kerlix: boolean;
  telfa: boolean;
  avintraAdministered: boolean;
  notes: string;
  patientSignature?: string; // Firma de asistencia
  nurseId?: string;
  cost?: number;
};

export const MOCK_PATIENTS: Patient[] = [
  {
    id: 'p1',
    fullName: 'María González Pérez',
    dateOfBirth: '1965-04-12',
    phone: '555-0123',
    religion: 'Católica',
    educationLevel: 'Secundaria',
    familyHistory: 'Madre con Diabetes Mellitus Tipo 2',
    pathologicalHistory: 'Hipertensión Arterial, Obesidad',
    nonPathologicalHistory: 'Sedentarismo, tabaquismo negado',
  },
  {
    id: 'p2',
    fullName: 'Juan Carlos López',
    dateOfBirth: '1958-11-23',
    phone: '555-0456',
    religion: 'Ninguna',
    educationLevel: 'Preparatoria',
    familyHistory: 'Padre finado por IAM',
    pathologicalHistory: 'Diabetes Mellitus Tipo 2 (15 años)',
    nonPathologicalHistory: 'Tabaquismo positivo',
  },
  {
    id: 'p3',
    fullName: 'Ana Silvia Martínez',
    dateOfBirth: '1972-08-05',
    phone: '555-0789',
    religion: 'Cristiana',
    educationLevel: 'Licenciatura',
    familyHistory: 'Sin antecedentes de importancia',
    pathologicalHistory: 'Hipotiroidismo',
    nonPathologicalHistory: 'Actividad física regular',
  },
  {
    id: 'p4',
    fullName: 'Roberto Sánchez',
    dateOfBirth: '1945-02-18',
    phone: '555-0999',
    religion: 'Católica',
    educationLevel: 'Primaria',
    familyHistory: 'Padre con hipertensión',
    pathologicalHistory: 'Insuficiencia Venosa Crónica',
    nonPathologicalHistory: 'Sedentarismo',
  }
];

export const MOCK_WOUNDS: Wound[] = [
  {
    id: 'w1',
    patientId: 'p1',
    location: 'Abdomen (Línea media)',
    description: 'Dehiscencia de herida quirúrgica post-laparotomía',
    createdAt: '2023-10-01T10:00:00Z',
    status: 'approved',
    initialPhotos: ['https://picsum.photos/seed/w1_init/400/300'],
    proposedPlan: 'Lavado con Prontosan, aplicación de Kerlix y Telfa diaria. Avintra según evolución.',
    doctorComments: 'De acuerdo con el plan. Vigilar signos de infección.',
    visitCount: 2,
    targetVisits: 4,
  },
  {
    id: 'w2',
    patientId: 'p2',
    location: 'Pie derecho (Talón)',
    description: 'Úlcera de pie diabético grado 2',
    createdAt: '2023-10-08T08:00:00Z',
    status: 'pending_admin',
    initialPhotos: ['https://picsum.photos/seed/w2_init/400/300'],
    proposedPlan: 'Desbridamiento autolítico, apósito hidrocoloide.',
    visitCount: 0,
    targetVisits: 4,
  },
  {
    id: 'w3',
    patientId: 'p3',
    location: 'Pierna izquierda (Tercio inferior)',
    description: 'Úlcera venosa',
    createdAt: '2023-10-09T11:00:00Z',
    status: 'pending_doctor',
    initialPhotos: ['https://picsum.photos/seed/w3_init/400/300'],
    proposedPlan: 'Terapia compresiva, limpieza con solución salina.',
    visitCount: 0,
    targetVisits: 4,
  },
  {
    id: 'w4',
    patientId: 'p4',
    location: 'Sacro',
    description: 'Úlcera por presión estadio III',
    createdAt: '2023-09-15T09:00:00Z',
    status: 'completed',
    initialPhotos: ['https://picsum.photos/seed/w4_init/400/300'],
    proposedPlan: 'Cambios de posición, parches hidrocelulares.',
    doctorComments: 'Excelente evolución, proceder al alta.',
    visitCount: 4,
    targetVisits: 4,
  }
];

export const MOCK_TREATMENTS: TreatmentLog[] = [
  {
    id: 't1',
    woundId: 'w1',
    evaluationDate: '2023-10-05T09:00:00Z',
    fluidLeakage: true,
    foreignMaterial: false,
    sloughPresence: true,
    peripheralTractsMeasurements: '2cm borde superior',
    prognosis: 'Reservado',
    photos: ['https://picsum.photos/seed/w1_t1_1/400/300', 'https://picsum.photos/seed/w1_t1_2/400/300'],
    prontosanSolution: true,
    prontosanGel: true,
    kerlix: true,
    telfa: false,
    avintraAdministered: true,
    notes: 'Abundante exudado. Se realiza lavado exhaustivo.',
  }
];

export type MedicalCertificate = {
  id: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  date: string;
  doctorName: string;
  doctorCredentials: string;
  doctorLicense: string;
  physicalState: string;
  woundDetails: string;
  treatment: string;
  visualStatus: string;
  auditoryStatus: string;
  locomotorStatus: string;
  neurologicalStatus: string;
  conclusions: string;
  signature?: string;
  createdAt: string;
};

export const MOCK_CERTIFICATES: MedicalCertificate[] = [
  {
    id: 'cert1',
    patientId: 'p1',
    patientName: 'María González Pérez',
    patientAge: 61,
    date: '2026-03-16',
    doctorName: 'Victor Ismael Medecigo Escudero',
    doctorCredentials: 'Médico Cirujano, Maestro en heridas por la Universidad Autónoma de México del Estado de Hidalgo y Universidad Panamericana',
    doctorLicense: '3490622-7218923',
    physicalState: 'Encamado(a), palidez generalizada de tegumentos',
    woundDetails: 'con herida por quemadura grado 2, exudativa con material Purulento en miembro sup. Izq.',
    treatment: 'paracetamol 750 mg tabl. c/ 8 horas, amikacina 500 mg amp. 1 c/ 24 horas por 5 días',
    visualStatus: 'campo visual y profundidad de campo adecuadas, esteropsis y percepción cromática',
    auditoryStatus: 'agudeza auditiva limitada',
    locomotorStatus: 'aparato locomotor (integridad, motilidad y reflejos) sin movilidad y ligeros',
    neurologicalStatus: 'examen neurológico (coordinación y reflejos) y exploración del estado mental sin alteraciones',
    conclusions: 'Paciente en proceso de recuperación con manejo antibiótico y analgésico.',
    createdAt: '2026-03-16T10:00:00Z'
  }
];

export const MOCK_PROPOSALS: TreatmentProposal[] = [
  {
    id: 'prop1',
    patientId: 'p1',
    patientName: 'María González Pérez',
    date: '2026-03-16',
    program: 'VIMEDICAL CUIDADOS EN CASA',
    numCurations: 12,
    materials: 'sin materiales',
    investment: 2500,
    createdAt: '2026-03-16T10:00:00Z',
    status: 'pending',
    nurseId: 'n1'
  }
];

export const MOCK_DIAGNOSTICS: Diagnostic[] = [
  {
    id: 'diag1',
    patientId: 'p1',
    patientName: 'María González Pérez',
    patientAge: 61,
    date: '2026-03-16',
    clinicalSummary: 'Paciente con herida crónica en miembro inferior izquierdo, presenta signos de colonización crítica.',
    diagnosis: 'Úlcera venosa complicada con infección local.',
    treatmentPlan: 'Limpieza con Prontosan, aplicación de apósitos de plata y vendaje multicapa.',
    recommendations: 'Reposo relativo, elevación de extremidad y control glucémico estricto.',
    doctorName: 'Victor Ismael Medecigo Escudero',
    doctorLicense: '3490622-7218923',
    createdAt: '2026-03-16T11:00:00Z'
  }
];
