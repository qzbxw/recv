"use client";

import { useState } from "react";

export type FaqAccordionItem = {
  question: string;
  answer: string;
};

export function FaqAccordion({
  items,
  eyebrow,
  initialOpen = 0,
  triggerClassName = "",
  questionClassName = "",
  answerClassName = "",
}: {
  items: FaqAccordionItem[];
  eyebrow: string;
  initialOpen?: number;
  triggerClassName?: string;
  questionClassName?: string;
  answerClassName?: string;
}) {
  const [openFaq, setOpenFaq] = useState(initialOpen);

  return (
    <div className="grid gap-6">
      {items.map((item, index) => {
        const isOpen = index === openFaq;
        return (
          <div
            key={item.question}
            className={`lend-faq-card lend-spotlight-card ${isOpen ? "is-open" : ""} group`}
          >
            <div className="lend-card-spotlight" />
            <div className="lend-faq-indicator" />

            <button
              onClick={() => setOpenFaq(isOpen ? -1 : index)}
              className={`lend-faq-trigger w-full ${triggerClassName}`}
            >
              <div className="flex flex-col gap-2 text-left">
                <span className="lend-faq-eyebrow">
                  {eyebrow} 0{index + 1}
                </span>
                <span className={`lend-faq-question ${questionClassName}`}>
                  {item.question}
                </span>
              </div>

              <div className="lend-faq-toggle-icon">
                <div className="lend-faq-toggle-bar h" />
                <div className="lend-faq-toggle-bar v" />
              </div>
            </button>

            <div className={`lend-faq-collapse ${isOpen ? "is-open" : ""}`}>
              <div className="lend-faq-collapse-inner">
                <p className={`lend-faq-answer ${answerClassName}`}>{item.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
