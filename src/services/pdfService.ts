import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Patient, Wound, TreatmentLog, Quotation, Diagnostic, MedicalCertificate } from '../types';

// Logo Base64 (ViMedical - Blue/Gold style)
const VIMEDICAL_LOGO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAYAAACOEfKtAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAJnSURBVHgB7VvRbtNAEPyO76p9IDwhiU/gC6jE73CJCjEhPkh8gk/hK+QTfIrE7/CHiEhPCCHxD0iLpH6H2N7i9bpe71zO9pxP7XN00Yy0shzLzuzO7U67C0iRIkWKFClSpEiRIkWKFClSpEiRIkWKFClSpEiRIkWKFClSpEiRIkWKFClSpEiRIkWKFClSpEiRIkWK/ydw/X0Zf9p/gH/2f+C/fW/uP54z99fP6p57088/6Z4H8u+n0O0Puf/xWp3hUPe+v6p7Hsi/H8m/f0z996f6eSD/fUj996X6OZD//pD670f1/ZD676P6dlD977v6dlB9u6/+76f6dkB966N6b9C+D6hvfVQ3v6X+B6g+3Fd/O+77i7ovD7mvX7rOfz+r78fU307UP07U304q6U1FfbtRf/9X/ZpUN78n1c3vSfX6K1K9/pqm3pSnd7/S1JsKOI46/Z6m/v6Y+m9f6r8f6tux+vte/f1A9f2Y+vtF9fc99fcn9ffv9O059fenaetN+/pWvOmtedM39W3f9E1/6pu+6U990zf96Zt+1Tf96Zt+1Td98f796Zt+1Td98f/96Zt+1Td98X850zf96Zt+1Tf96Zt+1Tf96Zt+1Td98f/96Zt+1Tf96Zt+1Tfg8v/70zf96Zt+1Tf96Zt+1Tf96Zt+1Tfg8v/70zf96Zt+1Tf9iZf/35++6U/f9Ke+6U/f9Ke+6U/f9Ke+6U/f9Ke++f9+1Te6m77oZ9f7KVKkSJEiRYoUKVKkSJEiXv8A2C+hYl+0C2oAAAAASUVORK5CYII=";

const addHeader = (doc: jsPDF, title: string) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header background
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  // Logo
  try {
    doc.addImage(VIMEDICAL_LOGO, 'PNG', 15, 10, 20, 20);
  } catch (e) {
    console.error('Error adding logo to PDF', e);
  }
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('ViMedical', 40, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(title.toUpperCase(), pageWidth - 20, 25, { align: 'right' });
  
  // Accent line
  doc.setDrawColor(203, 184, 130); // gold
  doc.setLineWidth(1.5);
  doc.line(0, 40, pageWidth, 40);
};

export const generateDiagnosticPDF = (diagnostic: Diagnostic) => {
  const doc = new jsPDF();
  addHeader(doc, 'DIAGNÓSTICO CLÍNICO');
  
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Patient Info
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Información del Paciente', 20, 55);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Paciente: ${diagnostic.patientName}`, 20, 65);
  doc.text(`Edad: ${diagnostic.patientAge} años`, 20, 72);
  doc.text(`Fecha: ${new Date(diagnostic.date).toLocaleDateString()}`, 20, 79);
  
  // ... rest of the function (headers already added)
  // I will replace the headers in the next function

  // Clinical Summary
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen Clínico:', 20, 95);
  doc.setFont('helvetica', 'normal');
  const summaryLines = doc.splitTextToSize(diagnostic.clinicalSummary, pageWidth - 40);
  doc.text(summaryLines, 20, 102);
  
  let currentY = 102 + (summaryLines.length * 5) + 10;

  // Diagnosis
  doc.setFont('helvetica', 'bold');
  doc.text('Diagnóstico:', 20, currentY);
  doc.setFont('helvetica', 'normal');
  const diagnosisLines = doc.splitTextToSize(diagnostic.diagnosis, pageWidth - 40);
  doc.text(diagnosisLines, 20, currentY + 7);
  
  currentY += 7 + (diagnosisLines.length * 5) + 10;

  // Treatment Plan
  doc.setFont('helvetica', 'bold');
  doc.text('Plan de Tratamiento:', 20, currentY);
  doc.setFont('helvetica', 'normal');
  const planLines = doc.splitTextToSize(diagnostic.treatmentPlan, pageWidth - 40);
  doc.text(planLines, 20, currentY + 7);
  
  currentY += 7 + (planLines.length * 5) + 10;

  // Recommendations
  doc.setFont('helvetica', 'bold');
  doc.text('Recomendaciones:', 20, currentY);
  doc.setFont('helvetica', 'normal');
  const recLines = doc.splitTextToSize(diagnostic.recommendations, pageWidth - 40);
  doc.text(recLines, 20, currentY + 7);

  // Signature
  const footerY = 260;
  doc.setDrawColor(203, 213, 225);
  doc.line(20, footerY, 90, footerY);
  doc.setFontSize(9);
  doc.text(diagnostic.doctorName, 55, footerY + 5, { align: 'center' });
  doc.text(`Cédula: ${diagnostic.doctorLicense}`, 55, footerY + 10, { align: 'center' });
  
  if (diagnostic.signature) {
    try {
      doc.addImage(diagnostic.signature, 'PNG', 30, footerY - 25, 50, 20);
    } catch (e) {
      console.error('Error adding signature to diagnostic PDF', e);
    }
  }

  doc.save(`ViMedical_Diagnostico_${diagnostic.patientName.replace(/\s+/g, '_')}.pdf`);
};

