import { 
  Patient, 
  Wound, 
  TreatmentLog, 
  MedicalCertificate, 
  TreatmentProposal, 
  Diagnostic 
} from './types';

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
    initialPhotos: ['https://images.unsplash.com/photo-1576091160550-217359f42f8c?q=80&w=2070&auto=format&fit=crop'],
    proposedPlan: 'Lavado con Prontosan, aplicación de Kerlix y Telfa diaria. Avintra según evolución.',
    doctor_comments: 'De acuerdo con el plan. Vigilar signos de infección.',
  },
  {
    id: 'w2',
    patientId: 'p2',
    location: 'Pie derecho (Talón)',
    description: 'Úlcera de pie diabético grado 2',
    createdAt: '2023-10-08T08:00:00Z',
    status: 'pending_admin',
    initialPhotos: ['https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?q=80&w=2070&auto=format&fit=crop'],
    proposedPlan: 'Desbridamiento autolítico, apósito hidrocoloide.',
  },
  {
    id: 'w3',
    patientId: 'p3',
    location: 'Pierna izquierda (Tercio inferior)',
    description: 'Úlcera venosa',
    createdAt: '2023-10-09T11:00:00Z',
    status: 'pending_doctor',
    initialPhotos: ['https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=2070&auto=format&fit=crop'],
    proposedPlan: 'Terapia compresiva, limpieza con solución salina.',
  }
];

export const MOCK_TREATMENTS: TreatmentLog[] = [
  {
    id: 't1',
    woundId: 'w1',
    patientId: 'p1',
    date: '2023-10-05T09:00:00Z',
    type: 'Curación',
    description: 'Limpieza y cambio de vendaje',
    photos: ['https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=2080&auto=format&fit=crop'],
    nurseId: 'n1',
    nurseName: 'Enf. Carmen',
    vitalSigns: {
      ta: '120/80',
      fc: '80',
      fr: '18',
      temp: '36.5',
      oxygen: '98'
    }
  }
];

export const MOCK_CERTIFICATES: MedicalCertificate[] = [
  {
    id: 'cert1',
    patientId: 'p1',
    patientName: 'María González Pérez',
    date: '2026-03-16',
    reason: 'Reposo Médico',
    diagnosis: 'Dehiscencia de herida quirúrgica',
    recommendations: 'Curación diaria y reposo absoluto',
    doctorName: 'Victor Ismael Medecigo Escudero',
    doctorLicense: '3490622-7218923',
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
    materials: 'incluídos',
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
    clinicalSummary: 'Paciente con herida crónica en miembro inferior...',
    diagnosis: 'Úlcera venosa complicada',
    treatmentPlan: 'Limpieza con Prontosan...',
    recommendations: 'Reposo relativo...',
    doctorName: 'Victor Ismael Medecigo Escudero',
    doctorLicense: '3490622-7218923',
    createdAt: '2026-03-16T11:00:00Z'
  }
];
