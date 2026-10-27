export interface DashboardSupervisor {
  id: string;
  name: string;
  rol: string;
}

export interface DashboardTienda {
  id: string;
  name: string;
  sup: string;
  tags: string[];
}

export interface DashboardThresholds {
  critica: number;
  ok: number;
}

export interface DashboardSeedData {
  exportado: string;
  umbrales: DashboardThresholds;
  config: {
    supervisoras: DashboardSupervisor[];
    tiendas: DashboardTienda[];
  };
  auditorias?: any[];
}

export const DASHBOARD_SEED: DashboardSeedData = {
  exportado: "",
  umbrales: { critica: 70, ok: 85 },
  config: {
    supervisoras: [
      { id: "p-lidya", name: "Lidya", rol: "Supervisora general" },
      { id: "p-damaris", name: "Damaris Burgos", rol: "Supervisora de Franquicias" },
      { id: "p-evelyn", name: "Evelyn Cedrón", rol: "Supervisora de Franquicias · audita las 3 propias" }
    ],
    tiendas: [
      { id: "t-ballester", name: "Ballester", sup: "p-damaris", tags: [] },
      { id: "t-balvanera", name: "Balvanera", sup: "p-damaris", tags: [] },
      { id: "t-barrancas-de-belgrano", name: "Barrancas de Belgrano", sup: "p-damaris", tags: [] },
      { id: "t-belgrano", name: "Belgrano", sup: "p-damaris", tags: [] },
      { id: "t-caballito", name: "Caballito", sup: "p-damaris", tags: ["Experience"] },
      { id: "t-del-viso", name: "Del Viso", sup: "p-damaris", tags: [] },
      { id: "t-floresta", name: "Floresta", sup: "p-damaris", tags: [] },
      { id: "t-martinez", name: "Martínez", sup: "p-damaris", tags: [] },
      { id: "t-munro", name: "Munro", sup: "p-damaris", tags: [] },
      { id: "t-palermo", name: "Palermo", sup: "p-damaris", tags: [] },
      { id: "t-puerto-madero", name: "Puerto Madero", sup: "p-damaris", tags: [] },
      { id: "t-villa-adelina", name: "Villa Adelina", sup: "p-damaris", tags: [] },
      { id: "t-ituzaingo", name: "Ituzaingó", sup: "p-damaris", tags: [] },
      { id: "t-don-torcuato", name: "Don Torcuato", sup: "p-damaris", tags: [] },
      { id: "t-mataderos", name: "Mataderos", sup: "p-damaris", tags: [] },
      { id: "t-moreno", name: "Moreno", sup: "p-damaris", tags: [] },
      { id: "t-paternal", name: "Paternal", sup: "p-damaris", tags: [] },
      { id: "t-tigre", name: "Tigre", sup: "p-damaris", tags: [] },
      { id: "t-bella-vista", name: "Bella Vista", sup: "p-evelyn", tags: [] },
      { id: "t-devoto", name: "Devoto", sup: "p-evelyn", tags: [] },
      { id: "t-escobar", name: "Escobar", sup: "p-evelyn", tags: [] },
      { id: "t-florida", name: "Florida", sup: "p-evelyn", tags: [] },
      { id: "t-hurlingham", name: "Hurlingham", sup: "p-evelyn", tags: [] },
      { id: "t-jose-c-paz", name: "José C. Paz", sup: "p-evelyn", tags: [] },
      { id: "t-muniz", name: "Muñiz", sup: "p-evelyn", tags: [] },
      { id: "t-pilar-centro", name: "Pilar Centro", sup: "p-evelyn", tags: [] },
      { id: "t-pilar-derqui", name: "Pilar Derqui", sup: "p-evelyn", tags: [] },
      { id: "t-san-fernando", name: "San Fernando", sup: "p-evelyn", tags: [] },
      { id: "t-san-martin", name: "San Martín", sup: "p-evelyn", tags: [] },
      { id: "t-san-miguel", name: "San Miguel", sup: "p-evelyn", tags: [] },
      { id: "t-vicente-lopez", name: "Vicente López", sup: "p-evelyn", tags: ["Propia", "Experience"] },
      { id: "t-villa-crespo", name: "Villa Crespo", sup: "p-evelyn", tags: ["Propia"] },
      { id: "t-maschwitz", name: "Maschwitz", sup: "p-evelyn", tags: [] },
      { id: "t-los-polvorines", name: "Los Polvorines", sup: "p-evelyn", tags: [] },
      { id: "t-general-pacheco", name: "General Pacheco", sup: "p-evelyn", tags: [] },
      { id: "t-merlo", name: "Merlo", sup: "p-evelyn", tags: [] },
      { id: "t-villa-urquiza", name: "Villa Urquiza", sup: "p-evelyn", tags: [] },
      { id: "t-canitas", name: "Cañitas", sup: "p-evelyn", tags: ["Propia", "Experience"] },
      { id: "t-campana", name: "Campana", sup: "p-evelyn", tags: [] }
    ]
  }
};