export const generateCertificatePDF = (certificate: MedicalCertificate) => {
  const doc = new jsPDF();
  addHeader(doc, 'CERTIFICADO MÉDICO');
  const pageWidth = doc.internal.pageSize.getWidth();

  // Content
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const date = new Date(certificate.date);
  const dateStr = date.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
  
  doc.text(`Fecha: ${dateStr}`, pageWidth - 20, 50, { align: 'right' });
  
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DEL PACIENTE', 20, 60);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nombre: ${certificate.patientName}`, 20, 67);
  doc.text(`Edad: ${certificate.patientAge} años`, 120, 67);

  // Clinical Details
  let currentY = 80;
  
  const sections = [
    { title: 'ESTADO FÍSICO:', content: certificate.physicalState },
    { title: 'DETALLES DE HERIDA:', content: certificate.woundDetails },
    { title: 'TRATAMIENTO:', content: certificate.treatment },
    { title: 'ESTADO VISUAL:', content: certificate.visualStatus },
    { title: 'ESTADO AUDITIVO:', content: certificate.auditoryStatus },
    { title: 'APARATO LOCOMOTOR:', content: certificate.locomotorStatus },
    { title: 'EXAMEN NEUROLÓGICO:', content: certificate.neurologicalStatus },
    { title: 'CONCLUSIONES:', content: certificate.conclusions },
  ];

  sections.forEach(section => {
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.text(section.title, 20, currentY);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(section.content, pageWidth - 40);
    doc.text(lines, 20, currentY + 6);
    currentY += 6 + (lines.length * 5) + 8;
  });

  // Signature
  const footerY = 260;
  doc.setDrawColor(203, 213, 225);
  doc.line(pageWidth / 2 - 40, footerY, pageWidth / 2 + 40, footerY);
  doc.setFontSize(9);
  doc.text(`Dr. ${certificate.doctorName}`, pageWidth / 2, footerY + 5, { align: 'center' });
  doc.text(`Cédula Profesional: ${certificate.doctorLicense}`, pageWidth / 2, footerY + 10, { align: 'center' });
  
  if (certificate.signature) {
    try {
      doc.addImage(certificate.signature, 'PNG', pageWidth / 2 - 25, footerY - 25, 50, 20);
    } catch (e) {
      console.error('Error adding signature to certificate PDF', e);
    }
  }

  doc.save(`ViMedical_Certificado_${certificate.patientName.replace(/\s+/g, '_')}.pdf`);
};

