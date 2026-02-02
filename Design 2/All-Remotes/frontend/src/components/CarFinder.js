import { useState } from 'react';
import { Search, Car, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const CAR_MAKES = [
  'Toyota', 'Holden', 'Ford', 'Mazda', 'Hyundai', 'Nissan', 'Mitsubishi',
  'Subaru', 'Honda', 'Volkswagen', 'BMW', 'Mercedes-Benz', 'Audi', 'Kia',
  'Suzuki', 'Lexus', 'Jeep', 'Land Rover', 'Volvo', 'Peugeot', 'Isuzu',
  'Great Wall', 'Haval', 'MG', 'LDV', 'Renault', 'Skoda', 'Mini'
];

const AUSTRALIAN_STATES = [
  { code: 'NSW', name: 'New South Wales' },
  { code: 'VIC', name: 'Victoria' },
  { code: 'QLD', name: 'Queensland' },
  { code: 'WA', name: 'Western Australia' },
  { code: 'SA', name: 'South Australia' },
  { code: 'TAS', name: 'Tasmania' },
  { code: 'NT', name: 'Northern Territory' },
  { code: 'ACT', name: 'Australian Capital Territory' }
];

const YEARS = Array.from({ length: 30 }, (_, i) => (new Date().getFullYear() - i).toString());

const CarFinder = ({ onSearch }) => {
  const [rego, setRego] = useState('');
  const [regoState, setRegoState] = useState('');
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [manualState, setManualState] = useState('');

  const handleRegoSearch = async () => {
    if (!rego) {
      toast.error('Please enter a registration number');
      return;
    }
    
    if (!regoState) {
      toast.error('Please select your state');
      return;
    }

    toast.info(`Looking up ${regoState} registration...`);
    
    // Simulate API delay with state-specific lookup
    setTimeout(() => {
      const mockResults = {
        'NSW': { make: 'Toyota', model: 'Camry', year: '2018' },
        'VIC': { make: 'Holden', model: 'Commodore', year: '2016' },
        'QLD': { make: 'Ford', model: 'Ranger', year: '2019' },
        'WA': { make: 'Mazda', model: 'CX-5', year: '2017' },
        'SA': { make: 'Hyundai', model: 'i30', year: '2020' },
        'TAS': { make: 'Subaru', model: 'Outback', year: '2015' },
        'NT': { make: 'Toyota', model: 'Hilux', year: '2018' },
        'ACT': { make: 'Honda', model: 'CR-V', year: '2019' }
      };
      
      const mockResult = mockResults[regoState] || mockResults['NSW'];
      
      toast.success(`Found: ${mockResult.year} ${mockResult.make} ${mockResult.model}`);
      onSearch({
        brand: mockResult.make,
        model: `${mockResult.model} ${mockResult.year}`,
        state: regoState,
        type: 'rego'
      });
    }, 1500);
  };

  const handleManualSearch = () => {
    if (!selectedMake || !selectedYear) {
      toast.error('Please select make and year');
      return;
    }
    
    if (!manualState) {
      toast.error('Please select your state');
      return;
    }

    onSearch({
      brand: selectedMake,
      year: selectedYear,
      model: selectedModel || 'all',
      state: manualState,
      type: 'manual'
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 shadow-lg animate-fade-in" data-testid="car-finder">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4 md:mb-6">
        <div className="p-2 md:p-3 bg-red-50 rounded-full flex-shrink-0 animate-bounce-slow">
          <Car className="h-6 w-6 md:h-8 md:w-8 text-red-600" />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-black leading-tight" style={{ fontFamily: 'Chivo, sans-serif' }}>
            Find Your Car Remote
          </h2>
          <p className="text-xs md:text-sm text-gray-600">Search by rego or select manually</p>
        </div>
      </div>

      <Tabs defaultValue="rego" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4 md:mb-6">
          <TabsTrigger value="rego" data-testid="rego-tab" className="text-sm md:text-base">
            By Registration
          </TabsTrigger>
          <TabsTrigger value="manual" data-testid="manual-tab" className="text-sm md:text-base">
            Manual Selection
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rego" data-testid="rego-content" className="animate-slide-in">
          <div className="space-y-3 md:space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <MapPin className="h-4 w-4 text-red-600" />
                State/Territory *
              </label>
              <Select value={regoState} onValueChange={setRegoState}>
                <SelectTrigger data-testid="state-select" className="transition-all hover:border-red-600">
                  <SelectValue placeholder="Select your state" />
                </SelectTrigger>
                <SelectContent>
                  {AUSTRALIAN_STATES.map(state => (
                    <SelectItem key={state.code} value={state.code}>
                      {state.code} - {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Registration Number *</label>
              <Input
                placeholder="Enter rego (e.g., ABC123)"
                value={rego}
                onChange={(e) => setRego(e.target.value.toUpperCase())}
                className="text-base md:text-lg transition-all focus:ring-2 focus:ring-red-600"
                data-testid="rego-input"
              />
              <p className="text-xs text-gray-500 mt-2">
                Enter your vehicle registration to find compatible remotes automatically
              </p>
            </div>

            <Button
              onClick={handleRegoSearch}
              className="w-full bg-red-600 text-white hover:bg-red-700 h-11 md:h-12 text-sm md:text-base font-bold transition-all transform hover:scale-105"
              data-testid="rego-search-button"
            >
              <Search className="mr-2 h-4 w-4 md:h-5 md:w-5" />
              Search by Rego
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="manual" data-testid="manual-content" className="animate-slide-in">
          <div className="space-y-3 md:space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <MapPin className="h-4 w-4 text-red-600" />
                State/Territory *
              </label>
              <Select value={manualState} onValueChange={setManualState}>
                <SelectTrigger data-testid="manual-state-select" className="transition-all hover:border-red-600">
                  <SelectValue placeholder="Select your state" />
                </SelectTrigger>
                <SelectContent>
                  {AUSTRALIAN_STATES.map(state => (
                    <SelectItem key={state.code} value={state.code}>
                      {state.code} - {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Car Make *</label>
              <Select value={selectedMake} onValueChange={setSelectedMake}>
                <SelectTrigger data-testid="make-select" className="transition-all hover:border-red-600">
                  <SelectValue placeholder="Select make" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {CAR_MAKES.map(make => (
                    <SelectItem key={make} value={make}>{make}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Year *</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger data-testid="year-select" className="transition-all hover:border-red-600">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {YEARS.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Model (Optional)</label>
              <Input
                placeholder="e.g., Camry, Hilux"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="transition-all focus:ring-2 focus:ring-red-600"
                data-testid="model-input"
              />
            </div>

            <Button
              onClick={handleManualSearch}
              className="w-full bg-red-600 text-white hover:bg-red-700 h-11 md:h-12 text-sm md:text-base font-bold transition-all transform hover:scale-105"
              data-testid="manual-search-button"
            >
              <Search className="mr-2 h-4 w-4 md:h-5 md:w-5" />
              Find My Remote
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-4 md:mt-6 p-3 md:p-4 bg-gray-50 rounded border border-gray-200 animate-fade-in-delay">
        <h3 className="font-bold text-sm mb-2">Need help?</h3>
        <p className="text-xs text-gray-600">
          Can't find your remote? Contact us at <strong className="text-red-600">1300 REMOTE</strong> or send a photo of your current remote to our text line.
        </p>
      </div>
    </div>
  );
};

export default CarFinder;
