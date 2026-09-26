/* Cosecha Justa — panel paso a paso de la página Producto:
   1) qué quieres hacer, 2) qué cosecha tienes, 3) cuánto, 4) tu perfil.
   Sin JavaScript el formulario se muestra completo y se envía igual. */
(function () {
  "use strict";

  var KG_POR_CAJA = 20;

  /* Precio de referencia por kilo al vender por lote (pesos) */
  var COSECHAS = {
    mango:    { nombre: "Mango",    precio: 7 },
    jitomate: { nombre: "Jitomate", precio: 6 },
    chile:    { nombre: "Chile",    precio: 12 },
    fresa:    { nombre: "Fresa",    precio: 9 },
    guayaba:  { nombre: "Guayaba",  precio: 8 },
    platano:  { nombre: "Plátano",  precio: 5 },
    aguacate: { nombre: "Aguacate", precio: 15 },
    limon:    { nombre: "Limón",    precio: 6 }
  };

  /* Producto del taller según la cosecha (mismas cifras que la tabla de la página) */
  var TALLER = {
    mango:    { producto: "Mango deshidratado enchilado", foto: "mango-deshidratado", alt: "Rebanadas de mango deshidratado en una canasta", porKilo: 1,   unidad: "bolsas de 100 g", precio: 65 },
    jitomate: { producto: "Salsa artesanal en frasco", foto: "salsa", alt: "Salsa verde en molcajete", porKilo: 3,   unidad: "frascos de 250 g", precio: 55 },
    chile:    { producto: "Salsa artesanal en frasco", foto: "salsa", alt: "Salsa verde en molcajete", porKilo: 3,   unidad: "frascos de 250 g", precio: 55 },
    fresa:    { producto: "Mermelada con piloncillo", foto: "mermelada", alt: "Mermelada de fresa llenando frascos", porKilo: 4.5, unidad: "frascos de 250 g", precio: 60 },
    guayaba:  { producto: "Mermelada con piloncillo", foto: "mermelada", alt: "Mermelada llenando frascos", porKilo: 4.5, unidad: "frascos de 250 g", precio: 60 }
  };

  var CAMINOS = { lote: "Vender mi cosecha por lote", taller: "Aprender a hacer un producto" };

  function pesos(n) { return "$" + Math.round(n).toLocaleString("es-MX") + " MXN"; }
  function numero(n) { return Math.round(n).toLocaleString("es-MX"); }
  function limpiar(t) { return String(t).replace(/[<>&"]/g, ""); }

  function leerPerfil() {
    try { return JSON.parse(localStorage.getItem("cj-perfil") || "null"); } catch (e) { return null; }
  }
  function guardarPerfil(perfil) {
    try { localStorage.setItem("cj-perfil", JSON.stringify(perfil)); } catch (e) { /* sin almacenamiento */ }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("asistente");
    if (!form) return;

    var pasos = form.querySelectorAll(".paso");
    var indicadores = form.querySelectorAll("[data-indicador]");
    var progresoTexto = document.getElementById("progreso-texto");
    var chipsCosecha = form.querySelectorAll(".cosechas .chip");
    var aprenderas = document.getElementById("aprenderas");
    var estimado = document.getElementById("estimado");
    var confirmacion = document.getElementById("confirmacion");
    var saludo = document.getElementById("saludo");
    var actual = 1;

    function valor(nombre) {
      var marcado = form.querySelector("input[name='" + nombre + "']:checked");
      if (marcado) return marcado.value;
      var el = form.querySelector("[name='" + nombre + "']:not([type='radio'])");
      return el ? el.value.trim() : "";
    }

    function kilos() {
      var n = Number(valor("cantidad"));
      return valor("unidad") === "cajas" ? n * KG_POR_CAJA : n;
    }

    function marcarError(idError, campo, mensaje) {
      var error = document.getElementById(idError);
      if (error) error.textContent = mensaje;
      if (campo) campo.setAttribute("aria-invalid", mensaje ? "true" : "false");
      return !mensaje;
    }

    /* Paso 2: en el taller solo se muestran las cosechas que sirven para los 3 productos */
    function actualizarCosechas() {
      var camino = valor("camino");
      chipsCosecha.forEach(function (chip) {
        var visible = !camino || chip.getAttribute("data-caminos").split(" ").indexOf(camino) !== -1;
        var radio = chip.querySelector("input");
        chip.hidden = !visible;
        if (!visible && radio.checked) radio.checked = false;
      });
      document.getElementById("ayuda-cosecha").textContent = camino === "taller"
        ? "Solo las del taller."
        : "";
      actualizarAprenderas();
    }

    function actualizarAprenderas() {
      var t = TALLER[valor("cosecha")];
      if (valor("camino") === "taller" && t) {
        aprenderas.innerHTML = '<img src="img/' + t.foto + '.jpg" alt="' + t.alt + '">' +
          "<p><span>Aprenderás</span><strong>" + t.producto + "</strong></p>";
      } else {
        aprenderas.innerHTML = "";
      }
    }

    /* Paso 3: estimado que cambia mientras escribes */
    function filasEstimado() {
      var camino = valor("camino");
      var cosecha = COSECHAS[valor("cosecha")];
      var kg = kilos();
      if (!camino || !cosecha || !(kg > 0)) return null;

      var filas = [["Cosecha", cosecha.nombre + ", " + numero(kg) + " kg"]];
      if (camino === "lote") {
        filas.push(["Precio de referencia", pesos(cosecha.precio) + " por kilo"]);
        filas.push(["Recibirías", pesos(kg * cosecha.precio)]);
      } else {
        var t = TALLER[valor("cosecha")];
        var piezas = kg * t.porKilo;
        filas.push(["Producto", t.producto]);
        filas.push(["Saldrían aprox.", numero(piezas) + " " + t.unidad]);
        filas.push(["Valor en venta", pesos(piezas * t.precio)]);
      }
      return filas;
    }

    function tablaHTML(titulo, filas) {
      var html = "<h3>" + titulo + "</h3><dl>";
      filas.forEach(function (f, i) {
        html += "<dt>" + f[0] + "</dt><dd" + (i === filas.length - 1 ? ' class="total"' : "") + ">" + f[1] + "</dd>";
      });
      return html + "</dl>";
    }

    function actualizarEstimado() {
      var filas = filasEstimado();
      estimado.hidden = !filas;
      estimado.innerHTML = filas
        ? '<img class="estimado-foto" src="img/' + valor("cosecha") + '.jpg" alt="">' + tablaHTML("Tu estimado", filas)
        : "";
    }

    function validarPaso(n) {
      if (n === 1) return marcarError("error-camino", null, valor("camino") ? "" : "Elige una opción.");
      if (n === 2) return marcarError("error-cosecha", null, valor("cosecha") ? "" : "Elige una cosecha.");
      if (n === 3) {
        var kg = kilos();
        var minimo = valor("camino") === "lote" ? 50 : 1;
        var msg = !(kg > 0) ? "Escribe la cantidad." :
          kg < minimo ? "Mínimo 50 kg." : "";
        return marcarError("error-cantidad", form.elements.cantidad, msg);
      }
      var tel = valor("telefono").replace(/\D/g, "");
      var a = marcarError("error-p-nombre", form.elements.nombre, valor("nombre").length >= 2 ? "" : "Escribe tu nombre.");
      var b = marcarError("error-p-telefono", form.elements.telefono, tel.length === 10 ? "" : "Deben ser 10 números.");
      var c = marcarError("error-p-comunidad", form.elements.comunidad, valor("comunidad").length >= 3 ? "" : "Escribe tu comunidad.");
      return a && b && c;
    }

    function primerCampoConError(n) {
      var paso = form.querySelector("[data-paso='" + n + "']");
      return paso.querySelector("[aria-invalid='true']") ||
        paso.querySelector(".chip:not([hidden]) input, input[type='radio']");
    }

    function mostrar(n, opciones) {
      opciones = opciones || {};
      actual = n;
      pasos.forEach(function (p) {
        p.setAttribute("data-activo", String(Number(p.getAttribute("data-paso")) === n));
      });
      indicadores.forEach(function (li) {
        var i = Number(li.getAttribute("data-indicador"));
        if (i === n) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
        li.setAttribute("data-hecho", String(i < n));
      });
      if (n === 2) actualizarCosechas();
      if (n === 3) actualizarEstimado();
      progresoTexto.textContent = "Paso " + n + " de 4";
      if (opciones.historial) {
        try { history.pushState({ paso: n }, "", "#paso-" + n); } catch (e) { /* sin historial */ }
      }
      if (opciones.foco !== false) {
        var titulo = form.querySelector("[data-paso='" + n + "'] legend h2");
        if (titulo) titulo.focus();
      }
    }

    function avanzarA(destino) {
      if (destino > actual && !validarPaso(actual)) {
        var campo = primerCampoConError(actual);
        if (campo) campo.focus();
        return;
      }
      mostrar(destino, { historial: true });
    }

    /* Botones Siguiente / Atrás / Avanzar */
    form.querySelectorAll("[data-ir]").forEach(function (boton) {
      boton.addEventListener("click", function () { avanzarA(Number(boton.getAttribute("data-ir"))); });
    });

    /* Reacciones inmediatas al elegir o escribir */
    form.querySelectorAll("input[name='camino']").forEach(function (r) {
      r.addEventListener("change", function () {
        marcarError("error-camino", null, "");
        actualizarCosechas();
      });
    });
    form.querySelectorAll("input[name='cosecha']").forEach(function (r) {
      r.addEventListener("change", function () {
        marcarError("error-cosecha", null, "");
        actualizarAprenderas();
      });
    });
    form.elements.cantidad.addEventListener("input", function () {
      marcarError("error-cantidad", form.elements.cantidad, "");
      actualizarEstimado();
    });
    form.querySelectorAll("input[name='unidad']").forEach(function (r) {
      r.addEventListener("change", actualizarEstimado);
    });

    /* El botón "Atrás" del navegador también regresa entre pasos */
    window.addEventListener("popstate", function (e) {
      confirmacion.innerHTML = "";
      mostrar(e.state && e.state.paso ? e.state.paso : 1);
    });

    /* Crear perfil */
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      for (var n = 1; n <= 4; n++) {
        if (!validarPaso(n)) {
          if (n !== actual) mostrar(n, { historial: true, foco: false });
          var campo = primerCampoConError(n);
          if (campo) campo.focus();
          return;
        }
      }

      var perfil = {
        nombre: limpiar(valor("nombre")),
        telefono: limpiar(valor("telefono")),
        comunidad: limpiar(valor("comunidad")),
        contacto: valor("contacto")
      };
      guardarPerfil(perfil);

      var solicitud = [["Quieres", CAMINOS[valor("camino")]]].concat(filasEstimado());
      var datosPerfil = [
        ["Nombre", perfil.nombre],
        ["Teléfono", perfil.telefono],
        ["Comunidad", perfil.comunidad],
        ["Te contactamos por", perfil.contacto]
      ];

      pasos.forEach(function (p) { p.setAttribute("data-activo", "false"); });
      indicadores.forEach(function (li) { li.removeAttribute("aria-current"); li.setAttribute("data-hecho", "true"); });
      confirmacion.innerHTML =
        "<h2>¡Listo, " + perfil.nombre.split(" ")[0] + "!</h2>" +
        "<p>Te contactamos en 48 horas.</p>" +
        '<div class="perfil-tarjetas">' +
          '<div class="resumen">' + tablaHTML("Tu perfil", datosPerfil).replace(' class="total"', "") + "</div>" +
          '<div class="resumen">' + tablaHTML("Tu solicitud", solicitud) + "</div>" +
        "</div>" +
        '<p><a href="producto.html#empezar">Otra solicitud</a> · <a href="index.html">Inicio</a></p>';
      confirmacion.focus();
    });

    /* Si ya creó su perfil antes, lo saludamos y llenamos sus datos */
    var guardado = leerPerfil();
    if (guardado && guardado.nombre) {
      form.elements.nombre.value = guardado.nombre;
      form.elements.telefono.value = guardado.telefono || "";
      form.elements.comunidad.value = guardado.comunidad || "";
      var radioContacto = form.querySelector("input[name='contacto'][value='" + guardado.contacto + "']");
      if (radioContacto) radioContacto.checked = true;
      saludo.textContent = "Hola de nuevo, " + guardado.nombre.split(" ")[0] + ".";
      saludo.hidden = false;
    }

    /* Si llega desde un botón (?camino=lote o ?camino=taller), esa opción ya viene elegida */
    var camino = new URLSearchParams(location.search).get("camino");
    var radioCamino = camino && form.querySelector("input[name='camino'][value='" + camino.replace(/\W/g, "") + "']");
    if (radioCamino) radioCamino.checked = true;

    /* Estado inicial */
    try { history.replaceState({ paso: 1 }, "", location.pathname + location.search + location.hash); } catch (e) { /* nada */ }
    mostrar(1, { foco: false });
  });
})();
