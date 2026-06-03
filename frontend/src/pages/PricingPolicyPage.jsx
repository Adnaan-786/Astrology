import React from 'react';
import LegalPageLayout from '@/components/LegalPageLayout';

const PricingPolicyPage = () => {
  return (
    <LegalPageLayout title="Pricing Policy">
      <h2 className="text-xl font-bold text-white mt-8 mb-4">Price Range</h2>
      <p>
        At AstroVedic AI, we have customized pricing according to the services rendered by us. The details are provided to you beforehand according to the effort, efficiency, and the output of the service.
      </p>

      <h2 className="text-xl font-bold text-white mt-8 mb-4">Customized Pricing</h2>
      <p>
        Our pricing is structured based on the type and complexity of the service. Different services may have different pricing tiers, which will be clearly communicated before purchase.
      </p>

      <h2 className="text-xl font-bold text-white mt-8 mb-4">Price Matching</h2>
      <p>
        At AstroVedic AI, we are committed to offering you the best possible prices. We will be glad to meet our competitor's pricing if you ever find a service that we offer, in similar interest and providing the same features, available from a similar service provider.
      </p>
      <p className="mt-4">
        Our prices do not vary according to the market needs, competitor pricing, etc.
      </p>

      <h2 className="text-xl font-bold text-white mt-8 mb-4">Pricing Errors</h2>
      <p>
        We work hard to ensure the accuracy of pricing. Despite our efforts, pricing errors may still occur. If a service's price is higher than the price displayed, we will cancel your booking and notify you of the cancellation.
      </p>

      <h2 className="text-xl font-bold text-white mt-8 mb-4">Personal Use</h2>
      <p>
        Our services are offered by AstroVedic AI for your personal needs. Therefore, we reserve the right to refuse to sell to any person whom we believe may be misusing the service.
      </p>

      <p className="mt-8">
        Please feel free to reach us at: <a href="mailto:astrovedicaiii@gmail.com" className="text-[#F5C842] hover:underline">astrovedicaiii@gmail.com</a>
      </p>
    </LegalPageLayout>
  );
};

export default PricingPolicyPage;
