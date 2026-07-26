import { useState } from "react";
import { contactProvider } from "../data/contactProvider";

export default function ContactForm() {
  const [status, setStatus] = useState("");

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    const form = e.currentTarget;
    const data = new FormData(form);

    data.append(
      "access_key",
      import.meta.env.VITE_WEB3FORMS_ACCESS_KEY
    );

    try {
      const response = await fetch(
        "https://api.web3forms.com/submit",
        {
          method: "POST",
          body: data,
        }
      );

      const result = await response.json();

      if (result.success) {
        setStatus("Message sent successfully");
        form.reset();
      } else {
        setStatus("Failed to send message");
      }

    } catch {
      setStatus("Something went wrong");
    }
  }


  return (
    <section>
      <h2>Contact Support</h2>

      <p>
        Provider: {contactProvider.provider}
      </p>

      <form onSubmit={handleSubmit}>

        <input
          name="name"
          placeholder="Your name"
          required
        />

        <input
          name="email"
          type="email"
          placeholder="Email"
          required
        />

        <textarea
          name="message"
          placeholder="Message"
          required
        />

        <button type="submit">
          Send
        </button>

      </form>

      <p>{status}</p>
    </section>
  );
}