import type { Facts } from "../types"
import { DateParser } from "../utils/date-parser"

export class EntityExtractor {
  // Extraer entidades de tablero
  static extractTableroEntities(facts: Facts): void {
    const message = facts.message
    facts.entities = facts.entities || {}

    // Extraer nombre del tablero para crear/eliminar
    const nombreMatch =
      message.match(/tablero\s+(?:llamado|que\s+se\s+llame|con\s+(?:el\s+)?nombre(?:\s+de)?)\s+"([^"]+)"/i) ||
      message.match(/tablero\s+(?:llamado|que\s+se\s+llame|con\s+(?:el\s+)?nombre(?:\s+de)?)\s+([^\s"]+)/i)

    if (nombreMatch) {
      facts.entities.tablero_nombre = nombreMatch[1]
    }

    // Para modificar tablero
    const nombreActualMatch =
      message.match(/tablero\s+(?:llamado|que\s+se\s+llama|con\s+(?:el\s+)?nombre(?:\s+de)?)\s+"([^"]+)"\s+a/i) ||
      message.match(/tablero\s+(?:llamado|que\s+se\s+llama|con\s+(?:el\s+)?nombre(?:\s+de)?)\s+([^\s"]+)\s+a/i)

    const nombreNuevoMatch = message.match(/a\s+"([^"]+)"/i) || message.match(/a\s+([^\s"]+)$/i)

    if (nombreActualMatch) {
      facts.entities.tablero_nombre_actual = nombreActualMatch[1]
    }

    if (nombreNuevoMatch) {
      facts.entities.tablero_nombre_nuevo = nombreNuevoMatch[1]
    }

    // Extraer descripción si existe
    const descripcionMatch = message.match(/descripción\s+"([^"]+)"/i) || message.match(/descripción\s+([^\s"]+)/i)

    if (descripcionMatch) {
      facts.entities.tablero_descripcion = descripcionMatch[1]
    }
  }

  // Extraer entidades de columna
  static extractColumnaEntities(facts: Facts): void {
    const message = facts.message
    facts.entities = facts.entities || {}
    console.log("Extrayendo entidades de columna del mensaje:", message)

    // Extraer nombre de la columna para crear/eliminar - Patrones mejorados
    const patronesNombre = [
      /columna\s+(?:llamada|que\s+se\s+llame|con\s+(?:el\s+)?nombre(?:\s+de)?)\s+"([^"]+)"/i,
      /columna\s+(?:llamada|que\s+se\s+llame|con\s+(?:el\s+)?nombre(?:\s+de)?)\s+([^\s"]+)/i,
      /columna\s+llamada\s+([^\s",.]+)/i,
      /crear\s+columna\s+([^\s",.]+)/i,
      /crea\s+columna\s+([^\s",.]+)/i,
      /nueva\s+columna\s+([^\s",.]+)/i,
    ]

    for (const patron of patronesNombre) {
      const match = message.match(patron)
      if (match && match[1]) {
        console.log(`Nombre de columna encontrado con patrón ${patron}: ${match[1]}`)
        facts.entities.columna_nombre = match[1]
        break
      }
    }

    // Si no se encontró con los patrones anteriores, buscar después de "llamada"
    if (!facts.entities.columna_nombre && message.toLowerCase().includes("llamada")) {
      const partes = message.toLowerCase().split("llamada")
      if (partes.length > 1 && partes[1].trim()) {
        const nombrePosible = partes[1].trim().split(/\s+/)[0]
        if (nombrePosible) {
          console.log(`Nombre de columna extraído después de "llamada": ${nombrePosible}`)
          facts.entities.columna_nombre = nombrePosible
        }
      }
    }

    // Para modificar columna
    const nombreActualMatch =
      message.match(/columna\s+(?:llamada|que\s+se\s+llama|con\s+(?:el\s+)?nombre(?:\s+de)?)\s+"([^"]+)"\s+a/i) ||
      message.match(/columna\s+(?:llamada|que\s+se\s+llama|con\s+(?:el\s+)?nombre(?:\s+de)?)\s+([^\s"]+)\s+a/i)

    const nombreNuevoMatch = message.match(/a\s+"([^"]+)"/i) || message.match(/a\s+([^\s"]+)$/i)

    if (nombreActualMatch) {
      facts.entities.columna_nombre_actual = nombreActualMatch[1]
    }

    if (nombreNuevoMatch) {
      facts.entities.columna_nombre_nuevo = nombreNuevoMatch[1]
    }

    console.log("Entidades de columna extraídas:", facts.entities)
  }

  // Extraer entidades de tarea
  static extractTareaEntities(facts: Facts): void {
    const message = facts.message
    facts.entities = facts.entities || {}
    console.log("Extrayendo entidades de tarea del mensaje:", message)

    // Primero intentar extraer con patrones específicos para títulos con comillas
    const tituloConComillasMatch = message.match(
      /tarea\s+(?:llamada|que\s+se\s+llame|con\s+(?:el\s+)?(?:nombre|título)(?:\s+de)?)\s+"([^"]+)"/i,
    )

    if (tituloConComillasMatch) {
      facts.entities.tarea_titulo = tituloConComillasMatch[1]
      console.log(`Título de tarea encontrado con comillas: "${facts.entities.tarea_titulo}"`)
    } else {
      // Si no hay comillas, extraer el título entre "llamada" y "en" (para tareas en columnas específicas)
      if (message.toLowerCase().includes("llamada") && message.toLowerCase().includes(" en ")) {
        const parteInicial = message.toLowerCase().split("llamada")[1].trim()
        const partes = parteInicial.split(" en ")
        if (partes.length > 0 && partes[0].trim()) {
          facts.entities.tarea_titulo = partes[0].trim()
          console.log(`Título de tarea extraído entre "llamada" y "en": "${facts.entities.tarea_titulo}"`)
        }
      }
      // Si no hay "en", intentar extraer todo después de "llamada"
      else if (message.toLowerCase().includes("llamada")) {
        const parteInicial = message.toLowerCase().split("llamada")[1].trim()
        // Extraer hasta alguna preposición o fin de la frase
        const titulo = parteInicial.split(/\s+(?:con|para|a|de|por)\s+/)[0].trim()
        if (titulo) {
          facts.entities.tarea_titulo = titulo
          console.log(`Título de tarea extraído después de "llamada": "${facts.entities.tarea_titulo}"`)
        }
      }
      // Si aún no hay título, intentar con patrones simples
      else {
        const tituloPatrones = [
          /crear\s+tarea\s+([^\s",.]+)/i,
          /crea\s+tarea\s+([^\s",.]+)/i,
          /nueva\s+tarea\s+([^\s",.]+)/i,
        ]

        for (const patron of tituloPatrones) {
          const match = message.match(patron)
          if (match && match[1]) {
            facts.entities.tarea_titulo = match[1]
            console.log(`Título de tarea encontrado con patrón simple: "${facts.entities.tarea_titulo}"`)
            break
          }
        }
      }
    }

    // Extraer columna donde crear la tarea - mejorado para capturar nombres con espacios
    if (message.toLowerCase().includes(" en ")) {
      const partes = message.toLowerCase().split(" en ")
      if (partes.length > 1) {
        // Capturar todo hasta la siguiente preposición o fin de la frase
        const columnaCompleta = partes[1]
          .trim()
          .split(/\s+(?:con|para|a|de|por)\s+/)[0]
          .trim()
        if (columnaCompleta && columnaCompleta.length > 0) {
          console.log(`Columna para tarea encontrada: "${columnaCompleta}"`)
          facts.entities.columna_nombre = columnaCompleta
        }
      }
    }

    // Para modificar tarea
    const tituloActualMatch =
      message.match(
        /tarea\s+(?:llamada|que\s+se\s+llama|con\s+(?:el\s+)?(?:nombre|título)(?:\s+de)?)\s+"([^"]+)"\s+a/i,
      ) ||
      message.match(/tarea\s+(?:llamada|que\s+se\s+llama|con\s+(?:el\s+)?(?:nombre|título)(?:\s+de)?)\s+([^\s"]+)\s+a/i)

    const tituloNuevoMatch = message.match(/a\s+"([^"]+)"/i) || message.match(/a\s+([^\s"]+)$/i)

    if (tituloActualMatch) {
      facts.entities.tarea_titulo_actual = tituloActualMatch[1]
    }

    if (tituloNuevoMatch) {
      facts.entities.tarea_titulo_nuevo = tituloNuevoMatch[1]
    }

    // Extraer descripción si existe
    const descripcionMatch = message.match(/descripción\s+"([^"]+)"/i) || message.match(/descripción\s+([^\s"]+)/i)

    if (descripcionMatch) {
      facts.entities.tarea_descripcion = descripcionMatch[1]
    }

    // Extraer prioridad si existe
    const prioridadMatch = message.match(/prioridad\s+(alta|media|baja)/i)

    if (prioridadMatch) {
      facts.entities.tarea_prioridad = prioridadMatch[1]
    }

    // Extraer fecha si existe - MEJORADO para expresiones de fecha
    this.extractFechaEntities(facts, message)

    // Extraer miembros si existen - mejorado para capturar múltiples miembros
    const miembrosMatch =
      message.match(/miembros?\s+"([^"]+)"/i) ||
      message.match(/miembros?\s+([^"]+?)(?:\s+a\s+la|\s+de\s+la|\s+en|\s+para|\s*$)/i)

    if (miembrosMatch) {
      console.log("Miembros encontrados:", miembrosMatch[1])
      // Dividir por comas si hay varios miembros
      facts.entities.tarea_miembros = miembrosMatch[1].split(/\s*,\s*/).map((m) => m.trim())
      console.log("Lista de miembros extraídos:", facts.entities.tarea_miembros)
    }

    // Extraer acción para miembros (agregar/quitar) si no se estableció antes
    if (!facts.entities.accion_miembro) {
      const accionMiembroMatch = message.match(/(agregar|añadir|asignar|quitar|eliminar|remover)\s+miembros?/i)

      if (accionMiembroMatch) {
        facts.entities.accion_miembro = accionMiembroMatch[1]
        console.log("Acción de miembro detectada:", facts.entities.accion_miembro)
      }

      // Si no se detectó una acción específica pero hay miembros, asumir "asignar" por defecto
      if (facts.entities.tarea_miembros && !facts.entities.accion_miembro) {
        facts.entities.accion_miembro = "asignar"
        console.log("Usando acción de miembro por defecto: asignar")
      }
    }

    // Extraer título de tarea específicamente para el caso de gestionar miembros
    if (facts.intent === "gestionar_miembros" && !facts.entities.tarea_titulo) {
      // Patrones para encontrar el título de la tarea en comandos de gestión de miembros
      const patronesTituloTarea = [
        /a\s+la\s+tarea\s+"([^"]+)"/i,
        /a\s+la\s+tarea\s+([^"]+?)(?:\s*$|\s+con)/i,
        /de\s+la\s+tarea\s+"([^"]+)"/i,
        /de\s+la\s+tarea\s+([^"]+?)(?:\s*$|\s+con)/i,
        /tarea\s+"([^"]+)"/i,
        /tarea\s+([^"]+?)(?:\s*$|\s+con)/i,
      ]

      for (const patron of patronesTituloTarea) {
        const match = message.match(patron)
        if (match && match[1]) {
          // Capturar el título completo (puede tener múltiples palabras)
          facts.entities.tarea_titulo = match[1].trim()
          console.log(
            `Título de tarea para gestión de miembros encontrado con patrón ${patron}: "${facts.entities.tarea_titulo}"`,
          )
          break
        }
      }
    }

    // Extraer título de tarea específicamente para el caso de cambiar fecha
    if (facts.intent === "cambiar_fecha" && !facts.entities.tarea_titulo) {
      // Patrones para encontrar el título de la tarea en comandos de cambio de fecha
      const patronesTituloTarea = [
        /fecha\s+de\s+(?:la\s+)?tarea\s+"([^"]+)"/i,
        /fecha\s+de\s+(?:la\s+)?tarea\s+([^"]+?)(?:\s+a|\s*$)/i,
        /tarea\s+"([^"]+)"\s+(?:a|para)/i,
        /tarea\s+([^"]+?)(?:\s+a|\s+para|\s*$)/i,
      ]

      for (const patron of patronesTituloTarea) {
        const match = message.match(patron)
        if (match && match[1]) {
          facts.entities.tarea_titulo = match[1].trim()
          console.log(`Título de tarea para cambio de fecha encontrado: "${facts.entities.tarea_titulo}"`)
          break
        }
      }
    }

    // Extraer columna destino para mover tarea
    const columnaDestinoMatch =
      message.match(/a\s+(?:la\s+)?columna\s+"([^"]+)"/i) || message.match(/a\s+(?:la\s+)?columna\s+([^\s"]+)/i)

    if (columnaDestinoMatch) {
      facts.entities.columna_destino = columnaDestinoMatch[1]
    }

    console.log("Entidades de tarea extraídas:", facts.entities)
  }

  // Método específico para extraer expresiones de fecha
  private static extractFechaEntities(facts: Facts, message: string): void {
    console.log("Extrayendo entidades de fecha del mensaje:", message)

    // Primero, intentar extraer la fecha directamente si está después de palabras clave
    const fechaDirectaPatrones = [
      /fecha\s+(.*?)(?:\s+(?:con|y|para|a|de)\s+|$)/i,
      /para\s+(.*?)(?:\s+(?:con|y|para|a|de)\s+|$)/i,
      /vence\s+(.*?)(?:\s+(?:con|y|para|a|de)\s+|$)/i,
      /vencimiento\s+(.*?)(?:\s+(?:con|y|para|a|de)\s+|$)/i,
      /plazo\s+(.*?)(?:\s+(?:con|y|para|a|de)\s+|$)/i,
    ]

    let fechaExpresion = null

    // Buscar coincidencias con los patrones directos
    for (const patron of fechaDirectaPatrones) {
      const match = message.match(patron)
      if (match && match[1]) {
        fechaExpresion = match[1].trim()
        console.log(`Expresión de fecha encontrada directamente: "${fechaExpresion}"`)
        break
      }
    }

    // Si no se encontró con los patrones directos, buscar expresiones específicas
    if (!fechaExpresion) {
      // Buscar expresiones relativas simples
      const expresionesRelativas = ["hoy", "mañana", "manana", "pasado mañana", "pasado manana"]
      for (const expr of expresionesRelativas) {
        if (message.toLowerCase().includes(expr)) {
          fechaExpresion = expr
          console.log(`Expresión de fecha relativa encontrada: "${fechaExpresion}"`)
          break
        }
      }
    }

    // Si aún no hay fecha, buscar patrones de "en X días/semanas/meses"
    if (!fechaExpresion) {
      const enTiempoPatrones = [/en\s+(\d+)\s+d[ií]as?/i, /en\s+(\d+)\s+semanas?/i, /en\s+(\d+)\s+meses?/i]

      for (const patron of enTiempoPatrones) {
        const match = message.match(patron)
        if (match) {
          fechaExpresion = match[0]
          console.log(`Expresión de fecha "en tiempo" encontrada: "${fechaExpresion}"`)
          break
        }
      }
    }

    // Si aún no hay fecha, buscar patrones de "el día X del mes Y"
    if (!fechaExpresion) {
      const diaDelMesMatch = message.match(/(?:el\s+)?(\d{1,2})\s+de\s+([a-zé]+)(?:\s+(?:de\s+)?(\d{4}))?/i)
      if (diaDelMesMatch) {
        fechaExpresion = diaDelMesMatch[0]
        console.log(`Expresión de fecha "día del mes" encontrada: "${fechaExpresion}"`)
      }
    }

    // Si aún no hay fecha, buscar patrones de "próximo día de la semana"
    if (!fechaExpresion) {
      const proximoDiaMatch = message.match(/pr[óo]ximo\s+([a-zé]+)/i)
      if (proximoDiaMatch) {
        fechaExpresion = proximoDiaMatch[0]
        console.log(`Expresión de fecha "próximo día" encontrada: "${fechaExpresion}"`)
      }
    }

    // Si aún no hay fecha, buscar formatos estándar
    if (!fechaExpresion) {
      const formatoEstandarMatch = message.match(/\b(\d{1,2}\/\d{1,2}\/\d{4})\b/i)
      if (formatoEstandarMatch) {
        fechaExpresion = formatoEstandarMatch[1]
        console.log(`Expresión de fecha formato estándar encontrada: "${fechaExpresion}"`)
      } else {
        const formatoISOMatch = message.match(/\b(\d{4}-\d{1,2}-\d{1,2})\b/i)
        if (formatoISOMatch) {
          fechaExpresion = formatoISOMatch[1]
          console.log(`Expresión de fecha formato ISO encontrada: "${fechaExpresion}"`)
        }
      }
    }

    // Si aún no hay fecha, buscar solo números como posible día del mes
    if (!fechaExpresion) {
      // Buscar números después de palabras clave de fecha
      const soloDiaPatrones = [
        /fecha\s+(\d{1,2})\b/i,
        /para\s+(?:el\s+)?(\d{1,2})\b/i,
        /vence\s+(?:el\s+)?(\d{1,2})\b/i,
      ]

      for (const patron of soloDiaPatrones) {
        const match = message.match(patron)
        if (match && match[1]) {
          fechaExpresion = match[1]
          console.log(`Expresión de fecha solo día encontrada: "${fechaExpresion}"`)
          break
        }
      }
    }

    // Si se encontró una expresión de fecha, intentar analizarla
    if (fechaExpresion) {
      const fechaObjeto = DateParser.parseDate(fechaExpresion)
      if (fechaObjeto) {
        // Guardar tanto la expresión original como la fecha analizada
        facts.entities = facts.entities || {}
        facts.entities.tarea_fecha_expresion = fechaExpresion
        facts.entities.tarea_fecha = DateParser.formatDateISO(fechaObjeto)
        console.log(`Fecha analizada: ${facts.entities.tarea_fecha} (de la expresión: ${fechaExpresion})`)
      } else {
        console.log(`No se pudo analizar la expresión de fecha: ${fechaExpresion}`)
      }
    } else {
      console.log("No se encontró ninguna expresión de fecha en el mensaje")
    }
  }
}