export const generateQuotationPDF = (quotation: Quotation) => {
  const doc = new jsPDF();
  addHeader(doc, 'COTIZACIÓN DE TRATAMIENTO');
  const pageWidth = doc.internal.pageSize.getWidth();

  // Quotation Info
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Detalle del Presupuesto', 20, 55);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Paciente: ${quotation.patientName}`, 20, 65);
  doc.text(`Fecha: ${new Date(quotation.createdAt).toLocaleDateString()}`, 20, 72);
  doc.text(`Estado: ${quotation.status === 'sent' ? 'Enviada' : 'Pendiente'}`, 20, 79);

  // Items Table
  const tableData = quotation.items.map(item => [
    item.description,
    item.quantity.toString(),
    `$${item.unitCost.toLocaleString()}`,
    `$${item.total.toLocaleString()}`
  ]);

  autoTable(doc, {
    startY: 90,
    head: [['Descripción', 'Cant.', 'Costo U.', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42] },
    foot: [['', '', 'TOTAL GENERAL:', `$${quotation.totalAmount.toLocaleString()}`]],
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' }
  });

  const finalY = (doc as any).lastAutoTable.finalY;

  if (quotation.notes) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Notas Adicionales:', 20, finalY + 15);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(quotation.notes, 20, finalY + 25, { maxWidth: pageWidth - 40 });
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Este presupuesto tiene una vigencia de 15 días a partir de su emisión.', pageWidth / 2, footerY, { align: 'center' });

  doc.save(`Cotizacion_${quotation.patientName.replace(/\s+/g, '_')}.pdf`);
};

export const generateClinicalHistoryPDF = (patient: Patient, wounds: Wound[] = [], treatments: TreatmentLog[] = [], doctorSignature?: string) => {
  const doc = new jsPDF();
  addHeader(doc, 'HISTORIAL CLÍNICO COMPLETO');
  const pageWidth = doc.internal.pageSize.getWidth();

  // Patient Info
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Datos del Paciente', 20, 55);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nombre: ${patient.fullName}`, 20, 65);
  doc.text(`Fecha de Nacimiento: ${patient.dateOfBirth}`, 20, 72);
  doc.text(`Teléfono: ${patient.phone}`, 20, 79);
  doc.text(`Género: ${patient.gender || 'N/A'}`, 20, 86);
  doc.text(`Estado Civil: ${patient.maritalStatus || 'N/A'}`, pageWidth / 2, 65);
  doc.text(`Ocupación: ${patient.occupation || 'N/A'}`, pageWidth / 2, 72);
  doc.text(`Religión: ${patient.religion}`, pageWidth / 2, 79);
  doc.text(`Dirección: ${patient.address || 'N/A'}`, 20, 93);

  // Background
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Antecedentes', 20, 110);
  
  const backgroundData = [
    ['Heredo Familiares', patient.familyHistory || 'Sin antecedentes'],
    ['Personales Patológicos', patient.pathologicalHistory || 'Sin antecedentes'],
    ['No Patológicos', patient.nonPathologicalHistory || 'Sin antecedentes']
  ];

  autoTable(doc, {
    startY: 115,
    body: backgroundData,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 5 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } }
  });

  let currentY = (doc as any).lastAutoTable.finalY + 15;

  // Initial Wound Photo
  if (patient.initialWoundPhoto) {
    if (currentY > 210) { doc.addPage(); currentY = 20; }
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Foto Inicial de la Herida', 20, currentY);
    try {
      doc.addImage(patient.initialWoundPhoto, 'JPEG', 20, currentY + 5, 80, 60);
      currentY += 75;
    } catch (e) {
      console.error('Error adding initial wound photo to PDF', e);
      currentY += 15;
    }
  }

  // Wounds Summary
  if (wounds.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Registro de Heridas', 20, currentY);

    const woundTable = wounds.map(w => [
      w.location,
      w.description,
      w.status,
      new Date(w.createdAt).toLocaleDateString()
    ]);

    autoTable(doc, {
      startY: currentY + 5,
      head: [['Localización', 'Descripción', 'Estado', 'Fecha Registro']],
      body: woundTable,
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42] }
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;
  }

  // Comments
  if (patient.clinicalComments && patient.clinicalComments.length > 0) {
    if (currentY > 240) { doc.addPage(); currentY = 20; }
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Observaciones Clínicas', 20, currentY);

    const commentTable = patient.clinicalComments.map(c => [
      new Date(c.createdAt).toLocaleDateString(),
      c.author,
      c.text
    ]);

    autoTable(doc, {
      startY: currentY + 5,
      head: [['Fecha', 'Autor', 'Observación']],
      body: commentTable,
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42] }
    });
    currentY = (doc as any).lastAutoTable.finalY + 15;
  }

  // Legal Documents
  if (patient.privacyNoticeSigned || patient.consentFormSigned) {
    if (currentY > 220) { doc.addPage(); currentY = 20; }
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Documentos Legales', 20, currentY);
    currentY += 10;

    if (patient.privacyNoticeSigned && patient.privacyNoticeSignature) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Aviso de Privacidad (${patient.privacyNoticeType})`, 20, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(`Firmado el: ${patient.privacyNoticeDate}`, 20, currentY + 5);
      try {
        doc.addImage(patient.privacyNoticeSignature, 'PNG', 20, currentY + 10, 40, 20);
      } catch (e) {
        console.error('Error adding privacy signature to PDF', e);
      }
      currentY += 35;
    }

    if (patient.consentFormSigned && patient.consentFormSignature) {
      if (currentY > 250) { doc.addPage(); currentY = 20; }
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Consentimiento Informado (${patient.consentFormType})`, 20, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(`Firmado el: ${patient.consentFormDate}`, 20, currentY + 5);
      try {
        doc.addImage(patient.consentFormSignature, 'PNG', 20, currentY + 10, 40, 20);
      } catch (e) {
        console.error('Error adding consent signature to PDF', e);
      }
      currentY += 35;
    }
  }

  // Doctor Signature
  if (doctorSignature) {
    if (currentY > 250) { doc.addPage(); currentY = 20; }
    doc.setDrawColor(200, 200, 200);
    doc.line(20, currentY + 20, 80, currentY + 20);
    doc.setFontSize(8);
    doc.text('Firma del Profesional', 50, currentY + 25, { align: 'center' });
    try {
      doc.addImage(doctorSignature, 'PNG', 25, currentY, 50, 20);
    } catch (e) {
      console.error('Error adding doctor signature to PDF', e);
    }
  }

  doc.save(`Historial_${patient.fullName.replace(/\s+/g, '_')}.pdf`);
};

