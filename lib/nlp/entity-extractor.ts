import type { Facts } from "../types"
import { DateParser } from "../utils/date-parser"

export class EntityExtractor {
  // Extraer entidades de tablero - MEJORADO
  static extractTableroEntities(facts: Facts): void {
    const message = facts.message
    facts.entities = facts.entities || {}

    console.log("Extrayendo entidades de tablero del mensaje:", message)

    // Extraer nombre del tablero para crear/eliminar
    const nombreMatch =
      message.match(/tablero\s+(?:llamado|que\s+se\s+llame|con\s+(?:el\s+)?nombre(?:\s+de)?)\s+"([^"]+)"/i) ||
      message.match(/tablero\s+(?:llamado|que\s+se\s+llame|con\s+(?:el\s+)?nombre(?:\s+de)?)\s+([^\s"]+)/i) ||
      message.match(/tablero\s+"([^"]+)"/i) ||
      message.match(/tablero\s+([^\s",.]+)/i)

    if (nombreMatch) {
      facts.entities.tablero_nombre = nombreMatch[1]
      console.log("Nombre de tablero encontrado:", facts.entities.tablero_nombre)
    }

    // Para modificar tablero - detectar nombre actual y nuevo nombre con "por" o "a" - MEJORADO
    // Primero intentamos con patrones específicos para "por"
    const cambiarNombrePorPatrones = [
      // Patrones con comillas
      /cambiar?\s+(?:el\s+)?nombre\s+(?:del\s+)?tablero\s+"([^"]+)"\s+por\s+"([^"]+)"/i,
      /cambiar?\s+(?:el\s+)?nombre\s+(?:del\s+)?tablero\s+"([^"]+)"\s+por\s+([^\s",.]+)/i,
      /cambiar?\s+(?:el\s+)?nombre\s+(?:del\s+)?tablero\s+([^\s",.]+)\s+por\s+"([^"]+)"/i,
      /cambiar?\s+(?:el\s+)?nombre\s+(?:del\s+)?tablero\s+([^\s",.]+)\s+por\s+([^\s",.]+)/i,
      /renombrar?\s+(?:el\s+)?tablero\s+"([^"]+)"\s+por\s+"([^"]+)"/i,
      /renombrar?\s+(?:el\s+)?tablero\s+"([^"]+)"\s+por\s+([^\s",.]+)/i,
      /renombrar?\s+(?:el\s+)?tablero\s+([^\s",.]+)\s+por\s+"([^"]+)"/i,
      /renombrar?\s+(?:el\s+)?tablero\s+([^\s",.]+)\s+por\s+([^\s",.]+)/i,
      /modifica\s+(?:el\s+)?nombre\s+(?:de\s+)?tablero\s+"([^"]+)"\s+por\s+"([^"]+)"/i,
      /modifica\s+(?:el\s+)?nombre\s+(?:de\s+)?tablero\s+"([^"]+)"\s+por\s+([^\s",.]+)/i,
      /modifica\s+(?:el\s+)?nombre\s+(?:de\s+)?tablero\s+([^\s",.]+)\s+por\s+"([^"]+)"/i,
      /modifica\s+(?:el\s+)?nombre\s+(?:de\s+)?tablero\s+([^\s",.]+)\s+por\s+([^\s",.]+)/i,
      // Patrones más directos
      /cambia\s+(?:el\s+)?tablero\s+"([^"]+)"\s+por\s+"([^"]+)"/i,
      /cambia\s+(?:el\s+)?tablero\s+"([^"]+)"\s+por\s+([^\s",.]+)/i,
      /cambia\s+(?:el\s+)?tablero\s+([^\s",.]+)\s+por\s+"([^"]+)"/i,
      /cambia\s+(?:el\s+)?tablero\s+([^\s",.]+)\s+por\s+([^\s",.]+)/i,
      // Patrones sin "nombre"
      /cambiar?\s+tablero\s+"([^"]+)"\s+por\s+"([^"]+)"/i,
      /cambiar?\s+tablero\s+"([^"]+)"\s+por\s+([^\s",.]+)/i,
      /cambiar?\s+tablero\s+([^\s",.]+)\s+por\s+"([^"]+)"/i,
      /cambiar?\s+tablero\s+([^\s",.]+)\s+por\s+([^\s",.]+)/i,
    ]

    for (const patron of cambiarNombrePorPatrones) {
      const match = message.match(patron)
      if (match && match[1] && match[2]) {
        facts.entities.tablero_nombre_actual = match[1].trim()
        facts.entities.tablero_nombre_nuevo = match[2].trim()
        console.log(
          "Nombre actual y nuevo encontrados con 'por':",
          facts.entities.tablero_nombre_actual,
          "->",
          facts.entities.tablero_nombre_nuevo,
        )
        break
      }
    }

    // Si no se encontró con "por", intentar con "a"
    if (!facts.entities.tablero_nombre_nuevo) {
      const cambiarNombreAPatrones = [
        // Patrones completos con "nombre"
        /cambiar?\s+(?:el\s+)?nombre\s+(?:del\s+)?tablero\s+"([^"]+)"\s+a\s+"([^"]+)"/i,
        /cambiar?\s+(?:el\s+)?nombre\s+(?:del\s+)?tablero\s+"([^"]+)"\s+a\s+([^\s",.]+)/i,
        /cambiar?\s+(?:el\s+)?nombre\s+(?:del\s+)?tablero\s+([^\s",.]+)\s+a\s+"([^"]+)"/i,
        /cambiar?\s+(?:el\s+)?nombre\s+(?:del\s+)?tablero\s+([^\s",.]+)\s+a\s+([^\s",.]+)/i,
        /renombrar?\s+(?:el\s+)?tablero\s+"([^"]+)"\s+a\s+"([^"]+)"/i,
        /renombrar?\s+(?:el\s+)?tablero\s+"([^"]+)"\s+a\s+([^\s",.]+)/i,
        /renombrar?\s+(?:el\s+)?tablero\s+([^\s",.]+)\s+a\s+"([^"]+)"/i,
        /renombrar?\s+(?:el\s+)?tablero\s+([^\s",.]+)\s+a\s+([^\s",.]+)/i,
        // Patrones más directos
        /cambia\s+(?:el\s+)?tablero\s+"([^"]+)"\s+a\s+"([^"]+)"/i,
        /cambia\s+(?:el\s+)?tablero\s+"([^"]+)"\s+a\s+([^\s",.]+)/i,
        /cambia\s+(?:el\s+)?tablero\s+([^\s",.]+)\s+a\s+"([^"]+)"/i,
        /cambia\s+(?:el\s+)?tablero\s+([^\s",.]+)\s+a\s+([^\s",.]+)/i,
        // Patrones sin "nombre"
        /cambiar?\s+tablero\s+"([^"]+)"\s+a\s+"([^"]+)"/i,
        /cambiar?\s+tablero\s+"([^"]+)"\s+a\s+([^\s",.]+)/i,
        /cambiar?\s+tablero\s+([^\s",.]+)\s+a\s+"([^"]+)"/i,
        /cambiar?\s+tablero\s+([^\s",.]+)\s+a\s+([^\s",.]+)/i,
        // Patrones solo con nuevo nombre
        /cambiar?\s+(?:el\s+)?nombre\s+(?:del\s+)?tablero\s+a\s+"([^"]+)"/i,
        /cambiar?\s+(?:el\s+)?nombre\s+(?:del\s+)?tablero\s+a\s+([^\s",.]+)/i,
        /renombrar?\s+(?:el\s+)?tablero\s+a\s+"([^"]+)"/i,
        /renombrar?\s+(?:el\s+)?tablero\s+a\s+([^\s",.]+)/i,
        /cambiar?\s+tablero\s+a\s+"([^"]+)"/i,
        /cambiar?\s+tablero\s+a\s+([^\s",.]+)/i,
        /nombre\s+(?:del\s+)?tablero\s+a\s+"([^"]+)"/i,
        /nombre\s+(?:del\s+)?tablero\s+a\s+([^\s",.]+)/i,
      ]

      for (const patron of cambiarNombreAPatrones) {
        const match = message.match(patron)
        if (match) {
          if (match[2]) {
            // Patrón con nombre actual y nuevo
            facts.entities.tablero_nombre_actual = match[1].trim()
            facts.entities.tablero_nombre_nuevo = match[2].trim()
            console.log(
              "Nombre actual y nuevo encontrados con 'a':",
              facts.entities.tablero_nombre_actual,
              "->",
              facts.entities.tablero_nombre_nuevo,
            )
          } else if (match[1]) {
            // Solo nuevo nombre
            facts.entities.tablero_nombre_nuevo = match[1].trim()
            console.log("Nuevo nombre de tablero encontrado con 'a':", facts.entities.tablero_nombre_nuevo)
          }
          break
        }
      }
    }

    // Extraer descripción si existe
    const descripcionMatch = message.match(/descripción\s+"([^"]+)"/i) || message.match(/descripción\s+([^\s"]+)/i)

    if (descripcionMatch) {
      facts.entities.tablero_descripcion = descripcionMatch[1]
    }

    console.log("Entidades de tablero extraídas:", facts.entities)
  }

