export interface FirebaseConfigInput {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export type ClassType = 'normal' | 'doctor' | 'estudiante';

export interface ClienteData {
  id: string;
  nombre: string;
  telefono: string;
  clasificacion: ClassType;
  universidad?: string;
  puntos: number;
  fechaRegistro?: string;
}

export type MovimientoTipo = 'compra' | 'canje' | 'ajuste' | 'reseteo';

export interface MovimientoData {
  id: string;
  clienteId: string;
  tipo: MovimientoTipo;
  puntos: number; // Can be positive or negative
  fecha: string;
  monto?: number;
  ticketNo?: string;
  concepto?: string;
  anteriorPuntos?: number;
  anulado?: boolean;
  fechaAnulado?: string;
  motivoAnulado?: string;
}

export interface UniversidadData {
  id: string;
  nombre: string;
}

export interface ConfiguracionPuntos {
  pesosPorPunto: number; // e.g. 1 punto por cada $10 gastados
  valorPuntoEnPesos: number; // e.g. 1 punto equivale a $0.1 pesos
}

export interface VerificationResult {
  success: boolean;
  message: string;
  errorDetails?: string;
}
