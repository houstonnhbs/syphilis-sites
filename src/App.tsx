import { useEffect, useRef, useState } from 'react';
import { 
  MapPin, 
  Filter, 
  Search, 
  Clock, 
  Phone, 
  RotateCcw, 
  Layers
} from 'lucide-react';
import { HOUSTON_MOCK_SITES } from './data';
import { SurveySite, ClinicTypeFilter } from './types';
import { ZIP_CENTROIDS, getHaversineDistance } from './zipCodes';

export default function App() {
  const L = (window as any).L;

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<ClinicTypeFilter>('ALL');
  const [zipQuery, setZipQuery] = useState('');
  
  // Selected site for detail panel
  const [selectedSite, setSelectedSite] = useState<SurveySite | null>(HOUSTON_MOCK_SITES[0]);
  
  // Map References
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const mapContainerId = 'react-map-container';

  // Validate ZIP code formats
  const isValidZip = (zip: string) => /^\d{5}$/.test(zip);

  // Get centroid coordinates of the entered ZIP query
  const getZipCentroid = (zip: string): [number, number] | null => {
    if (!isValidZip(zip)) return null;
    if (ZIP_CENTROIDS[zip]) {
      return ZIP_CENTROIDS[zip];
    }
    // Dynamic extraction fallback from current mock sites
    for (const site of HOUSTON_MOCK_SITES) {
      const match = site.address.match(/TX\s+(\d{5})/i);
      if (match && match[1] === zip) {
        return site.coordinates;
      }
    }
    return null;
  };

  const targetCentroid = getZipCentroid(zipQuery);

  // Initial filtering logic (text query + type)
  const filteredSites = HOUSTON_MOCK_SITES.filter(site => {
    const matchesSearch = 
      site.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      site.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'ALL' || site.type === selectedType;
    
    return matchesSearch && matchesType;
  });

  // Dynamic distance attachments & premium sorting when a valid ZIP is specified
  const sitesWithDistance = filteredSites.map(site => {
    const distance = targetCentroid 
      ? getHaversineDistance(targetCentroid, site.coordinates) 
      : null;
    return { ...site, distance };
  });

  if (targetCentroid) {
    sitesWithDistance.sort((a, b) => {
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });
  }

  // Calculate high-level KPIs based on loaded sites
  const kpis = {
    total: HOUSTON_MOCK_SITES.length,
    department: HOUSTON_MOCK_SITES.filter(s => s.type === 'Department').length,
    community: HOUSTON_MOCK_SITES.filter(s => s.type === 'Community').length,
  };

  // Initialize and maintain map instance
  useEffect(() => {
    if (!L) return;

    const container = document.getElementById(mapContainerId);
    if (!container) return;

    // Center map around Houston and surrounding areas with view zoom of 10 to fit far clinics like Conroe or Dickinson
    const map = L.map(mapContainerId, {
      center: [29.7450, -95.3900],
      zoom: 10,
      zoomControl: true,
      fadeAnimation: true
    });
    
    mapRef.current = map;

    // Load light CartoDB Voyager map layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(map);

    // Initial Marker rendering
    updateMapMarkers(sitesWithDistance);

    // Cleanup hook
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current.clear();
      }
    };
  }, []); // Run on mount

  // Update markers when filtered lists or distance calculations change
  useEffect(() => {
    if (mapRef.current) {
      updateMapMarkers(sitesWithDistance);
    }
  }, [searchQuery, selectedType, zipQuery, sitesWithDistance.length]);

  // Adjust zoom & pan automatically when a valid ZIP is resolved
  useEffect(() => {
    if (mapRef.current && targetCentroid) {
      mapRef.current.setView(targetCentroid, 12, { animate: true, duration: 0.8 });
      if (sitesWithDistance.length > 0) {
        const closestSite = sitesWithDistance[0];
        setSelectedSite(closestSite);
        
        // Wait a small buffer to let the animation complete
        setTimeout(() => {
          const marker = markersRef.current.get(closestSite.id);
          if (marker) {
            marker.openPopup();
          }
        }, 800);
      }
    }
  }, [zipQuery]);

  // Helper to draw custom HTML marker pinheads
  const updateMapMarkers = (sites: any[]) => {
    const map = mapRef.current;
    if (!map || !L) return;

    // Remove existing markers
    markersRef.current.forEach(marker => map.removeLayer(marker));
    markersRef.current.clear();

    sites.forEach(site => {
      // Houston Health Dept (Blue) or Community Clinic (Orange)
      const pinColor = site.type === 'Department' ? '#102A4C' : '#F37021';

      // Define Custom Div Icon Pinhead shape matching the natural theme
      const customIcon = L.divIcon({
        html: `
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            background-color: ${pinColor};
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 4px 10px rgba(16, 42, 76, 0.25);
            border: 2px solid white;
            transition: all 0.2s;
          " class="custom-map-pin">
            <div style="
              width: 10px;
              height: 10px;
              background-color: white;
              border-radius: 50%;
              transform: rotate(45deg);
            "></div>
          </div>
        `,
        className: 'custom-leaflet-pin',
        iconSize: [32, 40],
        iconAnchor: [16, 40],
        popupAnchor: [0, -36]
      });

      // Construct popup styling with details
      const badgeClass = site.type === 'Department' 
        ? 'bg-[#EBF3FC] border-[#AECBF4] text-[#102A4C]' 
        : 'bg-[#FFF3EB] border-[#FED9C0] text-[#F37021]';

      let distanceLine = '';
      if (site.distance !== null && site.distance !== undefined) {
        distanceLine = `
          <div style="font-size: 11px; font-weight: bold; color: #F37021; margin: 4px 0 2px 0;">
            📍 ${site.distance.toFixed(1)} miles away
          </div>
        `;
      }

      const popupHtml = `
        <div style="font-family: 'Inter', sans-serif; padding: 0.375rem; max-width: 250px; color: #102A4C;">
          <div style="display: flex; align-items: center; gap: 0.375rem; margin-bottom: 0.375rem;">
            <span style="font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 4px; border: 1px solid;" class="${badgeClass}">
              ${site.type === 'Department' ? 'HOUSTON HEALTH DEPT' : 'COMMUNITY PARTNER'}
            </span>
          </div>
          <h4 style="font-weight: 700; font-size: 13.5px; margin: 0; color: #102A4C; font-family: 'Outfit', sans-serif;">${site.name}</h4>
          <p style="font-size: 11px; color: #4A5568; margin: 3px 0 0 0; line-height: 1.3;">${site.address}</p>
          ${distanceLine}
          <div style="height: 1px; background-color: #E2E8F0; margin: 6px 0;"></div>
          <p style="font-size: 10px; color: #4A5568; line-height: 1.3; margin: 0;">${site.hours}</p>
        </div>
      `;

      const marker = L.marker(site.coordinates, { icon: customIcon })
        .bindPopup(popupHtml, { closeButton: false, offset: L.point(0, -2) })
        .addTo(map);

      // Store marker ref
      markersRef.current.set(site.id, marker);

      // On marker click update detail pane
      marker.on('click', () => {
        setSelectedSite(site);
      });
    });
  };

  // Interactive interaction logic from state to map panning
  const focusOnSite = (site: SurveySite) => {
    setSelectedSite(site);
    const map = mapRef.current;
    const marker = markersRef.current.get(site.id);
    
    if (map && marker) {
      map.setView(site.coordinates, 14, { animate: true, duration: 0.8 });
      marker.openPopup();
    }
  };

  // Reset filter selections
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedType('ALL');
    setZipQuery('');
    if (mapRef.current) {
      mapRef.current.setView([29.7450, -95.3900], 10);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-hhd-orange/10 selection:text-hhd-blue">
      
      {/* 🚀 Header Branding Bar */}
      <header className="bg-hhd-blue text-white border-b border-hhd-blue/80 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-hhd-orange border border-white/10 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-hhd-orange animate-pulse"></span>
                Official Provider Locator & Interactive Information Map
              </span>
              <h1 className="text-3xl font-bold font-display tracking-tight text-white flex items-center gap-2">
                Houston NHBS Syphilis Testing Sites
              </h1>
              <p className="text-hhd-grey text-sm mt-1 max-w-2xl font-sans">
                Comprehensive mapping, addresses, operational hours, and Syphilis testing services of official Houston Health Department clinics and supportive Community partners.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Primary KPI Status Band */}
      <section className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center animate-fade-in">
            
            <div className="bg-slate-50 rounded-xl py-3 px-4 border border-slate-200 flex flex-col justify-center items-center">
              <span className="text-[10px] text-slate-custom font-bold font-mono tracking-wider uppercase mb-1">TOTAL CLINIC SITES</span>
              <span className="text-2xl font-extrabold text-hhd-blue">{kpis.total}</span>
            </div>

            <div className="bg-[#EBF3FC] rounded-xl py-3 px-4 border border-[#CADDF6] flex flex-col justify-center items-center">
              <span className="text-[10px] text-hhd-blue font-bold font-mono tracking-wider uppercase mb-1">HEALTH DEPARTMENT CLINICS</span>
              <span className="text-2xl font-extrabold text-hhd-blue">{kpis.department}</span>
            </div>

            <div className="bg-[#FFF3EB] rounded-xl py-3 px-4 border border-[#FCD4BB] flex flex-col justify-center items-center">
              <span className="text-[10px] text-hhd-orange font-bold font-mono tracking-wider uppercase mb-1">COMMUNITY CLINICS</span>
              <span className="text-2xl font-extrabold text-hhd-orange">{kpis.community}</span>
            </div>

          </div>
        </div>
      </section>

      {/* Main Interactive Workspace */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Interactive Map & Detail View Card (Right Panel on Desktop, Top on Mobile) */}
          <div className="lg:col-span-8 flex flex-col gap-6 order-1 lg:order-2">
            
            {/* Interactive Leaflet Map Sandbox Panel */}
            <div className="relative bg-white border border-stone-200 rounded-3xl p-3.5 shadow-sm overflow-hidden">
              
              {/* Leaflet Anchor */}
              <div 
                id={mapContainerId} 
                className="rounded-2xl bg-stone-50 border border-stone-200/40"
                style={{ height: '480px', width: '100%', position: 'relative' }}
              ></div>

              {/* Dynamic Floating Visual Legend */}
              <div className="absolute bottom-7 right-7 z-[510] bg-white/95 backdrop-blur-md border border-stone-200 rounded-2xl p-4 shadow-lg max-w-[240px]">
                <h3 className="text-xs font-bold font-display text-hhd-blue uppercase tracking-tight mb-2.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-hhd-orange" />
                  Map Pin Key
                </h3>
                
                <div className="space-y-2.5 text-[11px]">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full border border-white bg-hhd-blue shadow-sm"></span>
                    <span className="text-slate-600 font-semibold">Houston Health Dept</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full border border-white bg-hhd-orange shadow-sm"></span>
                    <span className="text-slate-600 font-semibold">Community Partners</span>
                  </div>
                </div>

                <div className="h-px bg-stone-100 my-2.5"></div>
                
                <div className="text-[9px] text-slate-custom leading-relaxed font-mono">
                  CLICK ON PINS TO ZOOM & REVEAL OPERATIONAL TIMINGS.
                </div>
              </div>

            </div>

            {/* Dynamic focused Detail Card */}
            {selectedSite && (
              <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 relative overflow-hidden animate-fade-in">
                <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-hhd-blue/5 to-transparent pointer-events-none"></div>
                
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wide uppercase ${
                        selectedSite.type === 'Department' 
                          ? 'bg-[#EBF3FC] border-[#AECBF4] text-hhd-blue border' 
                          : 'bg-[#FFF3EB] border-[#FED9C0] text-[#F37021] border'
                      }`}>
                        {selectedSite.type === 'Department' ? 'Houston Health Department Facility' : 'Community Clinic Partner'}
                      </span>
                      
                      {zipQuery && isValidZip(zipQuery) && targetCentroid && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#EBF3FC] text-hhd-blue border border-[#CADDF6]">
                          📍 {getHaversineDistance(targetCentroid, selectedSite.coordinates).toFixed(1)} miles from ZIP {zipQuery}
                        </span>
                      )}

                      <span className="text-[11px] font-mono text-slate-custom">
                        Lat: {selectedSite.coordinates[0].toFixed(4)}, Lng: {selectedSite.coordinates[1].toFixed(4)}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-bold font-display text-hhd-blue tracking-tight">
                      {selectedSite.name}
                    </h3>
                    
                    <p className="text-sm text-slate-custom mt-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-hhd-orange shrink-0" />
                      {selectedSite.address}
                    </p>
                  </div>

                  <div className="flex flex-row md:flex-col gap-2 shrink-0">
                    <div className="flex items-center gap-2 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-hhd-blue font-semibold">
                      <Phone className="w-3.5 h-3.5 text-hhd-orange shrink-0" />
                      <span className="font-mono">{selectedSite.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-hhd-blue font-semibold">
                      <Clock className="w-3.5 h-3.5 text-hhd-orange shrink-0" />
                      <span>{selectedSite.hours}</span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-slate-custom leading-relaxed max-w-4xl bg-slate-50/70 rounded-2xl p-4 border border-slate-100">
                  <strong className="text-hhd-blue font-bold">Services & Description:</strong> {selectedSite.description}
                </p>
              </div>
            )}

          </div>

          {/* Filter Drawer & Site Directory (Left Panel on Desktop, Bottom on Mobile) */}
          <div className="lg:col-span-4 flex flex-col gap-6 order-2 lg:order-1">
            
            {/* Directory Filter Panel Card */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold font-display text-hhd-blue flex items-center gap-2">
                  <Filter className="w-4 h-4 text-hhd-orange" />
                  Filter Facilities
                </h2>
                <button 
                  onClick={handleResetFilters}
                  className="text-xs text-slate-custom hover:text-hhd-orange font-semibold flex items-center gap-1 transition"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset Filters
                </button>
              </div>

              <div className="space-y-4">
                
                {/* Nearest 5-Digit ZIP Code Search */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[10px] font-bold text-slate-custom font-mono uppercase tracking-wider">
                      Closest ZIP Code Search
                    </label>
                    {zipQuery && (
                      <span className="text-[10px] font-bold text-hhd-orange font-mono">
                        {targetCentroid ? '✓ Sort Active' : 'Unresolved ZIP'}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-[#F37021] shrink-0" />
                    <input 
                      type="text" 
                      maxLength={5}
                      value={zipQuery}
                      onChange={(e) => {
                        const cleanVal = e.target.value.replace(/\D/g, '');
                        setZipQuery(cleanVal);
                      }}
                      placeholder="Enter 5-digit ZIP (e.g. 77002, 77036)"
                      className="w-full text-sm bg-slate-50 border border-stone-200 rounded-xl pl-10 pr-12 py-3 outline-none focus:bg-white focus:ring-2 focus:ring-hhd-orange/10 focus:border-hhd-orange transition-all font-semibold text-ink font-mono"
                    />
                    {zipQuery && (
                      <button 
                        onClick={() => setZipQuery('')}
                        className="absolute right-3 top-3 bg-stone-100 hover:bg-stone-200 text-stone-500 rounded px-1.5 py-1 text-[10px] font-bold transition cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  {zipQuery && !targetCentroid && zipQuery.length === 5 && (
                    <p className="text-[10px] text-hhd-orange font-medium mt-1">
                      ZIP coordinates outside our current dictionary. Fallback distance calculations disabled.
                    </p>
                  )}
                  {zipQuery && targetCentroid && (
                    <p className="text-[10px] text-emerald-600 font-semibold mt-1">
                      Showing clinics sorted by distance from ZIP {zipQuery}.
                    </p>
                  )}
                </div>

                {/* Text Search Input */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-custom font-mono uppercase tracking-wider mb-1.5">
                    Search Clinics by Keyword
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="e.g. Northside, Montrose, Avenue..."
                      className="w-full text-sm bg-slate-50 border border-stone-200 rounded-xl pl-10 pr-3.5 py-2.5 outline-none focus:bg-white focus:ring-2 focus:ring-hhd-blue/10 focus:border-hhd-blue transition-all font-medium text-ink"
                    />
                  </div>
                </div>

                {/* Clinic Provider Category Filter Buttons */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-custom font-mono uppercase tracking-wider mb-1.5">
                    Provider Category
                  </label>
                  <div className="flex flex-col gap-1.5">
                    {[
                      { key: 'ALL', label: 'All Providers' },
                      { key: 'Department', label: 'Houston Health Department Clinics' },
                      { key: 'Community', label: 'Community Clinics' }
                    ].map((provider) => (
                      <button
                        key={provider.key}
                        onClick={() => setSelectedType(provider.key as ClinicTypeFilter)}
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border transition text-left cursor-pointer flex items-center justify-between ${
                          selectedType === provider.key
                            ? 'bg-hhd-blue text-white border-hhd-blue shadow-md'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-custom border-stone-200'
                        }`}
                      >
                        <span>{provider.label}</span>
                        {selectedType === provider.key && <span className="w-1.5 h-1.5 rounded-full bg-hhd-orange inline-block"></span>}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* Collapsed Directory Index */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 flex flex-col shrink-0 h-[400px]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold font-display text-hhd-blue">
                   All Facilities ({sitesWithDistance.length})
                </h2>
                <span className="text-[10px] font-mono text-hhd-orange uppercase tracking-wide">Houston Metro</span>
              </div>

              <div className="overflow-y-auto pr-1 flex-grow space-y-2.5">
                {sitesWithDistance.length === 0 ? (
                  <div className="h-44 flex flex-col items-center justify-center text-center p-4">
                    <MapPin className="w-8 h-8 text-stone-300 stroke-[1.5] mb-2" />
                    <span className="text-sm font-semibold text-stone-500">No facilities match search</span>
                    <span className="text-xs text-stone-400 mt-1">Try resetting the selection parameters</span>
                  </div>
                ) : (
                  sitesWithDistance.map((site) => {
                    const isActive = selectedSite?.id === site.id;
                    
                    const badgeColor = site.type === 'Department' 
                      ? 'bg-[#EBF3FC] text-hhd-blue border-[#CADDF6]' 
                      : 'bg-[#FFF3EB] text-hhd-orange border-[#FCD4BB]';

                    const dotColor = site.type === 'Department' ? 'bg-hhd-blue' : 'bg-hhd-orange';

                    return (
                      <div
                        key={site.id}
                        onClick={() => focusOnSite(site)}
                        className={`group p-3.5 rounded-xl border transition cursor-pointer text-left relative overflow-hidden flex flex-col gap-2 ${
                          isActive 
                            ? 'bg-slate-50/80 border-hhd-blue shadow-md ring-1 ring-hhd-blue/25' 
                            : 'bg-white hover:bg-slate-50/50 border-stone-200/85 hover:border-hhd-blue/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black rounded-md border uppercase ${badgeColor}`}>
                            {site.type === 'Department' ? 'HHD Clinic' : 'Partner'}
                          </span>

                          {site.distance !== null && site.distance !== undefined && (
                            <span className="text-[10px] font-bold text-hhd-orange flex items-center gap-0.5 bg-[#FFF3EB] px-2 py-0.5 rounded border border-[#FCD4BB] font-mono">
                              📍 {site.distance.toFixed(1)} mi
                            </span>
                          )}

                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-xs font-extrabold font-display text-hhd-blue transition-colors">
                            {site.name}
                          </h3>
                          <p className="text-[11px] text-slate-custom mt-0.5 line-clamp-1">{site.address}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* Footer Block */}
      <footer className="bg-white border-t border-stone-200 text-center py-6 mt-auto">
        <p className="text-xs text-slate-custom font-medium">
          Houston Public Health Services Map • Powered by LeafletJS & Tailwind CSS • Official Interactive Facility Directory
        </p>
        <p className="text-[10px] text-serif text-[#A0AEC0] mt-1.5 leading-relaxed tracking-wide">
          Designed with compliant high-contrast typography, generous negative space, and accessibility standards for the city.
        </p>
      </footer>

    </div>
  );
}
