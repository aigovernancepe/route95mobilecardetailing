// Maps English page slugs to Spanish URL slugs
// Key = English slug (matches filename without .astro)
// Value = Spanish slug (used in /es/ pages)
export const slugMap: Record<string, string> = {
  '': '',
  'about': 'nosotros',
  'contact': 'contacto',
  'car-wash-fort-lauderdale': 'lavado-de-autos-fort-lauderdale',
  'hand-wash-fort-lauderdale': 'lavado-a-mano-fort-lauderdale',
  'car-waxing-fort-lauderdale': 'encerado-de-autos-fort-lauderdale',
  'clay-bar-treatment-fort-lauderdale': 'tratamiento-barra-de-arcilla-fort-lauderdale',
  'wheel-cleaning-fort-lauderdale': 'limpieza-de-rines-fort-lauderdale',
  'chrome-polishing-fort-lauderdale': 'pulido-de-cromo-fort-lauderdale',
  'engine-bay-cleaning-fort-lauderdale': 'limpieza-de-motor-fort-lauderdale',
  'water-spot-removal-fort-lauderdale': 'eliminacion-de-manchas-de-agua-fort-lauderdale',
  'trim-restoration-fort-lauderdale': 'restauracion-de-molduras-fort-lauderdale',
  'tire-dressing-fort-lauderdale': 'acondicionador-de-llantas-fort-lauderdale',
  'bug-and-tar-removal-fort-lauderdale': 'eliminacion-de-insectos-y-alquitran-fort-lauderdale',
  'upholstery-cleaning-fort-lauderdale': 'limpieza-de-tapiceria-fort-lauderdale',
  'seat-shampooing-fort-lauderdale': 'lavado-de-asientos-fort-lauderdale',
  'carpet-shampooing-fort-lauderdale': 'lavado-de-alfombras-fort-lauderdale',
  'leather-cleaning-fort-lauderdale': 'limpieza-de-cuero-fort-lauderdale',
  'leather-conditioning-fort-lauderdale': 'acondicionamiento-de-cuero-fort-lauderdale',
  'steam-cleaning-fort-lauderdale': 'limpieza-a-vapor-fort-lauderdale',
  'odor-removal-fort-lauderdale': 'eliminacion-de-olores-fort-lauderdale',
  'smoke-odor-removal-fort-lauderdale': 'eliminacion-de-olor-a-humo-fort-lauderdale',
  'pet-hair-removal-fort-lauderdale': 'eliminacion-de-pelo-de-mascota-fort-lauderdale',
  'interior-vacuuming-fort-lauderdale': 'aspirado-interior-fort-lauderdale',
  'dashboard-cleaning-fort-lauderdale': 'limpieza-de-tablero-fort-lauderdale',
  'car-detailing-services-fort-lauderdale': 'servicios-de-detallado-fort-lauderdale',
  'quick-wash-fort-lauderdale': 'lavado-rapido-fort-lauderdale',
  'fresh-start-fort-lauderdale': 'nuevo-comienzo-fort-lauderdale',
  'complete-clean-fort-lauderdale': 'limpieza-completa-fort-lauderdale',
  'premium-refresh-fort-lauderdale': 'renovacion-premium-fort-lauderdale',
  'fabric-protection-fort-lauderdale': 'proteccion-de-tela-fort-lauderdale',
  'interior-protection-fort-lauderdale': 'proteccion-interior-fort-lauderdale',
  'blog': 'blog',
  'mobile-car-detailing-prices-fort-lauderdale': 'precios-detallado-movil-fort-lauderdale',
  'faq': 'preguntas-frecuentes',
  'interior-car-detailing-fort-lauderdale': 'detallado-interior-fort-lauderdale',
  'fleet-detailing-fort-lauderdale': 'detallado-de-flotas-fort-lauderdale',
  'areas': 'areas',
  'mobile-car-detailing-dania-beach': 'detallado-movil-dania-beach',
  'mobile-car-detailing-hollywood-fl': 'detallado-movil-hollywood-fl',
  'mobile-car-detailing-pompano-beach': 'detallado-movil-pompano-beach',
};

// Reverse map: Spanish slug -> English slug
export const reverseSlugMap: Record<string, string> = Object.fromEntries(
  Object.entries(slugMap).map(([en, es]) => [es, en])
);
