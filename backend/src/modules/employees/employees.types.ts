export interface EmployeePublicView {
  id: string;
  fullName: string;
  socialName: string | null;
  displayName: string; // socialName || fullName - usado no diretorio/telas
  registrationNumber: string;
  photoUrl: string | null;
  admissionDate: Date;
  status: "ATIVO" | "INATIVO" | "AFASTADO";
  employmentType: "CLT" | "PJ" | "ESTAGIO" | "TERCEIRIZADO" | "COOPERADO";
  extension: string | null;
  corporateEmail: string;
  corporatePhone: string | null;
  position: { id: string; name: string };
  sector: { id: string; name: string; department: { id: string; name: string; unit: { id: string; name: string } } };
  manager: { id: string; fullName: string; registrationNumber: string } | null;
}

export interface EmployeeRestrictedView {
  cpf: string;
  birthDate: Date;
  personalPhone: string | null;
  personalEmail: string | null;
}

export interface CreateEmployeeInput {
  fullName: string;
  socialName?: string;
  registrationNumber: string;
  photoUrl?: string;
  admissionDate: string;
  employmentType: "CLT" | "PJ" | "ESTAGIO" | "TERCEIRIZADO" | "COOPERADO";
  positionId: string;
  sectorId: string;
  managerId?: string;
  extension?: string;
  corporateEmail: string;
  corporatePhone?: string;
  userId?: string;
  // dados restritos - separados propositalmente do restante do payload
  restricted: {
    cpf: string;
    birthDate: string;
    personalPhone?: string;
    personalEmail?: string;
  };
}

export interface UpdateEmployeeInput {
  fullName?: string;
  socialName?: string;
  photoUrl?: string;
  extension?: string;
  corporateEmail?: string;
  corporatePhone?: string;
}

export interface UpdateOrganizationInput {
  positionId?: string;
  sectorId?: string;
  managerId?: string | null;
}