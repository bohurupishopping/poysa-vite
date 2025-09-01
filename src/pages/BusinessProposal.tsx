import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { ProposalForm } from '@/components/business-proposal/ProposalForm';
import { useBusinessProposal } from '@/hooks/useBusinessProposal';
import { useFileUpload } from '@/hooks/useFileUpload';
import { ProposalFormData } from '@/types/business-proposal';
import { toast } from 'sonner';

export const BusinessProposal: React.FC = () => {
  const navigate = useNavigate();
  const { proposal, loading, submitProposal } = useBusinessProposal();
  const { uploadMultipleFiles } = useFileUpload();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    // If user already has a proposal, redirect to pending assignment
    if (proposal && !loading) {
      navigate('/pending-assignment');
    }
  }, [proposal, loading, navigate]);

  const handleSubmit = async (formData: ProposalFormData) => {
    setIsSubmitting(true);
    
    try {
      let documentUrls: string[] = [];
      
      // Upload documents if any
      if (formData.documents.length > 0) {
        toast.info('Uploading documents...');
        documentUrls = await uploadMultipleFiles(formData.documents);
      }
      
      // Submit proposal
      await submitProposal(formData, documentUrls);
      
      toast.success('Business proposal submitted successfully!');
      setShowConfirmation(true);
      
      // Redirect to pending assignment after 3 seconds
      setTimeout(() => {
        navigate('/pending-assignment');
      }, 3000);
      
    } catch (error) {
      console.error('Error submitting proposal:', error);
      toast.error('Failed to submit proposal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (showConfirmation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl text-green-600">Proposal Submitted!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Thank you for submitting your business proposal. Our team will review your information and get back to you soon.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-center space-x-2 text-blue-600">
                <Clock className="h-5 w-5" />
                <span className="text-sm font-medium">Redirecting in 3 seconds...</span>
              </div>
            </div>
            <Button 
              onClick={() => navigate('/pending-assignment')}
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Business Proposal Submission
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Please provide your company information and supporting documents to complete your business proposal. 
            This information will help us understand your business needs and provide the best possible service.
          </p>
        </div>
        
        <div className="mb-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">Important Information</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• All fields marked with (*) are required</li>
                    <li>• You can upload up to 5 supporting documents (PDF, JPG, PNG)</li>
                    <li>• Each file must be smaller than 10MB</li>
                    <li>• Your proposal will be reviewed within 2-3 business days</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <ProposalForm 
          onSubmit={handleSubmit} 
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
};

export default BusinessProposal;