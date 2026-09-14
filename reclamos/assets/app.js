/* ============================================================
   Libro de Reclamaciones — lógica del formulario
   Envía a Supabase vía RPC public.registrar_reclamacion
   ============================================================ */
(function () {
  'use strict';

  var CFG   = window.RECLAMOS_CONFIG || {};
  var form  = document.getElementById('formReclamo');
  var btn   = document.getElementById('btnEnviar');
  var errGen= document.getElementById('errGeneral');

  /* Código de identificación: uno nuevo por cada visita al libro.
     Se muestra en la cabecera y viaja con la reclamación. */
  var CODIGO_IDENT = (window.crypto && crypto.randomUUID)
    ? crypto.randomUUID()
    : uuidFallback();

  document.getElementById('codigoLibro').textContent = CODIGO_IDENT;
  if (CFG.RUC) document.getElementById('ruc').textContent = CFG.RUC;

  function uuidFallback() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  /* ── Reglas de validación ──────────────────────────────── */
  var REGLAS = {
    nombres_completos: {
      msg: 'Ingrese sus nombres y apellidos completos (mínimo 3 caracteres).',
      ok: function (v) { return v.length >= 3 && v.length <= 150; }
    },
    tipo_documento: {
      msg: 'Seleccione el tipo de documento.',
      ok: function (v) { return v !== ''; }
    },
    numero_documento: {
      msg: 'Ingrese un número de documento válido (entre 6 y 20 caracteres).',
      ok: function (v) { return v.length >= 6 && v.length <= 20; }
    },
    correo_electronico: {
      msg: 'Ingrese un correo electrónico válido.',
      ok: function (v) { return /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(v); }
    },
    celular: {
      msg: 'Ingrese un número de celular válido (entre 6 y 20 dígitos).',
      ok: function (v) { return /^[\d\s+()-]{6,20}$/.test(v); }
    },
    servicio_contratado: {
      msg: 'Seleccione el servicio contratado.',
      ok: function (v) { return v !== ''; }
    },
    descripcion_reclamo: {
      msg: 'Describa el producto o servicio (mínimo 10 caracteres).',
      ok: function (v) { return v.length >= 10 && v.length <= 3000; }
    },
    tipo_reclamacion: {
      msg: 'Indique si se trata de un reclamo o una queja.',
      ok: function (v) { return v !== ''; }
    },
    detalle_reclamo: {
      msg: 'Detalle el motivo de su reclamación (mínimo 10 caracteres).',
      ok: function (v) { return v.length >= 10 && v.length <= 5000; }
    },
    pedido: {
      msg: 'Indique qué espera como solución (mínimo 10 caracteres).',
      ok: function (v) { return v.length >= 10 && v.length <= 3000; }
    }
  };

  function pintarError(campo, mensaje) {
    var el  = document.getElementById(campo);
    var box = document.querySelector('[data-err-for="' + campo + '"]');
    if (el)  el.setAttribute('aria-invalid', mensaje ? 'true' : 'false');
    if (box) {
      box.textContent = mensaje || '';
      box.classList.toggle('is-visible', !!mensaje);
    }
  }

  function validarCampo(campo) {
    var el = document.getElementById(campo);
    if (!el) return true;
    var regla = REGLAS[campo];
    if (!regla) return true;
    var valido = regla.ok(el.value.trim());
    pintarError(campo, valido ? '' : regla.msg);
    return valido;
  }

  /* Valida en blur; limpia el error mientras el usuario corrige */
  Object.keys(REGLAS).forEach(function (campo) {
    var el = document.getElementById(campo);
    if (!el) return;
    el.addEventListener('blur', function () { validarCampo(campo); });
    el.addEventListener('input', function () {
      if (el.getAttribute('aria-invalid') === 'true') validarCampo(campo);
    });
    el.addEventListener('change', function () {
      if (el.tagName === 'SELECT') validarCampo(campo);
    });
  });

  var chkLegal = document.getElementById('acepta_tratamiento_datos');
  chkLegal.addEventListener('change', function () {
    if (chkLegal.checked) pintarError('acepta_tratamiento_datos', '');
  });

  /* ── Envío ─────────────────────────────────────────────── */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    errGen.classList.remove('is-visible');
    errGen.textContent = '';

    /* Trampa anti-bot: si viene llena, fingimos éxito sin guardar */
    if (document.getElementById('website').value !== '') return;

    var primerError = null;
    Object.keys(REGLAS).forEach(function (campo) {
      if (!validarCampo(campo) && !primerError) primerError = campo;
    });

    if (!chkLegal.checked) {
      pintarError('acepta_tratamiento_datos',
        'Debe aceptar el tratamiento de sus datos personales para enviar la reclamación.');
      if (!primerError) primerError = 'acepta_tratamiento_datos';
    }

    if (primerError) {
      var foco = document.getElementById(primerError);
      if (foco) {
        foco.focus({ preventScroll: true });
        foco.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    enviar();
  });

  function val(id) { return document.getElementById(id).value.trim(); }

  function enviar() {
    btn.disabled = true;
    btn.classList.add('is-loading');
    btn.querySelector('.btn__label').textContent = 'Enviando…';

    var cuerpo = {
      p_nombres_completos:        val('nombres_completos'),
      p_es_menor_edad:            document.getElementById('es_menor_edad').checked,
      p_tipo_documento:           val('tipo_documento'),
      p_numero_documento:         val('numero_documento'),
      p_correo_electronico:       val('correo_electronico'),
      p_celular:                  val('celular'),
      p_servicio_contratado:      val('servicio_contratado'),
      p_descripcion_reclamo:      val('descripcion_reclamo'),
      p_tipo_reclamacion:         val('tipo_reclamacion'),
      p_detalle_reclamo:          val('detalle_reclamo'),
      p_pedido:                   val('pedido'),
      p_acepta_tratamiento_datos: true,
      p_user_agent:               navigator.userAgent,
      p_codigo_identificacion:    CODIGO_IDENT
    };

    fetch(CFG.SUPABASE_URL + '/rest/v1/rpc/registrar_reclamacion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': CFG.SUPABASE_KEY,
        'Authorization': 'Bearer ' + CFG.SUPABASE_KEY
      },
      body: JSON.stringify(cuerpo)
    })
      .then(function (r) {
        return r.json().then(function (data) {
          if (!r.ok) throw new Error(data.message || data.hint || 'Error ' + r.status);
          return data;
        });
      })
      .then(function (data) {
        var fila = Array.isArray(data) ? data[0] : data;
        if (!fila || !fila.codigo_seguimiento) throw new Error('Respuesta inesperada del servidor.');
        mostrarExito(fila);
      })
      .catch(function (err) {
        console.error('[reclamos]', err);
        errGen.textContent = err.message && err.message.indexOf('demasiadas') > -1
          ? err.message
          : 'No pudimos registrar su reclamación en este momento. Verifique su conexión e inténtelo nuevamente. Si el problema persiste, escríbanos a ' + (CFG.CORREO_SOPORTE || 'reclamos@transitur.pe') + '.';
        errGen.classList.add('is-visible');
      })
      .finally(function () {
        btn.disabled = false;
        btn.classList.remove('is-loading');
        btn.querySelector('.btn__label').textContent = 'Enviar reclamación';
      });
  }

  function mostrarExito(fila) {
    document.getElementById('codigoSeguimiento').textContent = fila.codigo_seguimiento;

    var limite = fila.fecha_limite_respuesta;
    if (limite) {
      var p = limite.split('-');
      var f = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
      document.getElementById('fechaLimite').textContent =
        f.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    form.hidden = true;
    document.querySelector('.hero').hidden = true;
    var exito = document.getElementById('exito');
    exito.hidden = false;
    exito.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  document.getElementById('btnImprimir').addEventListener('click', function () {
    window.print();
  });
})();
