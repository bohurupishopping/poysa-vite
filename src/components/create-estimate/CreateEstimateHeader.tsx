import { ArrowLeft, Save, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface CreateEstimateHeaderProps {
    onSaveDraft: () => void;
    onSaveAndSend: () => void;
    saving: boolean;
    isEditing?: boolean;
}

export function CreateEstimateHeader({ onSaveDraft, onSaveAndSend, saving, isEditing = false }: CreateEstimateHeaderProps) {
    const navigate = useNavigate();

    return (
        <div className="mb-8 flex flex-col gap-6">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/manager/sales/estimates')}
                        className="rounded-full h-9 lg:h-10 bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                            {isEditing ? 'Edit Estimate' : 'Create Estimate'}
                        </h1>
                        <p className="text-gray-600">
                            {isEditing ? 'Update your sales estimate' : 'Generate a new sales estimate'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={onSaveDraft}
                        disabled={saving}
                        className="h-9 lg:h-10 px-3 lg:px-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                    >
                        <Save className="mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">Save Draft</span>
                    </Button>
                    <Button
                        onClick={onSaveAndSend}
                        disabled={saving}
                        className="h-9 lg:h-10 px-3 lg:px-4 bg-green-600 hover:bg-green-700 rounded-full transition-colors"
                    >
                        <Send className="mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">Save & Send</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}
