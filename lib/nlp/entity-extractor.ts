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

    // Para modificar columna - MEJORADO
    const nombreActualPatrones = [
      /columna\s+(?:llamada|que\s+se\s+llama|con\s+(?:el\s+)?nombre(?:\s+de)?)\s+"([^"]+)"\s+(?:a|por)/i,
      /columna\s+(?:llamada|que\s+se\s+llama|con\s+(?:el\s+)?nombre(?:\s+de)?)\s+([^\s"]+)\s+(?:a|por)/i,
      /columna\s+"([^"]+)"\s+(?:a|por)/i,
      /columna\s+([^\s",.]+)\s+(?:a|por)/i,
      /cambiar?\s+(?:el\s+)?nombre\s+(?:de\s+la\s+)?columna\s+"([^"]+)"\s+(?:a|por)/i,
      /cambiar?\s+(?:el\s+)?nombre\s+(?:de\s+la\s+)?columna\s+([^\s",.]+)\s+(?:a|por)/i,
      /renombrar?\s+(?:la\s+)?columna\s+"([^"]+)"\s+(?:a|por)/i,
      /renombrar?\s+(?:la\s+)?columna\s+([^\s",.]+)\s+(?:a|por)/i,
      /modifica\s+(?:el\s+)?nombre\s+(?:de\s+la\s+)?columna\s+"([^"]+)"\s+(?:a|por)/i,
      /modifica\s+(?:el\s+)?nombre\s+(?:de\s+la\s+)?columna\s+([^\s",.]+)\s+(?:a|por)/i,
      /cambia\s+(?:la\s+)?columna\s+"([^"]+)"\s+(?:a|por)/i,
      /cambia\s+(?:la\s+)?columna\s+([^\s",.]+)\s+(?:a|por)/i,
    ]

    for (const patron of nombreActualPatrones) {
      const match = message.match(patron)
      if (match && match[1]) {
        facts.entities.columna_nombre_actual = match[1].trim()
        console.log("Nombre actual de columna encontrado:", facts.entities.columna_nombre_actual)
        break
      }
    }

    // Buscar el nuevo nombre después de "a" o "por"
    if (facts.entities.columna_nombre_actual) {
      const nombreNuevoPatrones = [/por\s+"([^"]+)"/i, /por\s+([^\s",.]+)/i, /a\s+"([^"]+)"/i, /a\s+([^\s",.]+)/i]

      for (const patron of nombreNuevoPatrones) {
        const match = message.match(patron)
        if (match && match[1]) {
          facts.entities.columna_nombre_nuevo = match[1].trim()
          console.log("Nuevo nombre de columna encontrado:", facts.entities.columna_nombre_nuevo)
          break
        }
      }
    }

    console.log("Entidades de columna extraídas:", facts.entities)
  }

  // Extraer entidades de tarea - MEJORADO SIGNIFICATIVAMENTE
  static extractTareaEntities(facts: Facts): void {
    const message = facts.message
    facts.entities = facts.entities || {}
    console.log("Extrayendo entidades de tarea del mensaje:", message)

    // MEJORA: Extraer la columna donde crear/modificar/eliminar la tarea
    this.extractColumnForTask(facts, message)

    // MEJORA: Extraer título de tarea con patrones más robustos
    if (!facts.entities.tarea_titulo) {
      this.extractTaskTitle(facts, message)
    }

    // MEJORA: Para modificar tarea - detectar título actual y nuevo título
    this.extractTaskTitleChange(facts, message)

    // Extraer descripción si existe - MEJORADO
    const descripcionPatrones = [
      /descripción\s+"([^"]+)"/i,
      /descripción\s+([^\s"]+)/i,
      /con\s+descripción\s+"([^"]+)"/i,
      /con\s+descripción\s+([^\s"]+)/i,
      /con\s+la\s+descripción\s+"([^"]+)"/i,
      /con\s+la\s+descripción\s+([^\s"]+)/i,
    ]

    for (const patron of descripcionPatrones) {
      const match = message.match(patron)
      if (match && match[1]) {
        facts.entities.tarea_descripcion = match[1].trim()
        console.log("Descripción de tarea encontrada:", facts.entities.tarea_descripcion)
        break
      }
    }

    // Extraer prioridad si existe - MEJORADO
    const prioridadPatrones = [
      /prioridad\s+(alta|media|baja)/i,
      /con\s+prioridad\s+(alta|media|baja)/i,
      /con\s+la\s+prioridad\s+(alta|media|baja)/i,
      /prioridad\s+(high|medium|low)/i,
      /con\s+prioridad\s+(high|medium|low)/i,
      /con\s+la\s+prioridad\s+(high|medium|low)/i,
    ]

    for (const patron of prioridadPatrones) {
      const match = message.match(patron)
      if (match && match[1]) {
        let prioridad = match[1].toLowerCase()
        // Normalizar prioridades en inglés
        if (prioridad === "high") prioridad = "alta"
        if (prioridad === "medium") prioridad = "media"
        if (prioridad === "low") prioridad = "baja"

        facts.entities.tarea_prioridad = prioridad
        console.log("Prioridad de tarea encontrada:", facts.entities.tarea_prioridad)
        break
      }
    }

    // Extraer fecha si existe - MEJORADO para expresiones de fecha
    this.extractFechaEntities(facts, message)

    // Extraer miembros si existen - mejorado para capturar múltiples miembros
    const miembrosPatrones = [
      /miembros?\s+"([^"]+)"/i,
      /miembros?\s+([^"]+?)(?:\s+a\s+la|\s+de\s+la|\s+en|\s+para|\s*$)/i,
      /con\s+miembros?\s+"([^"]+)"/i,
      /con\s+miembros?\s+([^"]+?)(?:\s+a\s+la|\s+de\s+la|\s+en|\s+para|\s*$)/i,
      /con\s+los\s+miembros?\s+"([^"]+)"/i,
      /con\s+los\s+miembros?\s+([^"]+?)(?:\s+a\s+la|\s+de\s+la|\s+en|\s+para|\s*$)/i,
      /asigna(?:r)?\s+miembros?\s+"([^"]+)"/i,
      /asigna(?:r)?\s+miembros?\s+([^"]+?)(?:\s+a\s+la|\s+de\s+la|\s+en|\s+para|\s*$)/i,
    ]

    for (const patron of miembrosPatrones) {
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

    // Extraer columna destino para mover tarea - MEJORADO
    const columnaDestinoPatrones = [
      /a\s+(?:la\s+)?columna\s+"([^"]+)"/i,
      /a\s+(?:la\s+)?columna\s+([^\s",.]+)/i,
      /hacia\s+(?:la\s+)?columna\s+"([^"]+)"/i,
      /hacia\s+(?:la\s+)?columna\s+([^\s",.]+)/i,
      /en\s+(?:la\s+)?columna\s+"([^"]+)"/i,
      /en\s+(?:la\s+)?columna\s+([^\s",.]+)/i,
    ]

    for (const patron of columnaDestinoPatrones) {
      const match = message.match(patron)
      if (match && match[1]) {
        facts.entities.columna_destino = match[1].trim()
        console.log("Columna destino encontrada:", facts.entities.columna_destino)
        break
      }
    }

    console.log("Entidades de tarea extraídas:", facts.entities)
  }

  // NUEVO: Método para extraer la columna donde crear/modificar/eliminar la tarea
  private static extractColumnForTask(facts: Facts, message: string): void {
    const columnaPatrones = [
      /en\s+(?:la\s+)?columna\s+"([^"]+)"/i,
      /en\s+(?:la\s+)?columna\s+([^\s",.]+)/i,
      /dentro\s+de\s+(?:la\s+)?columna\s+"([^"]+)"/i,
      /dentro\s+de\s+(?:la\s+)?columna\s+([^\s",.]+)/i,
      /para\s+(?:la\s+)?columna\s+"([^"]+)"/i,
      /para\s+(?:la\s+)?columna\s+([^\s",.]+)/i,
      /de\s+(?:la\s+)?columna\s+"([^"]+)"/i,
      /de\s+(?:la\s+)?columna\s+([^\s",.]+)/i,
    ]

    for (const patron of columnaPatrones) {
      const match = message.match(patron)
      if (match && match[1]) {
        facts.entities.columna_nombre = match[1].trim()
        console.log("Columna para tarea encontrada:", facts.entities.columna_nombre)
        break
      }
    }
  }

  // NUEVO: Método para extraer el título de la tarea
  private static extractTaskTitle(facts: Facts, message: string): void {
    // Patrones para títulos con comillas
    const tituloComillasPatrones = [
      /tarea\s+(?:llamada|que\s+se\s+llame|con\s+(?:el\s+)?(?:nombre|título)(?:\s+de)?)\s+"([^"]+)"/i,
      /tarea\s+"([^"]+)"/i,
      /crear\s+tarea\s+"([^"]+)"/i,
      /crea\s+tarea\s+"([^"]+)"/i,
      /nueva\s+tarea\s+"([^"]+)"/i,
    ]

    for (const patron of tituloComillasPatrones) {
      const match = message.match(patron)
      if (match && match[1]) {
        facts.entities.tarea_titulo = match[1].trim()
        console.log(`Título de tarea encontrado con comillas: "${facts.entities.tarea_titulo}"`)
        return
      }
    }

    // Si no hay comillas, extraer el título entre "llamada" y "en" (para tareas en columnas específicas)
    if (message.toLowerCase().includes("llamada") && message.toLowerCase().includes(" en ")) {
      const parteInicial = message.toLowerCase().split("llamada")[1].trim()
      const partes = parteInicial.split(" en ")
      if (partes.length > 0 && partes[0].trim()) {
        facts.entities.tarea_titulo = partes[0].trim()
        console.log(`Título de tarea extraído entre "llamada" y "en": "${facts.entities.tarea_titulo}"`)
        return
      }
    }

    // Si no hay "en", intentar extraer todo después de "llamada" hasta alguna preposición
    if (message.toLowerCase().includes("llamada")) {
      const parteInicial = message.toLowerCase().split("llamada")[1].trim()
      // Extraer hasta alguna preposición o fin de la frase
      const titulo = parteInicial.split(/\s+(?:con|para|a|de|por|en)\s+/)[0].trim()
      if (titulo) {
        facts.entities.tarea_titulo = titulo
        console.log(`Título de tarea extraído después de "llamada": "${facts.entities.tarea_titulo}"`)
        return
      }
    }

    // Patrones para títulos sin comillas
    const tituloSinComillasPatrones = [
      /tarea\s+([^\s",.]+(?:\s+[^\s",.]+)*?)(?:\s+(?:con|para|a|de|por|en)|\s*$)/i,
      /crear\s+tarea\s+([^\s",.]+(?:\s+[^\s",.]+)*?)(?:\s+(?:con|para|a|de|por|en)|\s*$)/i,
      /crea\s+tarea\s+([^\s",.]+(?:\s+[^\s",.]+)*?)(?:\s+(?:con|para|a|de|por|en)|\s*$)/i,
      /nueva\s+tarea\s+([^\s",.]+(?:\s+[^\s",.]+)*?)(?:\s+(?:con|para|a|de|por|en)|\s*$)/i,
    ]

    for (const patron of tituloSinComillasPatrones) {
      const match = message.match(patron)
      if (match && match[1] && !["nueva", "llamada", "que", "con"].includes(match[1].toLowerCase())) {
        facts.entities.tarea_titulo = match[1].trim()
        console.log(`Título de tarea encontrado sin comillas: "${facts.entities.tarea_titulo}"`)
        return
      }
    }

    // Patrones específicos para el caso de cambiar fecha
    if (facts.intent === "cambiar_fecha") {
      const patronesTituloTarea = [
        /fecha\s+de\s+(?:la\s+)?tarea\s+"([^"]+)"/i,
        /fecha\s+de\s+(?:la\s+)?tarea\s+([^"]+?)(?:\s+a|\s+para|\s*$)/i,
        /tarea\s+"([^"]+)"\s+(?:a|para)/i,
        /tarea\s+([^"]+?)(?:\s+a|\s+para|\s*$)/i,
      ]

      for (const patron of patronesTituloTarea) {
        const match = message.match(patron)
        if (match && match[1]) {
          facts.entities.tarea_titulo = match[1].trim()
          console.log(`Título de tarea para cambio de fecha encontrado: "${facts.entities.tarea_titulo}"`)
          return
        }
      }
    }

    // Patrones específicos para el caso de gestionar miembros
    if (facts.intent === "gestionar_miembros") {
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
          facts.entities.tarea_titulo = match[1].trim()
          console.log(`Título de tarea para gestión de miembros encontrado: "${facts.entities.tarea_titulo}"`)
          return
        }
      }
    }
  }

  // NUEVO: Método para extraer cambios de título de tarea
  private static extractTaskTitleChange(facts: Facts, message: string): void {
    // Patrones para detectar título actual y nuevo título con "por"
    const cambiarTituloPorPatrones = [
      /cambiar?\s+(?:el\s+)?(?:nombre|título)\s+(?:de\s+la\s+)?tarea\s+"([^"]+)"\s+por\s+"([^"]+)"/i,
      /cambiar?\s+(?:el\s+)?(?:nombre|título)\s+(?:de\s+la\s+)?tarea\s+"([^"]+)"\s+por\s+([^\s",.]+)/i,
      /cambiar?\s+(?:el\s+)?(?:nombre|título)\s+(?:de\s+la\s+)?tarea\s+([^\s",.]+)\s+por\s+"([^"]+)"/i,
      /cambiar?\s+(?:el\s+)?(?:nombre|título)\s+(?:de\s+la\s+)?tarea\s+([^\s",.]+)\s+por\s+([^\s",.]+)/i,
      /renombrar?\s+(?:la\s+)?tarea\s+"([^"]+)"\s+por\s+"([^"]+)"/i,
      /renombrar?\s+(?:la\s+)?tarea\s+"([^"]+)"\s+por\s+([^\s",.]+)/i,
      /renombrar?\s+(?:la\s+)?tarea\s+([^\s",.]+)\s+por\s+"([^"]+)"/i,
      /renombrar?\s+(?:la\s+)?tarea\s+([^\s",.]+)\s+por\s+([^\s",.]+)/i,
      /modifica\s+(?:el\s+)?(?:nombre|título)\s+(?:de\s+la\s+)?tarea\s+"([^"]+)"\s+por\s+"([^"]+)"/i,
      /modifica\s+(?:el\s+)?(?:nombre|título)\s+(?:de\s+la\s+)?tarea\s+"([^"]+)"\s+por\s+([^\s",.]+)/i,
      /modifica\s+(?:el\s+)?(?:nombre|título)\s+(?:de\s+la\s+)?tarea\s+([^\s",.]+)\s+por\s+"([^"]+)"/i,
      /modifica\s+(?:el\s+)?(?:nombre|título)\s+(?:de\s+la\s+)?tarea\s+([^\s",.]+)\s+por\s+([^\s",.]+)/i,
      // Patrones más directos
      /cambia\s+(?:la\s+)?tarea\s+"([^"]+)"\s+por\s+"([^"]+)"/i,
      /cambia\s+(?:la\s+)?tarea\s+"([^"]+)"\s+por\s+([^\s",.]+)/i,
      /cambia\s+(?:la\s+)?tarea\s+([^\s",.]+)\s+por\s+"([^"]+)"/i,
      /cambia\s+(?:la\s+)?tarea\s+([^\s",.]+)\s+por\s+([^\s",.]+)/i,
    ]

    for (const patron of cambiarTituloPorPatrones) {
      const match = message.match(patron)
      if (match && match[1] && match[2]) {
        facts.entities.tarea_titulo_actual = match[1].trim()
        facts.entities.tarea_titulo_nuevo = match[2].trim()
        console.log(
          "Título actual y nuevo encontrados con 'por':",
          facts.entities.tarea_titulo_actual,
          "->",
          facts.entities.tarea_titulo_nuevo,
        )
        return
      }
    }

    // Patrones para detectar título actual y nuevo título con "a"
    const cambiarTituloAPatrones = [
      /cambiar?\s+(?:el\s+)?(?:nombre|título)\s+(?:de\s+la\s+)?tarea\s+"([^"]+)"\s+a\s+"([^"]+)"/i,
      /cambiar?\s+(?:el\s+)?(?:nombre|título)\s+(?:de\s+la\s+)?tarea\s+"([^"]+)"\s+a\s+([^\s",.]+)/i,
      /cambiar?\s+(?:el\s+)?(?:nombre|título)\s+(?:de\s+la\s+)?tarea\s+([^\s",.]+)\s+a\s+"([^"]+)"/i,
      /cambiar?\s+(?:el\s+)?(?:nombre|título)\s+(?:de\s+la\s+)?tarea\s+([^\s",.]+)\s+a\s+([^\s",.]+)/i,
      /renombrar?\s+(?:la\s+)?tarea\s+"([^"]+)"\s+a\s+"([^"]+)"/i,
      /renombrar?\s+(?:la\s+)?tarea\s+"([^"]+)"\s+a\s+([^\s",.]+)/i,
      /renombrar?\s+(?:la\s+)?tarea\s+([^\s",.]+)\s+a\s+"([^"]+)"/i,
      /renombrar?\s+(?:la\s+)?tarea\s+([^\s",.]+)\s+a\s+([^\s",.]+)/i,
      // Patrones más directos
      /cambia\s+(?:la\s+)?tarea\s+"([^"]+)"\s+a\s+"([^"]+)"/i,
      /cambia\s+(?:la\s+)?tarea\s+"([^"]+)"\s+a\s+([^\s",.]+)/i,
      /cambia\s+(?:la\s+)?tarea\s+([^\s",.]+)\s+a\s+"([^"]+)"/i,
      /cambia\s+(?:la\s+)?tarea\s+([^\s",.]+)\s+a\s+([^\s",.]+)/i,
    ]

    for (const patron of cambiarTituloAPatrones) {
      const match = message.match(patron)
      if (match && match[1] && match[2]) {
        facts.entities.tarea_titulo_actual = match[1].trim()
        facts.entities.tarea_titulo_nuevo = match[2].trim()
        console.log(
          "Título actual y nuevo encontrados con 'a':",
          facts.entities.tarea_titulo_actual,
          "->",
          facts.entities.tarea_titulo_nuevo,
        )
        return
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
