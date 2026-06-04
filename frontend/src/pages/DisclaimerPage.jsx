import React from 'react';
import LegalPageLayout from '@/components/LegalPageLayout';

const DisclaimerPage = () => {
  return (
    <LegalPageLayout title="Our Disclaimer">
      <p>
        The information and data contained on the AstroVedic AI website is to be treated purely for your informational and entertainment purposes only. Any prediction, report, horoscope, Kundli, or other content that you receive is AI-generated and is not a substitute for advice, programs, or treatment that you would normally receive from a licensed professional such as a lawyer, doctor, psychiatrist, or financial advisor. Accordingly, AstroVedic AI provides no guarantees, implied warranties, or assurances of any kind, and will not be responsible for any interpretation made or use by the recipient of the information and data mentioned above.
      </p>

      <p className="mt-6">
        AstroVedic AI is a product of AstroVedic AI. All transactions and gathered data are/will be accessed by AstroVedic AI.
      </p>

      <h2 className="text-xl font-bold text-white mt-8 mb-4">STRICT NO-REFUND POLICY</h2>
      <ul className="space-y-4 list-disc pl-5 text-zinc-300">
        <li>
          <strong>All Sales are Final:</strong> Because AI astrology charts, Kundlis, and reports are digital products delivered instantaneously upon payment, all transactions are strictly non-refundable and non-cancellable.
        </li>
        <li>
          <strong>Technical Glitches:</strong> Refunds or manual delivery will only be processed if a user’s bank account is debited but a technical server error prevents the AI output from being generated. Such verified cases must be emailed to astrovedicaiii@gmail.com and will be resolved within 7-10 working days.
        </li>
      </ul>
    </LegalPageLayout>
  );
};

export default DisclaimerPage;
