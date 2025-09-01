import { useState, useEffect, createContext, useContext } from "react";
import { Building2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

interface Company {
  id: string;
  name: string;
}

interface CompanyContextType {
  selectedCompany: string;
  setSelectedCompany: (id: string) => void;
  companies: Company[];
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const useCompanyContext = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    return { selectedCompany: "", setSelectedCompany: () => { }, companies: [] };
  }
  return context;
};

export const CompanyContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("");

  useEffect(() => {
    const fetchCompanies = async () => {
      const { data } = await supabase
        .from('companies')
        .select('id, name')
        .is('deleted_at', null)
        .order('name');

      if (data) {
        setCompanies(data);
        if (data.length > 0 && !selectedCompany) {
          setSelectedCompany(data[0].id);
        }
      }
    };

    fetchCompanies();
  }, []);

  return (
    <CompanyContext.Provider value={{ selectedCompany, setSelectedCompany, companies }}>
      {children}
    </CompanyContext.Provider>
  );
};

export function CompanyContextSwitcher() {
  const { selectedCompany, setSelectedCompany, companies } = useCompanyContext();

  if (companies.length === 0) {
    return (
      <div className="flex items-center gap-2 px-2.5 py-1.5 bg-gray-50 rounded-md border text-xs">
        <Building2 className="h-3.5 w-3.5 text-gray-400" />
        <span className="text-xs text-gray-500 truncate">No companies</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white rounded-md border shadow-sm text-xs w-full">
      <Building2 className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
      <Select value={selectedCompany} onValueChange={setSelectedCompany}>
        <SelectTrigger className="w-full border-0 bg-transparent focus:ring-0 text-xs font-medium text-gray-700 p-0 h-5 truncate">
          <SelectValue placeholder="Select Company" className="truncate" />
        </SelectTrigger>
        <SelectContent className="rounded-md border shadow-sm text-xs">
          {companies.map((company) => (
            <SelectItem
              key={company.id}
              value={company.id}
              className="text-xs py-1.5 px-2"
            >
              <span className="truncate">{company.name}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
