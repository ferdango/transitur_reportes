/* ============================================================
   Configuración pública — Libro de Reclamaciones Transitur
   La clave publishable es de uso público (protegida por RLS).
   ============================================================ */
window.RECLAMOS_CONFIG = {
  SUPABASE_URL: 'https://rbcnjosixvyoodyunjkt.supabase.co',
  SUPABASE_KEY: 'sb_publishable_vemYiTnRpBgS-ZLWRbL0MA_z-QxXdqT',

  RAZON_SOCIAL: 'Transitur Perú SAC',
  RUC: '20600322703',

  // Correo al que se deriva al usuario si falla el envío
  CORREO_SOPORTE: 'reclamos@transitur.pe'
};

/* El «Código de identificación» de la cabecera NO es fijo: app.js genera un
   UUID nuevo cada vez que el usuario abre el libro y lo guarda junto a la
   reclamación (columna codigo_identificacion). */
