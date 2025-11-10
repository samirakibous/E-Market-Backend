// services/mailSender.js
import { transporter } from '../config/mail.js';

export const sendMail = async ({ to, subject, text, html }) => {
  try {
    await transporter.sendMail({
      from: `"E-Market" <${process.env.MAIL_USERNAME}>`,
      to,
      subject,
      text,
      html,
    });
    console.log(`Mail envoyé à ${to}`);
  } catch (err) {
    console.error("Erreur d'envoi de mail :", err);
  }
};
