import React, { useState } from "react";
import { Plus, Minus } from "lucide-react";

const FAQ_ITEMS = [
  {
    question: "1. Em quanto tempo começo a perceber diferença?",
    answer:
      "Muitos clientes relatam melhorias na mobilidade e sensação de corpo mais leve logo nas primeiras semanas de uso diário. Como os resultados são cumulativos, recomendamos o uso contínuo para suporte integral.",
  },
  {
    question: "2. Preciso tomar todos os dias?",
    answer:
      "Sim. A constância é fundamental. O MIX10 PRO foi desenvolvido como um suplemento de uso diário para suprir continuamente as articulações e os músculos com os nutrientes necessários.",
  },
  {
    question: "3. O MIX10 PRO é medicamento?",
    answer:
      "Não. O MIX10 PRO é um suplemento alimentar de formulação premium, 100% regularizado perante as normas de suplementos da ANVISA. Ele apoia a saúde do corpo sem os efeitos colaterais de anti-inflamatórios ou medicamentos sintéticos.",
  },
  {
    question: "4. Qual o diferencial da fórmula?",
    answer:
      "Ao contrário de suplementos comuns que usam ativos isolados (ex: apenas Colágeno), o MIX10 PRO combina 10 ativos estratégicos (Colágeno Tipo II, MSM, Condroitina, Cúrcuma, Vitaminas e Minerais) que atuam em sinergia completa.",
  },
  {
    question: "5. Há contraindicações?",
    answer:
      "O MIX10 PRO é produzido com ingredientes seguros e naturais. Gestantes, lactantes e portadores de enfermidades graves devem consultar um médico antes de iniciar o uso de qualquer suplemento.",
  },
  {
    question: "6. Como funciona o envio do produto?",
    answer:
      "Os pedidos são despachados em até 24 horas úteis após a confirmação do pagamento. Você receberá por e-mail e WhatsApp o código de rastreio para acompanhar a entrega.",
  },
  {
    question: "7. Quanto tempo demora para chegar?",
    answer:
      "O prazo médio de entrega para a região Sudeste é de 3 a 7 dias úteis. Para as demais regiões, o prazo pode variar de 5 a 10 dias úteis, conforme a localidade e opção de envio.",
  },
];

interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200/80 py-4.5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left text-xs sm:text-sm font-bold text-gray-900 transition-colors hover:text-emerald-800 cursor-pointer"
      >
        <span>{question}</span>
        <span className="ml-4 shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-emerald-50 text-emerald-800">
          {isOpen ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
        </span>
      </button>
      
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-52 opacity-100 mt-3" : "max-h-0 opacity-0"
        }`}
      >
        <p className="text-xs sm:text-sm font-normal text-gray-600 leading-relaxed pl-1">
          {answer}
        </p>
      </div>
    </div>
  );
}

export default function FAQ() {
  return (
    <section
      data-section="faq"
      id="faq"
      className="bg-[#F8F6F4]/55 py-20 lg:py-24 px-3 sm:px-8"
    >
      <div className="mx-auto max-w-2xl">
        <div className="text-center mb-12">
          <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Dúvidas Frequentes
          </span>
          <h2 className="mt-4 text-2xl font-light tracking-tight text-gray-900 sm:text-3xl leading-[1.2]">
            O que você <span className="italic">precisa saber</span> sobre o MIX10
          </h2>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-gray-200/60">
          {FAQ_ITEMS.map((item, idx) => (
            <FAQItem key={idx} question={item.question} answer={item.answer} />
          ))}
        </div>
      </div>
    </section>
  );
}
