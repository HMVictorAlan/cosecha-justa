/* Encuesta de apps (Actividad 4).
   Las respuestas se guardan solo en este dispositivo (localStorage) y se exportan
   como texto, por WhatsApp o como tabla .csv. No se envía nada a ningún servidor. */
(function () {
  "use strict";

  var CLAVE = "cj-encuesta";
  var META = 5;
  var memoria = []; /* respaldo si el navegador no permite guardar */

  function cargar() {
    try {
      var datos = JSON.parse(localStorage.getItem(CLAVE) || "[]");
      return Array.isArray(datos) ? datos : [];
    } catch (e) { return memoria.slice(); }
  }

  function guardar(lista) {
    memoria = lista.slice();
    try { localStorage.setItem(CLAVE, JSON.stringify(lista)); return true; } catch (e) { return false; }
  }

  function marcados(form, nombre) {
    return Array.prototype.filter.call(form.querySelectorAll("input[name='" + nombre + "']"), function (c) {
      return c.checked;
    }).map(function (c) { return c.value; });
  }

  function limpio(texto) { return (texto || "").replace(/\s+/g, " ").trim(); }

  /* ---------- Texto para copiar o enviar ---------- */
  function comoTexto(r, n) {
    var perfil = [r.genero, r.edad ? r.edad + " años" : "", r.ocupacion].filter(Boolean).join(", ");
    return [
      "P" + n + " — " + perfil + " (" + r.lugar + ")",
      "1. Apps: " + r.app1 + ", " + r.app2,
      "2. " + r.app1 + ": " + (r.uso1.join(", ") || "—") + " | " + r.app2 + ": " + (r.uso2.join(", ") || "—") +
        (r.usoDetalle ? " | " + r.usoDetalle : ""),
      "3. Le gusta: " + (r.gusta || "—") + " | Les falta: “" + r.falta + "”",
      "4. Comida por app: " + r.comida + (r.comidaDetalle ? " (" + r.comidaDetalle + ")" : ""),
      "5. App de productores: " + r.usaria + (r.confianza ? " | Para confiar: " + r.confianza : "")
    ].join("\n");
  }

  function todoComoTexto(lista) {
    return "Encuesta de apps · Actividad 4\n\n" + lista.map(function (r, i) { return comoTexto(r, i + 1); }).join("\n\n");
  }

  function comoCSV(lista) {
    var columnas = ["#", "Edad", "Género", "Ocupación", "Lugar", "App 1", "Uso app 1", "App 2", "Uso app 2",
      "Para qué exactamente", "Le gusta", "Les falta", "Comida por app", "Detalle comida", "Usaría la app", "Para confiar"];
    var filas = lista.map(function (r, i) {
      return ["P" + (i + 1), r.edad, r.genero, r.ocupacion, r.lugar, r.app1, r.uso1.join(", "), r.app2, r.uso2.join(", "),
        r.usoDetalle, r.gusta, r.falta, r.comida, r.comidaDetalle, r.usaria, r.confianza];
    });
    return [columnas].concat(filas).map(function (fila) {
      return fila.map(function (v) { return '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"'; }).join(",");
    }).join("\r\n");
  }

  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("form-encuesta");
    if (!form) return;

    var aviso = document.getElementById("aviso-encuesta");
    var avisoAcciones = document.getElementById("aviso-acciones");
    var conteo = document.getElementById("conteo");
    var listaEl = document.getElementById("lista-respuestas");
    var vacio = document.getElementById("sin-respuestas");
    var acciones = document.getElementById("acciones");
    var botonWhats = document.getElementById("btn-whatsapp");

    /* El nombre de cada app aparece en la pregunta 2 */
    ["1", "2"].forEach(function (n) {
      var campo = form.elements["app" + n];
      var titulo = document.getElementById("uso" + n + "-titulo");
      campo.addEventListener("input", function () { titulo.textContent = limpio(campo.value) || "App " + n; });
    });

    /* ---------- Lista de entrevistas guardadas ---------- */
    function pintar() {
      var lista = cargar();
      conteo.textContent = lista.length;
      vacio.hidden = lista.length > 0;
      acciones.hidden = lista.length === 0;
      listaEl.innerHTML = "";
      lista.forEach(function (r, i) {
        var li = document.createElement("li");
        li.className = "respuesta";
        var h = document.createElement("h3");
        h.textContent = "P" + (i + 1) + ". " + r.ocupacion + (r.edad ? ", " + r.edad + " años" : "");
        var apps = document.createElement("p");
        apps.textContent = "Apps: " + r.app1 + " y " + r.app2 + " · " + r.lugar;
        var cita = document.createElement("p");
        cita.className = "cita";
        cita.textContent = "“" + r.falta + "”";
        var quitar = document.createElement("button");
        quitar.type = "button";
        quitar.className = "btn-quitar";
        quitar.textContent = "Borrar P" + (i + 1);
        quitar.addEventListener("click", function () {
          if (!window.confirm("¿Borrar la entrevista P" + (i + 1) + "?")) return;
          var actual = cargar();
          actual.splice(i, 1);
          guardar(actual);
          pintar();
          avisar(avisoAcciones, "Se borró la entrevista P" + (i + 1) + ".");
        });
        li.appendChild(h); li.appendChild(apps); li.appendChild(cita); li.appendChild(quitar);
        listaEl.appendChild(li);
      });
      botonWhats.href = "https://wa.me/?text=" + encodeURIComponent(todoComoTexto(lista));
    }

    function avisar(caja, texto, esError) {
      caja.textContent = texto;
      caja.classList.toggle("es-error", !!esError);
      caja.focus();
    }

    /* ---------- Validación ---------- */
    var OBLIGATORIOS = {
      edad: "Escribe la edad.",
      ocupacion: "Escribe a qué se dedica.",
      lugar: "Elige dónde la entrevistaste.",
      app1: "Escribe la primera app.",
      app2: "Escribe la segunda app.",
      falta: "Anota lo que les falta a sus apps.",
      comida: "Elige Sí o No.",
      usaria: "Elige una respuesta."
    };

    function validar() {
      var primero = null;
      Object.keys(OBLIGATORIOS).forEach(function (nombre) {
        var campo = form.elements[nombre];
        var valor = campo instanceof RadioNodeList ? campo.value : limpio(campo.value);
        var error = document.getElementById("error-" + nombre);
        var mal = !valor;
        if (nombre === "edad" && valor && (+valor < 12 || +valor > 110)) mal = true;
        error.textContent = mal ? OBLIGATORIOS[nombre] : "";
        if (!(campo instanceof RadioNodeList)) campo.setAttribute("aria-invalid", mal ? "true" : "false");
        if (mal && !primero) primero = campo instanceof RadioNodeList ? campo[0] : campo;
      });
      return primero;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var primero = validar();
      if (primero) {
        avisar(aviso, "Faltan respuestas. Revisa los campos marcados.", true);
        primero.focus();
        return;
      }
      var r = {
        edad: limpio(form.elements.edad.value),
        genero: form.elements.genero.value,
        ocupacion: limpio(form.elements.ocupacion.value),
        lugar: form.elements.lugar.value,
        app1: limpio(form.elements.app1.value),
        app2: limpio(form.elements.app2.value),
        uso1: marcados(form, "uso1"),
        uso2: marcados(form, "uso2"),
        usoDetalle: limpio(form.elements.usoDetalle.value),
        gusta: limpio(form.elements.gusta.value),
        falta: limpio(form.elements.falta.value),
        comida: form.elements.comida.value,
        comidaDetalle: limpio(form.elements.comidaDetalle.value),
        usaria: form.elements.usaria.value,
        confianza: limpio(form.elements.confianza.value),
        fecha: new Date().toISOString()
      };
      var lista = cargar();
      lista.push(r);
      var persistio = guardar(lista);
      form.reset();
      document.getElementById("uso1-titulo").textContent = "App 1";
      document.getElementById("uso2-titulo").textContent = "App 2";
      pintar();
      var faltan = META - lista.length;
      avisar(aviso, "Se guardó la entrevista P" + lista.length + ". " +
        (faltan > 0 ? "Faltan " + faltan + "." : "¡Ya tienes las 5! Abajo puedes copiarlas o enviarlas.") +
        (persistio ? "" : " Ojo: este navegador no permite guardar; no cierres la página."), !persistio);
    });

    /* ---------- Exportar ---------- */
    document.getElementById("btn-copiar").addEventListener("click", function () {
      var texto = todoComoTexto(cargar());
      function listo() { avisar(avisoAcciones, "Respuestas copiadas. Pégalas donde las necesites."); }
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(texto).then(listo, copiarViejo);
      } else { copiarViejo(); }
      function copiarViejo() {
        var area = document.createElement("textarea");
        area.value = texto;
        area.setAttribute("readonly", "");
        area.style.position = "absolute"; area.style.left = "-9999px";
        document.body.appendChild(area);
        area.select();
        var ok = false;
        try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
        document.body.removeChild(area);
        if (ok) listo(); else avisar(avisoAcciones, "No se pudo copiar. Usa Enviar por WhatsApp o Descargar tabla.", true);
      }
    });

    document.getElementById("btn-csv").addEventListener("click", function () {
      /* El BOM hace que Excel lea bien los acentos */
      var archivo = new Blob(["﻿" + comoCSV(cargar())], { type: "text/csv;charset=utf-8" });
      var enlace = document.createElement("a");
      enlace.href = URL.createObjectURL(archivo);
      enlace.download = "encuesta-apps.csv";
      document.body.appendChild(enlace);
      enlace.click();
      document.body.removeChild(enlace);
      setTimeout(function () { URL.revokeObjectURL(enlace.href); }, 1000);
      avisar(avisoAcciones, "Se descargó encuesta-apps.csv.");
    });

    document.getElementById("btn-borrar").addEventListener("click", function () {
      if (!window.confirm("¿Borrar todas las entrevistas de este celular? No se puede deshacer.")) return;
      guardar([]);
      pintar();
      avisar(avisoAcciones, "Se borraron todas las entrevistas.");
    });

    pintar();
  });
})();