export const generateFinalReport = (patient: Patient, wound?: Wound, treatments: TreatmentLog[] = [], doctorSignature?: string) => {
  const doc = new jsPDF();
  addHeader(doc, 'INFORME FINAL DE TRATAMIENTO');
  const pageWidth = doc.internal.pageSize.getWidth();

  // Patient Info
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Información del Paciente', 20, 55);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nombre: ${patient.fullName}`, 20, 65);
  doc.text(`Fecha de Nacimiento: ${patient.dateOfBirth}`, 20, 72);
  doc.text(`Teléfono: ${patient.phone}`, 20, 79);
  doc.text(`Dirección: ${patient.address || 'N/A'}`, 20, 86);

  // Clinical History
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Antecedentes Clínicos', 20, 105);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Heredo Familiares:', 20, 115);
  doc.text(patient.familyHistory || 'Sin antecedentes registrados', 60, 115, { maxWidth: pageWidth - 80 });
  
  doc.text('Personales Patológicos:', 20, 125);
  doc.text(patient.pathologicalHistory || 'Sin antecedentes registrados', 60, 125, { maxWidth: pageWidth - 80 });
  
  doc.text('No Patológicos:', 20, 135);
  doc.text(patient.nonPathologicalHistory || 'Sin antecedentes registrados', 60, 135, { maxWidth: pageWidth - 80 });

  let currentY = 155;

  // Wound Info
  if (wound) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Detalle de la Herida', 20, currentY);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Localización: ${wound.location}`, 20, currentY + 10);
    doc.text(`Descripción: ${wound.description}`, 20, currentY + 17);
    doc.text(`Estado Final: ${wound.status === 'completed' ? 'Cerrada / Completada' : wound.status}`, 20, currentY + 24);
    doc.text(`Plan de Tratamiento: ${wound.proposedPlan}`, 20, currentY + 31, { maxWidth: pageWidth - 40 });
    
    currentY += 55;
  }

  // Treatment History Table
  if (treatments.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Historial de Visitas', 20, currentY);

    const tableData = treatments.map((t, index) => [
      `Visita ${index + 1}`,
      new Date(t.evaluationDate).toLocaleDateString(),
      t.prognosis,
      t.notes.substring(0, 50) + (t.notes.length > 50 ? '...' : '')
    ]);

    autoTable(doc, {
      startY: currentY + 5,
      head: [['Visita', 'Fecha', 'Pronóstico', 'Observaciones']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42] },
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 20;
  } else {
    currentY += 20;
  }

  // Photos Section
  if (patient.initialWoundPhoto) {
    if (currentY > 210) { doc.addPage(); currentY = 20; }
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Evidencia Fotográfica Inicial', 20, currentY);
    try {
      doc.addImage(patient.initialWoundPhoto, 'JPEG', 20, currentY + 5, 80, 60);
      currentY += 75;
    } catch (e) {
      console.error('Error adding initial wound photo to final report', e);
      currentY += 15;
    }
  } else {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Evidencia Fotográfica', 20, currentY);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('(Las fotos se incluyen en el expediente digital adjunto)', 20, currentY + 10);
    currentY += 20;
  }

  // Signature Placeholders
  const footerY = doc.internal.pageSize.getHeight() - 40;
  doc.setDrawColor(200, 200, 200);
  doc.line(20, footerY, 80, footerY);
  doc.line(pageWidth - 80, footerY, pageWidth - 20, footerY);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Firma del Profesional', 50, footerY + 5, { align: 'center' });
  doc.text('Firma del Paciente', pageWidth - 50, footerY + 5, { align: 'center' });
  
  // Add doctor signature if available
  if (doctorSignature) {
    try {
      doc.addImage(doctorSignature, 'PNG', 25, footerY - 25, 50, 20);
    } catch (e) {
      console.error('Error adding doctor signature to report', e);
    }
  }

  // Add patient signature if available (from last treatment)
  const lastTreatmentWithSignature = [...treatments].reverse().find(t => t.patientSignature);
  if (lastTreatmentWithSignature?.patientSignature) {
    try {
      doc.addImage(lastTreatmentWithSignature.patientSignature, 'PNG', pageWidth - 75, footerY - 25, 50, 20);
    } catch (e) {
      console.error('Error adding patient signature to report', e);
    }
  } else if (patient.consentFormSignature) {
    try {
      doc.addImage(patient.consentFormSignature, 'PNG', pageWidth - 75, footerY - 25, 50, 20);
    } catch (e) {
      console.error('Error adding patient consent signature to report', e);
    }
  }

  doc.save(`ViMedical_Informe_${patient.fullName.replace(/\s+/g, '_')}.pdf`);
};

