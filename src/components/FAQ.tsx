"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { FAQ_DATA, type FAQItem } from "@/config/faq";

interface FAQProps {
  category?: FAQItem["category"];
  limit?: number;
}

export function FAQ({ category, limit }: FAQProps) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  const faqs = category
    ? FAQ_DATA.filter((faq) => faq.category === category)
    : FAQ_DATA;

  const displayFaqs = limit ? faqs.slice(0, limit) : faqs;

  return (
    <div className="space-y-4">
      {displayFaqs.map((faq, index) => (
        <div
          key={index}
          className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden"
        >
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="font-semibold text-slate-900 dark:text-slate-100">{faq.question}</span>
            <ChevronDown
              className={`h-5 w-5 text-slate-500 dark:text-slate-400 transition-transform ${
                openIndex === index ? "rotate-180" : ""
              }`}
            />
          </button>
          {openIndex === index && (
            <div className="px-6 py-4 pt-0 text-slate-600 dark:text-slate-300 leading-relaxed">
              {faq.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
