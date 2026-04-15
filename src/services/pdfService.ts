import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Patient, Wound, TreatmentLog, Quotation, Diagnostic, MedicalCertificate } from '../mockData';

export const generateDiagnosticPDF = (diagnostic: Diagnostic) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('ViMedical', 20, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('DIAGNÓSTICO CLÍNICO', pageWidth - 20, 25, { align: 'right' });

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
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('ViMedical', 20, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('CERTIFICADO MÉDICO', pageWidth - 20, 25, { align: 'right' });

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
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('ViMedical', 20, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('COTIZACIÓN DE TRATAMIENTO', pageWidth - 20, 25, { align: 'right' });

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
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('ViMedical', 20, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('HISTORIAL CLÍNICO COMPLETO', pageWidth - 20, 25, { align: 'right' });

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
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('ViMedical', 20, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('INFORME FINAL DE TRATAMIENTO', pageWidth - 20, 25, { align: 'right' });

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
