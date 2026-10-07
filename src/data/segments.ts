import { SegmentDef } from '../types/audit';

export const PASS_SCORE = 85;
export const STORAGE_KEY = 'auditoria-mi-gusto-v1';
export const HISTORY_STORAGE_KEY = 'auditoria-mi-gusto-history-v1';

export const SEGMENTS: SegmentDef[] = [
  {
    name: 'Experiencia del cliente e imagen',
    short: 'Cliente',
    items: [
      { points: 0.5, text: 'Exterior e interior, incluidos los vidrios, limpios, sin residuos ni elementos que afecten la imagen de ingreso.' },
      { points: 0.5, text: 'Marquesina, fachada e iluminación exterior operativas y en buen estado, sin roturas, humedad ni pintura deteriorada.' },
      { points: 0.5, text: 'Menú, pantallas, cartelería y comunicación comercial actualizados, limpios y alineados a la marca, sin cartelería informal.' },
      { points: 0.5, text: 'Ambientación general, música y elementos POP disponibles y dentro del estándar del formato de tienda.' },
      { points: 2, text: 'El equipo brinda bienvenida, despedida y atención con actitud amable, cordial y orientada al cliente.' },
      { points: 1, text: 'El equipo conoce el producto y las promociones vigentes, y aplica venta sugestiva cuando corresponde.' },
      { points: 2, text: 'El tiempo de espera del cliente se mantiene dentro del estándar operativo de la marca.' },
      { points: 2, text: 'Delivery propio y apps externas con tiempos adecuados. Todo pedido sale en bolsa de delivery cerrada e identificada.' },
      { points: 1, text: 'Teléfonos, comanderos y dispositivos de gestión y despacho de pedidos disponibles, limpios y operativos.' }
    ]
  },
  {
    name: 'Calidad del producto y ejecución operativa',
    short: 'Producto',
    items: [
      { points: 0.25, text: 'Estaciones de Envía y Retira completas, ordenadas y preparadas para operar.' },
      { points: 0.25, text: 'En Retira, toppings disponibles, bien preparados/cortados, conservados y rotulados según el proceso vigente.' },
      { points: 0.75, text: 'Calidad final de empanadas cerradas y abiertas: cocción, pintado/cobertura, gratinado y presentación.' },
      { points: 0.25, text: 'Presentación y empaque final según estándar: caja, parafinado, servilletas, etiquetas y cierre.' },
      { points: 0.75, text: 'Proceso de pizzas según procedimiento vigente: elaboración, cocción y corte.' },
      { points: 10, text: 'Empanadas y pizzas con rótulo primario de vencimiento bien colocado y dentro del rango de fecha.' },
      { points: 0.5, text: 'Todas las bebidas dentro de su fecha de vencimiento y con envases íntegros.' },
      { points: 0.5, text: 'Mangas y dips: conservación, rotulación, fecha de elaboración/apertura y vencimiento.' },
      { points: 0.25, text: 'Dips de criolla con gramaje de 30 g y rotulados con fecha de vencimiento.' },
      { points: 0.25, text: 'Jamón con gramaje de 21 a 23 g. Feteado y horma con rótulo vigente.' },
      { points: 0.25, text: 'Pepperoni con gramaje de 1 a 3 g. Feteado y horma con rótulo vigente.' },
      { points: 0.5, text: 'Verduras sanitizadas y almacenadas, en condiciones de calidad y con rótulo de ingreso.' },
      { points: 0.5, text: 'Solo productos y proveedores autorizados; todos los insumos con identificación y trazabilidad.' }
    ]
  },
  {
    name: 'Seguridad alimentaria',
    short: 'Seguridad',
    items: [
      { points: 2.5, text: 'Registro diario de temperatura de empanadas en crudo (0° a 5°) y cocidas (65°/85°) completo al inicio del turno.' },
      { points: 2.5, text: 'Registro diario de temperaturas de heladeras y freezer completo al inicio y cierre del turno.' },
      { points: 2, text: 'Lavado de manos correcto, con insumos disponibles y alarma de recordatorio activa.' },
      { points: 2, text: 'Uso correcto de cofia, delantal y guantes, con cambio de guantes cuando el proceso lo requiere.' },
      { points: 1, text: 'Guantes anticorte y de alta temperatura disponibles, limpios y en condiciones.' },
      { points: 1.5, text: 'Productos de limpieza identificados y guardados en forma segura; pulverizadores con rotulación vigente.' },
      { points: 1.5, text: 'Utensilios, cambros y tuppers lavados, sin residuos y guardados en orden, sin riesgo de contaminación.' },
      { points: 2, text: 'Sin plagas ni indicios de insectos o roedores en elaboración, almacenamiento o atención.' }
    ]
  },
  {
    name: 'Limpieza e higiene',
    short: 'Limpieza',
    items: [
      { points: 3, text: 'Horno limpio en su interior, exterior y cintas.' },
      { points: 2, text: 'Feteadora limpia y sin restos de fiambres, incluido el sector del filo.' },
      { points: 2, text: 'Bandejas de cocción de empanadas y carros transportadores limpios y en condiciones.' },
      { points: 1.5, text: 'Escobas y palas limpias, en buen estado, bien guardadas y sin suciedad acumulada.' },
      { points: 1.5, text: 'Tachos de basura limpios, con abertura en la tapa y/o tapa vaivén.' },
      { points: 2.5, text: 'Baños en óptimas condiciones de limpieza y con sus insumos disponibles.' },
      { points: 2.5, text: 'Estaciones de trabajo (Envía, Retira y Pizza) limpias, sin restos de adhesivos ni suciedad acumulada.' },
      { points: 3, text: 'Heladeras y freezers limpios por dentro y por fuera, sectorizados y con guías/pisos higiénicos.' },
      { points: 2, text: 'Azulejos de la tienda limpios y sin marcas visibles.' }
    ]
  },
  {
    name: 'Mantenimiento e infraestructura',
    short: 'Mantenimiento',
    items: [
      { points: 2.5, text: 'Tableros, enchufes y cableado en buen estado, bien instalados e identificados.' },
      { points: 2, text: 'Burletes y manijas de heladeras en óptimas condiciones.' },
      { points: 2.5, text: 'Bachas en buen estado, funcionando, con buen desagüe y sin pérdidas de agua.' },
      { points: 2, text: 'Iluminación general adecuada, sin luminarias quemadas.' },
      { points: 2, text: 'Luces de emergencia instaladas y funcionando.' },
      { points: 2, text: 'Sistemas de inyección y extracción funcionando correctamente.' },
      { points: 4.5, text: 'Todos los hornos funcionan correctamente.' },
      { points: 2.5, text: 'Pisos, paredes y azulejos en buen estado, sin humedad ni pintura descascarada.' }
    ]
  },
  {
    name: 'Gestión operativa y KPIs',
    short: 'KPIs',
    items: [
      { points: 1.5, text: 'Vendor Late del período dentro del objetivo: ≤ 8%.' },
      { points: 1.5, text: 'Inaccuracy del período dentro del objetivo: ≤ 2%.' },
      { points: 2, text: 'Reclamos acumulados del mes anterior no superan el 2% del total de la venta.' }
    ]
  },
  {
    name: 'Administración',
    short: 'Administración',
    items: [
      { points: 1, text: 'Habilitación vigente y exhibida.' },
      { points: 0.75, text: 'Formulario 960 actualizado.' },
      { points: 0.75, text: 'Constancia de inscripción ARCA e IIBB vigente.' },
      { points: 1, text: 'Talonarios/comprobantes de facturación A y B manual vigentes.' },
      { points: 0.75, text: 'Certificados de fumigación, análisis de agua y limpieza de campana vigentes y disponibles.' },
      { points: 0.75, text: 'Todos los colaboradores con curso de manipulación de alimentos o libreta sanitaria, según corresponda.' },
      { points: 0.5, text: 'Botiquín completo: gasas, curitas, algodón, agua oxigenada, Pervinox, tijera, Platsul y guantes. Sin medicamentos.' },
      { points: 0.5, text: 'Matafuegos reglamentados, señalizados y vigentes.' }
    ]
  },
  {
    name: 'RRHH e imagen del equipo',
    short: 'RRHH',
    items: [
      { points: 3.5, text: 'Gerente y colaboradores con imagen personal de marca: uniforme completo y en buen estado, higiene, cabello recogido y sin bijouterie.' },
      { points: 3.5, text: 'Carpeta de legajos actualizada con la documentación definida por la compañía.' }
    ]
  },
  {
    name: 'Bodega',
    short: 'Bodega',
    items: [
      { points: 1.5, text: 'Bodega ordenada y sectorizada; cajas e insumos fuera del piso, paquetes abiertos protegidos y sistema PEPS respetado.' },
      { points: 0.5, text: 'Rótulos aprobados por la marca disponibles para la operación.' }
    ]
  }
];

// Enrich with ideal totals
SEGMENTS.forEach(seg => {
  seg.ideal = seg.items.reduce((sum, item) => sum + item.points, 0);
});

export const TOTAL_ITEMS = SEGMENTS.reduce((n, s) => n + s.items.length, 0);
