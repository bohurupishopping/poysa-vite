import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, Image, X } from 'lucide-react';
import { ProposalFormData } from '@/types/business-proposal';
import { useFileUpload } from '@/hooks/useFileUpload';
import { toast } from 'sonner';

interface ProposalFormProps {
  onSubmit: (data: ProposalFormData) => void;
  isSubmitting: boolean;
}

export const ProposalForm: React.FC<ProposalFormProps> = ({ onSubmit, isSubmitting }) => {
  const { uploads, clearUploads } = useFileUpload();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ProposalFormData>({
    full_name: '',
    phone: '',
    email: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state_province: '',
    postal_code: '',
    country: 'India',
    company_name: '',
    is_gst_registered: false,
    gstin: '',
    documents: []
  });

  const [errors, setErrors] = useState<Partial<ProposalFormData>>({});

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<ProposalFormData> = {};

    if (step === 1) {
      if (!formData.full_name.trim()) newErrors.full_name = 'Full name is required';
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
      
      // Email validation with format check
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else {
        const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
        if (!emailRegex.test(formData.email)) {
          newErrors.email = 'Please enter a valid email address';
        }
      }
      
      if (!formData.company_name.trim()) newErrors.company_name = 'Company name is required';
      if (!formData.address_line_1.trim()) newErrors.address_line_1 = 'Address line 1 is required';
      if (!formData.city.trim()) newErrors.city = 'City is required';
      if (!formData.state_province.trim()) newErrors.state_province = 'State/Province is required';
      if (!formData.postal_code.trim()) newErrors.postal_code = 'Postal code is required';
      
      if (formData.is_gst_registered && !formData.gstin.trim()) {
        newErrors.gstin = 'GSTIN is required when GST registered';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (formData.documents.length + files.length > 5) {
      toast.error('Maximum 5 files allowed');
      return;
    }

    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      toast.error('Only PDF and image files are allowed');
      return;
    }

    const oversizedFiles = files.filter(file => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error('Files must be smaller than 10MB');
      return;
    }

    setFormData(prev => ({
      ...prev,
      documents: [...prev.documents, ...files]
    }));
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = () => {
    if (validateStep(1)) {
      onSubmit(formData);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  className={errors.full_name ? 'border-red-500' : ''}
                />
                {errors.full_name && <p className="text-red-500 text-sm mt-1">{errors.full_name}</p>}
              </div>
              
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                className={errors.company_name ? 'border-red-500' : ''}
              />
              {errors.company_name && <p className="text-red-500 text-sm mt-1">{errors.company_name}</p>}
            </div>

            <div>
              <Label htmlFor="address_line_1">Address Line 1 *</Label>
              <Input
                id="address_line_1"
                value={formData.address_line_1}
                onChange={(e) => setFormData(prev => ({ ...prev, address_line_1: e.target.value }))}
                className={errors.address_line_1 ? 'border-red-500' : ''}
              />
              {errors.address_line_1 && <p className="text-red-500 text-sm mt-1">{errors.address_line_1}</p>}
            </div>

            <div>
              <Label htmlFor="address_line_2">Address Line 2</Label>
              <Input
                id="address_line_2"
                value={formData.address_line_2}
                onChange={(e) => setFormData(prev => ({ ...prev, address_line_2: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  className={errors.city ? 'border-red-500' : ''}
                />
                {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
              </div>
              
              <div>
                <Label htmlFor="state_province">State/Province *</Label>
                <Input
                  id="state_province"
                  value={formData.state_province}
                  onChange={(e) => setFormData(prev => ({ ...prev, state_province: e.target.value }))}
                  className={errors.state_province ? 'border-red-500' : ''}
                />
                {errors.state_province && <p className="text-red-500 text-sm mt-1">{errors.state_province}</p>}
              </div>
              
              <div>
                <Label htmlFor="postal_code">Postal Code *</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
                  className={errors.postal_code ? 'border-red-500' : ''}
                />
                {errors.postal_code && <p className="text-red-500 text-sm mt-1">{errors.postal_code}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_gst_registered"
                  checked={formData.is_gst_registered}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_gst_registered: checked, gstin: checked ? prev.gstin : '' }))}
                />
                <Label htmlFor="is_gst_registered">GST Registered</Label>
              </div>
              
              {formData.is_gst_registered && (
                <div>
                  <Label htmlFor="gstin">GSTIN *</Label>
                  <Input
                    id="gstin"
                    value={formData.gstin}
                    onChange={(e) => setFormData(prev => ({ ...prev, gstin: e.target.value }))}
                    className={errors.gstin ? 'border-red-500' : ''}
                    placeholder="Enter your GSTIN"
                  />
                  {errors.gstin && <p className="text-red-500 text-sm mt-1">{errors.gstin}</p>}
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label>Supporting Documents (Optional - Max 5 files)</Label>
              <div className="mt-2">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Drag and drop files here, or click to select</p>
                  <p className="text-sm text-gray-500 mb-4">PDF, JPG, PNG files up to 10MB each</p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    Select Files
                  </Button>
                </div>
              </div>
            </div>

            {formData.documents.length > 0 && (
              <div>
                <Label>Selected Files ({formData.documents.length}/5)</Label>
                <div className="mt-2 space-y-2">
                  {formData.documents.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {file.type.startsWith('image/') ? (
                          <Image className="h-5 w-5 text-blue-500" />
                        ) : (
                          <FileText className="h-5 w-5 text-red-500" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Review Your Information</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Full Name</Label>
                  <p className="text-sm">{formData.full_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Phone</Label>
                  <p className="text-sm">{formData.phone}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-500">Email</Label>
                <p className="text-sm">{formData.email}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-500">Company Name</Label>
                <p className="text-sm">{formData.company_name}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-500">Address</Label>
                <p className="text-sm">
                  {formData.address_line_1}
                  {formData.address_line_2 && `, ${formData.address_line_2}`}
                  <br />
                  {formData.city}, {formData.state_province} {formData.postal_code}
                  <br />
                  {formData.country}
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-500">GST Registration</Label>
                <p className="text-sm">
                  {formData.is_gst_registered ? `Yes - ${formData.gstin}` : 'No'}
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-500">Documents</Label>
                <p className="text-sm">
                  {formData.documents.length > 0 
                    ? `${formData.documents.length} file(s) selected`
                    : 'No documents uploaded'
                  }
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const stepTitles = [
    'Company Information',
    'Document Upload',
    'Review & Submit'
  ];

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>Business Proposal - {stepTitles[currentStep - 1]}</CardTitle>
          <div className="text-sm text-gray-500">Step {currentStep} of 3</div>
        </div>
        <Progress value={(currentStep / 3) * 100} className="w-full" />
      </CardHeader>
      
      <CardContent>
        {renderStepContent()}
        
        <div className="flex justify-between mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            Previous
          </Button>
          
          {currentStep < 3 ? (
            <Button type="button" onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Proposal'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};