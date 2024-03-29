import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { google } from "googleapis";
import { config } from "../configEnv.js";
dotenv.config();

const { OAuth2 } = google.auth;
const OAUTH_PLAYGROUND = "https://developers.google.com/oauthplayground";

const {
  MAILING_SERVICE_CLIENT_ID,
  MAILING_SERVICE_CLIENT_SECRET,
  MAILING_SERVICE_REFRESH_TOKEN,
  SENDER_EMAIL_ADDRESS,
} = process.env;

const oauth2Client = new OAuth2(
  MAILING_SERVICE_CLIENT_ID,
  MAILING_SERVICE_CLIENT_SECRET
);
oauth2Client.setCredentials({
  refresh_token: MAILING_SERVICE_REFRESH_TOKEN,
});

// send mail
export const sendEmail = (to, url, txt, type) => {
  const accessToken = oauth2Client.getAccessToken();
  const smtpTransport = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: SENDER_EMAIL_ADDRESS,
      clientId: MAILING_SERVICE_CLIENT_ID,
      clientSecret: MAILING_SERVICE_CLIENT_SECRET,
      refreshToken: MAILING_SERVICE_REFRESH_TOKEN,
      accessToken: accessToken,
    },
  });
  const mailOptions = {
    from: SENDER_EMAIL_ADDRESS,
    to: to,
    subject: "Super Project Activate Account",
    html: `
              <div style="max-width: 700px; margin:auto; border: 10px solid #ddd; padding: 50px 20px; font-size: 110%;">
              <h2 style="text-align: center; text-transform: uppercase;color: teal;">Welcome to the Super Project.</h2>
              <p>Congratulations! You're almost set to start using Super Project.
                  Just click the button below to validate your email address.
              </p>
              <a href=${url} style="background: crimson; text-decoration: none; color: white; padding: 10px 20px; margin: 10px 0; display: inline-block;">${txt}</a>
              <p>If the button doesn't work for any reason, you can also click on the link below:</p>
              <div>${url}</div>
              </div>
          `,
  };
  const mailForgot = {
    from: SENDER_EMAIL_ADDRESS,
    to: to,
    subject: "Super Project Activate Account",
    html: `
              <div style="max-width: 700px; margin:auto; border: 10px solid #ddd; padding: 50px 20px; font-size: 110%;">
              <h2 style="text-align: center; text-transform: uppercase;color: teal;">Welcome to the Super Project.</h2>
              <p style="text-align: center">${txt} : <span style="color:red">${url}</span> </p>
              
              </div>
          `,
  };
  smtpTransport.sendMail(
    type === "forgot" ? mailForgot : mailOptions,
    (err, infor) => {
      if (err) {
        console.log(err);
      } else {
        console.log(infor);
      }
      smtpTransport.close();
    }
  );
};
