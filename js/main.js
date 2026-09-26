/* Cosecha Justa — comportamiento del sitio
   Todo es mejora progresiva: sin JavaScript el contenido y la navegación siguen funcionando. */
(function () {
  "use strict";

  var raiz = document.documentElement;
  raiz.classList.add("js");

  /* ---------- Preferencias de accesibilidad (se recuerdan entre páginas) ---------- */
  function leer(clave) {
    try { return localStorage.getItem(clave); } catch (e) { return null; }
  }
  function guardar(clave, valor) {
    try { localStorage.setItem(clave, valor); } catch (e) { /* sin almacenamiento: no pasa nada */ }
  }

  var TAMANOS = ["normal", "grande", "mayor"];
  var NOMBRES_TAMANO = { normal: "normal", grande: "grande", mayor: "muy grande" };
  var INTERRUPTORES = ["contraste", "enlaces", "espaciado"];
  var prefs = {
    texto: leer("cj-texto") || "normal",
    contraste: leer("cj-contraste") || "normal",
    enlaces: leer("cj-enlaces") || "normal",
    espaciado: leer("cj-espaciado") || "normal"
  };
  if (prefs.contraste === "alto") prefs.contraste = "activo"; /* valor de una versión anterior */

  /* Se aplica antes de pintar la página para que no parpadee */
  function aplicar() {
    raiz.setAttribute("data-texto", prefs.texto);
    INTERRUPTORES.forEach(function (clave) { raiz.setAttribute("data-" + clave, prefs[clave]); });
  }
  aplicar();

  document.addEventListener("DOMContentLoaded", function () {
    var botonA11y = document.getElementById("a11y-boton");
    var panel = document.getElementById("a11y-panel");
    var estado = document.getElementById("a11y-estado");

    function anunciar(mensaje) {
      if (estado) estado.textContent = mensaje;
    }

    function sincronizarBotones() {
      INTERRUPTORES.forEach(function (clave) {
        var b = document.querySelector("[data-accion='" + clave + "']");
        if (b) b.setAttribute("aria-pressed", prefs[clave] === "activo" ? "true" : "false");
      });
      var i = TAMANOS.indexOf(prefs.texto);
      var menos = document.querySelector("[data-accion='texto-menos']");
      var mas = document.querySelector("[data-accion='texto-mas']");
      if (menos) menos.disabled = i === 0;
      if (mas) mas.disabled = i === TAMANOS.length - 1;
      var valorTexto = document.getElementById("a11y-tamano");
      if (valorTexto) valorTexto.textContent = NOMBRES_TAMANO[prefs.texto];
    }
    sincronizarBotones();

    /* ---------- Abrir y cerrar el panel ---------- */
    function abrirPanel(abrir) {
      if (!botonA11y || !panel) return;
      botonA11y.setAttribute("aria-expanded", String(abrir));
      panel.hidden = !abrir;
      if (abrir) {
        var titulo = panel.querySelector("h2");
        if (titulo) titulo.focus();
      }
    }
    if (botonA11y && panel) {
      botonA11y.addEventListener("click", function () {
        abrirPanel(botonA11y.getAttribute("aria-expanded") !== "true");
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && !panel.hidden) {
          abrirPanel(false);
          botonA11y.focus();
        }
      });
      var cerrar = panel.querySelector(".a11y-cerrar");
      if (cerrar) cerrar.addEventListener("click", function () { abrirPanel(false); botonA11y.focus(); });
      document.addEventListener("click", function (e) {
        if (!panel.hidden && !panel.contains(e.target) && !botonA11y.contains(e.target)) abrirPanel(false);
      });
    }

    /* ---------- Acciones del panel ---------- */
    document.querySelectorAll("[data-accion]").forEach(function (boton) {
      boton.addEventListener("click", function () {
        var accion = boton.getAttribute("data-accion");
        var i = TAMANOS.indexOf(prefs.texto);

        if (accion === "texto-mas" || accion === "texto-menos") {
          if (accion === "texto-mas" && i < TAMANOS.length - 1) prefs.texto = TAMANOS[i + 1];
          if (accion === "texto-menos" && i > 0) prefs.texto = TAMANOS[i - 1];
          guardar("cj-texto", prefs.texto);
          anunciar("Tamaño de texto: " + NOMBRES_TAMANO[prefs.texto]);
        }
        if (INTERRUPTORES.indexOf(accion) !== -1) {
          prefs[accion] = prefs[accion] === "activo" ? "normal" : "activo";
          guardar("cj-" + accion, prefs[accion]);
          anunciar(boton.getAttribute("data-nombre") + (prefs[accion] === "activo" ? ": activado" : ": desactivado"));
        }
        if (accion === "restablecer") {
          prefs = { texto: "normal", contraste: "normal", enlaces: "normal", espaciado: "normal" };
          ["texto"].concat(INTERRUPTORES).forEach(function (clave) { guardar("cj-" + clave, "normal"); });
          if (window.speechSynthesis && window.speechSynthesis.speaking) leerPagina(botonLeer);
          anunciar("Se restablecieron los ajustes de accesibilidad.");
        }
        if (accion === "leer") leerPagina(boton);

        aplicar();
        sincronizarBotones();
      });
    });

    /* ---------- Lectura en voz alta (texto a voz del navegador) ---------- */
    var botonLeer = document.querySelector("[data-accion='leer']");
    if (botonLeer && !("speechSynthesis" in window)) botonLeer.hidden = true;

    function leerPagina(boton) {
      var voz = window.speechSynthesis;
      var etiqueta = boton.querySelector(".a11y-etiqueta");
      function detenido() {
        boton.setAttribute("aria-pressed", "false");
        etiqueta.textContent = "Leer en voz alta";
      }
      if (voz.speaking) {
        voz.cancel();
        detenido();
        return;
      }
      var main = document.getElementById("contenido");
      var frase = new SpeechSynthesisUtterance(main ? main.innerText : document.body.innerText);
      frase.lang = "es-MX";
      frase.rate = 0.95;
      frase.onend = detenido;
      voz.speak(frase);
      boton.setAttribute("aria-pressed", "true");
      etiqueta.textContent = "Detener lectura";
    }

    /* ---------- Antes y después: de cosecha a producto ---------- */
    document.querySelectorAll(".antes-despues").forEach(function (figura) {
      var boton = figura.querySelector(".btn-cambio");
      var antes = figura.querySelector(".antes");
      var despues = figura.querySelector(".despues");
      var marca = figura.querySelector(".marca");
      function pintar(verProducto) {
        figura.setAttribute("data-estado", verProducto ? "despues" : "antes");
        boton.setAttribute("aria-pressed", String(verProducto));
        boton.textContent = verProducto ? "Ver cosecha" : "Ver terminado";
        antes.setAttribute("aria-hidden", String(verProducto));
        despues.setAttribute("aria-hidden", String(!verProducto));
        marca.textContent = verProducto ? "Producto" : "Cosecha";
      }
      pintar(false);
      boton.addEventListener("click", function () {
        pintar(figura.getAttribute("data-estado") === "antes");
      });
    });

    /* ---------- Galería deslizable ---------- */
    var galeria = document.querySelector(".galeria");
    document.querySelectorAll("[data-galeria]").forEach(function (boton) {
      boton.addEventListener("click", function () {
        if (!galeria) return;
        var paso = galeria.clientWidth * 0.8 * Number(boton.getAttribute("data-galeria"));
        var suave = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        galeria.scrollBy({ left: paso, behavior: suave ? "smooth" : "auto" });
      });
    });

    /* ---------- Tarjetas que revelan qué hacemos (Inicio) ---------- */
    function abrirTarjeta(tarjeta, abrir) {
      var b = tarjeta.querySelector(".revela-boton");
      tarjeta.classList.toggle("abierta", abrir);
      b.setAttribute("aria-expanded", String(abrir));
      tarjeta.querySelector(".revela-panel a").tabIndex = abrir ? 0 : -1;
    }
    document.querySelectorAll(".revela").forEach(function (tarjeta) {
      abrirTarjeta(tarjeta, false);
      tarjeta.querySelector(".revela-boton").addEventListener("click", function () {
        abrirTarjeta(tarjeta, !tarjeta.classList.contains("abierta"));
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      var abierta = document.activeElement && document.activeElement.closest && document.activeElement.closest(".revela.abierta");
      if (abierta) {
        abrirTarjeta(abierta, false);
        abierta.querySelector(".revela-boton").focus();
      }
    });

    /* ---------- Página de producto: miniaturas ---------- */
    var fotoPrincipal = document.querySelector(".foto-principal");
    document.querySelectorAll(".miniatura").forEach(function (mini) {
      mini.addEventListener("click", function () {
        fotoPrincipal.src = mini.getAttribute("data-foto");
        fotoPrincipal.alt = mini.getAttribute("data-alt");
        document.querySelectorAll(".miniatura").forEach(function (m) {
          m.setAttribute("aria-pressed", String(m === mini));
        });
      });
    });

    /* ---------- Página de producto: cantidad y carrito (maqueta) ---------- */
    document.querySelectorAll("form.compra").forEach(function (compra) {
      var campo = compra.querySelector("input[name='cantidad']");
      var aviso = compra.querySelector(".aviso-compra");
      function limitar(n) { return Math.min(99, Math.max(1, Math.round(Number(n)) || 1)); }
      compra.querySelectorAll(".paso-cant").forEach(function (b) {
        b.addEventListener("click", function () {
          campo.value = limitar(Number(campo.value) + Number(b.getAttribute("data-cambio")));
        });
      });
      compra.addEventListener("submit", function (e) {
        e.preventDefault();
        var n = limitar(campo.value);
        campo.value = n;
        var total = n * Number(compra.getAttribute("data-precio"));
        aviso.textContent = "Agregaste " + n + " × " + compra.getAttribute("data-producto") +
          " ($" + total.toLocaleString("es-MX") + "). Es una maqueta: no se hace ningún cobro.";
      });
    });

    /* ---------- Menú en móvil ---------- */
    var menuBoton = document.querySelector(".menu-boton");
    var nav = document.getElementById("menu-principal");
    if (menuBoton && nav) {
      nav.setAttribute("data-abierto", "false");
      menuBoton.addEventListener("click", function () {
        var abierto = menuBoton.getAttribute("aria-expanded") === "true";
        menuBoton.setAttribute("aria-expanded", String(!abierto));
        nav.setAttribute("data-abierto", String(!abierto));
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && menuBoton.getAttribute("aria-expanded") === "true") {
          menuBoton.setAttribute("aria-expanded", "false");
          nav.setAttribute("data-abierto", "false");
          menuBoton.focus();
        }
      });
    }

    /* ---------- Filtro de productos ---------- */
    var filtros = document.querySelectorAll("input[name='categoria']");
    var productos = document.querySelectorAll(".producto");
    var conteo = document.getElementById("conteo-productos");
    filtros.forEach(function (filtro) {
      filtro.addEventListener("change", function () {
        var visibles = 0;
        productos.forEach(function (p) {
          var mostrar = filtro.value === "todos" || p.getAttribute("data-categoria") === filtro.value;
          p.hidden = !mostrar;
          if (mostrar) visibles++;
        });
        if (conteo) conteo.textContent = "Mostrando " + visibles + " producto" + (visibles === 1 ? "" : "s") + ".";
      });
    });

    /* ---------- Validación del formulario de contacto ---------- */
    var form = document.getElementById("form-contacto");
    if (form) {
      form.setAttribute("novalidate", "");

      /* Si viene de un botón (?motivo=lote o ?motivo=taller), deja la opción ya elegida */
      var motivo = new URLSearchParams(location.search).get("motivo");
      if (motivo && form.elements.perfil.querySelector("option[value='" + motivo.replace(/\W/g, "") + "']")) {
        form.elements.perfil.value = motivo;
      }
      var aviso = document.getElementById("aviso-form");

      var reglas = {
        nombre: function (v) { return v.trim().length >= 2 ? "" : "Escribe tu nombre (al menos 2 letras)."; },
        telefono: function (v) {
          var digitos = v.replace(/\D/g, "");
          return digitos.length === 10 ? "" : "Escribe un teléfono de 10 números. Ejemplo: 55 1234 5678.";
        },
        perfil: function (v) { return v ? "" : "Elige qué te interesa."; },
        mensaje: function (v) { return v.trim().length >= 5 ? "" : "Cuéntanos en pocas palabras qué necesitas."; }
      };

      function validar(campo) {
        var regla = reglas[campo.name];
        if (!regla) return true;
        var msg = regla(campo.value);
        var error = document.getElementById("error-" + campo.name);
        campo.setAttribute("aria-invalid", msg ? "true" : "false");
        if (error) error.textContent = msg;
        return !msg;
      }

      Object.keys(reglas).forEach(function (nombre) {
        var campo = form.elements[nombre];
        if (campo) campo.addEventListener("blur", function () { validar(campo); });
      });

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var primeroConError = null;
        Object.keys(reglas).forEach(function (nombre) {
          var campo = form.elements[nombre];
          if (campo && !validar(campo) && !primeroConError) primeroConError = campo;
        });

        if (primeroConError) {
          aviso.className = "aviso es-error";
          aviso.textContent = "Revisa los campos marcados. Hay datos que faltan o no son correctos.";
          primeroConError.focus();
          return;
        }
        aviso.className = "aviso";
        aviso.textContent = "¡Gracias, " + form.elements.nombre.value.trim() +
          "! Recibimos tu mensaje. Te llamaremos o escribiremos por WhatsApp en menos de 48 horas.";
        form.reset();
        aviso.focus();
      });
    }
  });
})();
