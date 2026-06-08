export type Role = 'Administrador' | 'Enfermero' | 'Doctor' | 'Coordinador' | 'E-commerce';

export type View = 'dashboard' | 'patients' | 'patient-detail' | 'wound-detail' | 'new-assessment' | 'new-treatment' | 'new-patient' | 'settings' | 'clinical-history' | 'clinical-history-detail' | 'quotations' | 'new-quotation' | 'quotation-detail' | 'privacy-notice' | 'consent-form' | 'certificates' | 'new-certificate' | 'certificate-detail' | 'treatment-proposals' | 'new-treatment-proposal' | 'treatment-proposal-detail' | 'register-nurse' | 'diagnostics' | 'new-diagnostic' | 'diagnostic-detail' | 'profile' | 'nurses-management' | 'ecommerce' | 'analytics' | 'inventory' | 'orders' | 'wound-measurement';

export interface UserProfile {
  id: string;
  user_id?: string;
  role: Role;
  fullName: string;
  email: string;
  username?: string;
  password?: string;
  phone?: string;
  license?: string;
  specialty?: string;
  photoUrl?: string;
  signatureUrl?: string;
  bio?: string;
  status?: 'active' | 'suspended';
}

export type ClinicalComment = {
  id: string;
  author: string;
  role: Role;
  text: string;
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
  initialPhotos?: string[];
  initialWoundPhoto?: string;
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
  createdAt?: string;
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
  doctor_comments?: string;
  dimensions?: {
    length: number;
    width: number;
    depth: number;
  };
  length?: number;
  width?: number;
  depth?: number;
  tissueType?: string;
  exudateLevel?: string;
  painLevel?: number;
  characteristics?: string;
  prognosis?: string;
  weight?: string;
  height?: string;
  temp?: string;
  pulse?: string;
  heartRate?: string;
  respiratoryRate?: string;
  oxygenation?: string;
  bloodPressureSystolic?: string;
  bloodPressureDiastolic?: string;
  glycemiaFasting?: string;
  glycemiaPostprandial?: string;
  abiArm?: string;
  abiLeftToe?: string;
  abiRightToe?: string;
  abi_arm?: string;
  abi_left_toe?: string;
  abi_right_toe?: string;
  visitCount?: number;
  targetVisits?: number;
  diagnosis?: string;
  tunneling?: number;
  sinusTract?: number;
  undermining?: number;
};

export type TreatmentLog = {
  id: string;
  woundId: string;
  patientId: string;
  evaluationDate?: string;
  date: string;
  type: string;
  description: string;
  width?: number;
  length?: number;
  fluidLeakage?: string;
  foreignMaterial?: string;
  sloughPresence?: string;
  peripheralTractsMeasurements?: string;
  prognosis?: string;
  photos: string[];
  nurseId: string;
  nurseName: string;
  cost?: number;
  clinicalComments?: ClinicalComment[];
  supplies?: string[];
  vitalSigns?: {
    ta: string;
    fc: string;
    fr: string;
    temp: string;
    oxygen: string;
  };
  observations?: string;
  notes?: string;
  patientSignature?: string;
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

export type MedicalCertificate = {
  id: string;
  patientId: string;
  patientName: string;
  patientAge?: number;
  date: string;
  reason?: string;
  diagnosis?: string;
  recommendations?: string;
  doctorName: string;
  doctorCredentials?: string;
  doctorLicense: string;
  physicalState?: string;
  woundDetails?: string;
  treatment?: string;
  visualStatus?: string;
  auditoryStatus?: string;
  locomotorStatus?: string;
  neurologicalStatus?: string;
  conclusions?: string;
  signature?: string;
  createdAt: string;
};

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  category: string;
}

export interface Order {
  id: string;
  userId: string;
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: string;
  createdAt: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type Attendance = {
  id: string;
  patientId: string;
  patientName: string;
  nurseId: string;
  nurseName: string;
  status: 'check_in' | 'check_out';
  timestamp: string;
  location?: string;
  signature?: string;
  signeeName?: string;
  signeeType?: 'Paciente' | 'Familiar';
};