  // Extraer entidades de columna - MEJORADO
  static extractColumnaEntities(facts: Facts): void {
    const message = facts.message
    facts.entities = facts.entities || {}
    console.log("Extrayendo entidades de columna del mensaje:", message)

    // Extraer nombre de la columna para crear/eliminar - Patrones mejorados
    const patronesNombre = [
      /columna\s+(?:llamada|que\s+se\s+llame|con\s+(?:el\s+)?nombre(?:\s+de)?)\s+"([^"]+)"/i,
      /columna\s+(?:llamada|que\s+se\s+llame|con\s+(?:el\s+)?nombre(?:\s+de)?)\s+([^\s"]+)/i,
      /columna\s+llamada\s+([^\s",.]+(?:\s+[^\s",.]+)*?)(?:\s+con|\s+para|\s*$)/i,
      /crear\s+columna\s+([^\s",.]+(?:\s+[^\s",.]+)*?)(?:\s+con|\s+para|\s*$)/i,
      /crea\s+columna\s+([^\s",.]+(?:\s+[^\s",.]+)*?)(?:\s+con|\s+para|\s*$)/i,
      /nueva\s+columna\s+([^\s",.]+(?:\s+[^\s",.]+)*?)(?:\s+con|\s+para|\s*$)/i,
    ]

    for (const patron of patronesNombre) {
      const match = message.match(patron)
      if (match && match[1]) {
        console.log(`Nombre de columna encontrado con patrón ${patron}: ${match[1]}`)
        facts.entities.columna_nombre = match[1].trim()
        break
      }
    }

    // Si no se encontró con los patrones anteriores, buscar después de "llamada"
    if (!facts.entities.columna_nombre && message.toLowerCase().includes("llamada")) {
      const partes = message.toLowerCase().split("llamada")[1].trim()
      if (partes) {
        // Extraer hasta alguna preposición o fin de frase
        const nombrePosible = partes.split(/\s+(?:con|para|a|de|por)\s+/)[0].trim()
        if (nombrePosible) {
          console.log(`Nombre de columna extraído después de "llamada": ${nombrePosible}`)
          facts.entities.columna_nombre = nombrePosible
        }
      }
    }

    // Para modificar columna - MEJORADO
    // Primero intentamos con patrones específicos para "de X a Y"
    const cambiarNombreColumnaPatrones = [
      /cambiar\s+(?:el\s+)?nombre\s+(?:de\s+la\s+)?columna\s+"([^"]+)"\s+(?:a|por)\s+"([^"]+)"/i,
      /cambiar\s+(?:el\s+)?nombre\s+(?:de\s+la\s+)?columna\s+"([^"]+)"\s+(?:a|por)\s+([^\s",.]+)/i,
      /cambiar\s+(?:el\s+)?nombre\s+(?:de\s+la\s+)?columna\s+([^\s",.]+(?:\s+[^\s",.]+)*?)\s+(?:a|por)\s+"([^"]+)"/i,
      /cambiar\s+(?:el\s+)?nombre\s+(?:de\s+la\s+)?columna\s+([^\s",.]+(?:\s+[^\s",.]+)*?)\s+(?:a|por)\s+([^\s",.]+(?:\s+[^\s",.]+)*?)(?:\s|$)/i,
      /renombrar\s+(?:la\s+)?columna\s+"([^"]+)"\s+(?:a|por)\s+"([^"]+)"/i,
      /renombrar\s+(?:la\s+)?columna\s+"([^"]+)"\s+(?:a|por)\s+([^\s",.]+)/i,
      /renombrar\s+(?:la\s+)?columna\s+([^\s",.]+(?:\s+[^\s",.]+)*?)\s+(?:a|por)\s+"([^"]+)"/i,
      /renombrar\s+(?:la\s+)?columna\s+([^\s",.]+(?:\s+[^\s",.]+)*?)\s+(?:a|por)\s+([^\s",.]+(?:\s+[^\s",.]+)*?)(?:\s|$)/i,
      /modifica\s+(?:la\s+)?columna\s+"([^"]+)"\s+(?:a|por)\s+"([^"]+)"/i,
      /modifica\s+(?:la\s+)?columna\s+"([^"]+)"\s+(?:a|por)\s+([^\s",.]+)/i,
      /modifica\s+(?:la\s+)?columna\s+([^\s",.]+(?:\s+[^\s",.]+)*?)\s+(?:a|por)\s+"([^"]+)"/i,
      /modifica\s+(?:la\s+)?columna\s+([^\s",.]+(?:\s+[^\s",.]+)*?)\s+(?:a|por)\s+([^\s",.]+(?:\s+[^\s",.]+)*?)(?:\s|$)/i,
      /cambia\s+(?:la\s+)?columna\s+"([^"]+)"\s+(?:a|por)\s+"([^"]+)"/i,
      /cambia\s+(?:la\s+)?columna\s+"([^"]+)"\s+(?:a|por)\s+([^\s",.]+)/i,
      /cambia\s+(?:la\s+)?columna\s+([^\s",.]+(?:\s+[^\s",.]+)*?)\s+(?:a|por)\s+"([^"]+)"/i,
      /cambia\s+(?:la\s+)?columna\s+([^\s",.]+(?:\s+[^\s",.]+)*?)\s+(?:a|por)\s+([^\s",.]+(?:\s+[^\s",.]+)*?)(?:\s|$)/i,
    ]

    for (const patron of cambiarNombreColumnaPatrones) {
      const match = message.match(patron)
      if (match && match[1] && match[2]) {
        facts.entities.columna_nombre_actual = match[1].trim()
        facts.entities.columna_nombre_nuevo = match[2].trim()
        console.log(
          "Nombre de columna actual y nuevo encontrados:",
          facts.entities.columna_nombre_actual,
          "->",
          facts.entities.columna_nombre_nuevo,
        )
        break
      }
    }

    console.log("Entidades de columna extraídas:", facts.entities)
  }

  // Extraer entidades de tarea - MEJORADO SIGNIFICATIVAMENTE
  static extractTareaEntities(facts: Facts): void {
    const message = facts.message
    facts.entities = facts.entities || {}
    console.log("Extrayendo entidades de tarea del mensaje:", message)

    // Detectar columna específica - NUEVO Y MEJORADO
    this.extractColumnForTask(facts, message)

    // Primero intentar extraer títulos con patrones específicos
    this.extractTaskTitle(facts, message)

    // Para modificar tarea - MEJORADO
    this.extractTaskTitleUpdate(facts, message)

    // Extraer descripción si existe - MEJORADO
    this.extractTaskDescription(facts, message)

    // Extraer prioridad si existe - MEJORADO
    this.extractTaskPriority(facts, message)

    // Extraer fecha si existe - MANTENIDO
    this.extractFechaEntities(facts, message)

    // Extraer miembros si existen - MEJORADO
    this.extractTaskMembers(facts, message)

    // Extraer columna destino para mover tarea - MEJORADO
    this.extractTaskColumnDestination(facts, message)

    console.log("Entidades de tarea extraídas:", facts.entities)
  }

  // Métodos auxiliares para la extracción de entidades de tarea

  // Extraer columna específica para la tarea - NUEVO
  private static extractColumnForTask(facts: Facts, message: string): void {
    console.log("Buscando columna específica para tarea")

    // Patrones para detectar columna específica
    const patronesColumna = [
      /en\s+(?:la\s+)?columna\s+"([^"]+)"/i,
      /en\s+(?:la\s+)?columna\s+([^\s",.]+(?:\s+[^\s",.]+)*?)(?:\s+con|\s+para|\s*$)/i,
      /a\s+(?:la\s+)?columna\s+"([^"]+)"/i,
      /a\s+(?:la\s+)?columna\s+([^\s",.]+(?:\s+[^\s",.]+)*?)(?:\s+con|\s+para|\s*$)/i,
      /para\s+(?:la\s+)?columna\s+"([^"]+)"/i,
      /para\s+(?:la\s+)?columna\s+([^\s",.]+(?:\s+[^\s",.]+)*?)(?:\s+con|\s+para|\s*$)/i,
      /dentro\s+de\s+(?:la\s+)?columna\s+"([^"]+)"/i,
      /dentro\s+de\s+(?:la\s+)?columna\s+([^\s",.]+(?:\s+[^\s",.]+)*?)(?:\s+con|\s+para|\s*$)/i,
    ]

    for (const patron of patronesColumna) {
      const match = message.match(patron)
      if (match && match[1]) {
        facts.entities.columna_nombre = match[1].trim()
        console.log(`Columna para tarea encontrada: "${facts.entities.columna_nombre}"`)
        break
      }
    }
  }

  // Extraer título de la tarea - MEJORADO
  private static extractTaskTitle(facts: Facts, message: string): void {
    // Si ya tenemos un título (quizás de una detección anterior), no hacer nada
    if (facts.entities.tarea_titulo) {
      return
    }

    console.log("Extrayendo título de tarea")

    // Patrones para títulos con comillas
    const patronesConComillas = [
      /tarea\s+(?:llamada|titulada|que\s+se\s+llame)\s+"([^"]+)"/i,
      /tarea\s+"([^"]+)"/i,
      /crear\s+tarea\s+"([^"]+)"/i,
      /crea\s+tarea\s+"([^"]+)"/i,
      /nueva\s+tarea\s+"([^"]+)"/i,
    ]

    // Primero buscar títulos con comillas
    for (const patron of patronesConComillas) {
      const match = message.match(patron)
      if (match && match[1]) {
        facts.entities.tarea_titulo = match[1].trim()
        console.log(`Título de tarea con comillas encontrado: "${facts.entities.tarea_titulo}"`)
        return
      }
    }

    // Si no hay comillas, usar patrones más complejos
    const patronesSinComillas = [
      /tarea\s+(?:llamada|titulada)\s+([^\s",.]+(?:\s+[^\s",.]+)*?)(?:\s+en\s+|\s+con\s+|\s+para\s+|\s*$)/i,
      /crear\s+tarea\s+([^\s",.]+(?:\s+[^\s",.]+)*?)(?:\s+en\s+|\s+con\s+|\s+para\s+|\s*$)/i,
      /crea\s+tarea\s+([^\s",.]+(?:\s+[^\s",.]+)*?)(?:\s+en\s+|\s+con\s+|\s+para\s+|\s*$)/i,
      /nueva\s+tarea\s+([^\s",.]+(?:\s+[^\s",.]+)*?)(?:\s+en\s+|\s+con\s+|\s+para\s+|\s*$)/i,
    ]

    for (const patron of patronesSinComillas) {
      const match = message.match(patron)
      if (match && match[1] && !["nueva", "llamada", "que", "con", "en"].includes(match[1].toLowerCase())) {
        facts.entities.tarea_titulo = match[1].trim()
        console.log(`Título de tarea sin comillas encontrado: "${facts.entities.tarea_titulo}"`)
        return
      }
    }

    // Si aún no hay título y el mensaje contiene "llamada" o "titulada", intentar extraer el título
    if (message.toLowerCase().includes("llamada") || message.toLowerCase().includes("titulada")) {
      const parte = message
        .toLowerCase()
        .split(/llamada|titulada/)[1]
        .trim()
      if (parte) {
        // Extraer hasta la siguiente preposición o fin de mensaje
        const titulo = parte.split(/\s+(?:en|con|para|a|de|por)\s+/)[0].trim()
        if (titulo) {
          facts.entities.tarea_titulo = titulo
          console.log(`Título de tarea extraído después de "llamada/titulada": "${facts.entities.tarea_titulo}"`)
          return
        }
      }
    }

    // Casos específicos según la intención
    if (
      facts.intent === "eliminar_tarea" ||
      facts.intent === "cambiar_prioridad" ||
      facts.intent === "cambiar_fecha" ||
      facts.intent === "gestionar_miembros"
    ) {
      const patronesEspecificos = [
        /tarea\s+([^\s",.]+(?:\s+[^\s",.]+)*?)(?:\s+a|\s+de|\s+en|\s+con|\s+para|\s*$)/i,
        /de\s+(?:la\s+)?tarea\s+([^\s",.]+(?:\s+[^\s",.]+)*?)(?:\s+a|\s+de|\s+en|\s+con|\s+para|\s*$)/i,
        /para\s+(?:la\s+)?tarea\s+([^\s",.]+(?:\s+[^\s",.]+)*?)(?:\s+a|\s+de|\s+en|\s+con|\s+para|\s*$)/i,
      ]

      for (const patron of patronesEspecificos) {
        const match = message.match(patron)
        if (match && match[1]) {
          facts.entities.tarea_titulo = match[1].trim()
          console.log(`Título de tarea para acción específica encontrado: "${facts.entities.tarea_titulo}"`)
          return
        }
      }
    }
  }

  // Extraer título actual y nuevo para actualización de tarea - MEJORADO
  private static extractTaskTitleUpdate(facts: Facts, message: string): void {
    if (facts.intent !== "modificar_tarea") {
      return
    }

    console.log("Extrayendo títulos para actualización de tarea")

    // Patrones para cambio de título con "a" o "por"
    const patronesCambioTitulo = [
      /cambiar\s+(?:el\s+)?(?:nombre|título)\s+(?:de\s+la\s+)?tarea\s+"([^"]+)"\s+(?:a|por)\s+"([^"]+)"/i,
      /cambiar\s+(?:el\s+)?(?:nombre|título)\s+(?:de\s+la\s+)?tarea\s+"([^"]+)"\s+(?:a|por)\s+([^\s",.]+(?:\s+[^\s",.]+)*?)(?:\s|$)/i,
      /cambiar\s+(?:el\s+)?(?:nombre|título)\s+(?:de\s+la\s+)?tarea\s+([^\s",.]+(?:\s+[^\s",.]+)*?)\s+(?:a|por)\s+"([^"]+)"/i,
      /cambiar\s+(?:el\s+)?(?:nombre|título)\s+(?:de\s+la\s+)?tarea\s+([^\s",.]+(?:\s+[^\s",.]+)*?)\s+(?:a|por)\s+([^\s",.]+(?:\s+[^\s",.]+)*?)(?:\s|$)/i,
      /renombrar\s+(?:la\s+)?tarea\s+"([^"]+)"\s+(?:a|por)\s+"([^"]+)"/i,
      /renombrar\s+(?:la\s+)?tarea\s+"([^"]+)"\s+(?:a|por)\s+([^\s",.]+(?:\s+[^\s",.]+)*?)(?:\s|$)/i,
      /renombrar\s+(?:la\s+)?tarea\s+([^\s",.]+(?:\s+[^\s",.]+)*?)\s+(?:a|por)\s+"([^"]+)"/i,
      /renombrar\s+(?:la\s+)?tarea\s+([^\s",.]+(?:\s+[^\s",.]+)*?)\s+(?:a|por)\s+([^\s",.]+(?:\s+[^\s",.]+)*?)(?:\s|$)/i,
      /modificar\s+(?:la\s+)?tarea\s+"([^"]+)"\s+(?:a|por)\s+"([^"]+)"/i,
      /modificar\s+(?:la\s+)?tarea\s+"([^"]+)"\s+(?:a|por)\s+([^\s",.]+(?:\s+[^\s",.]+)*?)(?:\s|$)/i,
      /modificar\s+(?:la\s+)?tarea\s+([^\s",.]+(?:\s+[^\s",.]+)*?)\s+(?:a|por)\s+"([^"]+)"/i,
      /modificar\s+(?:la\s+)?tarea\s+([^\s",.]+(?:\s+[^\s",.]+)*?)\s+(?:a|por)\s+([^\s",.]+(?:\s+[^\s",.]+)*?)(?:\s|$)/i,
      /tarea\s+"([^"]+)"\s+(?:a|por)\s+"([^"]+)"/i,
      /tarea\s+"([^"]+)"\s+(?:a|por)\s+([^\s",.]+(?:\s+[^\s",.]+)*?)(?:\s|$)/i,
      /tarea\s+([^\s",.]+(?:\s+[^\s",.]+)*?)\s+(?:a|por)\s+"([^"]+)"/i,
      /tarea\s+([^\s",.]+(?:\s+[^\s",.]+)*?)\s+(?:a|por)\s+([^\s",.]+(?:\s+[^\s",.]+)*?)(?:\s|$)/i,
    ]

    for (const patron of patronesCambioTitulo) {
      const match = message.match(patron)
      if (match && match[1] && match[2]) {
        facts.entities.tarea_titulo_actual = match[1].trim()
        facts.entities.tarea_titulo_nuevo = match[2].trim()
        console.log(
          "Títulos para actualización encontrados:",
          facts.entities.tarea_titulo_actual,
          "->",
          facts.entities.tarea_titulo_nuevo,
        )
        return
      }
    }

    // Si no encontramos un patrón claro, pero hay un único "tarea X", asumimos que es el título actual
    if (!facts.entities.tarea_titulo_actual) {
      // Si ya se extrajo un título normal, usarlo como título actual
      if (facts.entities.tarea_titulo) {
        facts.entities.tarea_titulo_actual = facts.entities.tarea_titulo
        delete facts.entities.tarea_titulo
        console.log("Usando título extraído como título actual:", facts.entities.tarea_titulo_actual)
      }
    }
  }

  // Extraer descripción de tarea - MEJORADO
  private static extractTaskDescription(facts: Facts, message: string): void {
    console.log("Buscando descripción de tarea")

    // Patrones para descripción con comillas
    const patronesDescripcion = [
      /descripción\s+"([^"]+)"/i,
      /descripcion\s+"([^"]+)"/i,
      /con\s+(?:la\s+)?descripción\s+"([^"]+)"/i,
      /con\s+(?:la\s+)?descripcion\s+"([^"]+)"/i,
      /con\s+descripción\s+"([^"]+)"/i,
      /con\s+descripcion\s+"([^"]+)"/i,
      /descripción\s+([^\s",.]+(?:\s+[^\s",.]+)*?)(?:\s+en|\s+con|\s+para|\s*$)/i,
      /descripcion\s+([^\s",.]+(?:\s+[^\s",.]+)*?)(?:\s+en|\s+con|\s+para|\s*$)/i,
    ]

    for (const patron of patronesDescripcion) {
      const match = message.match(patron)
      if (match && match[1]) {
        facts.entities.tarea_descripcion = match[1].trim()
        console.log(`Descripción de tarea encontrada: "${facts.entities.tarea_descripcion}"`)
        break
      }
    }

    // Si no encontramos con patrones específicos pero hay "con" después del título
    if (!facts.entities.tarea_descripcion && message.toLowerCase().includes(" con ")) {
      const partes = message.toLowerCase().split(" con ")
      if (partes.length > 1) {
        // Excluir patrones que no son descripción
        if (
          !partes[1].includes("prioridad") &&
          !partes[1].includes("fecha") &&
          !partes[1].includes("miembro") &&
          !partes[1].includes("para") &&
          !partes[1].includes("columna")
        ) {
          // Extraer hasta la siguiente preposición o fin de mensaje
          const descripcion = partes[1].split(/\s+(?:en|para|a|de)\s+/)[0].trim()
          if (descripcion) {
            facts.entities.tarea_descripcion = descripcion
            console.log(`Descripción de tarea extraída después de "con": "${facts.entities.tarea_descripcion}"`)
          }
        }
      }
    }
  }

  // Extraer prioridad de tarea - MEJORADO
  private static extractTaskPriority(facts: Facts, message: string): void {
    console.log("Buscando prioridad de tarea")

    // Patrones para detección de prioridad
    const patronesPrioridad = [
      /prioridad\s+(alta|media|baja)/i,
      /prioridad\s+(high|medium|low)/i,
      /con\s+prioridad\s+(alta|media|baja)/i,
      /con\s+prioridad\s+(high|medium|low)/i,
      /(?:en|como|de)\s+prioridad\s+(alta|media|baja)/i,
      /(?:en|como|de)\s+prioridad\s+(high|medium|low)/i,
    ]

    for (const patron of patronesPrioridad) {
      const match = message.match(patron)
      if (match && match[1]) {
        // Normalizar valor de prioridad
        let prioridad = match[1].toLowerCase()
        if (prioridad === "high") prioridad = "alta"
        if (prioridad === "medium") prioridad = "media"
        if (prioridad === "low") prioridad = "baja"

        facts.entities.tarea_prioridad = prioridad.charAt(0).toUpperCase() + prioridad.slice(1) // Capitalizar
        console.log(`Prioridad de tarea encontrada: ${facts.entities.tarea_prioridad}`)
        break
      }
    }
  }

  // Extraer miembros de tarea - MEJORADO
  private static extractTaskMembers(facts: Facts, message: string): void {
    console.log("Buscando miembros de tarea")

    // Patrones para detección de miembros
    const patronesMiembros = [
      /miembros?\s+"([^"]+)"/i,
      /miembros?\s+([^"]+?)(?:\s+a\s+la|\s+de\s+la|\s+en|\s+para|\s*$)/i,
      /asigna(?:r)?\s+(?:a\s+)?([^"]+?)(?:\s+a\s+la|\s+de\s+la|\s+en|\s+para|\s*$)/i,
      /añad(?:ir|e)\s+(?:a\s+)?([^"]+?)(?:\s+a\s+la|\s+de\s+la|\s+en|\s+para|\s*$)/i,
      /agrega(?:r)?\s+(?:a\s+)?([^"]+?)(?:\s+a\s+la|\s+de\s+la|\s+en|\s+para|\s*$)/i,
      /quita(?:r)?\s+(?:a\s+)?([^"]+?)(?:\s+a\s+la|\s+de\s+la|\s+en|\s+para|\s*$)/i,
      /elimina(?:r)?\s+(?:a\s+)?([^"]+?)(?:\s+a\s+la|\s+de\s+la|\s+en|\s+para|\s*$)/i,
      /remueve\s+(?:a\s+)?([^"]+?)(?:\s+a\s+la|\s+de\s+la|\s+en|\s+para|\s*$)/i,
    ]

    for (const patron of patronesMiembros) {
      const match = message.match(patron)
      if (match && match[1]) {
        console.log("Miembros encontrados:", match[1])
        // Dividir por comas si hay varios miembros
        facts.entities.tarea_miembros = match[1].split(/\s*,\s*/).map((m) => m.trim())
        console.log("Lista de miembros extraídos:", facts.entities.tarea_miembros)
        break
      }
    }

    // Extraer acción para miembros (agregar/quitar) si no se estableció antes
    if (!facts.entities.accion_miembro && facts.entities.tarea_miembros) {
      const accionMiembroMatch = message.match(
        /(agregar|añadir|asignar|quitar|eliminar|remover)\s+(?:a\s+)?(?:los\s+)?miembros?/i,
      )

      if (accionMiembroMatch) {
        facts.entities.accion_miembro = accionMiembroMatch[1].toLowerCase()
        console.log("Acción de miembro detectada:", facts.entities.accion_miembro)
      }

      // Si no se detectó una acción específica pero hay miembros, asumir "asignar" por defecto
      if (!facts.entities.accion_miembro) {
        facts.entities.accion_miembro = "asignar"
        console.log("Usando acción de miembro por defecto: asignar")
      }
    }
  }

  // Extraer columna destino para mover tarea - MEJORADO
  private static extractTaskColumnDestination(facts: Facts, message: string): void {
    if (facts.intent !== "mover_tarea") {
      return
    }

    console.log("Buscando columna destino para mover tarea")

    // Patrones para columna destino
    const patronesColumnaDestino = [
      /a\s+(?:la\s+)?columna\s+"([^"]+)"/i,
      /a\s+(?:la\s+)?columna\s+([^\s",.]+(?:\s+[^\s",.]+)*?)(?:\s|$)/i,
      /hacia\s+(?:la\s+)?columna\s+"([^"]+)"/i,
      /hacia\s+(?:la\s+)?columna\s+([^\s",.]+(?:\s+[^\s",.]+)*?)(?:\s|$)/i,
      /para\s+(?:la\s+)?columna\s+"([^"]+)"/i,
      /para\s+(?:la\s+)?columna\s+([^\s",.]+(?:\s+[^\s",.]+)*?)(?:\s|$)/i,
    ]

    for (const patron of patronesColumnaDestino) {
      const match = message.match(patron)
      if (match && match[1]) {
        facts.entities.columna_destino = match[1].trim()
        console.log(`Columna destino encontrada: "${facts.entities.columna_destino}"`)
        break
      }
    }
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

    // Si aún no hay fecha, buscar patrones de "próximo lunes/martes/etc."
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
