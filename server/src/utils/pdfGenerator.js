const PDFDocument = require('pdfkit');

/**
 * BloodLink AI - Premium PDF Document Generation
 * Formats:
 * 1. Donor Registration Confirmation (A4 Portrait)
 * 2. Blood Donation Receipt (A4 Portrait)
 * 3. Certificate of Appreciation (A4 Landscape)
 */

/**
 * Generate Donor Registration Confirmation PDF stream
 */
function generateRegistrationConfirmationPDF(donor, user, stream) {
  const doc = new PDFDocument({
    size: 'A4',
    layout: 'portrait',
    margin: 40,
    info: {
      Title: `BloodLink AI - Donor Registration Confirmation - ${donor.donorId || donor._id}`,
      Author: 'BloodLink AI Campus Coordination Desk'
    }
  });

  doc.pipe(stream);

  const width = doc.page.width;
  const height = doc.page.height;
  const margin = 40;

  // Outer decorative border
  doc.rect(margin, margin, width - margin * 2, height - margin * 2)
     .lineWidth(1.5)
     .strokeColor('#dc2626')
     .stroke();

  doc.rect(margin + 4, margin + 4, width - margin * 2 - 8, height - margin * 2 - 8)
     .lineWidth(0.5)
     .strokeColor('#cbd5e1')
     .stroke();

  // Top Header Banner
  doc.rect(margin + 4, margin + 4, width - margin * 2 - 8, 80)
     .fillColor('#991b1b')
     .fill();

  // Header Title
  doc.fillColor('#ffffff')
     .font('Helvetica-Bold')
     .fontSize(20)
     .text('BLOODLINK AI', margin + 20, margin + 20);

  doc.font('Helvetica')
     .fontSize(9)
     .fillColor('#fecaca')
     .text('SMART CAMPUS BLOOD BANK & EMERGENCY COORDINATION', margin + 20, margin + 45);

  doc.font('Helvetica-Bold')
     .fontSize(10)
     .fillColor('#ffffff')
     .text('VOLUNTARY DONOR REGISTRY', width - margin - 200, margin + 25, { width: 180, align: 'right' });

  // Document Title
  let y = margin + 105;
  doc.font('Helvetica-Bold')
     .fontSize(16)
     .fillColor('#0f172a')
     .text('DONOR REGISTRATION CONFIRMATION', margin + 20, y, { align: 'center', width: width - (margin + 20) * 2 });

  y += 22;
  doc.font('Helvetica')
     .fontSize(10)
     .fillColor('#64748b')
     .text('Official record of voluntary donor registration for campus emergency coordination', margin + 20, y, { align: 'center', width: width - (margin + 20) * 2 });

  // Mandatory Safety Notice
  y += 26;
  doc.rect(margin + 20, y, width - (margin + 20) * 2, 38)
     .fillColor('#fffbeb')
     .strokeColor('#fde68a')
     .lineWidth(1)
     .fillAndStroke();

  doc.font('Helvetica-Bold')
     .fontSize(8.5)
     .fillColor('#92400e')
     .text('OFFICIAL NOTICE: REGISTRATION CONFIRMATION ONLY', margin + 30, y + 8);

  doc.font('Helvetica')
     .fontSize(7.5)
     .fillColor('#b45309')
     .text('This document confirms that the student/faculty has enrolled in the voluntary blood donor registry. It does not represent proof of blood donation. Official donation receipts are issued separately after medical collection.', margin + 30, y + 20, { width: width - (margin + 30) * 2 });

  // Donor Details Table / Cards
  y += 50;

  const donorName = user.name || 'Campus Donor';
  const bloodGroup = donor.bloodGroup || 'O+';
  const collegeName = donor.college || user.college || process.env.CAMPUS_NAME || 'JC Bose University of Science and Technology, YMCA';
  const department = donor.department || user.department || 'Academic Department';
  const userType = donor.userType || user.userType || 'STUDENT';
  const rollNumber = donor.rollNumber || 'N/A';
  const donorId = `DONOR-${String(donor._id).slice(-8).toUpperCase()}`;
  const regRef = `BLD-REG-${new Date(donor.createdAt || Date.now()).getFullYear()}-${String(donor._id).slice(-6).toUpperCase()}`;
  const regDate = new Date(donor.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const fields = [
    { label: 'Donor Full Name', value: donorName },
    { label: 'Donor ID', value: donorId },
    { label: 'Blood Group', value: bloodGroup, isBadge: true },
    { label: 'Campus / College', value: collegeName },
    { label: 'Department / Faculty', value: `${department} (${userType})` },
    { label: 'Roll Number / ID', value: rollNumber },
    { label: 'Registration Date', value: regDate },
    { label: 'Registration Reference', value: regRef },
    { label: 'Contact Phone', value: user.phone || donor.phone || 'On file' },
    { label: 'Eligibility Status', value: donor.eligibilityStatus || 'ELIGIBLE' }
  ];

  doc.rect(margin + 20, y, width - (margin + 20) * 2, fields.length * 24 + 10)
     .fillColor('#ffffff')
     .strokeColor('#e2e8f0')
     .lineWidth(1)
     .fillAndStroke();

  fields.forEach((f, idx) => {
    const rowY = y + 8 + idx * 24;
    // Alternating row background
    if (idx % 2 === 0) {
      doc.rect(margin + 21, rowY - 3, width - (margin + 20) * 2 - 2, 22)
         .fillColor('#f8fafc')
         .fill();
    }

    doc.font('Helvetica-Bold')
       .fontSize(9)
       .fillColor('#475569')
       .text(f.label, margin + 35, rowY);

    if (f.isBadge) {
      doc.rect(margin + 220, rowY - 2, 40, 16)
         .fillColor('#dc2626')
         .fill();
      doc.font('Helvetica-Bold')
         .fontSize(10)
         .fillColor('#ffffff')
         .text(f.value, margin + 220, rowY + 1, { width: 40, align: 'center' });
    } else {
      doc.font('Helvetica')
         .fontSize(9)
         .fillColor('#0f172a')
         .text(f.value, margin + 220, rowY, { width: width - margin - 260 });
    }
  });

  // Thank You Message Box
  y += fields.length * 24 + 25;
  doc.rect(margin + 20, y, width - (margin + 20) * 2, 70)
     .fillColor('#f0fdf4')
     .strokeColor('#bbf7d0')
     .lineWidth(1)
     .fillAndStroke();

  doc.font('Helvetica-Bold')
     .fontSize(11)
     .fillColor('#166534')
     .text('Thank You for Joining the Campus Lifesaver Network! ❤️', margin + 35, y + 12);

  doc.font('Helvetica')
     .fontSize(8.5)
     .fillColor('#15803d')
     .text('Your voluntary commitment ensures that patients in critical emergency need on campus and in local hospitals can receive urgent transfusions in time. Please keep your campus emergency availability active and participate in upcoming campus blood drives.', margin + 35, y + 28, { width: width - (margin + 35) * 2, lineGap: 3 });

  // Coordinator Sign & Seal
  y += 90;
  doc.font('Helvetica-Bold')
     .fontSize(9)
     .fillColor('#0f172a')
     .text('Authorized by:', margin + 35, y);

  doc.font('Helvetica')
     .fontSize(8.5)
     .fillColor('#475569')
     .text('Campus Blood Bank Coordinator / Youth Red Cross Chapter\nEmergency Coordination Cell, Health Centre\nSystem Generated Secure Registration Document', margin + 35, y + 14);

  // Digital verification code box
  doc.rect(width - margin - 170, y, 150, 48)
     .strokeColor('#e2e8f0')
     .lineWidth(1)
     .stroke();

  doc.font('Helvetica-Bold')
     .fontSize(7.5)
     .fillColor('#64748b')
     .text('DIGITAL VERIFICATION', width - margin - 160, y + 6);

  doc.font('Courier')
     .fontSize(7.5)
     .fillColor('#0f172a')
     .text(`REF: ${regRef}\nISSUED: ${new Date().toISOString().slice(0, 10)}\nSTATUS: ACTIVE`, width - margin - 160, y + 18);

  // Footer
  doc.font('Helvetica')
     .fontSize(7.5)
     .fillColor('#94a3b8')
     .text(`BloodLink AI • Smart Campus Blood Bank Coordination Platform • Page 1 of 1`, margin + 20, height - margin - 15, { align: 'center', width: width - (margin + 20) * 2 });

  doc.end();
}

/**
 * Generate Blood Donation Receipt PDF stream
 */
function generateDonationReceiptPDF(donation, donor, user, stream) {
  const doc = new PDFDocument({
    size: 'A4',
    layout: 'portrait',
    margin: 40,
    info: {
      Title: `BloodLink AI - Blood Donation Receipt - ${donation.donationId}`,
      Author: 'BloodLink AI Campus Coordination Desk'
    }
  });

  doc.pipe(stream);

  const width = doc.page.width;
  const height = doc.page.height;
  const margin = 40;

  // Outer border
  doc.rect(margin, margin, width - margin * 2, height - margin * 2)
     .lineWidth(1.5)
     .strokeColor('#059669')
     .stroke();

  doc.rect(margin + 4, margin + 4, width - margin * 2 - 8, height - margin * 2 - 8)
     .lineWidth(0.5)
     .strokeColor('#cbd5e1')
     .stroke();

  // Top Header Banner
  doc.rect(margin + 4, margin + 4, width - margin * 2 - 8, 80)
     .fillColor('#065f46')
     .fill();

  doc.fillColor('#ffffff')
     .font('Helvetica-Bold')
     .fontSize(20)
     .text('BLOODLINK AI', margin + 20, margin + 20);

  doc.font('Helvetica')
     .fontSize(9)
     .fillColor('#a7f3d0')
     .text('SMART CAMPUS BLOOD BANK & TRANSFUSION SERVICES', margin + 20, margin + 45);

  doc.font('Helvetica-Bold')
     .fontSize(10)
     .fillColor('#ffffff')
     .text('OFFICIAL DONATION RECEIPT', width - margin - 210, margin + 25, { width: 190, align: 'right' });

  // Receipt Number
  const receiptNum = donation.receiptNumber || `RCP-2026-${String(donation.donationId || donation._id).slice(-6).toUpperCase()}`;

  let y = margin + 105;
  doc.font('Helvetica-Bold')
     .fontSize(16)
     .fillColor('#0f172a')
     .text('BLOOD DONATION RECEIPT', margin + 20, y, { align: 'center', width: width - (margin + 20) * 2 });

  y += 22;
  doc.font('Helvetica')
     .fontSize(10)
     .fillColor('#64748b')
     .text(`Receipt Number: ${receiptNum} • Status: Verified & Completed`, margin + 20, y, { align: 'center', width: width - (margin + 20) * 2 });

  // Verified Badge Bar
  y += 26;
  doc.rect(margin + 20, y, width - (margin + 20) * 2, 34)
     .fillColor('#ecfdf5')
     .strokeColor('#a7f3d0')
     .lineWidth(1)
     .fillAndStroke();

  doc.font('Helvetica-Bold')
     .fontSize(10)
     .fillColor('#047857')
     .text('✓ BLOOD DONATION COMPLETED AND VERIFIED BY AUTHORIZED STAFF', margin + 30, y + 10);

  // Donation Details
  y += 48;

  const donorName = user.name || (donor.userId && donor.userId.name) || 'Campus Donor';
  const bloodGroup = donation.bloodGroup || donor.bloodGroup || 'O+';
  const donationDate = new Date(donation.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const collegeName = donation.college || donor.college || process.env.CAMPUS_NAME || 'JC Bose University of Science and Technology, YMCA';
  const location = donation.location || (donation.hospitalId && donation.hospitalId.hospitalName) || 'Campus Health Centre Blood Bank';
  const comp = donation.donationType || 'Whole Blood';

  const rows = [
    { label: 'Receipt Number', value: receiptNum },
    { label: 'Donation Reference ID', value: donation.donationId },
    { label: 'Donor Full Name', value: donorName },
    { label: 'Donor Blood Group', value: bloodGroup, isBadge: true },
    { label: 'Component Collected', value: comp },
    { label: 'Units Donated', value: '1 Unit (350ml / 450ml Standard)' },
    { label: 'Donation Date', value: donationDate },
    { label: 'Collection Venue / Centre', value: location },
    { label: 'Campus / College', value: collegeName },
    { label: 'Verification Status', value: 'Completed & Clinically Verified' }
  ];

  doc.rect(margin + 20, y, width - (margin + 20) * 2, rows.length * 24 + 10)
     .fillColor('#ffffff')
     .strokeColor('#e2e8f0')
     .lineWidth(1)
     .fillAndStroke();

  rows.forEach((r, idx) => {
    const rowY = y + 8 + idx * 24;
    if (idx % 2 === 0) {
      doc.rect(margin + 21, rowY - 3, width - (margin + 20) * 2 - 2, 22)
         .fillColor('#f8fafc')
         .fill();
    }

    doc.font('Helvetica-Bold')
       .fontSize(9)
       .fillColor('#475569')
       .text(r.label, margin + 35, rowY);

    if (r.isBadge) {
      doc.rect(margin + 220, rowY - 2, 40, 16)
         .fillColor('#dc2626')
         .fill();
      doc.font('Helvetica-Bold')
         .fontSize(10)
         .fillColor('#ffffff')
         .text(r.value, margin + 220, rowY + 1, { width: 40, align: 'center' });
    } else {
      doc.font('Helvetica')
         .fontSize(9)
         .fillColor('#0f172a')
         .text(r.value, margin + 220, rowY, { width: width - margin - 260 });
    }
  });

  // Post Donation Advice Box
  y += rows.length * 24 + 25;
  doc.rect(margin + 20, y, width - (margin + 20) * 2, 65)
     .fillColor('#f8fafc')
     .strokeColor('#e2e8f0')
     .lineWidth(1)
     .fillAndStroke();

  doc.font('Helvetica-Bold')
     .fontSize(10)
     .fillColor('#0f172a')
     .text('Post-Donation Care & Next Eligible Date:', margin + 35, y + 10);

  const nextEligible = new Date(donation.createdAt || Date.now());
  nextEligible.setDate(nextEligible.getDate() + 90);
  const nextDateStr = nextEligible.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  doc.font('Helvetica')
     .fontSize(8)
     .fillColor('#475569')
     .text(`• Drink plenty of fluids over the next 24 hours.\n• Avoid heavy weight lifting or strenuous physical exercise today.\n• You will be eligible to donate again on: ${nextDateStr} (90 days medical cooldown).`, margin + 35, y + 26, { lineGap: 3 });

  // Signature Block
  y += 85;
  doc.font('Helvetica-Bold')
     .fontSize(9)
     .fillColor('#0f172a')
     .text('Issued & Verified by:', margin + 35, y);

  doc.font('Helvetica')
     .fontSize(8.5)
     .fillColor('#475569')
     .text('Authorized Blood Bank Officer / Medical Transfusionist\nCampus Health Centre & Red Cross Blood Bank Services', margin + 35, y + 14);

  // Digital verification code box
  doc.rect(width - margin - 170, y, 150, 48)
     .strokeColor('#e2e8f0')
     .lineWidth(1)
     .stroke();

  doc.font('Helvetica-Bold')
     .fontSize(7.5)
     .fillColor('#64748b')
     .text('DIGITAL RECEIPT VERIFICATION', width - margin - 160, y + 6);

  doc.font('Courier')
     .fontSize(7.5)
     .fillColor('#0f172a')
     .text(`RCP: ${receiptNum}\nDATE: ${new Date().toISOString().slice(0, 10)}\nSTATUS: VERIFIED`, width - margin - 160, y + 18);

  // Footer
  doc.font('Helvetica')
     .fontSize(7.5)
     .fillColor('#94a3b8')
     .text(`BloodLink AI • Official Blood Donation Receipt • Page 1 of 1`, margin + 20, height - margin - 15, { align: 'center', width: width - (margin + 20) * 2 });

  doc.end();
}

/**
 * Generate Certificate of Appreciation PDF stream (A4 Landscape)
 */
function generateCertificatePDF(donation, donor, user, stream) {
  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margin: 40,
    info: {
      Title: `BloodLink AI - Certificate of Appreciation - ${user.name || 'Donor'}`,
      Author: 'BloodLink AI Campus Coordination Desk'
    }
  });

  doc.pipe(stream);

  const width = doc.page.width;   // ~841.89
  const height = doc.page.height; // ~595.28

  // Outer border with subtle gold accent
  doc.rect(25, 25, width - 50, height - 50)
     .lineWidth(3)
     .strokeColor('#b91c1c')
     .stroke();

  doc.rect(30, 30, width - 60, height - 60)
     .lineWidth(1)
     .strokeColor('#d97706')
     .stroke();

  doc.rect(34, 34, width - 68, height - 68)
     .lineWidth(0.5)
     .strokeColor('#cbd5e1')
     .stroke();

  // Corner decorative embellishments
  const cornerSize = 20;
  const drawCorner = (x, y, flipX, flipY) => {
    doc.save();
    doc.lineWidth(1.5).strokeColor('#d97706');
    doc.moveTo(x, y + (flipY ? -cornerSize : cornerSize)).lineTo(x, y).lineTo(x + (flipX ? -cornerSize : cornerSize), y).stroke();
    doc.restore();
  };
  drawCorner(38, 38, false, false);
  drawCorner(width - 38, 38, true, false);
  drawCorner(38, height - 38, false, true);
  drawCorner(width - 38, height - 38, true, true);

  // Top Organization Branding
  let y = 55;
  doc.font('Helvetica-Bold')
     .fontSize(11)
     .fillColor('#991b1b')
     .text('BLOODLINK AI • SMART CAMPUS BLOOD BANK PLATFORM', 40, y, { align: 'center', width: width - 80 });

  const collegeName = donation.college || donor.college || process.env.CAMPUS_NAME || 'JC Bose University of Science and Technology, YMCA';
  y += 16;
  doc.font('Helvetica')
     .fontSize(9)
     .fillColor('#64748b')
     .text(`${collegeName} • Youth Red Cross Chapter & NSS Cell`, 40, y, { align: 'center', width: width - 80 });

  // Main Certificate Title
  y += 35;
  doc.font('Helvetica-Bold')
     .fontSize(28)
     .fillColor('#991b1b')
     .text('Certificate of Appreciation', 40, y, { align: 'center', width: width - 80 });

  // Decorative gold underline
  y += 38;
  doc.moveTo(width / 2 - 120, y).lineTo(width / 2 + 120, y).lineWidth(2).strokeColor('#d97706').stroke();
  doc.circle(width / 2, y, 4).fillColor('#b91c1c').fill();

  // Subtitle
  y += 16;
  doc.font('Helvetica')
     .fontSize(12)
     .fillColor('#475569')
     .text('This certificate is proudly presented to', 40, y, { align: 'center', width: width - 80 });

  // Donor Full Name (Prominently displayed)
  y += 24;
  const donorName = user.name || (donor.userId && donor.userId.name) || 'Campus Donor';
  doc.font('Helvetica-Bold')
     .fontSize(24)
     .fillColor('#0f172a')
     .text(donorName, 40, y, { align: 'center', width: width - 80 });

  // Wording as required:
  // "in recognition of their voluntary blood donation and compassionate contribution toward saving lives.
  //  Your generosity reflects the true spirit of humanity and community service.
  //  Thank you for being a lifesaver."
  y += 36;
  doc.font('Helvetica')
     .fontSize(11)
     .fillColor('#334155')
     .text('in recognition of their voluntary blood donation and compassionate contribution toward saving lives.', 60, y, { align: 'center', width: width - 120 });

  y += 18;
  doc.font('Helvetica-Oblique')
     .fontSize(10.5)
     .fillColor('#475569')
     .text('Your generosity reflects the true spirit of humanity and community service.', 60, y, { align: 'center', width: width - 120 });

  y += 18;
  doc.font('Helvetica-Bold')
     .fontSize(11)
     .fillColor('#991b1b')
     .text('Thank you for being a lifesaver.', 60, y, { align: 'center', width: width - 120 });

  // Donation Details Badge Row
  y += 32;
  const bloodGroup = donation.bloodGroup || donor.bloodGroup || 'O+';
  const donationDate = new Date(donation.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const certRef = donation.certificateNumber || `CERT-2026-${String(donation.donationId || donation._id).slice(-6).toUpperCase()}`;

  doc.rect(width / 2 - 250, y, 500, 32)
     .fillColor('#f8fafc')
     .strokeColor('#e2e8f0')
     .lineWidth(1)
     .fillAndStroke();

  doc.font('Helvetica-Bold')
     .fontSize(9.5)
     .fillColor('#475569')
     .text(`Blood Group: `, width / 2 - 235, y + 10);

  doc.fillColor('#b91c1c').text(`${bloodGroup}`, width / 2 - 165, y + 10);

  doc.fillColor('#475569').text(`Date: `, width / 2 - 80, y + 10);
  doc.fillColor('#0f172a').text(`${donationDate}`, width / 2 - 50, y + 10);

  doc.fillColor('#475569').text(`Certificate Ref: `, width / 2 + 80, y + 10);
  doc.fillColor('#0f172a').text(`${certRef}`, width / 2 + 160, y + 10);

  // Signatures Area
  y += 65;
  const sigLeftX = width / 2 - 240;
  const sigRightX = width / 2 + 80;

  // Left Signature
  doc.moveTo(sigLeftX, y).lineTo(sigLeftX + 160, y).lineWidth(1).strokeColor('#94a3b8').stroke();
  doc.font('Helvetica-Bold')
     .fontSize(9)
     .fillColor('#0f172a')
     .text('Dr. Suresh Babu, MD', sigLeftX, y + 6, { width: 160, align: 'center' });
  doc.font('Helvetica')
     .fontSize(7.5)
     .fillColor('#64748b')
     .text('Chief Medical Officer & Transfusionist\nAuthorized Partner Blood Bank', sigLeftX, y + 18, { width: 160, align: 'center' });

  // Center Official Seal
  const sealX = width / 2;
  const sealY = y + 10;
  doc.circle(sealX, sealY, 28).lineWidth(2).strokeColor('#d97706').stroke();
  doc.circle(sealX, sealY, 24).lineWidth(0.5).strokeColor('#b91c1c').stroke();
  doc.font('Helvetica-Bold')
     .fontSize(6)
     .fillColor('#b91c1c')
     .text('VERIFIED', sealX - 22, sealY - 12, { width: 44, align: 'center' });
  doc.font('Helvetica-Bold')
     .fontSize(8)
     .fillColor('#d97706')
     .text('★ LIFESAVER ★', sealX - 30, sealY - 4, { width: 60, align: 'center' });
  doc.font('Helvetica-Bold')
     .fontSize(5.5)
     .fillColor('#065f46')
     .text('BLOODLINK AI', sealX - 22, sealY + 6, { width: 44, align: 'center' });

  // Right Signature
  doc.moveTo(sigRightX, y).lineTo(sigRightX + 160, y).lineWidth(1).strokeColor('#94a3b8').stroke();
  doc.font('Helvetica-Bold')
     .fontSize(9)
     .fillColor('#0f172a')
     .text('Prof. Ramesh K. / Dr. Priya Sundaram', sigRightX, y + 6, { width: 160, align: 'center' });
  doc.font('Helvetica')
     .fontSize(7.5)
     .fillColor('#64748b')
     .text('Campus Blood Bank Coordinator\nYouth Red Cross & NSS Cell', sigRightX, y + 18, { width: 160, align: 'center' });

  doc.end();
}

module.exports = {
  generateRegistrationConfirmationPDF,
  generateDonationReceiptPDF,
  generateCertificatePDF
};
