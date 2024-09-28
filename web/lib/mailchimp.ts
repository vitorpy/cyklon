import axios from 'axios';

// Replace these with your actual Brevo API key and list ID
const API_KEY = process.env.NEXT_PUBLIC_BREVO_API_KEY;
const LIST_ID = '2';
const API_SERVER = 'https://api.brevo.com/v3';
const FROM_EMAIL = 'no-reply@blackpool.capital';
const TO_EMAIL = 'contact@blackpool.capital';

interface SubscribeData {
  email: string;
}

interface ContactFormData {
  name: string;
  email: string;
  message: string;
  subscribeNewsletter: boolean;
}

export async function subscribeToNewsletter(data: SubscribeData): Promise<boolean> {
  try {
    const response = await axios.post(
      `${API_SERVER}/contacts/doubleOptinConfirmation`,
      {
        email: data.email,
        emailBlacklisted: false,
        smsBlacklisted: false,
        includeListIds: [parseInt(LIST_ID)],
        templateId: 1,
        redirectionUrl: 'https://blackpool.capital/',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'api-key': API_KEY,
        },
      }
    );

    return response.status === 201;
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    return false;
  }
}

export async function submitContactForm(data: ContactFormData): Promise<boolean> {
  try {
    // Use Brevo API to send an email
    const response = await axios.post(
      `${API_SERVER}/smtp/email`,
      {
        sender: { email: FROM_EMAIL },
        to: [{ email: TO_EMAIL }],
        subject: 'New Contact Form Submission',
        htmlContent: `
          <p><strong>Name:</strong> ${data.name}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Message:</strong> ${data.message}</p>
        `,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'api-key': API_KEY,
        },
      }
    );

    if (response.status === 201) {
      console.log('Contact form submitted successfully');

      // If user wants to subscribe to the newsletter
      if (data.subscribeNewsletter) {
        await subscribeToNewsletter({ email: data.email });
      }

      return true;
    } else {
      console.error('Error submitting contact form:', response.data);
      return false;
    }
  } catch (error) {
    console.error('Error submitting contact form:', error);
    return false;
  }
}
