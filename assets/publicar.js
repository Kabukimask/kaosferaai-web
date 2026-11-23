// Pantalla de publicación de Kaosfera (cumple las directrices de UX de TikTok para Direct Post).
(function () {
  const API = "https://kaosfera-api.somoskaosfera.workers.dev";
  const $ = id => document.getElementById(id);
  const T = {
    es: {
      titulo: "Publicar en TikTok", conectar_txt: "Conecta tu cuenta de TikTok para publicar los vídeos de Kaosfera en tu perfil.",
      conectar: "Conectar con TikTok", publicaras: "Publicarás en la cuenta", desconectar: "Desconectar", video: "Vídeo",
      pie: "Título y descripción", privacidad: "¿Quién puede ver este vídeo?", elige: "Elige una opción…", permitir: "Permitir a los usuarios",
      comentar: "Comentar", duo: "Dúo", stitch: "Stitch", divulgar: "Divulgación de contenido",
      comercial: "Este vídeo promociona una marca, producto o servicio", propia: "Tu marca", tercero: "Contenido de marca (de un tercero)",
      ia: "Contenido generado con IA (voz sintética)", publicar: "Publicar",
      PUBLIC_TO_EVERYONE: "Todo el mundo", MUTUAL_FOLLOW_FRIENDS: "Amigos", FOLLOWER_OF_CREATOR: "Seguidores", SELF_ONLY: "Solo yo",
      et_propia: "Tu vídeo se etiquetará como «Contenido promocional».", et_tercero: "Tu vídeo se etiquetará como «Colaboración pagada».",
      cons: 'Al publicar, aceptas la <a href="https://www.tiktok.com/legal/page/global/music-usage-confirmation/en" target="_blank" rel="noopener">Confirmación de uso de música</a> de TikTok.',
      cons_marca: 'Al publicar, aceptas la <a href="https://www.tiktok.com/legal/page/global/bc-policy/en" target="_blank" rel="noopener">Política de contenido de marca</a> y la <a href="https://www.tiktok.com/legal/page/global/music-usage-confirmation/en" target="_blank" rel="noopener">Confirmación de uso de música</a> de TikTok.',
      marca_privado: "El contenido de marca no puede ser privado («Solo yo»).", elige_div: "Elige si es tu marca o contenido de un tercero.",
      largo: "Este vídeo dura más de lo que permite tu cuenta ({max} s).", publicando: "Enviando a TikTok…",
      enviado: "Enviado. Puede tardar unos minutos en aparecer en tu perfil.", estado: "Estado en TikTok: ", desactivado: "(desactivado en tu cuenta)",
      no_publicar: "Tu cuenta no puede publicar ahora mismo. Inténtalo más tarde.",
    },
    en: {
      titulo: "Post to TikTok", conectar_txt: "Connect your TikTok account to post Kaosfera videos to your profile.",
      conectar: "Continue with TikTok", publicaras: "You are posting to", desconectar: "Disconnect", video: "Video",
      pie: "Caption", privacidad: "Who can view this video", elige: "Select an option…", permitir: "Allow users to",
      comentar: "Comment", duo: "Duet", stitch: "Stitch", divulgar: "Content disclosure",
      comercial: "This video promotes a brand, product or service", propia: "Your brand", tercero: "Branded content (third party)",
      ia: "AI-generated content (synthetic voice)", publicar: "Post",
      PUBLIC_TO_EVERYONE: "Everyone", MUTUAL_FOLLOW_FRIENDS: "Friends", FOLLOWER_OF_CREATOR: "Followers", SELF_ONLY: "Only me",
      et_propia: "Your video will be labeled as \"Promotional content\".", et_tercero: "Your video will be labeled as \"Paid partnership\".",
      cons: 'By posting, you agree to TikTok\'s <a href="https://www.tiktok.com/legal/page/global/music-usage-confirmation/en" target="_blank" rel="noopener">Music Usage Confirmation</a>.',
      cons_marca: 'By posting, you agree to TikTok\'s <a href="https://www.tiktok.com/legal/page/global/bc-policy/en" target="_blank" rel="noopener">Branded Content Policy</a> and <a href="https://www.tiktok.com/legal/page/global/music-usage-confirmation/en" target="_blank" rel="noopener">Music Usage Confirmation</a>.',
      marca_privado: "Branded content visibility cannot be set to private.", elige_div: "Choose whether it is your brand or branded content.",
      largo: "This video is longer than your account allows ({max} s).", publicando: "Sending to TikTok…",
      enviado: "Sent. It may take a few minutes to appear on your profile.", estado: "TikTok status: ", desactivado: "(disabled for your account)",
      no_publicar: "Your account can't post right now. Please try again later.",
    },
  };
  let idioma = (() => { try { return localStorage.getItem("kf_lang"); } catch (e) { return null; } })() || (navigator.language || "es").slice(0, 2);
  if (!T[idioma]) idioma = "en";
  const t = k => T[idioma][k] || k;
  let sesion = null; try { sesion = localStorage.getItem("kf_sesion"); } catch (e) {}
  let creador = null, videos = [], duracion = 0;

  function traducir() {
    document.documentElement.lang = idioma; document.documentElement.setAttribute("translate", "no");
    document.querySelectorAll("[data-t]").forEach(el => { el.textContent = t(el.dataset.t); });
    pintarPrivacidad(); validar();
  }
  ["es", "en"].forEach(l => $("lang-" + l).addEventListener("click", e => { e.preventDefault(); idioma = l; try { localStorage.setItem("kf_lang", l); } catch (x) {} traducir(); }));

  async function api(ruta, cuerpo) {
    const r = await fetch(API + ruta, { method: cuerpo ? "POST" : "GET", headers: { "Content-Type": "application/json", ...(sesion ? { Authorization: "Bearer " + sesion } : {}) }, body: cuerpo ? JSON.stringify(cuerpo) : undefined });
    const d = await r.json().catch(() => ({ ok: false, mensaje: "Error" }));
    if (r.status === 401) { salir(false); throw new Error(d.mensaje); }
    if (!d.ok) throw new Error(d.mensaje || d.error);
    return d;
  }
  function salir(llamar) {
    if (llamar && sesion) api("/tiktok/desconectar", {}).catch(() => {});
    try { localStorage.removeItem("kf_sesion"); } catch (e) {}
    sesion = null; $("paso-publicar").hidden = true; $("paso-conectar").hidden = false;
  }
  $("btn-conectar").href = API + "/tiktok/login";
  $("btn-salir").addEventListener("click", () => salir(true));

  function pintarPrivacidad() {
    const sel = $("privacidad"), actual = sel.value;
    sel.innerHTML = `<option value="">${t("elige")}</option>` + ((creador && creador.privacy_level_options) || [])
      .map(o => `<option value="${o}">${t(o)}</option>`).join("");
    sel.value = actual;
    [["p-coment", "comment_disabled"], ["p-duo", "duet_disabled"], ["p-stitch", "stitch_disabled"]].forEach(([id, k]) => {
      const off = creador && creador[k]; $(id).disabled = !!off; if (off) $(id).checked = false;
      $(id).nextElementSibling.textContent = t({ "p-coment": "comentar", "p-duo": "duo", "p-stitch": "stitch" }[id]) + (off ? " " + t("desactivado") : "");
    });
  }

  function validar() {
    const comercial = $("d-comercial").checked, propia = $("d-propia").checked, tercero = $("d-tercero").checked;
    $("d-opciones").hidden = !comercial;
    $("d-etiqueta").textContent = !comercial ? "" : tercero ? t("et_tercero") : propia ? t("et_propia") : t("elige_div");
    // El contenido de marca de terceros no puede ser privado
    const soloYo = [...$("privacidad").options].find(o => o.value === "SELF_ONLY");
    if (soloYo) soloYo.disabled = comercial && tercero;
    if (comercial && tercero && $("privacidad").value === "SELF_ONLY") $("privacidad").value = "";
    $("consentimiento").innerHTML = comercial && tercero ? t("cons_marca") : t("cons");
    const max = creador && creador.max_video_post_duration_sec;
    const largo = max && duracion > max;
    $("aviso-duracion").hidden = !largo; if (largo) $("aviso-duracion").textContent = t("largo").replace("{max}", max);
    $("btn-publicar").disabled = !$("privacidad").value || largo || (comercial && !propia && !tercero) || !$("video").value;
    $("cuenta-car").textContent = $("titulo").value.length;
  }
  ["privacidad", "d-comercial", "d-propia", "d-tercero", "titulo"].forEach(id => $(id).addEventListener(id === "titulo" ? "input" : "change", validar));

  function elegirVideo() {
    const v = videos.find(x => x.id === $("video").value); if (!v) return;
    $("vista").src = v.file; $("titulo").value = v.title; duracion = v.duration; validar();
  }
  $("video").addEventListener("change", elegirVideo);
  $("vista").addEventListener("loadedmetadata", () => { duracion = $("vista").duration || duracion; validar(); });

  $("btn-publicar").addEventListener("click", async () => {
    const v = videos.find(x => x.id === $("video").value);
    $("btn-publicar").disabled = true; $("resultado").textContent = t("publicando");
    try {
      const d = await api("/tiktok/publicar", {
        video_url: v.file, title: $("titulo").value, privacy_level: $("privacidad").value, consentimiento: true,
        disable_comment: !$("p-coment").checked, disable_duet: !$("p-duo").checked, disable_stitch: !$("p-stitch").checked,
        brand_organic_toggle: $("d-comercial").checked && $("d-propia").checked, brand_content_toggle: $("d-comercial").checked && $("d-tercero").checked,
        is_aigc: $("d-ia").checked,
      });
      $("resultado").textContent = t("enviado");
      for (let i = 0; i < 12; i++) {
        await new Promise(r => setTimeout(r, 5000));
        const e = await api("/tiktok/estado", { publish_id: d.publish_id }).catch(() => null);
        const st = e && e.estado && e.estado.status; if (!st) continue;
        $("resultado").textContent = t("enviado") + " " + t("estado") + st;
        if (st === "PUBLISH_COMPLETE" || st === "FAILED") break;
      }
    } catch (e) { $("resultado").innerHTML = '<span class="error"></span>'; $("resultado").firstChild.textContent = e.message; validar(); }
  });

  async function iniciar() {
    traducir();
    if (!sesion) { $("paso-conectar").hidden = false; return; }
    try {
      const [c, lista] = await Promise.all([api("/tiktok/creador"), fetch("/videos/videos.json").then(r => r.json())]);
      creador = c.creador || {}; videos = lista;
      $("avatar").src = (c.usuario && c.usuario.avatar_url) || "/assets/icono-192.png";
      $("nombre").textContent = (c.usuario && c.usuario.display_name) || creador.creator_nickname || "";
      $("video").innerHTML = videos.map(v => `<option value="${v.id}">${v.id} (${v.lang.toUpperCase()}, ${Math.round(v.duration)} s)</option>`).join("");
      $("paso-publicar").hidden = false; $("paso-conectar").hidden = true;
      pintarPrivacidad(); elegirVideo();
    } catch (e) { $("error-general").textContent = e.message; if (!sesion) $("paso-conectar").hidden = false; }
  }
  iniciar();
})();
