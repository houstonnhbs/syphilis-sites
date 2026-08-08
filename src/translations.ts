export type Language = 'en' | 'es';

export const TRANSLATIONS = {
  en: {
    subHeaderBadge: 'Official Provider Locator & Interactive Information Map',
    title: 'Houston NHBS Syphilis Testing Sites',
    headerDescription: 'Comprehensive mapping, addresses, operational hours, and Syphilis testing services of official Houston Health Department clinics and supportive Community partners.',
    
    // KPIs
    totalSites: 'TOTAL CLINIC SITES',
    hhdClinics: 'HEALTH DEPARTMENT CLINICS',
    communityClinics: 'COMMUNITY CLINICS',

    // Map Legend
    mapKeyTitle: 'Map Pin Key',
    hhdLegend: 'Houston Health Dept',
    partnerLegend: 'Community Partners',
    mapInstruction: 'CLICK ON PINS TO ZOOM & REVEAL OPERATIONAL TIMINGS.',

    // Filters
    filterHeader: 'Filter Facilities',
    resetFilters: 'Reset Filters',
    closestZipLabel: 'Closest ZIP Code Search',
    sortActive: '✓ Sort Active',
    unresolvedZip: 'Unresolved ZIP',
    zipPlaceholder: 'Enter 5-digit ZIP (e.g. 77002, 77036)',
    clear: 'Clear',
    zipNotFound: 'ZIP coordinates outside our current dictionary. Fallback distance calculations disabled.',
    zipSortedNotice: (zip: string) => `Showing clinics sorted by distance from ZIP ${zip}.`,
    keywordLabel: 'Search Clinics by Keyword',
    searchPlaceholder: 'e.g. Northside, Montrose, Avenue...',
    providerCategoryLabel: 'Provider Category',
    providerAll: 'All Providers',
    providerDept: 'Houston Health Department Clinics',
    providerCommunity: 'Community Clinics',

    // Facilities List
    allFacilities: (count: number) => `All Facilities (${count})`,
    metroLabel: 'Houston Metro',
    noResults: 'No facilities match search',
    tryResetting: 'Try resetting the selection parameters',
    badgeHHD: 'HHD Clinic',
    badgePartner: 'Partner',

    // Popup & Details
    popupHHD: 'HOUSTON HEALTH DEPT',
    popupPartner: 'COMMUNITY PARTNER',
    badgeHHDFacility: 'Houston Health Department Facility',
    badgePartnerFacility: 'Community Clinic Partner',
    milesFromZip: (dist: string, zip: string) => `📍 ${dist} miles from ZIP ${zip}`,
    milesAway: (dist: string) => `📍 ${dist} miles away`,
    servicesLabel: 'Services & Description:',

    // Language Toggle
    langToggleLabel: 'Idioma / Language',

    // Footer
    footerTitle: 'Houston Public Health Services Map • Powered by LeafletJS & Tailwind CSS • Official Interactive Facility Directory',
    footerSubtitle: 'Designed with compliant high-contrast typography, generous negative space, and accessibility standards for the city.'
  },
  es: {
    subHeaderBadge: 'Localizador Oficial de Proveedores y Mapa Interactivo de Información',
    title: 'Sitios de Prueba de Sífilis NHBS de Houston',
    headerDescription: 'Mapas detallados, direcciones, horarios de atención y servicios de pruebas de sífilis de las clínicas oficiales del Departamento de Salud de Houston y organizaciones comunitarias aliadas.',
    
    // KPIs
    totalSites: 'TOTAL DE CLÍNICAS',
    hhdClinics: 'CLÍNICAS DEL DEPTO. DE SALUD',
    communityClinics: 'CLÍNICAS COMUNITARIAS',

    // Map Legend
    mapKeyTitle: 'Clave del Mapa',
    hhdLegend: 'Depto. de Salud de Houston',
    partnerLegend: 'Socios Comunitarios',
    mapInstruction: 'HAZ CLIC EN LOS PINES PARA AMPLIAR Y VER HORARIOS DE ATENCIÓN.',

    // Filters
    filterHeader: 'Filtrar Instalaciones',
    resetFilters: 'Restablecer Filtros',
    closestZipLabel: 'Buscar por Código Postal más Cercano',
    sortActive: '✓ Orden Activo',
    unresolvedZip: 'C.P. No Encontrado',
    zipPlaceholder: 'Ingresa C.P. de 5 dígitos (ej. 77002, 77036)',
    clear: 'Borrar',
    zipNotFound: 'Coordenadas del C.P. fuera del diccionario actual. Cálculo de distancia desactivado.',
    zipSortedNotice: (zip: string) => `Mostrando clínicas ordenadas por distancia desde el C.P. ${zip}.`,
    keywordLabel: 'Buscar Clínicas por Palabra Clave',
    searchPlaceholder: 'ej. Northside, Montrose, Avenue...',
    providerCategoryLabel: 'Categoría de Proveedor',
    providerAll: 'Todos los Proveedores',
    providerDept: 'Clínicas del Depto. de Salud de Houston',
    providerCommunity: 'Clínicas Comunitarias',

    // Facilities List
    allFacilities: (count: number) => `Todas las Instalaciones (${count})`,
    metroLabel: 'Área de Houston',
    noResults: 'No hay instalaciones que coincidan con la búsqueda',
    tryResetting: 'Intenta restablecer los parámetros de selección',
    badgeHHD: 'Clínica HHD',
    badgePartner: 'Socio',

    // Popup & Details
    popupHHD: 'DEPTO. SALUD HOUSTON',
    popupPartner: 'SOCIO COMUNITARIO',
    badgeHHDFacility: 'Instalación del Departamento de Salud de Houston',
    badgePartnerFacility: 'Clínica Comunitaria Aliada',
    milesFromZip: (dist: string, zip: string) => `📍 A ${dist} millas del C.P. ${zip}`,
    milesAway: (dist: string) => `📍 A ${dist} millas de distancia`,
    servicesLabel: 'Servicios y Descripción:',

    // Language Toggle
    langToggleLabel: 'Idioma / Language',

    // Footer
    footerTitle: 'Mapa de Servicios de Salud Pública de Houston • Desarrollado con LeafletJS y Tailwind CSS • Directorio Interactivo Oficial',
    footerSubtitle: 'Diseñado con tipografía accesible de alto contraste, amplio espacio negativo y estándares de accesibilidad para la ciudad.'
  }
};
