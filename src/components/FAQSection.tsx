import { useState } from "react";
import { FAQ_ITEMS } from "../config/constants";
import "./FAQSection.css";

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section className="faq" aria-label="Frequently asked questions">
      <h2 className="faq__title">Frequently Asked Questions</h2>
      <div className="faq__list">
        {FAQ_ITEMS.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={item.question} className="faq__item">
              <button
                type="button"
                className="faq__question"
                aria-expanded={isOpen}
                onClick={() => toggle(index)}
              >
                <span>{item.question}</span>
                <span className="faq__chevron" aria-hidden="true">
                  {isOpen ? "−" : "+"}
                </span>
              </button>
              {isOpen && (
                <div className="faq__answer" role="region">
                  <p>{item.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