export const generateConsentFormPDF = (patient: Patient) => {
  const doc = new jsPDF();
  addHeader(doc, 'CONSENTIMIENTO INFORMADO');
  
  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 55;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Patient details box
  doc.setFillColor(248, 250, 252);
  doc.rect(20, currentY, pageWidth - 40, 25, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(20, currentY, pageWidth - 40, 25, 'S');
  
  doc.setFont('helvetica', 'bold');
  doc.text(`Paciente: ${patient.fullName}`, 25, currentY + 10);
  doc.text(`ID Referencia: ${patient.id}`, 25, currentY + 17);
  
  const dateStr = patient.consentFormDate 
    ? new Date(patient.consentFormDate).toLocaleString('es-MX', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : new Date().toLocaleString('es-MX');
  
  doc.text(`Fecha Firma: ${dateStr}`, pageWidth - 95, currentY + 10);
  currentY += 35;
  
  // Document title
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('AUTORIZACIÓN DE ATENCIÓN DE VALORACIÓN Y TRATAMIENTO', 20, currentY);
  currentY += 8;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  const paragraph1 = `Por medio de la presente, el paciente o su representante legal de manera libre, voluntaria y asumiendo plenamente la responsabilidad, otorga su consentimiento expreso e informado a ViMedical y su personal calificado (enfermeros especialistas y médicos) para realizar las maniobras de valoración, curaciones complejas y terapéuticas necesarias para el adecuado manejo de sus heridas y lesiones vasculares, diabéticas o de cualquier etiología clínica.`;
  const splitP1 = doc.splitTextToSize(paragraph1, pageWidth - 40);
  doc.text(splitP1, 20, currentY);
  currentY += splitP1.length * 4.5 + 4;
  
  doc.setFont('helvetica', 'bold');
  doc.text('ALCANCE DE PROCEDIMIENTOS CLÍNICOS:', 20, currentY);
  currentY += 5;
  doc.setFont('helvetica', 'normal');
  const scopeText = `Esto abarca limpieza profunda, debridación enzimática, autolítica o mecánica de tejido no viable, toma de muestras microbiológicas de exudado, colocación de parches de barrera, apósitos de plata o apósitos de última generación, colocación de vendajes de compresión elástica o inelástica, y la toma obligatoria de registros fotográficos cronológicos clínicos con el fin exclusivo de registrar científicamente la evolución cicatrizal e histológica de las heridas.`;
  const splitScope = doc.splitTextToSize(scopeText, pageWidth - 40);
  doc.text(splitScope, 20, currentY);
  currentY += splitScope.length * 4.5 + 4;
  
  doc.setFont('helvetica', 'bold');
  doc.text('RIESGOS ASOCIADOS DIRECTOS:', 20, currentY);
  currentY += 5;
  doc.setFont('helvetica', 'normal');
  const risksText = `Se me ha notificado claramente que dichos procesos pueden acarrear riesgos inherentes del tratamiento cutáneo como dolor o ardor transitorio, sangrado moderado controlable por compresión local, irritación perilesional, inflamación colateral o susceptibilidad alérgica menor frente a los agentes de limpieza o apósitos de contacto. Doy fe de entender que la velocidad y el éxito final de la cicatrización dependen estrechamente de mis hábitos nutricionales, patologías preexistentes y apego a las indicaciones de descarga o vendajes.`;
  const splitRisks = doc.splitTextToSize(risksText, pageWidth - 40);
  doc.text(splitRisks, 20, currentY);
  currentY += splitRisks.length * 4.5 + 4;
  
  doc.setFont('helvetica', 'bold');
  doc.text('DERECHOS DEL TITULAR:', 20, currentY);
  currentY += 5;
  doc.setFont('helvetica', 'normal');
  const rightsText = `Reconozco el derecho pleno de revocar el consentimiento en cualquier fase de la atención sin repercusiones éticas posteriores sobre mi manejo y la disponibilidad constante del personal para disipar cualquier interrogante clínica.`;
  const splitRights = doc.splitTextToSize(rightsText, pageWidth - 40);
  doc.text(splitRights, 20, currentY);
  currentY += splitRights.length * 4.5 + 5;
  
  // Highlighted statement
  doc.setFillColor(243, 244, 246);
  doc.rect(20, currentY, pageWidth - 40, 15, 'F');
  doc.setDrawColor(209, 213, 219);
  doc.rect(20, currentY, pageWidth - 40, 15, 'S');
  doc.setFont('helvetica', 'bolditalic');
  doc.text('"Otorgo mi consentimiento libre, espontáneo e informado para recibir atención de enfermería avanzada clínica."', 25, currentY + 9);
  currentY += 30;
  
  // Signatures
  doc.setFont('helvetica', 'normal');
  doc.setDrawColor(200, 200, 200);
  doc.line(20, currentY, 80, currentY);
  doc.line(pageWidth - 80, currentY, pageWidth - 20, currentY);
  
  doc.setFontSize(8);
  doc.text('Firma Autorizada ViMedical', 50, currentY + 5, { align: 'center' });
  doc.text(`Firma de Conformidad: ${patient.fullName}`, pageWidth - 50, currentY + 5, { align: 'center' });
  
  if (patient.consentFormSignature) {
    try {
      doc.addImage(patient.consentFormSignature, 'PNG', pageWidth - 70, currentY - 21, 40, 18);
    } catch (e) {
      console.error('Error rendering patient consent signature to PDF', e);
    }
  }
  
  doc.save(`Consentimiento_ViMedical_${patient.fullName.replace(/\s+/g, '_')}.pdf`);
};

export const generatePrivacyNoticePDF = (patient: Patient) => {
  const doc = new jsPDF();
  addHeader(doc, 'AVISO DE PRIVACIDAD');
  
  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 55;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Patient details box
  doc.setFillColor(248, 250, 252);
  doc.rect(20, currentY, pageWidth - 40, 25, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(20, currentY, pageWidth - 40, 25, 'S');
  
  doc.setFont('helvetica', 'bold');
  doc.text(`Titular de los Datos: ${patient.fullName}`, 25, currentY + 10);
  doc.text(`ID Referencia: ${patient.id}`, 25, currentY + 17);
  
  const dateStr = patient.privacyNoticeDate 
    ? new Date(patient.privacyNoticeDate).toLocaleString('es-MX', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : new Date().toLocaleString('es-MX');
  
  doc.text(`Fecha Firma: ${dateStr}`, pageWidth - 95, currentY + 10);
  currentY += 35;
  
  // Document title
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('MANEJO, CONFIDENCIALIDAD Y RESGUARDO DE DATOS SENSIBLES VIMEDICAL', 20, currentY);
  currentY += 8;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  const intro = `En cumplimiento estricto con las normativas federales en materia de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) de México, ViMedical hace del conocimiento del titular que sus datos serán tratados con la máxima seguridad ética y profesional médica, asegurando su absoluta confidencialidad:`;
  const splitIntro = doc.splitTextToSize(intro, pageWidth - 40);
  doc.text(splitIntro, 20, currentY);
  currentY += splitIntro.length * 4.5 + 4;
  
  doc.setFont('helvetica', 'bold');
  doc.text('1. FINALIDAD DEL TRATAMIENTO DE LOS DATOS:', 20, currentY);
  currentY += 5;
  doc.setFont('helvetica', 'normal');
  const purpText = `La información recabada (incluyendo sus nombres completos, edad, ocupación, números de contacto y familiares responsables) será contenida celosamente dentro de su expediente clínico confidencial electrónico con la finalidad única de proveer seguimiento a la evolución clínica de heridas, planificar tratamientos, procesar facturación fiscal de servicios y fungir como contacto idóneo en emergencias.`;
  const splitPurp = doc.splitTextToSize(purpText, pageWidth - 40);
  doc.text(splitPurp, 20, currentY);
  currentY += splitPurp.length * 4.5 + 4;
  
  doc.setFont('helvetica', 'bold');
  doc.text('2. TRATAMIENTO EXCLUSIVO DE DATOS SENSIBLES:', 20, currentY);
  currentY += 5;
  doc.setFont('helvetica', 'normal');
  const sensText = `ViMedical tratará con rigor confidencial absoluto los datos clínicos altamente sensibles que abarcan historiales médicos previos, sintomatología, patologías de heredofamiliar o metabólica, así como registros gráficos detallados (fotografías microscópicas y macroscópicas directas del proceso de cicatrización cutánea). Ningún registro fotográfico o clínico será exhibido públicamente salvo autorización expresa o requerimiento legal emitido por autoridad competente.`;
  const splitSens = doc.splitTextToSize(sensText, pageWidth - 40);
  doc.text(splitSens, 20, currentY);
  currentY += splitSens.length * 4.5 + 4;
  
  doc.setFont('helvetica', 'bold');
  doc.text('3. TRANSFERENCIA DE DATOS Y ENLACE INTERCONSULTANTE:', 20, currentY);
  currentY += 5;
  doc.setFont('helvetica', 'normal');
  const transText = `Toda transferencia de información médica interna para fines de interconsulta con médicos adscritos, cirujanos plásticos o vasculares ajenos a la plantilla principal será tratada bajo los mismos estándares legales de discreción, previa notificación y anuencia verbal de la persona responsable.`;
  const splitTrans = doc.splitTextToSize(transText, pageWidth - 40);
  doc.text(splitTrans, 20, currentY);
  currentY += splitTrans.length * 4.5 + 5;
  
  // Highlighted statement
  doc.setFillColor(243, 244, 246);
  doc.rect(20, currentY, pageWidth - 40, 15, 'F');
  doc.setDrawColor(209, 213, 219);
  doc.rect(20, currentY, pageWidth - 40, 15, 'S');
  doc.setFont('helvetica', 'bolditalic');
  doc.text('"Acepto de manera informada y conforme las finalidades descritas para el resguardo de mi información personal."', 23, currentY + 9);
  currentY += 30;
  
  // Signatures
  doc.setFont('helvetica', 'normal');
  doc.setDrawColor(200, 200, 200);
  doc.line(20, currentY, 80, currentY);
  doc.line(pageWidth - 80, currentY, pageWidth - 20, currentY);
  
  doc.setFontSize(8);
  doc.text('Delegado de Datos Personales ViMedical', 50, currentY + 5, { align: 'center' });
  doc.text(`Firma del Titular: ${patient.fullName}`, pageWidth - 50, currentY + 5, { align: 'center' });
  
  if (patient.privacyNoticeSignature) {
    try {
      doc.addImage(patient.privacyNoticeSignature, 'PNG', pageWidth - 70, currentY - 21, 40, 18);
    } catch (e) {
      console.error('Error rendering patient privacy signature to PDF', e);
    }
  }
  
  doc.save(`Aviso_Privacidad_ViMedical_${patient.fullName.replace(/\s+/g, '_')}.pdf`);
};
