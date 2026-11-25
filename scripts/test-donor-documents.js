const http = require('http');

const port = process.env.PORT || 5002;

// Helper to make HTTP requests (supports JSON and binary buffer data)
const request = (options, postData) => {
  return new Promise((resolve, reject) => {
    const reqOptions = { ...options, headers: { ...(options.headers || {}) } };
    let bodyBuffer = null;

    if (postData) {
      if (typeof postData === 'string') {
        bodyBuffer = Buffer.from(postData);
        reqOptions.headers['Content-Type'] = 'application/json';
      } else if (Buffer.isBuffer(postData)) {
        bodyBuffer = postData;
      } else {
        const bodyStr = JSON.stringify(postData);
        bodyBuffer = Buffer.from(bodyStr);
        reqOptions.headers['Content-Type'] = 'application/json';
      }
      reqOptions.headers['Content-Length'] = bodyBuffer.length;
    }

    const req = http.request(reqOptions, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const rawBuffer = Buffer.concat(chunks);
        let parsed = null;
        try {
          parsed = JSON.parse(rawBuffer.toString('utf8'));
        } catch (_) {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: parsed,
          buffer: rawBuffer
        });
      });
    });

    req.on('error', reject);
    if (bodyBuffer) req.write(bodyBuffer);
    req.end();
  });
};

