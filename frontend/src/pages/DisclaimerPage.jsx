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
    </LegalPageLayout>
  );
};

export default DisclaimerPage;
