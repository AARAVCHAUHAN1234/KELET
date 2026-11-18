import React from 'react';

interface ClaimVerificationProps {
  claims: any[];
  verification: any[];
}

const ClaimVerification: React.FC<ClaimVerificationProps> = ({ claims, verification }) => {
  return (
    <div className="h-64 bg-raised rounded border border-border p-2 overflow-auto">
      <h2 className="text-lg mb-2">Claim Verification</h2>
      {claims && claims.length > 0 ? (
        claims.map((c, idx) => (
          <div key={idx} className="mb-2">
            <p className="font-medium text-primary">{c.claim}</p>
            <p className="text-sm text-muted">
              Status: {verification && verification[idx] ? verification[idx].status : '—'}
            </p>
          </div>
        ))
      ) : (
        <p className="text-muted">No claims available yet.</p>
      )}
    </div>
  );
};

export default ClaimVerification;