const runDonorDocumentTests = async () => {
  console.log(`\n============================================================`);
  console.log(`🧪 Starting BloodLink AI Donor Document & Certificate Tests (Port ${port})`);
  console.log(`============================================================\n`);

  try {
    // 1. Authenticate Actors
    // A. Campus Admin
    const adminLogin = await request({
      hostname: 'localhost',
      port,
      path: '/api/auth/login',
      method: 'POST'
    }, { email: 'admin@campus.edu.in', password: 'Admin@123' });
    if (adminLogin.status !== 200) throw new Error(`Admin login failed: ${JSON.stringify(adminLogin.data)}`);
    const adminToken = adminLogin.data.token;
    console.log(`✓ 1. Campus Admin Authenticated: ${adminLogin.data.user.name}`);

    // B. Student Donor 1 (Rahul Sharma)
    const donor1Login = await request({
      hostname: 'localhost',
      port,
      path: '/api/auth/login',
      method: 'POST'
    }, { email: 'rahul.cse@campus.edu.in', password: 'Donor@123' });
    if (donor1Login.status !== 200) throw new Error(`Donor 1 login failed: ${JSON.stringify(donor1Login.data)}`);
    const donor1Token = donor1Login.data.token;
    console.log(`✓ 2. Student Donor 1 Authenticated: ${donor1Login.data.user.name} (${donor1Login.data.user.bloodGroup || donor1Login.data.user.profile?.bloodGroup})`);

    // C. Donor 2 (Dr. Anita Verma)
    const donor2Login = await request({
      hostname: 'localhost',
      port,
      path: '/api/auth/login',
      method: 'POST'
    }, { email: 'dr.anita.ece@campus.edu.in', password: 'Donor@123' });
    if (donor2Login.status !== 200) throw new Error(`Donor 2 login failed: ${JSON.stringify(donor2Login.data)}`);
    const donor2Token = donor2Login.data.token;
    console.log(`✓ 3. Donor 2 Authenticated: ${donor2Login.data.user.name}`);

    // 2. Test Unauthenticated Access
    const unauthRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/documents/registration',
      method: 'GET'
    });
    if (unauthRes.status !== 401) {
      throw new Error(`Expected 401 for unauthenticated registration download, got ${unauthRes.status}`);
    }
    console.log(`✓ 4. Unauthenticated download rejected with 401 Unauthorized`);

    // 3. Test My Documents List for Donor 1
    const myDocsRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/documents/my-documents',
      method: 'GET',
      headers: { Authorization: `Bearer ${donor1Token}` }
    });
    if (myDocsRes.status !== 200 || !myDocsRes.data?.success) {
      throw new Error(`Failed to fetch donor documents: ${JSON.stringify(myDocsRes.data)}`);
    }
    const registrationDoc = myDocsRes.data.documents.find(d => d.type === 'REGISTRATION_CONFIRMATION');
    if (!registrationDoc || !registrationDoc.reference.startsWith('BLD-REG-')) {
      throw new Error(`Registration confirmation document missing or invalid reference: ${JSON.stringify(registrationDoc)}`);
    }
    console.log(`✓ 5. Donor 1 My Documents returned registration confirmation reference: ${registrationDoc.reference}`);

    // 4. Test Donor Registration Confirmation PDF Download
    const regPdfRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/documents/registration',
      method: 'GET',
      headers: { Authorization: `Bearer ${donor1Token}` }
    });
    if (regPdfRes.status !== 200) {
      throw new Error(`Registration PDF download failed with status ${regPdfRes.status}`);
    }
    const contentType = regPdfRes.headers['content-type'];
    if (!contentType || !contentType.includes('application/pdf')) {
      throw new Error(`Expected application/pdf, received ${contentType}`);
    }
    const pdfMagic = regPdfRes.buffer.subarray(0, 4).toString('utf8');
    if (pdfMagic !== '%PDF') {
      throw new Error(`Invalid PDF header magic bytes: ${pdfMagic}`);
    }
    console.log(`✓ 6. Registration Confirmation PDF generated successfully (${regPdfRes.buffer.length} bytes, Magic: ${pdfMagic})`);

    // 5. Test Gating: Pending/Unverified Donation should NOT allow Receipt or Certificate
    // Fetch a partner hospital
    const hospitalsRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/hospitals',
      method: 'GET',
      headers: { Authorization: `Bearer ${donor1Token}` }
    });
    const hospitalList = hospitalsRes.data?.hospitals || [];
    const targetHospital = hospitalList[0];
    if (!targetHospital) {
      throw new Error('No partner hospitals found in database');
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const newDonationRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/donations',
      method: 'POST',
      headers: { Authorization: `Bearer ${donor1Token}` }
    }, {
      hospitalId: targetHospital._id,
      donationType: 'Whole Blood',
      preferredDate: tomorrow.toISOString().split('T')[0],
      preferredTime: '10:30 AM',
      location: `${targetHospital.hospitalName}, ${targetHospital.city}`,
      bloodGroup: 'B+'
    });
    if (newDonationRes.status !== 201 || !newDonationRes.data?.success) {
      throw new Error(`Failed to create new donation request: ${JSON.stringify(newDonationRes.data)}`);
    }
    const createdDonation = newDonationRes.data.donation;
    console.log(`✓ 7. Created unverified donation appointment: ${createdDonation.donationId} (Status: ${createdDonation.status})`);

    // Attempting to download receipt for unverified donation
    const earlyReceiptRes = await request({
      hostname: 'localhost',
      port,
      path: `/api/documents/receipt/${createdDonation._id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${donor1Token}` }
    });
    if (earlyReceiptRes.status !== 400) {
      throw new Error(`Expected HTTP 400 when downloading receipt for unverified donation, got ${earlyReceiptRes.status}`);
    }
    console.log(`✓ 8. Receipt gated: correctly rejected for unverified donation (${earlyReceiptRes.data?.message})`);

    // Attempting to download certificate for unverified donation
    const earlyCertRes = await request({
      hostname: 'localhost',
      port,
      path: `/api/documents/certificate/${createdDonation._id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${donor1Token}` }
    });
    if (earlyCertRes.status !== 400) {
      throw new Error(`Expected HTTP 400 when downloading certificate for unverified donation, got ${earlyCertRes.status}`);
    }
    console.log(`✓ 9. Certificate gated: correctly rejected for unverified donation (${earlyCertRes.data?.message})`);

    // 6. Complete and Verify Donation via Admin Lifecycle Workflow
    // Transition: SCHEDULED -> CHECK_IN -> DONATED
    const updateWorkflowStep = async (status, extra = {}) => {
      const stepRes = await request({
        hostname: 'localhost',
        port,
        path: `/api/donations/${createdDonation._id}/status`,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` }
      }, { status, ...extra });
      if (stepRes.status !== 200 || !stepRes.data?.success) {
        throw new Error(`Failed to update donation status to ${status}: ${JSON.stringify(stepRes.data)}`);
      }
      return stepRes.data.donation;
    };

    await updateWorkflowStep('SCHEDULED');
    await updateWorkflowStep('CHECK_IN');
    const completedDonation = await updateWorkflowStep('DONATED', {
      notes: 'Phlebotomy completed successfully at campus medical camp.'
    });
    console.log(`✓ 10. Donation advanced through lifecycle to verified status: ${completedDonation.status}`);

    // 7. Verify Completed Donation Appears in Donor's Documents List
    const updatedDocsRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/documents/my-documents',
      method: 'GET',
      headers: { Authorization: `Bearer ${donor1Token}` }
    });
    if (updatedDocsRes.status !== 200 || !updatedDocsRes.data?.success) {
      throw new Error(`Failed to fetch updated donor documents: ${JSON.stringify(updatedDocsRes.data)}`);
    }
    const receiptDoc = updatedDocsRes.data.documents.find(
      d => d.type === 'DONATION_RECEIPT' && (String(d.donationId) === String(createdDonation._id) || d.id === `rcp-${createdDonation._id}`)
    );
    const certDoc = updatedDocsRes.data.documents.find(
      d => d.type === 'CERTIFICATE_OF_APPRECIATION' && (String(d.donationId) === String(createdDonation._id) || d.id === `cert-${createdDonation._id}`)
    );
    if (!receiptDoc || !receiptDoc.reference.startsWith('RCP-')) {
      throw new Error(`Verified donation receipt document missing or invalid: ${JSON.stringify(receiptDoc)}`);
    }
    if (!certDoc || !certDoc.reference.startsWith('CERT-')) {
      throw new Error(`Verified certificate document missing or invalid: ${JSON.stringify(certDoc)}`);
    }
    console.log(`✓ 11. Documents list now includes Receipt (${receiptDoc.reference}) and Certificate (${certDoc.reference})`);

    // 8. Download Blood Donation Receipt PDF
    const receiptPdfRes = await request({
      hostname: 'localhost',
      port,
      path: `/api/documents/receipt/${createdDonation._id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${donor1Token}` }
    });
    if (receiptPdfRes.status !== 200) {
      throw new Error(`Donation Receipt PDF download failed with status ${receiptPdfRes.status}`);
    }
    const receiptPdfMagic = receiptPdfRes.buffer.subarray(0, 4).toString('utf8');
    if (receiptPdfMagic !== '%PDF') {
      throw new Error(`Invalid Receipt PDF magic: ${receiptPdfMagic}`);
    }
    const receiptDisposition = receiptPdfRes.headers['content-disposition'] || '';
    if (!receiptDisposition.includes('BloodLink_Donation_Receipt_')) {
      throw new Error(`Invalid receipt filename in Content-Disposition: ${receiptDisposition}`);
    }
    console.log(`✓ 12. Blood Donation Receipt PDF downloaded successfully (${receiptPdfRes.buffer.length} bytes, Disposition: ${receiptDisposition})`);

    // 9. Download Certificate of Appreciation PDF
    const certPdfRes = await request({
      hostname: 'localhost',
      port,
      path: `/api/documents/certificate/${createdDonation._id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${donor1Token}` }
    });
    if (certPdfRes.status !== 200) {
      throw new Error(`Certificate PDF download failed with status ${certPdfRes.status}`);
    }
    const certPdfMagic = certPdfRes.buffer.subarray(0, 4).toString('utf8');
    if (certPdfMagic !== '%PDF') {
      throw new Error(`Invalid Certificate PDF magic: ${certPdfMagic}`);
    }
    const certDisposition = certPdfRes.headers['content-disposition'] || '';
    if (!certDisposition.includes('BloodLink_Certificate_')) {
      throw new Error(`Invalid certificate filename in Content-Disposition: ${certDisposition}`);
    }
    console.log(`✓ 13. Certificate of Appreciation PDF downloaded successfully (${certPdfRes.buffer.length} bytes, Landscape A4)`);

    // 10. Security Isolation: Another donor (Donor 2) MUST be forbidden from downloading Donor 1's documents
    const crossDonorReceipt = await request({
      hostname: 'localhost',
      port,
      path: `/api/documents/receipt/${createdDonation._id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${donor2Token}` }
    });
    if (crossDonorReceipt.status !== 403) {
      throw new Error(`Expected HTTP 403 for unauthorized donor cross-access to receipt, got ${crossDonorReceipt.status}`);
    }

    const crossDonorCert = await request({
      hostname: 'localhost',
      port,
      path: `/api/documents/certificate/${createdDonation._id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${donor2Token}` }
    });
    if (crossDonorCert.status !== 403) {
      throw new Error(`Expected HTTP 403 for unauthorized donor cross-access to certificate, got ${crossDonorCert.status}`);
    }
    console.log(`✓ 14. Access Control: Donor 2 correctly forbidden (403) from downloading Donor 1 documents`);

    // 11. Admin Access: Campus Admin CAN download verified receipt and certificate
    const adminReceiptRes = await request({
      hostname: 'localhost',
      port,
      path: `/api/documents/receipt/${createdDonation._id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (adminReceiptRes.status !== 200) {
      throw new Error(`Campus Admin receipt download failed with status ${adminReceiptRes.status}`);
    }

    const adminCertRes = await request({
      hostname: 'localhost',
      port,
      path: `/api/documents/certificate/${createdDonation._id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (adminCertRes.status !== 200) {
      throw new Error(`Campus Admin certificate download failed with status ${adminCertRes.status}`);
    }
    console.log(`✓ 15. Admin Oversight: Campus Admin can download verified receipt and certificate for institutional records`);

    console.log(`\n============================================================`);
    console.log(`🎉 ALL DONOR DOCUMENT & CERTIFICATE TESTS PASSED SUCCESSFULLY!`);
    console.log(`============================================================\n`);
  } catch (err) {
    console.error(`\n❌ Donor Document test failed:`, err.message);
    process.exit(1);
  }
};

if (require.main === module) {
  runDonorDocumentTests();
}

module.exports = { runDonorDocumentTests };
