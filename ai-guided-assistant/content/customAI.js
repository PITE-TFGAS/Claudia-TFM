// SCRIPT ENCARGADO DE GESTIONAR LAS IAS EXPERTAS QUE EL USUARIO PUEDA TENER

window.CustomAIManager = {
async getExpertForCurrentPage() {
    const currentHostname = window.location.hostname.toLowerCase();

    return new Promise((resolve) => {
      chrome.storage.local.get(["user_custom_ais"], (result) => {
        const ais = result.user_custom_ais || [];

        let experto = ais.find((ai) => {
          if (ai.domain.trim() === "*") return false;
          
          const cleanDomain = ai.domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, "");
          return currentHostname === cleanDomain || currentHostname.endsWith("." + cleanDomain);
        });
        
        if (!experto) {
          experto = ais.find((ai) => ai.domain.trim() === "*");
        }
        
        resolve(experto || null);
      });
    });
  },

  buildExpertPrompt(payload) {
    const {
      goal,
      dom,
      phase,
      lastSuggestedId,
      lastSuggestedText,
      clickedInfo,
      history,
      url,
      title,
    } = payload;

    const historyText =
      history && history.length > 0
        ? history.join("\n")
        : "Sin historial previo.";
    const clickedDesc = clickedInfo
      ? `ID: ${clickedInfo.id}, Texto: "${clickedInfo.text}", Tag: <${clickedInfo.tag}>`
      : "Click en zona vacía o desconocida";

    let contextInfo = `
DATOS DE NAVEGACIÓN ACTUALES:
- URL: "${url}"
- Título de la Página: "${title}"

HISTORIAL DE LA SESIÓN:
${historyText}
`;

    if (phase === "start") {
      contextInfo += `\nESTADO: Inicio de la tarea. Analiza el DOM y da el primer paso.`;
    } else if (phase === "navigation_completed") {
      contextInfo += `\nESTADO: Navegación completada (Página nueva). El usuario realizó una acción y la página cambió. Analiza si hemos llegado al objetivo o cuál es el siguiente paso.`;
    } else {
      contextInfo += `
ESTADO: Verificación de acción en la misma página.
COMPARATIVA DE ACCIÓN:
-------------------------------------------------
1. TU INSTRUCCIÓN ANTERIOR:
   - ID Sugerido: ${lastSuggestedId}
   - Texto que esperabas que pulsara: "${lastSuggestedText || "Cualquiera"}"
2. LO QUE HIZO EL USUARIO REALMENTE:
   - ${clickedDesc}
-------------------------------------------------`;
    }

    return `
Eres un asistente de navegación web experto para personas mayores. Tu trabajo es ayudar al usuario a completar CUALQUIER objetivo en CUALQUIER sitio web.
OBJETIVO DEL USUARIO: "${goal}"

CONTEXTO:
${contextInfo}

DOM ACTUAL (i=id, t=tag, x=texto):
${dom}

INTERPRETACIÓN DE ETIQUETAS DEL DOM:
- [OFERTA_VUELO]: Botón para **seleccionar un vuelo**. Prioridad alta.
- [CALENDARIO_PRECIO]: Botón para cambiar de día. NO CLICAR salvo que la fecha sea incorrecta.
- [INFO_PASO]: Barra de progreso. NO CLICAR, es solo información.
- [ACCION]: Elemento interactivo (Botón, Link, Input). Prioridad alta.
- [SELECCIONADO]: Elemento ya activo.
- [PRECIO]: Información económica crítica.
- [VACÍO]: Input que necesita ser rellenado.

REGLAS DE RAZONAMIENTO:
1. PRIORIDAD DEL CHAT (CRÍTICO): Obedece instrucciones prioritarias del historial.
2. ANÁLISIS DE COMPLETITUD: Verifica que los campos lógicos estén rellenos antes de pulsar "Continuar".
3. DETECCIÓN DE AMBIGÜEDAD: Si hay opciones críticas no especificadas (ej: Talla, Fecha), pregunta.
4. COHERENCIA DE ACCIÓN: Si la acción anterior fue exitosa, pasa a la siguiente.

El ID del elemento está en la propiedad "i".
Responde SOLO JSON estricto:
{
  "feedback": "Mensaje corto y natural de lo que el usuario debe hacer.",
  "target_id": number | null (si status es completed),
  "status": "in_progress" | "completed"
}`;
  },

  async callExpert(experto, payload) {
    console.log(`🧠 Usando IA Experta del usuario para: ${experto.domain}`);

    const fullPrompt = this.buildExpertPrompt(payload);

    try {
      const response = await fetch(experto.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: experto.apiKey ? `Bearer ${experto.apiKey}` : "",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: "Eres un sistema que responde SOLO en JSON válido.",
            },
            { role: "user", content: fullPrompt },
          ],
          raw_payload: payload,
        }),
      });

      if (!response.ok) throw new Error("Fallo en la IA Experta");

      const data = await response.json();

      let resultJson = data;

      if (data.choices && data.choices[0] && data.choices[0].message) {
        const rawContent = data.choices[0].message.content;
        const match = rawContent.match(/\{[\s\S]*\}/);
        if (match) {
          resultJson = JSON.parse(match[0]);
        }
      }

      if (resultJson && typeof resultJson.status === "string") {
        return resultJson;
      } else {
        throw new Error(
          "La IA experta no devolvió un JSON con el formato correcto.",
        );
      }
    } catch (error) {
      console.error("Error contactando a la IA experta:", error.message);
      return null;
    }
  },
};
