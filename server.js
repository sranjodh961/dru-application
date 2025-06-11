
import express from 'express';
import multer from 'multer';
import nodemailer from 'nodemailer';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { PDFDocument, rgb } from 'pdf-lib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer();

app.use(express.static(path.join(__dirname, 'public')));

app.post('/submit', upload.none(), async (req, res) => {
  try {
    const data = req.body;

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);
    const { width, height } = page.getSize();
    const fontSize = 12;
    let y = height - 40;

    page.drawText('Driver Application Form', { x: 50, y, size: 18 });
    y -= 30;

    const drawField = (label, value) => {
      page.drawText(label + ': ' + value, { x: 50, y, size: fontSize });
      y -= 20;
    };

    drawField('Full Name', data.fullName);
    drawField('Date of Birth', data.dob);
    drawField('Email', data.email);
    drawField('Phone', data.phone);
    drawField('Address', data.address);
    drawField('License Class', data.licenseClass);
    drawField('License Years', data.licenseYears);
    drawField('Position Applying For', data.position);
    drawField('Can Lift 50lbs', data.lift);
    drawField('Willing to Work Across Border', data.border);
    drawField('FAST Card', data.fast);
    drawField('Criminal Record', data.criminal);

    if (Array.isArray(data.company)) {
      data.company.forEach((comp, i) => {
        page.drawText('Employment ' + (i + 1), { x: 50, y, size: fontSize });
        y -= 20;
        drawField('Company', comp);
        drawField('Position', data.jobTitle[i]);
        drawField('Duration', data.jobDuration[i]);
      });
    }

    const authPage = pdfDoc.addPage([595, 842]);
    let ay = 780;
    authPage.drawText('Authorization', { x: 50, y: ay, size: 18 });
    ay -= 30;
    authPage.drawText('Authorization Name: ' + data.authName, { x: 50, y: ay, size: fontSize });
    ay -= 20;
    authPage.drawText('Authorization Date: ' + data.authDate, { x: 50, y: ay, size: fontSize });
    ay -= 40;
    authPage.drawText('Signature:', { x: 50, y: ay, size: fontSize });
    ay -= 100;

    if (data.signature) {
      const signatureImageBytes = Buffer.from(data.signature.split(',')[1], 'base64');
      const pngImage = await pdfDoc.embedPng(signatureImageBytes);
      authPage.drawImage(pngImage, {
        x: 50,
        y: ay,
        width: 200,
        height: 80,
      });
    }

    const pdfBytes = await pdfDoc.save();
    const pdfPath = path.join(__dirname, 'form-output.pdf');
    fs.writeFileSync(pdfPath, pdfBytes);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'sranjodh961@gmail.com',
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: 'sranjodh961@gmail.com',
      to: 'sranjodh961@gmail.com',
      subject: 'New Driver Application',
      text: 'A new application has been submitted.',
      attachments: [{
        filename: 'Driver_Application.pdf',
        path: pdfPath
      }]
    });

    res.send('Thank you for your submission!');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error generating PDF or sending email');
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
